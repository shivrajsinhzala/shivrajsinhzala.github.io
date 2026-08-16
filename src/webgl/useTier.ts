/**
 * Viewport tier for the 3D world.
 *
 * A corridor authored for a 16:9 desktop frustum does not fit a portrait
 * phone: the walls fall outside the field of view and the visitor flies down
 * an empty tube. Rather than shipping a separate mobile scene, the world's
 * lateral spread and the camera's field of view are derived from the actual
 * aspect ratio, so every device sees the same composition correctly framed.
 */

import { useThree } from '@react-three/fiber';

export type Tier = {
	mobile: boolean;
	/** Multiplier on every lateral (X) offset in the world. */
	spread: number;
	/**
	 * Multiplier on the *size* of corridor furniture.
	 *
	 * Narrowing the corridor without also shrinking what stands in it is a
	 * trap: at 360px the walls came in to ±9.7 while the slabs stayed 20 wide,
	 * so the camera flew straight through them. Position and size have to
	 * scale together.
	 */
	slabScale: number;
	fov: number;
	/** How far in front of a section's anchor the camera sits. */
	camOffset: number;
};

export function useTier(): Tier {
	const size = useThree((s) => s.size);
	const width = size.width || 1;
	const height = size.height || 1;
	const aspect = width / height;

	const mobile = width < 768 || aspect < 0.95;

	// Narrow frames pull the walls inward; wide frames keep the authored width.
	// The floor is 0.5 rather than 0.42 so the corridor keeps real clearance
	// once the furniture is scaled down too.
	const spread = Math.min(1, Math.max(0.5, aspect / 1.6));
	const slabScale = mobile ? 0.6 : 1;

	return {
		mobile,
		spread,
		slabScale,
		// A wider lens on portrait recovers some of the peripheral world that
		// the narrow frame would otherwise crop away.
		fov: mobile ? 78 : 62,
		camOffset: mobile ? 30 : 34,
	};
}
