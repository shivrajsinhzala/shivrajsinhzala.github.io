/**
 * WebGL root for the journey.
 *
 * Mounted as an Astro island behind the DOM overlay. The canvas is purely
 * presentational — every word on the page lives in the DOM layer above it, so
 * this subtree is `aria-hidden` and carries no content of its own.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import { CONTACT_Z, FOG_STOPS, LOOP_LENGTH, PALETTE } from '../data/journey';
import { cappedDpr, hasWebGL, prefersReducedMotion } from './capabilities';
import { DitherEffect } from './DitherEffect';
import { GraphGrid } from './World';
import { Sculpture } from './Sculpture';
import { Monoliths } from './Monoliths';
import {
	AwardPlinth,
	EducationMarkers,
	ExperienceTimeline,
	ReturnTunnel,
	SkillLattice,
	TerminalObject,
} from './Fixtures';
import { scrollState } from './scrollStore';
import { useTier } from './useTier';
import { pathDDX, pathX, pathY } from './path';
import { Dust } from './Dust';
import { updateAudio } from './audio';

/**
 * Critically damped smoothing (the classic SmoothDamp formulation).
 *
 * Used for the camera roll. A plain exponential lerp still starts moving at
 * full rate the instant its target jumps, which is what reads as a sudden
 * snap; a second-order filter has to accelerate first, so the tilt eases in
 * and out instead of stepping. Never overshoots.
 */
function smoothDamp(
	current: number,
	target: number,
	vel: { v: number },
	smoothTime: number,
	dt: number
): number {
	const omega = 2 / Math.max(0.0001, smoothTime);
	const x = omega * dt;
	const expo = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
	const change = current - target;
	const temp = (vel.v + omega * change) * dt;
	vel.v = (vel.v - omega * temp) * expo;
	return target + (change + temp) * expo;
}

/**
 * Drives the camera down the corridor from the measured scroll mapping, with a
 * small mouse-parallax offset. The camera never rolls and never looks anywhere
 * but forward — motion stays legible, which is what "restrained & sharp" means.
 */
