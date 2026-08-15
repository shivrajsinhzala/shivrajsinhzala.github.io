/**
 * Dust motes suspended along the corridor.
 *
 * The void gives the eye nothing to measure motion against, so travel reads as
 * "the scene is changing" rather than "I am moving". A few thousand points at
 * varying depths fix that: near ones sweep past fast, far ones barely move,
 * and the parallax between them is what the brain reads as speed.
 *
 * One Points object — a single draw call for the whole journey.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { LOOP_LENGTH, PALETTE } from '../data/journey';
import { pathX, pathY } from './path';
import { scrollState } from './scrollStore';

const COUNT = 2600;
/** Radius of the tube of dust around the corridor centre line. */
const RADIUS = 46;

function mulberry32(seed: number) {
	return function () {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function Dust() {
	const pointsRef = useRef<THREE.Points>(null);

	const geometry = useMemo(() => {
		const rand = mulberry32(77003);
		const positions = new Float32Array(COUNT * 2 * 3);
		const colors = new Float32Array(COUNT * 2 * 3);

		// Exactly one lap. The field is emitted twice, one lap apart, so the
		// dust ahead of the camera at the seam matches the dust ahead of it
		// after the wrap.
		const startZ = 0;
		const endZ = -LOOP_LENGTH;

		const tint = new THREE.Color();
		const palette = [PALETTE.softCyan, PALETTE.softPink, PALETTE.warmYellow, PALETTE.white];

		for (let i = 0; i < COUNT; i++) {
			const z = startZ + (endZ - startZ) * rand();

			// Distribute in an annulus so motes cluster near the corridor walls
			// rather than piling up in the middle of the camera's path.
			const angle = rand() * Math.PI * 2;
			const r = RADIUS * (0.25 + 0.75 * Math.sqrt(rand()));

			tint.set(palette[Math.floor(rand() * palette.length)]);
			// Vary brightness so the field has depth instead of reading as a
			// uniform sheet of identical specks.
			const b = 0.18 + rand() * 0.62;

			const x = pathX(z) + Math.cos(angle) * r;
			const y = pathY(z) + Math.sin(angle) * r * 0.55;

			// Copy A on this lap, copy B one lap ahead — identical pattern.
			for (const [c, dz] of [[0, 0], [COUNT, -LOOP_LENGTH]] as const) {
				const k = (i + c) * 3;
				positions[k] = x;
				positions[k + 1] = y;
				positions[k + 2] = z + dz;
				colors[k] = tint.r * b;
				colors[k + 1] = tint.g * b;
				colors[k + 2] = tint.b * b;
			}
		}

		const geo = new THREE.BufferGeometry();
		geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
		return geo;
	}, []);

	const material = useMemo(
		() =>
			new THREE.PointsMaterial({
				size: 0.26,
				sizeAttenuation: true,
				vertexColors: true,
				transparent: true,
				opacity: 0.6,
				depthWrite: false,
				// Fog would swallow the motes at exactly the distances where
				// they do the most work, so they opt out of it.
				fog: false,
			}),
		[]
	);

	useFrame(() => {
		const pts = pointsRef.current;
		if (!pts) return;
		// A whole-field drift, so the dust is never completely static even when
		// the visitor has stopped scrolling.
		if (!scrollState.reducedMotion) {
			const t = performance.now() * 0.00004;
			pts.position.x = Math.sin(t) * 1.6;
			pts.position.y = Math.cos(t * 0.8) * 1.2;
		}
	});

	return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
