/**
 * The signature object: a brutalist tower assembled from hard-edged slabs.
 *
 * Three things separate this from a pile of random cubes:
 *
 *  1. Composition. Slabs stack into a twisting tower, each rotated a little
 *     further than the one below and tapering as it rises. A straight stack
 *     reads as a pile; the helix reads as a sculpture from every angle.
 *  2. Shading. A custom flat shader quantises light into three discrete tones
 *     per face and inks every edge black. That gives real depth and weight
 *     while staying printed and flat, with no PBR or bloom anywhere.
 *  3. Colour as structure. Hue is a function of height, sweeping the brand
 *     palette from purple at the base to cyan at the crown, with black
 *     reserved for structural pieces. One continuous gradient reads as
 *     designed; randomly coloured blocks always read as generated.
 *
 * Note there is deliberately no drop-shadow mesh. A hard offset shadow is the
 * signature of the 2D design, but it only reads against a light ground; over
 * the black void it just punches black wedges out from behind the slabs.
 */

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '../data/journey';
import { scrollState } from './scrollStore';

/**
 * Colour ramp through the brand palette, bottom to top.
 *
 * Assigning colour by height instead of at random is what makes the object
 * read as designed: the eye follows one continuous gradient up the tower
 * rather than parsing a bag of unrelated hues. Nothing in the tower is pure
 * black — a black face is indistinguishable from the void behind it, so it
 * reads as a hole punched through the sculpture rather than as a surface.
 */
const RAMP = [
	new THREE.Color(PALETTE.violet),
	new THREE.Color(PALETTE.softPink),
	new THREE.Color(PALETTE.warmYellow),
	new THREE.Color(PALETTE.mint),
	new THREE.Color(PALETTE.softCyan),
];

/** t in 0..1 (bottom to top) → a colour interpolated along the ramp. */
function rampColor(t: number): THREE.Color {
	const x = Math.min(1, Math.max(0, t)) * (RAMP.length - 1);
	const i = Math.min(RAMP.length - 2, Math.floor(x));
	return new THREE.Color().lerpColors(RAMP[i], RAMP[i + 1], x - i);
}

