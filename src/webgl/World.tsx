/**
 * The infinite brutalist void: graph-paper grid planes and the flat material
 * language every object in the scene is built from.
 */

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { PALETTE } from '../data/journey';

/**
 * Graph-paper grid drawn analytically on a single large plane. Two quads (floor
 * + ceiling) replace what would otherwise be thousands of line segments, and
 * the lines stay pixel-crisp at any distance because they're computed in the
 * fragment shader rather than rasterised from geometry.
 */
export function GraphGrid() {
	const material = useMemo(() => {
		return new THREE.ShaderMaterial({
			transparent: true,
			depthWrite: false,
			side: THREE.DoubleSide,
			uniforms: {
				uColor: { value: new THREE.Color(PALETTE.cyan) },
				uMajor: { value: new THREE.Color(PALETTE.pink) },
				uFade: { value: 190 },
				uCameraZ: { value: 0 },
			},
			vertexShader: /* glsl */ `
				varying vec3 vWorld;
				void main() {
					vec4 wp = modelMatrix * vec4(position, 1.0);
					vWorld = wp.xyz;
					gl_Position = projectionMatrix * viewMatrix * wp;
				}
			`,
			fragmentShader: /* glsl */ `
				uniform vec3 uColor;
				uniform vec3 uMajor;
				uniform float uFade;
				uniform float uCameraZ;
				varying vec3 vWorld;

				// Analytic grid line with screen-space-derivative antialiasing, so
				// distant lines thin out instead of aliasing into moire.
				float gridLine(vec2 coord, float spacing, float thickness) {
					vec2 g = abs(fract(coord / spacing - 0.5) - 0.5) / fwidth(coord / spacing);
					float line = min(g.x, g.y);
					return 1.0 - min(line / thickness, 1.0);
				}

				void main() {
					vec2 coord = vWorld.xz;

					// Coarser spacing and thinner lines: a dense grid fills the
					// frame with noise and flattens everything in front of it.
					float minor = gridLine(coord, 7.0, 0.9);
					float major = gridLine(coord, 28.0, 1.1);

					// Distance fade toward the camera's current depth — the grid
					// always dissolves into the void rather than ending abruptly.
					float dist = abs(vWorld.z - uCameraZ);
					float fade = 1.0 - smoothstep(uFade * 0.25, uFade, dist);

					vec3 color = mix(uColor, uMajor, major);
					float alpha = max(minor * 0.07, major * 0.22) * fade;

					if (alpha < 0.002) discard;
					gl_FragColor = vec4(color, alpha);
				}
			`,
		});
	}, []);

	const floorRef = useRef<THREE.Mesh>(null);

	useFrame(({ camera }) => {
		material.uniforms.uCameraZ.value = camera.position.z;
		// Slide the plane with the camera so the grid is genuinely endless
		// without ever growing the geometry.
		if (floorRef.current) floorRef.current.position.z = camera.position.z;
	});

	return (
		<>
			<mesh ref={floorRef} rotation-x={-Math.PI / 2} position={[0, -14, 0]} material={material} frustumCulled={false}>
				<planeGeometry args={[600, 600]} />
			</mesh>
		</>
	);
}

/**
 * Hard neon edge. The one "glow" the design language permits — it reads as
 * printed neon because it's a constant-colour line, not a bloomed light bleed.
 */
export function EdgeOutline({
	geometry,
	color,
	opacity = 1,
}: {
	geometry: THREE.BufferGeometry;
	color: string;
	opacity?: number;
}) {
	const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 25), [geometry]);
	const mat = useMemo(
		() =>
			new THREE.LineBasicMaterial({
				color: new THREE.Color(color),
				transparent: opacity < 1,
				opacity,
			}),
		[color, opacity]
	);
	return <lineSegments geometry={edges} material={mat} />;
}
