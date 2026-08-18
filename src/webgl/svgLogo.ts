import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';

/**
 * Turns an SVG mark into real extruded 3D geometry.
 *
 * The skills used to be flat images pasted on a slab, which is why they read as
 * stickers rather than as part of the world. These are actual solids with
 * depth and lit sides, so they catch the corridor light like everything else.
 *
 * Normalised on the way out: SVG's Y axis points down and every mark has its
 * own viewBox origin, so each geometry is flipped, centred on its own bounding
 * box and scaled to a common height. Without that, marks authored at different
 * scales would arrive wildly different sizes.
 */
export function extrudeSvgPath(d: string, targetHeight = 6, depth = 1.1): THREE.BufferGeometry {
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="${d}"/></svg>`;
	return extrudeSvgDocument(svg, targetHeight, depth);
}

export function extrudeSvgDocument(
	svgText: string,
	targetHeight = 6,
	depth = 1.1
): THREE.BufferGeometry {
	const parsed = new SVGLoader().parse(svgText);

	const shapes: THREE.Shape[] = [];
	for (const path of parsed.paths) {
		// `true` for solid: brand marks rely on even-odd holes (the WordPress
		// W, the counters in the Shopify bag) and dropping them fills the mark
		// into a blob.
		for (const shape of SVGLoader.createShapes(path)) shapes.push(shape);
	}

	if (shapes.length === 0) return new THREE.BufferGeometry();

	const geo = new THREE.ExtrudeGeometry(shapes, {
		depth,
		bevelEnabled: true,
		bevelThickness: 0.08,
		bevelSize: 0.06,
		bevelSegments: 1,
		curveSegments: 8,
	});

	// SVG Y grows downward; three's grows up.
	geo.scale(1, -1, 1);
	geo.computeBoundingBox();

	const box = geo.boundingBox!;
	const size = new THREE.Vector3();
	box.getSize(size);
	const centre = new THREE.Vector3();
	box.getCenter(centre);

	geo.translate(-centre.x, -centre.y, -centre.z);
	const scale = size.y > 0 ? targetHeight / size.y : 1;
	geo.scale(scale, scale, 1);

	geo.computeVertexNormals();
	return geo;
}