function mulberry32(seed: number) {
	return function () {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

type Fragment = {
	assembled: THREE.Vector3;
	scattered: THREE.Vector3;
	scale: THREE.Vector3;
	rotationY: number;
	scatterRotation: THREE.Euler;
	color: THREE.Color;
};

const BASE_Y = -9;
const TOP_Y = 12;

/**
 * Builds a twisting tower: stacked slabs, each rotated a little further than
 * the one beneath it, tapering as they rise. The helical silhouette is what
 * gives the object its shape from every angle — a straight stack looks like a
 * pile, a twist looks like a sculpture. Deterministic, so it can be
 * art-directed rather than re-rolled.
 */
function buildFragments(): Fragment[] {
	const rand = mulberry32(20260815);
	const out: Fragment[] = [];

	const push = (
		pos: [number, number, number],
		scale: [number, number, number],
		color: THREE.Color | string,
		rotationY = 0
	) => {
		const angle = rand() * Math.PI * 2;
		const radius = 46 + rand() * 80;
		out.push({
			assembled: new THREE.Vector3(...pos),
			scattered: new THREE.Vector3(
				Math.cos(angle) * radius,
				(rand() - 0.5) * 95,
				Math.sin(angle) * radius - rand() * 55
			),
			scale: new THREE.Vector3(...scale),
			rotationY,
			scatterRotation: new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI),
			color: color instanceof THREE.Color ? color : new THREE.Color(color),
		});
	};

	const heightT = (y: number) => (y - BASE_Y) / (TOP_Y - BASE_Y);

	// --- Plinth: a deep tint of the base hue, never pure black -----------
	const plinth = rampColor(0).clone().multiplyScalar(0.55);
	push([0, BASE_Y - 0.9, 0], [12, 1.5, 12], plinth);
	push([0, BASE_Y + 0.2, 0], [10, 0.7, 10], rampColor(0));

	// --- Twisting core ----------------------------------------------------
	const LEVELS = 20;
	const TWIST = 0.31;
	for (let l = 0; l < LEVELS; l++) {
		const y = BASE_Y + 1.1 + l * 1.05;
		const t = heightT(y);

		// A gentle taper with a waist. Taper too hard and the stack reads as a
		// wedding cake rather than a tower, which buries the twist.
		const taper = 1 - t * 0.32;
		const waist = 1 - Math.exp(-Math.pow((t - 0.45) * 3.2, 2)) * 0.26;
		const w = 7.6 * taper * waist;
		const d = 5.9 * taper * waist;

		push([0, y, 0], [w, 0.8, d], rampColor(t), l * TWIST);
	}

	// --- Cantilevers: break the silhouette outward ------------------------
	const cantilevers: Array<[number, number, number, number]> = [
		[-1.5, 0.75, 9.5, 0.28],
		[3.2, -0.6, 8.2, 1.15],
		[6.8, 0.5, 7.0, 2.1],
	];
	for (const [y, zOff, len, rot] of cantilevers) {
		push([0, y, zOff], [len, 0.7, 1.9], rampColor(heightT(y)), rot);
	}

	// --- Crown ------------------------------------------------------------
	push([0, TOP_Y + 0.6, 0], [2.6, 1.1, 2.6], rampColor(1), LEVELS * TWIST);
	push([0, TOP_Y + 1.9, 0], [0.5, 2.2, 0.5], rampColor(1));

	return out;
}

/** Smootherstep — no overshoot, keeps the assembly reading as mechanical. */
function ease(t: number) {
	const x = Math.min(1, Math.max(0, t));
	return x * x * x * (x * (x * 6 - 15) + 10);
}

/**
 * Flat three-tone shading with inked edges.
 *
 * `instanceMatrix` / `instanceColor` are declared automatically by three for
 * ShaderMaterial on an InstancedMesh, so per-instance colour comes straight
 * from setColorAt.
 */
function makeMaterial() {
	return new THREE.ShaderMaterial({
		uniforms: {
			uLightDir: { value: new THREE.Vector3(0.55, 0.9, 0.45).normalize() },
		},
		vertexShader: /* glsl */ `
			varying vec3 vNormalW;
			varying vec2 vUv;
			varying vec3 vCol;

			void main() {
				vUv = uv;
				#ifdef USE_INSTANCING_COLOR
					vCol = instanceColor;
				#else
					vCol = vec3(1.0);
				#endif

				#ifdef USE_INSTANCING
					mat4 im = instanceMatrix;
				#else
					mat4 im = mat4(1.0);
				#endif

				vec4 world = modelMatrix * im * vec4(position, 1.0);
				// Boxes are axis-aligned, so a plain 3x3 is enough here and
				// normalize() absorbs the non-uniform scale.
				vNormalW = normalize(mat3(modelMatrix) * mat3(im) * normal);
				gl_Position = projectionMatrix * viewMatrix * world;
			}
		`,
		fragmentShader: /* glsl */ `
			uniform vec3 uLightDir;
			varying vec3 vNormalW;
			varying vec2 vUv;
			varying vec3 vCol;

			void main() {
				vec3 n = normalize(vNormalW);
				float t = dot(n, normalize(uLightDir)) * 0.5 + 0.5;

				// Three discrete tones. Quantising is what keeps it printed and
				// flat — a smooth ramp would immediately read as a render.
				float shade = t > 0.70 ? 1.0 : (t > 0.46 ? 0.66 : 0.38);

				vec3 col = vCol * shade;

				// Hard ink outline on every face edge. Box UVs run 0..1 per
				// face, so this outlines each block individually.
				float e = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
				float edge = smoothstep(0.0, 0.03, e);
				col = mix(vec3(0.02), col, edge);

				gl_FragColor = vec4(col, 1.0);
				#include <colorspace_fragment>
			}
		`,
	});
}

export type SculptureMode = 'hero' | 'finale' | 'loop';

export function Sculpture({
	mode = 'hero',
	position = [15, 2, -8],
	scale = 2.6,
}: {
	mode?: SculptureMode;
	position?: [number, number, number];
	scale?: number;
}) {
	const meshRef = useRef<THREE.InstancedMesh>(null);
	const groupRef = useRef<THREE.Group>(null);

	const fragments = useMemo(buildFragments, []);
	const count = fragments.length;
	const dummy = useMemo(() => new THREE.Object3D(), []);
	const tmp = useMemo(() => new THREE.Vector3(), []);
	const intro = useRef(mode === 'hero' ? 0 : 1);

	// Interaction state. Pointer position turns the tower; dragging spins it
	// and the spin carries momentum after release.
	const pointerX = useRef(0);
	const pointerY = useRef(0);
	const spin = useRef(0);
	const spinVel = useRef(0);
	const dragging = useRef(false);
	const lastDragX = useRef(0);

	const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
	const material = useMemo(makeMaterial, []);

	useEffect(() => {
		const mesh = meshRef.current;
		if (!mesh) return;
		fragments.forEach((f, i) => mesh.setColorAt(i, f.color));
		if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
	}, [fragments]);

	useEffect(() => {
		if (scrollState.reducedMotion) return;

		const onMove = (e: PointerEvent) => {
			pointerX.current = (e.clientX / window.innerWidth - 0.5) * 2;
			pointerY.current = (e.clientY / window.innerHeight - 0.5) * 2;

			if (dragging.current) {
				spinVel.current += (e.clientX - lastDragX.current) * 0.0006;
				lastDragX.current = e.clientX;
			}
		};

		// Only start a drag on the canvas itself, so dragging to select text in
		// the overlay never spins the sculpture.
		const onDown = (e: PointerEvent) => {
			if (!(e.target instanceof HTMLCanvasElement)) return;
			dragging.current = true;
			lastDragX.current = e.clientX;
		};
		const onUp = () => {
			dragging.current = false;
		};

		window.addEventListener('pointermove', onMove, { passive: true });
		window.addEventListener('pointerdown', onDown, { passive: true });
		window.addEventListener('pointerup', onUp, { passive: true });
		window.addEventListener('pointercancel', onUp, { passive: true });
		return () => {
			window.removeEventListener('pointermove', onMove);
			window.removeEventListener('pointerdown', onDown);
			window.removeEventListener('pointerup', onUp);
			window.removeEventListener('pointercancel', onUp);
		};
	}, []);

	useFrame((_, delta) => {
		const mesh = meshRef.current;
		if (!mesh) return;

		if (intro.current < 1) {
			intro.current = Math.min(1, intro.current + delta * (scrollState.reducedMotion ? 4 : 0.7));
		}

		const p = scrollState.progress;

		// Hero holds assembled at the top of the page and deconstructs as the
		// visitor leaves; the finale copy does the reverse at the very end.
		// The loop copy is always fully assembled: it has to match the hero's
		// resting state exactly at the moment of the wrap, and the visitor is
		// at the far end of the scroll when they see it.
		const assembly =
			mode === 'loop'
				? 1
				: mode === 'hero'
					? (1 - ease(p / 0.075)) * ease(intro.current)
					: ease((p - 0.87) / 0.13);

		const t = performance.now() * 0.0002;

		for (let i = 0; i < count; i++) {
			const f = fragments[i];

			// Stagger as a delayed window rather than a multiplier, so every
			// fragment still reaches fully assembled once assembly hits 1.
			const offset = (i / count) * 0.3;
			const a = ease((assembly - offset) / (1 - offset));

			tmp.lerpVectors(f.scattered, f.assembled, a);
			dummy.position.copy(tmp);

			if (!scrollState.reducedMotion) {
				const drift = 1 - a;
				dummy.position.x += Math.sin(t + i) * drift * 2.4;
				dummy.position.y += Math.cos(t * 1.3 + i * 0.7) * drift * 2.4;
			}

			dummy.rotation.set(
				THREE.MathUtils.lerp(f.scatterRotation.x, 0, a),
				THREE.MathUtils.lerp(f.scatterRotation.y, f.rotationY, a),
				THREE.MathUtils.lerp(f.scatterRotation.z, 0, a)
			);

			// Blocks stay slightly apart so the inked edges always read.
			dummy.scale.copy(f.scale).multiplyScalar(0.35 + a * 0.65);
			dummy.updateMatrix();
			mesh.setMatrixAt(i, dummy.matrix);
		}

		mesh.instanceMatrix.needsUpdate = true;

		// Interactive rotation: an idle drift, plus the pointer's horizontal
		// position, plus whatever spin the visitor has flung into it.
		const group = groupRef.current;
		if (group && !scrollState.reducedMotion) {
			spin.current += spinVel.current;
			spinVel.current *= 0.995;

			const idle = Math.sin(t * 2.2) * 0.18;
			const targetY = idle + pointerX.current * 0.55 + spin.current;
			group.rotation.y += (targetY - group.rotation.y) * Math.min(1, delta * 4);

			// A small counter-tilt gives the mass some response in the vertical
			// axis without ever letting it look like it is falling over.
			const targetX = pointerY.current * 0.12;
			group.rotation.x += (targetX - group.rotation.x) * Math.min(1, delta * 4);
		}
	});

	return (
		<group position={position} scale={scale}>
			<group ref={groupRef}>
				<instancedMesh
					ref={meshRef}
					args={[geometry, material, count]}
					frustumCulled={false}
				/>
			</group>
		</group>
	);
}
