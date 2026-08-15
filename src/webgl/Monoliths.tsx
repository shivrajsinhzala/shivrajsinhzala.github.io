/**
 * The projects corridor — twelve monoliths standing in the void, alternating
 * across the camera's path.
 *
 * Screenshot textures are loaded lazily as the camera approaches and disposed
 * when it leaves, so the corridor never holds twelve full-size textures in GPU
 * memory at once. That is what keeps the whole scene inside the 96 MB budget.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE, PROJECTS, projectTransform, type Project } from '../data/journey';
import { EdgeOutline } from './World';
import { scrollState } from './scrollStore';
import { useTier } from './useTier';
import { playTick } from './audio';
import { pathX, pathY } from './path';

const SLAB_W = 20;
const SLAB_H = 13;
const SLAB_D = 1.2;
/** Distance at which a monolith's texture starts loading. */
const LOAD_RADIUS = 130;
/** Distance at which it is released again. */
const UNLOAD_RADIUS = 190;

const loader = new THREE.TextureLoader();

function useLazyTexture(url: string, active: boolean) {
	const [texture, setTexture] = useState<THREE.Texture | null>(null);
	const current = useRef<THREE.Texture | null>(null);

	useEffect(() => {
		let cancelled = false;

		if (active && !current.current) {
			loader.load(url, (tex) => {
				if (cancelled) {
					tex.dispose();
					return;
				}
				tex.colorSpace = THREE.SRGBColorSpace;
				tex.generateMipmaps = true;
				tex.minFilter = THREE.LinearMipmapLinearFilter;
				tex.anisotropy = 4;
				current.current = tex;
				setTexture(tex);
			});
		}

		if (!active && current.current) {
			current.current.dispose();
			current.current = null;
			setTexture(null);
		}

		return () => {
			cancelled = true;
		};
	}, [url, active]);

	// Release on unmount.
	useEffect(
		() => () => {
			current.current?.dispose();
			current.current = null;
		},
		[]
	);

	return texture;
}

function Monolith({
	project,
	index,
	spread,
}: {
	project: Project;
	index: number;
	spread: number;
}) {
	const base = projectTransform(index, spread);
	const { rotationY, side } = base;
	// Offset onto the corridor's centre line at this depth, so the slabs stay
	// in formation as the path bends.
	const position: readonly [number, number, number] = [
		base.position[0] + pathX(base.position[2]),
		base.position[1] + pathY(base.position[2]),
		base.position[2],
	];
	const groupRef = useRef<THREE.Group>(null);
	const [near, setNear] = useState(false);
	const [hovered, setHovered] = useState(false);
	const texture = useLazyTexture(project.image, near);

	/** Only projects with a destination are clickable; the private one is not. */
	const interactive = project.href !== null;

	const slabGeo = useMemo(() => new THREE.BoxGeometry(SLAB_W, SLAB_H, SLAB_D), []);
	const backingMat = useMemo(
		() => new THREE.MeshBasicMaterial({ color: new THREE.Color(project.accent) }),
		[project.accent]
	);
	const screenMat = useMemo(
		() =>
			new THREE.MeshBasicMaterial({
				color: new THREE.Color('#ffffff'),
				transparent: true,
				opacity: 0,
			}),
		[]
	);

	// Swap the texture in with a short fade so a late-arriving image never pops.
	useEffect(() => {
		screenMat.map = texture;
		screenMat.needsUpdate = true;
	}, [texture, screenMat]);

	useFrame((state, delta) => {
		const group = groupRef.current;
		if (!group) return;

		const dist = Math.abs(state.camera.position.z - position[2]);

		if (dist < LOAD_RADIUS && !near) setNear(true);
		else if (dist > UNLOAD_RADIUS && near) setNear(false);

		// Fade the screenshot in only once the texture actually exists.
		const target = texture && dist < LOAD_RADIUS ? 1 : 0;
		screenMat.opacity += (target - screenMat.opacity) * Math.min(1, delta * 4);

		// Monoliths turn slightly to face the camera as it passes — the only
		// motion they have, and it makes the corridor feel inhabited.
		if (!scrollState.reducedMotion) {
			const t = THREE.MathUtils.clamp((state.camera.position.z - position[2]) / 60, -1, 1);
			group.rotation.y = rotationY - t * 0.16 * side;
		} else {
			group.rotation.y = rotationY;
		}

		// Hovering swells the slab and eases it toward the centre of the
		// corridor — a physical response that reads faster than a colour change.
		const lift = hovered && interactive ? 1 : 0;
		const ease = Math.min(1, delta * 8);

		const targetScale = 1 + lift * 0.06;
		group.scale.setScalar(group.scale.x + (targetScale - group.scale.x) * ease);

		const targetX = position[0] * (1 - lift * 0.06);
		group.position.x += (targetX - group.position.x) * ease;
	});

	const open = () => {
		if (!project.href) return;
		// noopener/noreferrer: the opened tab must never get a handle back to
		// this window.
		window.open(project.href, '_blank', 'noopener,noreferrer');
	};

	// The cursor is a page-level affordance, so it is reset on unmount as well
	// as on pointer-out — otherwise navigating away can leave it stuck.
	useEffect(() => {
		if (!hovered || !interactive) return;
		document.body.style.cursor = 'pointer';
		return () => {
			document.body.style.cursor = '';
		};
	}, [hovered, interactive]);

	return (
		<group
			ref={groupRef}
			position={[position[0], position[1], position[2]]}
			rotation-y={rotationY}
			onPointerOver={(e) => {
				e.stopPropagation();
				setHovered(true);
				if (interactive) playTick();
			}}
			onPointerOut={() => setHovered(false)}
			onClick={(e) => {
				e.stopPropagation();
				open();
			}}
		>
			{/* Solid accent backing, visible until the screenshot loads. */}
			<mesh geometry={slabGeo} material={backingMat} />

			{/* Screenshot face, inset like a matted print. */}
			<mesh position={[0, 0.6, SLAB_D / 2 + 0.02]} material={screenMat}>
				<planeGeometry args={[SLAB_W - 2.2, SLAB_H - 4]} />
			</mesh>

			<EdgeOutline geometry={slabGeo} color={PALETTE.black} />
		</group>
	);
}

export function Monoliths() {
	const { spread } = useTier();
	return (
		<group>
			{PROJECTS.map((p, i) => (
				<Monolith key={p.num} project={p} index={i} spread={spread} />
			))}
		</group>
	);
}
