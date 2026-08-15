/**
 * Capability probes.
 *
 * The journey must never render a blank black screen, so every one of these is
 * a hard gate: if WebGL is unavailable or the context is lost, the DOM layer
 * stands on its own and the canvas is simply never mounted.
 */

export function hasWebGL(): boolean {
	if (typeof window === 'undefined') return false;
	try {
		const canvas = document.createElement('canvas');
		const gl =
			canvas.getContext('webgl2') ||
			canvas.getContext('webgl') ||
			canvas.getContext('experimental-webgl');
		if (!gl) return false;
		// Software rasterisers report as WebGL but cannot hold 60fps on this scene.
		const debug = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
		if (debug) {
			const renderer = String(
				(gl as WebGLRenderingContext).getParameter(debug.UNMASKED_RENDERER_WEBGL) ?? ''
			).toLowerCase();
			if (renderer.includes('swiftshader') || renderer.includes('llvmpipe')) return false;
		}
		return true;
	} catch {
		return false;
	}
}

export function prefersReducedMotion(): boolean {
	if (typeof window === 'undefined') return false;
	return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Device pixel ratio, capped at 2 per the perf budget. Rendering at native DPR
 * on a 3x phone triples fragment cost for no perceptible gain.
 */
export function cappedDpr(): [number, number] {
	if (typeof window === 'undefined') return [1, 2];
	return [1, Math.min(2, window.devicePixelRatio || 1)];
}
