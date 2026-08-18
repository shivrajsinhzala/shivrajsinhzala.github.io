/**
 * Scroll state shared between the DOM overlay and the WebGL world.
 *
 * Deliberately dependency-free and mutable: `useFrame` reads this every frame,
 * so it must never allocate or trigger a React render on scroll. React
 * components subscribe only to discrete changes (active section id).
 */

import type { SectionId } from '../data/journey';

export type ScrollState = {
	/** 0..1 across the whole journey. Used for staging, never for camera position. */
	progress: number;
	/** World Z the camera should be at, derived from measured DOM anchors. */
	targetZ: number;
	/** Smoothed world Z the camera actually follows. */
	cameraZ: number;
	/** Scroll velocity in viewports/second — drives transition-only aberration. */
	velocity: number;
	/** Section the camera is currently inside. */
	active: SectionId;
	/** True while a teleport-nav flight is running. */
	flying: boolean;
	/** Set by the loop warp: the camera must jump, not spring, to the new Z. */
	snap: boolean;
	/**
	 * Timestamp until which gates stay silent.
	 *
	 * Any instant camera jump — the loop wrap, a teleport nav — crosses every
	 * gate in the scene in one frame. Without this they all fire at once, which
	 * is a wall of sound rather than a flourish.
	 */
	muteGatesUntil: number;
	ready: boolean;
	reducedMotion: boolean;
};

export const scrollState: ScrollState = {
	progress: 0,
	targetZ: 0,
	cameraZ: 0,
	velocity: 0,
	active: 'hero',
	flying: false,
	snap: false,
	muteGatesUntil: 0,
	ready: false,
	reducedMotion: false,
};

type Listener = (id: SectionId) => void;
const sectionListeners = new Set<Listener>();

export function onSectionChange(fn: Listener) {
	sectionListeners.add(fn);
	return () => sectionListeners.delete(fn);
}

export function setActiveSection(id: SectionId) {
	if (scrollState.active === id) return;
	scrollState.active = id;
	sectionListeners.forEach((fn) => fn(id));
}