function CameraRig() {
	const { camera } = useThree();
	const tier = useTier();
	const mouse = useRef({ x: 0, y: 0 });
	const target = useRef({ x: 0, y: 0 });
	/** Velocity term of the camera spring, so travel can overshoot and settle. */
	const zVel = useRef(0);
	/** Smoothed camera roll, plus its velocity term for the damper. */
	const bank = useRef(0);
	const bankVel = useRef({ v: 0 });

	// Field of view is part of the responsive tier, so it has to be pushed to
	// the camera whenever the viewport class changes.
	useEffect(() => {
		const cam = camera as THREE.PerspectiveCamera;
		cam.fov = tier.fov;
		cam.updateProjectionMatrix();
	}, [camera, tier.fov]);

	useEffect(() => {
		if (tier.mobile) return;
		const onMove = (e: PointerEvent) => {
			target.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
			target.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
		};
		window.addEventListener('pointermove', onMove, { passive: true });
		return () => window.removeEventListener('pointermove', onMove);
	}, [tier.mobile]);

	useFrame((_, delta) => {
		// Clamp dt so a backgrounded tab returning does not fire the spring
		// with a huge step and fling the camera down the corridor.
		const dt = Math.min(delta, 1 / 30);
		const d = Math.min(1, dt * 6);
		const cam = camera as THREE.PerspectiveCamera;

		if (scrollState.snap) {
			// The loop just cut back to the top: land exactly, with no spring
			// energy left over, or the camera would fly the whole way back.
			scrollState.cameraZ = scrollState.targetZ;
			zVel.current = 0;
			scrollState.snap = false;
		} else if (scrollState.reducedMotion) {
			scrollState.cameraZ = scrollState.targetZ;
		} else {
			// A light spring rather than an exponential ease. Slightly
			// underdamped (ζ ≈ 0.9) so the camera settles into a stop instead
			// of freezing dead the instant scrolling ends.
			const k = 90;
			const damping = 17;
			zVel.current += (scrollState.targetZ - scrollState.cameraZ) * k * dt;
			zVel.current *= Math.exp(-damping * dt);
			scrollState.cameraZ += zVel.current * dt;
		}

		const z = scrollState.cameraZ + tier.camOffset;

		// The corridor bends, so the camera rides its centre line rather than a
		// straight axis. Looking at the path further ahead is what makes
		// objects round a bend into view.
		const aheadZ = z - 74;
		const px = pathX(z);
		const py = pathY(z);

		if (scrollState.reducedMotion) {
			cam.position.set(px, py, z);
			cam.lookAt(pathX(aheadZ), pathY(aheadZ), aheadZ);
			return;
		}

		mouse.current.x += (target.current.x - mouse.current.x) * d;
		mouse.current.y += (target.current.y - mouse.current.y) * d;

		// Breathing: a slow, tiny drift so the camera never feels like a value
		// being interpolated along a rail.
		const t = performance.now() * 0.001;
		const breathX = Math.sin(t * 0.31) * 0.36 + Math.sin(t * 0.73) * 0.16;
		const breathY = Math.cos(t * 0.27) * 0.3 + Math.sin(t * 0.61) * 0.12;

		const parallaxX = tier.mobile ? 0 : mouse.current.x * 3.2;
		const parallaxY = tier.mobile ? 0 : -mouse.current.y * 2;

		cam.position.set(px + parallaxX + breathX, py + parallaxY + breathY, z);
		cam.lookAt(
			pathX(aheadZ) + (tier.mobile ? 0 : mouse.current.x * 5),
			pathY(aheadZ) + (tier.mobile ? 0 : -mouse.current.y * 3),
			aheadZ
		);

		// Field of view opens with scroll speed. This is the single strongest
		// cue that the visitor is moving rather than the scene changing.
		const speed = Math.min(Math.abs(scrollState.velocity), 2) / 2;

		// Bank into the bend.
		//
		// The gain is set so peak curvature lands near 3 degrees, comfortably
		// inside the clamp. It matters: with the gain left over from the old
		// (much gentler) path frequencies the roll sat pinned at its limit for
		// 92% of a lap and simply flipped sign, which reads as a snap rather
		// than a bank.
		//
		// It is then critically damped, which also does the work of keeping
		// fast scrolling calm: the target reverses several times a lap, and at
		// speed the filter cannot chase it, so the roll naturally settles into
		// a gentle sway instead of whipping.
		const bankTarget =
			THREE.MathUtils.clamp(-pathDDX(z) * 38, -0.06, 0.06) * (1 - speed * 0.3);
		bank.current = smoothDamp(bank.current, bankTarget, bankVel.current, 0.6, dt);

		// lookAt zeroes roll, so this has to come after it.
		cam.rotateZ(bank.current);
		const targetFov = tier.fov + speed * 7;
		cam.fov += (targetFov - cam.fov) * Math.min(1, dt * 4);
		cam.updateProjectionMatrix();
	});

	return null;
}

/** Post stack: one merged pass, aberration driven by scroll velocity only. */
function Post() {
	const effect = useMemo(() => new DitherEffect({ grain: 0.022, dither: 0.03 }), []);

	useFrame(() => {
		// Aberration is a transition artefact, not an ambient look: it tracks
		// scroll velocity and returns to exactly zero at rest.
		const v = Math.min(Math.abs(scrollState.velocity) * 0.55, 1);
		effect.setAberration(scrollState.reducedMotion ? 0 : v * 0.006);
	});

	// Mounted as a primitive: EffectComposer collects Effect *instances* from
	// its children, and a bare instance is not a valid React child.
	return (
		<EffectComposer>
			<primitive object={effect} dispose={null} />
		</EffectComposer>
	);
}

/**
 * Drifts the fog toward each section's hue as the camera travels, and feeds
 * the ambient drone. Both are continuous functions of position, so neither
 * needs to know anything about section boundaries.
 */
