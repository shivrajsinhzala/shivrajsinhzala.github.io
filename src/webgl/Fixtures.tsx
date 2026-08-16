/**
 * Fixed installations along the journey: the experience timeline, the skills
 * lattice, the award plinth, the education markers and the terminal object.
 *
 * Everything here is flat-shaded box geometry with neon edges — the same
 * material language as the sculpture and the monoliths, so the world reads as
 * one place rather than a sequence of unrelated set pieces.
 */

import { Suspense, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import {
	AWARD,
	EDUCATION,
	EXPERIENCE,
	PALETTE,
	SKILLS,
	TUNNEL_END_Z,
	TUNNEL_GATES,
	TUNNEL_START_Z,
} from '../data/journey';
import { EdgeOutline } from './World';
import { scrollState } from './scrollStore';
import { useTier } from './useTier';
import { pathX, pathY } from './path';
import { playGate } from './audio';

/* ------------------------------------------------------------------ */
/* Experience — markers receding in depth, chronology as distance      */
/* ------------------------------------------------------------------ */

/**
 * The experience run is a colonnade of gates the camera flies straight
 * through, one per responsibility, receding into the void.
 *
 * The earlier version put a blank white rectangle in the air for each item,
 * which read as five pieces of floating paper with nothing on them. A gate
 * carries no text either, but it is architecture: it frames the corridor,
 * gives the forward motion something to measure itself against, and the
 * palette walks a colour per step.
 */

const GATE_COLORS = [
	PALETTE.softCyan,
	PALETTE.softPink,
	PALETTE.warmYellow,
	PALETTE.mint,
	PALETTE.violet,
];

function Gate({
	z,
	width,
	height,
	color,
	thickness = 1.1,
	note = 0,
}: {
	z: number;
	width: number;
	height: number;
	color: string;
	thickness?: number;
	/** Scale degree this gate sounds when crossed. */
	note?: number;
}) {
	const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(color) }), [color]);
	// A deeper tint of the same hue for the horizontals, so the frame has some
	// modelling without any member disappearing into the black void.
	const deep = useMemo(
		() => new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(0.5) }),
		[color]
	);

	const halfW = width / 2;
	const halfH = height / 2;

	// Sound the gate the moment the camera crosses its plane. Tracking the sign
	// of the crossing rather than proximity means it fires exactly once per
	// pass, in either direction, at any scroll speed — so flying a run of
	// gates plays them as a phrase rather than a smear.
	const wasAhead = useRef<boolean | null>(null);
	useFrame(({ camera }) => {
		const ahead = camera.position.z > z;
		if (wasAhead.current !== null && wasAhead.current !== ahead) {
			playGate(note);
		}
		wasAhead.current = ahead;
	});

	return (
		<group position={[pathX(z), pathY(z), z]}>
			{/* Uprights */}
			<mesh position={[-halfW, 0, 0]} material={mat}>
				<boxGeometry args={[thickness, height, thickness]} />
			</mesh>
			<mesh position={[halfW, 0, 0]} material={mat}>
				<boxGeometry args={[thickness, height, thickness]} />
			</mesh>
			{/* Lintel and sill */}
			<mesh position={[0, halfH, 0]} material={deep}>
				<boxGeometry args={[width + thickness, thickness, thickness]} />
			</mesh>
			<mesh position={[0, -halfH, 0]} material={deep}>
				<boxGeometry args={[width + thickness, thickness, thickness]} />
			</mesh>
		</group>
	);
}

/**
 * A run of evenly spaced gates. Used all along the journey now rather than
 * only at the two ends — they are what gives the corridor rhythm and makes the
 * zigzag legible, since a bend is only visible if there is structure to see it
 * against.
 */
export function GateRun({
	from,
	to,
	count,
	width = 26,
	height = 20,
	taper = 0,
	colorOffset = 0,
	thickness = 1.1,
}: {
	from: number;
	to: number;
	count: number;
	width?: number;
	height?: number;
	/** Fraction the opening narrows by across the run. */
	taper?: number;
	colorOffset?: number;
	thickness?: number;
}) {
	const { spread } = useTier();

	const gates = Array.from({ length: count }, (_, i) => {
		const t = count === 1 ? 0 : i / (count - 1);
		const shrink = 1 - taper * t;
		return {
			z: from + (to - from) * t,
			width: width * spread * shrink,
			height: height * shrink,
			color: GATE_COLORS[(i + colorOffset) % GATE_COLORS.length],
		};
	});

	return (
		<group>
			{gates.map((g, i) => (
				<Gate
					key={i}
					z={g.z}
					width={g.width}
					height={g.height}
					color={g.color}
					thickness={thickness}
					note={colorOffset + i}
				/>
			))}
		</group>
	);
}

