/**
 * Combined post pass: ordered-dither + film grain + transition-only chromatic
 * aberration.
 *
 * All three live in one Effect so `postprocessing` merges them into a single
 * fullscreen shader rather than three separate passes — the whole post stack
 * costs one texture read per pixel, which is what keeps the budget on mobile.
 *
 * Deliberately no bloom, no DOF, no motion blur: the look is rendered-print,
 * not game engine.
 */

import { Effect } from 'postprocessing';
import { Uniform } from 'three';

const fragment = /* glsl */ `
	uniform float uTime;
	uniform float uAberration;
	uniform float uGrain;
	uniform float uDither;

	// 4x4 Bayer matrix — ordered dithering. Cheap, stable under motion, and it
	// reads as halftone print rather than noise.
	float bayer(vec2 p) {
		int x = int(mod(p.x, 4.0));
		int y = int(mod(p.y, 4.0));
		int i = y * 4 + x;
		if (i == 0)  return  0.0 / 16.0;
		if (i == 1)  return  8.0 / 16.0;
		if (i == 2)  return  2.0 / 16.0;
		if (i == 3)  return 10.0 / 16.0;
		if (i == 4)  return 12.0 / 16.0;
		if (i == 5)  return  4.0 / 16.0;
		if (i == 6)  return 14.0 / 16.0;
		if (i == 7)  return  6.0 / 16.0;
		if (i == 8)  return  3.0 / 16.0;
		if (i == 9)  return 11.0 / 16.0;
		if (i == 10) return  1.0 / 16.0;
		if (i == 11) return  9.0 / 16.0;
		if (i == 12) return 15.0 / 16.0;
		if (i == 13) return  7.0 / 16.0;
		if (i == 14) return 13.0 / 16.0;
		return 5.0 / 16.0;
	}

	float hash(vec2 p) {
		return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
	}

	void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
		vec2 centered = uv - 0.5;

		// Chromatic aberration scales with scroll velocity, so it only appears
		// during transitions and is completely absent at rest.
		vec3 color;
		if (uAberration > 0.0001) {
			vec2 offset = centered * uAberration;
			color.r = texture2D(inputBuffer, uv + offset).r;
			color.g = inputColor.g;
			color.b = texture2D(inputBuffer, uv - offset).b;
		} else {
			color = inputColor.rgb;
		}

		// Ordered dither — quantise to a coarse palette so gradients band on
		// purpose instead of smoothing out.
		float threshold = bayer(gl_FragCoord.xy) - 0.5;
		color += threshold * uDither;
		float levels = 12.0;
		color = floor(color * levels + 0.5) / levels;

		// Film grain, static-free (time-quantised so it doesn't shimmer).
		float g = hash(gl_FragCoord.xy + floor(uTime * 24.0)) - 0.5;
		color += g * uGrain;

		outputColor = vec4(color, inputColor.a);
	}
`;

export class DitherEffect extends Effect {
	constructor({ grain = 0.045, dither = 0.055 } = {}) {
		super('DitherEffect', fragment, {
			uniforms: new Map<string, Uniform<number>>([
				['uTime', new Uniform(0)],
				['uAberration', new Uniform(0)],
				['uGrain', new Uniform(grain)],
				['uDither', new Uniform(dither)],
			]),
		});
	}

	update(_renderer: unknown, _inputBuffer: unknown, deltaTime: number) {
		const t = this.uniforms.get('uTime');
		if (t) t.value += deltaTime;
	}

	setAberration(v: number) {
		const u = this.uniforms.get('uAberration');
		if (u) u.value = v;
	}
}
