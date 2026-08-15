/**
 * The corridor's centre line.
 *
 * The journey used to run dead straight down -Z, which meant the whole world
 * was visible at once and nothing was ever revealed. This bends it.
 *
 * Deliberately expressed as lateral displacement *as a function of Z* rather
 * than as a spline with its own parameter. Scroll → Z is measured from the DOM
 * and verified to land every section exactly; re-parameterising by arc length
 * would put that guarantee at risk for no visible gain. Here Z still means
 * exactly what it did, and X/Y are simply where the corridor sits at that
 * depth. Everything in the world — camera, monoliths, gates, dust — offsets by
 * the same function, so they stay in formation.
 *
 * Amplitudes are deliberately small — well under the corridor's own half
 * width. A bend wider than the corridor stops reading as "the path curves"
 * and starts reading as "the whole scene slid sideways", which destroys the
 * left/right structure of the monoliths. Gentle also keeps the banking from
 * inducing motion sickness.
 */

import { LOOP_LENGTH } from '../data/journey';

/**
 * Frequencies are exact harmonics of LOOP_LENGTH, so pathX(z - LOOP_LENGTH)
 * equals pathX(z) for every z. Without that the corridor would visibly kink
 * at the seam of the infinite loop.
 */
const TAU_OVER_LOOP = (Math.PI * 2) / LOOP_LENGTH;

const AX1 = 7;
const KX1 = TAU_OVER_LOOP * 4;
const AX2 = 3.5;
const KX2 = TAU_OVER_LOOP * 1;

const AY1 = 3;
const KY1 = TAU_OVER_LOOP * 3;
const PY1 = 1.3;

export function pathX(z: number): number {
	return Math.sin(z * KX1) * AX1 + Math.sin(z * KX2) * AX2;
}

export function pathY(z: number): number {
	return Math.sin(z * KY1 + PY1) * AY1;
}

/** dX/dZ — the corridor's lateral slope at a given depth. */
export function pathDX(z: number): number {
	return Math.cos(z * KX1) * AX1 * KX1 + Math.cos(z * KX2) * AX2 * KX2;
}

/** d²X/dZ² — curvature, used to bank the camera into bends. */
export function pathDDX(z: number): number {
	return -Math.sin(z * KX1) * AX1 * KX1 * KX1 - Math.sin(z * KX2) * AX2 * KX2 * KX2;
}

export function pathDY(z: number): number {
	return Math.cos(z * KY1 + PY1) * AY1 * KY1;
}