export function ExperienceTimeline({ z = -140 }: { z?: number }) {
	const { spread } = useTier();

	// One gate per responsibility, stepping away down the corridor.
	const gates = EXPERIENCE.tasks.map((_, i) => ({
		z: z + 26 - i * 20,
		// Gates widen as they recede so the run reads as a true perspective
		// tunnel rather than a set of identical frames.
		width: (24 + i * 2.4) * spread,
		height: 18 + i * 1.4,
		color: GATE_COLORS[i % GATE_COLORS.length],
	}));

	return (
		<group>
			{gates.map((g, i) => (
				<Gate key={i} z={g.z} width={g.width} height={g.height} color={g.color} note={i} />
			))}
		</group>
	);
}

/* ------------------------------------------------------------------ */
/* Skills — a lattice of blocks, height driven by proficiency          */
/* ------------------------------------------------------------------ */

export function SkillLattice({ z = -820 }: { z?: number }) {
	const groupRef = useRef<THREE.Group>(null);
	const { spread } = useTier();

	useFrame(({ camera }) => {
		if (!groupRef.current || scrollState.reducedMotion) return;
		// The lattice counter-rotates slowly as the camera passes through it,
		// so the visitor perceives real parallax depth between the columns.
		const t = (camera.position.z - z) * 0.004;
		groupRef.current.rotation.y = t;
	});

	return (
		<group ref={groupRef} position={[pathX(z), pathY(z), z]}>
			{SKILLS.map((skill, i) => {
				const angle = (i / SKILLS.length) * Math.PI * 2;
				const radius = 17 * spread;
				const height = (skill.level / 100) * 18;
				return (
					<SkillColumn
						key={skill.num}
						x={Math.cos(angle) * radius}
						zPos={Math.sin(angle) * radius}
						height={height}
						color={skill.accent}
						rotation={-angle + Math.PI / 2}
					/>
				);
			})}
		</group>
	);
}

function SkillColumn({
	x,
	zPos,
	height,
	color,
	rotation,
}: {
	x: number;
	zPos: number;
	height: number;
	color: string;
	rotation: number;
}) {
	const geo = useMemo(() => new THREE.BoxGeometry(5.5, height, 5.5), [height]);
	const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(color) }), [color]);
	return (
		<group position={[x, height / 2 - 9, zPos]} rotation-y={rotation}>
			<mesh geometry={geo} material={mat} />
			<EdgeOutline geometry={geo} color={PALETTE.black} />
		</group>
	);
}

/* ------------------------------------------------------------------ */
/* Award — the real Rising Star trophy on a plinth                      */
/* ------------------------------------------------------------------ */

/**
 * The actual award model, replacing the extruded star that stood here before.
 *
 * Two things this needs that nothing else in the scene does:
 *
 *  - Lights. Every other object is MeshBasicMaterial, which ignores lighting,
 *    so the scene ships with none. A GLB carrying PBR materials would render
 *    pure black. The lights added here are harmless to everything else for
 *    exactly the same reason.
 *  - Lazy loading. The file is ~1.6 MB, which is far too much to spend on
 *    first paint for something 960 units down the corridor, so it is only
 *    fetched once the camera is near.
 */
/**
 * Yaw that turns the trophy's engraved face toward the camera. Determined by
 * inspection: at 0 the star sits edge-on and the plaque points away.
 */
const AWARD_FACE_YAW = -Math.PI / 2;