function Atmosphere() {
	const { scene } = useThree();
	const stops = useMemo(
		() => FOG_STOPS.map((s) => ({ z: s.z, color: new THREE.Color(s.color) })),
		[]
	);
	const target = useMemo(() => new THREE.Color(), []);

	useFrame((_, delta) => {
		const fog = scene.fog as THREE.Fog | null;
		if (!fog) return;

		const z = scrollState.cameraZ;

		// Find the pair of stops bracketing the camera and blend between them.
		let a = stops[0];
		let b = stops[stops.length - 1];
		for (let i = 1; i < stops.length; i++) {
			if (z >= stops[i].z) {
				a = stops[i - 1];
				b = stops[i];
				break;
			}
		}
		const span = b.z - a.z;
		const t = span === 0 ? 0 : THREE.MathUtils.clamp((z - a.z) / span, 0, 1);

		// Multiplied down hard: this is coloured air, not a coloured background.
		target.copy(a.color).lerp(b.color, t).multiplyScalar(0.075);
		fog.color.lerp(target, Math.min(1, delta * 1.5));

		updateAudio(scrollState.progress, scrollState.velocity, scrollState.cameraZ);
	});

	return null;
}

function Scene() {
	const tier = useTier();

	// The hero sculpture sits beside the copy on desktop and drops below it on
	// portrait, where the text occupies the full width. The tower stands about
	// 21 world units tall, so these scales are what keep it inside the frustum
	// at each tier rather than cropping top and bottom.
	const heroBase: [number, number, number] = tier.mobile ? [0, -26, -24] : [14, -1, -6];
	const heroPos: [number, number, number] = [
		heroBase[0] + pathX(heroBase[2]),
		heroBase[1] + pathY(heroBase[2]),
		heroBase[2],
	];
	const heroScale = tier.mobile ? 1.4 : 1.2;

	const finaleZ = CONTACT_Z - 14;

	return (
		<>
			<CameraRig />
			<Atmosphere />
			<GraphGrid />
			<Dust />

			<Sculpture mode="hero" position={heroPos} scale={heroScale} />

			{/* The same hero one lap downstream. This is what the visitor is
			    looking at the instant the loop wraps, so the frame before and
			    after the cut are the same picture and the seam disappears. */}
			<Sculpture
				mode="loop"
				position={[heroPos[0], heroPos[1], heroPos[2] - LOOP_LENGTH]}
				scale={heroScale}
			/>

			<ExperienceTimeline />
			<Monoliths />
			<SkillLattice />
			<AwardPlinth />
			<EducationMarkers />
			<TerminalObject />
			<ReturnTunnel />

			{/* The finale copy: the same tower reassembling behind the contact
			    panel. A single instance could not do both, since the hero sits
			    1280 units back up the corridor. */}
			<Sculpture
				mode="finale"
				position={[pathX(finaleZ), -2 + pathY(finaleZ), finaleZ]}
				scale={tier.mobile ? 1.2 : 1.5}
			/>

			<Post />
		</>
	);
}

export default function Journey() {
	const [enabled, setEnabled] = useState(false);
	const [lost, setLost] = useState(false);

	useEffect(() => {
		scrollState.reducedMotion = prefersReducedMotion();
		setEnabled(hasWebGL());

		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		const onChange = () => {
			scrollState.reducedMotion = mq.matches;
		};
		mq.addEventListener('change', onChange);
		return () => mq.removeEventListener('change', onChange);
	}, []);

	// Flag the no-3D case on <html> so the overlay can collapse the corridor:
	// without monoliths to fly past, 780vh of scroll is empty dead space.
	useEffect(() => {
		document.documentElement.classList.toggle('no-webgl', !enabled || lost);
	}, [enabled, lost]);

	// If WebGL is unavailable or the context dies, render nothing at all. The
	// DOM overlay is a complete, readable page on its own — a blank black
	// screen is the one failure this site must never show.
	if (!enabled || lost) return null;

	return (
		<div className="journey-canvas" aria-hidden="true">
			<Canvas
				dpr={cappedDpr()}
				gl={{
					antialias: false,
					powerPreference: 'high-performance',
					alpha: false,
					stencil: false,
					depth: true,
				}}
				camera={{ fov: 62, near: 0.1, far: 420, position: [0, 0, 34] }}
				onCreated={({ gl, scene }) => {
					gl.setClearColor(new THREE.Color(PALETTE.black), 1);
					scene.fog = new THREE.Fog(PALETTE.black, 110, 300);
					gl.domElement.addEventListener('webglcontextlost', (e) => {
						e.preventDefault();
						setLost(true);
					});
				}}
			>
				<Scene />
			</Canvas>
		</div>
	);
}
