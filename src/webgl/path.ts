/**
 * The corridor's centre line.
 *
 * Deliberately expressed as lateral displacement *as a function of Z* rather
 * than as a spline with its own parameter. Scroll → Z is measured from the DOM
 * and verified to land every section exactly; re-parameterising by arc length
 * would put that guarantee at risk for no visible gain. Here Z still means
 * exactly what it did, and X/Y are simply where the corridor sits at that
 * depth. Everything in the world — camera, monoliths, gates, dust — offsets by
 * the same function, so they stay in formation.
 */

import { LOOP_LENGTH } from '../data/journey';

/**
 * Every frequency is an exact harmonic of LOOP_LENGTH, so pathX(z -
 * LOOP_LENGTH) equals pathX(z) for every z. Without that the corridor would
 * visibly kink at the seam of the infinite loop.
 */
const TAU_OVER_LOOP = (Math.PI * 2) / LOOP_LENGTH;

/** Full left-right-left cycles per lap. */
const ZIGZAG_CYCLES = 6;
const KZ = TAU_OVER_LOOP * ZIGZAG_CYCLES;

/**
 * Lateral swing, in world units.
 *
 * Held well under the corridor's own half-width (23). A path that swings wider
 * than the corridor stops reading as "the route zigzags" and starts reading as
 * "the whole scene slid sideways", which destroys the left/right structure of
 * the monoliths — that was the failure mode the first time this was tuned too
 * aggressively.
 */
const AMPLITUDE = 13;

/**
 * Band-limited triangle wave: the odd harmonics, with 1/k² falloff and
 * alternating sign.
 *
 * A sine sways; a triangle actually tracks left, then right, then left, with
 * straight runs between the turns — which is the motion being asked for. Only
 * four harmonics are summed on purpose. A true triangle has infinitely sharp
 * corners, and its second derivative (which drives the camera roll) would be
 * an impulse at every turn, producing exactly the sudden banking snap that was
 * fixed earlier. Truncating rounds the corners just enough to keep curvature
 * finite and the roll smooth.
 */
const HARMONICS = [1, 3, 5, 7] as const;
const TRI_NORM = 8 / (Math.PI * Math.PI);

/** Coefficient of the k-th harmonic in the triangle series. */
function triCoefficient(k: number): number {
	const sign = ((k - 1) / 2) % 2 === 0 ? 1 : -1;
	return (TRI_NORM * sign) / (k * k);
}

const COEFFS = HARMONICS.map(triCoefficient);

export function pathX(z: number): number {
	let sum = 0;
	for (let i = 0; i < HARMONICS.length; i++) {
		sum += COEFFS[i] * Math.sin(HARMONICS[i] * KZ * z);
	}
	return sum * AMPLITUDE;
}

/** dX/dZ — the corridor's lateral slope at a given depth. */
export function pathDX(z: number): number {
	let sum = 0;
	for (let i = 0; i < HARMONICS.length; i++) {
		const w = HARMONICS[i] * KZ;
		sum += COEFFS[i] * w * Math.cos(w * z);
	}
	return sum * AMPLITUDE;
}

/** d²X/dZ² — curvature, used to bank the camera into the turns. */
export function pathDDX(z: number): number {
	let sum = 0;
	for (let i = 0; i < HARMONICS.length; i++) {
		const w = HARMONICS[i] * KZ;
		sum -= COEFFS[i] * w * w * Math.sin(w * z);
	}
	return sum * AMPLITUDE;
}

/* ------------------------------------------------------------------ */
/* Vertical drift                                                       */
/* ------------------------------------------------------------------ */

const AY = 4;
const KY = TAU_OVER_LOOP * 3;
const PY = 1.3;

export function pathY(z: number): number {
	return Math.sin(z * KY + PY) * AY;
}

export function pathDY(z: number): number {
	return Math.cos(z * KY + PY) * AY * KY;
}