function AwardModel() {
	const { scene } = useGLTF(AWARD.model);
	const ref = useRef<THREE.Group>(null);

	/**
	 * Clone so repeated mounts never share (and mutate) one cached graph, and
	 * tame the material while we are here.
	 *
	 * The exported material carries no pbrMetallicRoughness block at all, so
	 * the glTF defaults apply — and the default metallicFactor is 1.0. A fully
	 * metallic surface with no environment map has nothing to reflect, so it
	 * renders pure black. That is why the trophy was invisible even though the
	 * file downloaded and decoded correctly.
	 */
	const model = useMemo(() => {
		const root = scene.clone(true);

		const tame = (m: THREE.Material) => {
			const mat = m.clone() as THREE.MeshStandardMaterial;
			if ('metalness' in mat) {
				mat.metalness = 0.15;
				mat.roughness = 0.55;
			}
			// A touch of self-illumination keeps it readable against a black
			// void without standing up an IBL rig for a single object.
			if ('emissive' in mat) {
				mat.emissive = new THREE.Color(PALETTE.warmYellow);
				mat.emissiveIntensity = 0.08;
			}
			mat.needsUpdate = true;
			return mat;
		};

		root.traverse((child) => {
			const mesh = child as THREE.Mesh;
			if (!mesh.isMesh) return;
			mesh.material = Array.isArray(mesh.material)
				? mesh.material.map(tame)
				: tame(mesh.material);
		});

		return root;
	}, [scene]);

	// Normalise: the exported model has its own scale and origin, so fit it to
	// a known height and sit it on the plinth rather than trusting the file.
	const fitted = useMemo(() => {
		const box = new THREE.Box3().setFromObject(model);
		const size = new THREE.Vector3();
		const centre = new THREE.Vector3();
		box.getSize(size);
		box.getCenter(centre);

		const targetHeight = 9;
		const scale = size.y > 0 ? targetHeight / size.y : 1;

		return {
			scale,
			offset: new THREE.Vector3(-centre.x * scale, -box.min.y * scale, -centre.z * scale),
		};
	}, [model]);

	useFrame(() => {
		if (!ref.current || scrollState.reducedMotion) return;
		// The model's front faces +X, so it needs a quarter turn to face the
		// camera. It used to spin continuously, which meant the visitor was
		// looking at the back of the trophy — and the engraved plaque — for
		// half of every revolution. It now presents its face and only sways.
		const t = performance.now() * 0.0009;
		ref.current.rotation.y = AWARD_FACE_YAW + Math.sin(t) * 0.32;
		// A slow bob, so it reads as presented rather than parked.
		ref.current.position.y = fitted.offset.y + Math.sin(t * 1.35) * 0.35;
	});

	return (
		<group ref={ref} position={[fitted.offset.x, fitted.offset.y, fitted.offset.z]}>
			<primitive object={model} scale={fitted.scale} />
		</group>
	);
}

export function AwardPlinth({ z = -960 }: { z?: number }) {
	const [near, setNear] = useState(false);
	const haloRef = useRef<THREE.Mesh>(null);

	const plinthGeo = useMemo(() => new THREE.BoxGeometry(8, 12, 8), []);
	const plinthMat = useMemo(
		() =>
			new THREE.MeshBasicMaterial({
				color: new THREE.Color(PALETTE.violet).multiplyScalar(0.5),
			}),
		[]
	);

	// A flat disc behind the trophy. The model is the one lit, detailed object
	// in a flat-shaded world, and without something behind it, it reads as
	// floating debris rather than an exhibit.
	const haloMat = useMemo(
		() =>
			new THREE.MeshBasicMaterial({
				color: new THREE.Color(PALETTE.warmYellow),
				transparent: true,
				opacity: 0.09,
				side: THREE.DoubleSide,
			}),
		[]
	);

	useFrame(({ camera }, delta) => {
		const dist = Math.abs(camera.position.z - z);
		if (dist < 220 && !near) setNear(true);
		else if (dist > 300 && near) setNear(false);

		if (haloRef.current && !scrollState.reducedMotion) {
			haloRef.current.rotation.z += delta * 0.08;
		}
	});

	return (
		<group position={[pathX(z), -3 + pathY(z), z]}>
			<mesh geometry={plinthGeo} material={plinthMat} position={[0, -6, 0]} />
			<EdgeOutline geometry={plinthGeo} color={PALETTE.warmYellow} />

			<mesh ref={haloRef} position={[0, 5, -5]} material={haloMat}>
				<circleGeometry args={[9, 64]} />
			</mesh>

			{/*
			  Lights exist solely for the GLB; unlit materials ignore them.
			  Point lights on purpose: a directional light aims at its target
			  object, which defaults to the world origin — meaningless for a
			  fixture 960 units down the corridor.
			*/}
			<ambientLight intensity={1.6} />
			<pointLight position={[7, 12, 10]} intensity={420} distance={60} decay={2} />
			<pointLight
				position={[-8, 4, 8]}
				intensity={220}
				distance={50}
				decay={2}
				color={PALETTE.softCyan}
			/>
			<pointLight
				position={[0, -2, 9]}
				intensity={160}
				distance={40}
				decay={2}
				color={PALETTE.warmYellow}
			/>

			{/* Mounted only when near. Gating on a prop would still run the
			    loader on mount and pull the whole 1.6 MB at first paint. */}
			{near && (
				<Suspense fallback={null}>
					<AwardModel />
				</Suspense>
			)}
		</group>
	);
}

