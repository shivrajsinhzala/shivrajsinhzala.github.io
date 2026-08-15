/**
 * Fixed installations along the journey: the experience timeline, the skills
 * lattice, the award plinth, the education markers and the terminal object.
 *
 * Everything here is flat-shaded box geometry with neon edges — the same
 * material language as the sculpture and the monoliths, so the world reads as
 * one place rather than a sequence of unrelated set pieces.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
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
import { playImpact } from './audio';

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
}: {
	z: number;
	width: number;
	height: number;
	color: string;
	thickness?: number;
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

	// Fire an impact the moment the camera crosses this gate's plane. Tracking
	// the sign of the crossing rather than proximity means it sounds exactly
	// once per pass, in either direction, at any scroll speed.
	const wasAhead = useRef<boolean | null>(null);
	useFrame(({ camera }) => {
		const ahead = camera.position.z > z;
		if (wasAhead.current !== null && wasAhead.current !== ahead) {
			playImpact(0.9);
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
				<Gate key={i} z={g.z} width={g.width} height={g.height} color={g.color} />
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
/* Award — a plinth, lit by nothing, standing alone                    */
/* ------------------------------------------------------------------ */

export function AwardPlinth({ z = -960 }: { z?: number }) {
	const starRef = useRef<THREE.Mesh>(null);

	const plinthGeo = useMemo(() => new THREE.BoxGeometry(8, 12, 8), []);
	const plinthMat = useMemo(
		() => new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.violet).multiplyScalar(0.5) }),
		[]
	);
	// An extruded star — the award, rendered in the same flat language rather
	// than as a realistic trophy.
	const starGeo = useMemo(() => {
		const shape = new THREE.Shape();
		const spikes = 5;
		const outer = 3.4;
		const inner = 1.5;
		for (let i = 0; i < spikes * 2; i++) {
			const r = i % 2 === 0 ? outer : inner;
			const a = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
			const px = Math.cos(a) * r;
			const py = Math.sin(a) * r;
			if (i === 0) shape.moveTo(px, py);
			else shape.lineTo(px, py);
		}
		shape.closePath();
		return new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: false });
	}, []);
	const starMat = useMemo(
		() => new THREE.MeshBasicMaterial({ color: new THREE.Color(PALETTE.warmYellow) }),
		[]
	);

	useFrame((_, delta) => {
		if (!starRef.current || scrollState.reducedMotion) return;
		starRef.current.rotation.y += delta * 0.5;
	});

	return (
		<group position={[pathX(z), -3 + pathY(z), z]}>
			<mesh geometry={plinthGeo} material={plinthMat} position={[0, -6, 0]} />
			<EdgeOutline geometry={plinthGeo} color={PALETTE.cyan} />
			<mesh ref={starRef} geometry={starGeo} material={starMat} position={[0, 4, 0]}>
				<EdgeOutline geometry={starGeo} color={PALETTE.black} />
			</mesh>
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
				/>
			))}
		</group>
	);
}
