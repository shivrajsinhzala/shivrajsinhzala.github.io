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
	const spread = Math.min(1, Math.max(0.42, aspect / 1.6));

	return {
		mobile,
		spread,
		// A wider lens on portrait recovers some of the peripheral world that
		// the narrow frame would otherwise crop away.
		fov: mobile ? 78 : 62,
		camOffset: mobile ? 30 : 34,
	};
}