/* ------------------------------------------------------------------ */
/* Education — two markers flanking the path                           */
/* ------------------------------------------------------------------ */

export function EducationMarkers({ z = -1060 }: { z?: number }) {
	const { spread } = useTier();
	const geo = useMemo(() => new THREE.BoxGeometry(7, 7, 7), []);
	return (
		<group>
			{EDUCATION.map((edu, i) => {
				const side = i === 0 ? -1 : 1;
				return (
					<group key={edu.badge} position={[side * 16 * spread, i === 0 ? 2 : -4, z - i * 26]} rotation-y={-side * 0.5}>
						<mesh geometry={geo}>
							<meshBasicMaterial color={edu.accent} />
						</mesh>
						<EdgeOutline geometry={geo} color={PALETTE.black} />
					</group>
				);
			})}
		</group>
	);
}

/* ------------------------------------------------------------------ */
/* Terminal — a physical object with a scanline screen                 */
/* ------------------------------------------------------------------ */

export function TerminalObject({ z = -1160 }: { z?: number }) {
	const screenMat = useMemo(() => {
		return new THREE.ShaderMaterial({
			transparent: true,
			uniforms: {
				uTime: { value: 0 },
				uColor: { value: new THREE.Color('#00ff88') },
			},
			vertexShader: /* glsl */ `
				varying vec2 vUv;
				void main() {
					vUv = uv;
					gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
				}
			`,
			fragmentShader: /* glsl */ `
				uniform float uTime;
				uniform vec3 uColor;
				varying vec2 vUv;

				void main() {
					// Horizontal scanlines plus a slow sweep — a CRT read purely
					// as pattern, with no bloom anywhere near it.
					float scan = step(0.5, fract(vUv.y * 90.0));
					float sweep = smoothstep(0.0, 0.08, abs(fract(vUv.y - uTime * 0.08) - 0.5));

					// Blocky "text" rows so the screen reads as a terminal at
					// distance without costing a texture.
					float row = step(0.55, fract(vUv.y * 26.0));
					float glyph = step(0.35, fract(vUv.x * 42.0 + floor(vUv.y * 26.0) * 3.7));
					float text = row * glyph * step(vUv.x, 0.82);

					vec3 color = uColor * (0.18 + text * 0.9);
					float alpha = (0.55 + scan * 0.2) * (0.7 + sweep * 0.3);
					gl_FragColor = vec4(color, alpha);
				}
			`,
		});
	}, []);

	const bodyGeo = useMemo(() => new THREE.BoxGeometry(22, 14, 1.6), []);
	const bodyMat = useMemo(
		() => new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.black) }),
		[]
	);

	useFrame((_, delta) => {
		screenMat.uniforms.uTime.value += delta;
	});

	return (
		<group position={[pathX(z), 1 + pathY(z), z]}>
			<mesh geometry={bodyGeo} material={bodyMat} />
			<EdgeOutline geometry={bodyGeo} color="#00ff88" />
			<mesh position={[0, 0, 0.85]} material={screenMat}>
				<planeGeometry args={[19.5, 11.5]} />
			</mesh>
		</group>
	);
}

/* ------------------------------------------------------------------ */
/* Return tunnel — the run of gates that loops back to the start        */
/* ------------------------------------------------------------------ */

/**
 * A long nested run of gates closing the journey.
 *
 * Spacing tightens and the openings narrow toward the end, so the visitor
 * accelerates into the warp instead of the corridor simply stopping. The
 * colours cycle the soft palette on a short period, which also means the last
 * few frames are visually interchangeable — that is what lets the loop cut
 * without a seam being obvious.
 */
export function ReturnTunnel() {
	const { spread } = useTier();

	const gates = Array.from({ length: TUNNEL_GATES }, (_, i) => {
		const t = i / (TUNNEL_GATES - 1);
		// Ease the spacing so gates bunch up toward the far end.
		const eased = t * t * 0.55 + t * 0.45;
		return {
			z: TUNNEL_START_Z + (TUNNEL_END_Z - TUNNEL_START_Z) * eased,
			width: (34 - t * 16) * spread,
			height: 26 - t * 12,
			color: GATE_COLORS[i % GATE_COLORS.length],
			thickness: 1.4 - t * 0.6,
		};
	});

	return (
		<group>
			{gates.map((g, i) => (
				<Gate
					key={i}
					z={g.z}
					width={g.width}
					height={g.height}
					color={g.color}
					thickness={g.thickness}
					note={i}
				/>
			))}
		</group>
	);
}
