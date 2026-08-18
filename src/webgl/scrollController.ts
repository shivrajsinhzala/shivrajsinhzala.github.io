/**
 * Scroll controller for the journey.
 *
 * Converts scroll position into the world Z the camera follows, tracks the
 * active section, and runs teleport-nav flights.
 *
 * The mapping is built by measuring the real DOM: every section (and every
 * project step inside the corridor) contributes an anchor pairing "the scroll
 * offset at which this element is centred" with "the world Z that belongs to
 * it". Camera Z is then piecewise-linear between anchors.
 *
 * This is why sections land exactly where they should on any device: nothing
 * assumes a section is 140vh tall, or that a phone reflows the same as a
 * desktop. Anchors are rebuilt whenever layout can change.
 *
 * Runs regardless of whether WebGL mounted — the DOM overlay's reveal states
 * depend on it, so the page animates correctly even with no canvas at all.
 */

import {
	LOOP_LENGTH,
	PROJECTS,
	SECTIONS,
	projectTransform,
	skillZ,
	type SectionId,
} from '../data/journey';
import { scrollState, setActiveSection } from './scrollStore';

/** Teleport nav duration. Fast enough to feel instant, slow enough to keep orientation. */
const FLIGHT_MS = 350;

type LenisLike = {
	scrollTo: (
		target: number,
		opts?: {
			duration?: number;
			easing?: (t: number) => number;
			immediate?: boolean;
			onComplete?: () => void;
		}
	) => void;
};

declare global {
	interface Window {
		lenis?: LenisLike;
	}
}

type Anchor = { y: number; z: number; id: SectionId };

let anchors: Anchor[] = [];

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Scroll offset at which an element sits in the middle of the viewport. */
function centredScrollY(el: Element, vh: number, maxScroll: number): number {
	const rect = el.getBoundingClientRect();
	const top = rect.top + window.scrollY;
	return clamp(top + rect.height / 2 - vh / 2, 0, maxScroll);
}

function buildAnchors() {
	const vh = window.innerHeight;
	if (vh <= 0) return;

	const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
	const list: Anchor[] = [];

	for (const section of SECTIONS) {
		const el = document.getElementById(section.id);
		if (!el) continue;

		if (section.id === 'projects') {
			// The corridor is not one anchor but one per monolith: each project
			// caption must be centred exactly as the camera passes its slab.
			const heading = el.querySelector('[data-corridor-heading]');
			if (heading) {
				list.push({ y: centredScrollY(heading, vh, maxScroll), z: section.z, id: 'projects' });
			}
			el.querySelectorAll<HTMLElement>('[data-project-index]').forEach((step) => {
				const i = Number(step.dataset.projectIndex);
				if (Number.isNaN(i)) return;
				list.push({
					y: centredScrollY(step, vh, maxScroll),
					// Anchors are section positions, and the camera sits camOffset
					// (34) in front of them. Backing the anchor off by 8 leaves the
					// slab ~26 units ahead when its caption is centred, so it reads
					// as being approached rather than already passed.
					z: projectTransform(i).position[2] - 8,
					id: 'projects',
				});
			});
			continue;
		}

		if (section.id === 'skills') {
			// Same shape as the corridor: one anchor per skill so the camera
			// arrives at each 3D mark exactly as its card centres.
			const heading = el.querySelector('[data-skills-heading]');
			if (heading) {
				list.push({ y: centredScrollY(heading, vh, maxScroll), z: section.z, id: 'skills' });
			}
			el.querySelectorAll<HTMLElement>('[data-skill-index]').forEach((step) => {
				const i = Number(step.dataset.skillIndex);
				if (Number.isNaN(i)) return;
				list.push({
					y: centredScrollY(step, vh, maxScroll),
					z: skillZ(i) - 8,
					id: 'skills',
				});
			});
			continue;
		}

		list.push({ y: centredScrollY(el, vh, maxScroll), z: section.z, id: section.id });
	}

	// The loop clone sits one full lap downstream of the real hero, so the
	// camera arrives at the duplicate sculpture exactly as the clone centres.
	const clone = document.getElementById('hero-loop');
	if (clone) {
		// Anchored to the clone's top rather than its centre: at scroll 0 the
		// real hero sits with its top at the viewport top, so the seam has to
		// reproduce that exact framing for the cut to be invisible.
		const top = clone.getBoundingClientRect().top + window.scrollY;
		list.push({ y: clamp(top, 0, maxScroll), z: -LOOP_LENGTH, id: 'hero' });
	}

	list.sort((a, b) => a.y - b.y);

	// Guarantee strictly increasing y so interpolation can never divide by zero
	// or run backwards if two elements happen to centre at the same offset.
	anchors = list.filter((a, i) => i === 0 || a.y > list[i - 1].y + 0.5);
}

/** Piecewise-linear scroll offset → world Z. */
function scrollToZ(y: number): number {
	if (anchors.length === 0) return 0;
	if (y <= anchors[0].y) return anchors[0].z;

	for (let i = 1; i < anchors.length; i++) {
		if (y <= anchors[i].y) {
			const a = anchors[i - 1];
			const b = anchors[i];
			const t = (y - a.y) / (b.y - a.y);
			return a.z + (b.z - a.z) * t;
		}
	}
	return anchors[anchors.length - 1].z;
}

/** Section whose element currently owns the viewport centre. */
function activeSectionAt(y: number): SectionId {
	if (anchors.length === 0) return 'hero';
	let best = anchors[0];
	let bestD = Infinity;
	for (const a of anchors) {
		const d = Math.abs(a.y - y);
		if (d < bestD) {
			bestD = d;
			best = a;
		}
	}
	return best.id;
}

/**
 * Append a copy of the hero after the footer.
 *
 * The loop can only be seamless if the DOM is periodic as well as the world:
 * at the moment of the wrap the visitor must already be looking at the hero,
 * so that resetting the scroll position changes nothing on screen. The clone
 * is inert and hidden from assistive tech — it is the same content, and only
 * the original should be reachable or indexed.
 */
function buildLoopClone() {
	if (scrollState.reducedMotion) return;
	if (document.getElementById('hero-loop')) return;

	const hero = document.getElementById('hero');
	const footer = document.querySelector('footer');
	if (!hero || !footer) return;

	const clone = hero.cloneNode(true) as HTMLElement;
	clone.id = 'hero-loop';
	clone.setAttribute('aria-hidden', 'true');
	clone.dataset.loopClone = '';

	// Strip every id so the clone cannot collide with the original, and take
	// the whole subtree out of the tab order.
	clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
	clone.querySelectorAll('a, button, input, select, textarea').forEach((el) => {
		el.setAttribute('tabindex', '-1');
		(el as HTMLElement).style.pointerEvents = 'none';
	});

	footer.insertAdjacentElement('afterend', clone);

	// Runway past the seam.
	//
	// With the clone as the last element its centred offset equals maxScroll,
	// so the wrap could only fire once scrolling had already hit the bottom and
	// stopped dead — which is exactly why the loop read as a jump instead of a
	// continuation. This spacer puts a full viewport beyond the seam so the
	// wrap happens mid-scroll, with momentum still carrying.
	const runway = document.createElement('div');
	runway.setAttribute('aria-hidden', 'true');
	runway.dataset.loopRunway = '';
	runway.style.height = '100svh';
	runway.style.pointerEvents = 'none';
	clone.insertAdjacentElement('afterend', runway);
}

export function initJourney() {
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	scrollState.reducedMotion = reduced;

	buildLoopClone();
	buildAnchors();

	let lastY = window.scrollY;
	let lastTime = performance.now();

	const readScroll = () => {
		const vh = window.innerHeight;
		const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
		const y = window.scrollY || document.documentElement.scrollTop;

		scrollState.progress = clamp(y / maxScroll, 0, 1);
		scrollState.targetZ = scrollToZ(y);

		const now = performance.now();
		const dt = Math.max(1, now - lastTime);
		// Normalised by viewport height so velocity means the same thing on a
		// phone and a 4K monitor — it only drives transition aberration.
		scrollState.velocity = ((y - lastY) / Math.max(1, vh) / dt) * 1000;
		lastY = y;
		lastTime = now;

		setActiveSection(activeSectionAt(y));
		syncNav(scrollState.active);
		syncReveals(vh);

		// Crossing the loop clone's centre wraps back to the real hero. Both
		// show the same thing, so nothing on screen changes.
		if (!wrapping && !scrollState.reducedMotion && anchors.length > 1) {
			const seam = anchors[anchors.length - 1];
			if (seam.z === -LOOP_LENGTH && y >= seam.y) {
				wrapToStart(anchors[0].y);
			}
		}
	};

	// Rebuild anchors whenever layout can change. Fonts landing late or an
	// image settling both shift element offsets, and a stale anchor table is
	// exactly how a section ends up arriving at the wrong scroll position.
	const remeasure = () => {
		buildAnchors();
		readScroll();
	};

	window.addEventListener('resize', remeasure, { passive: true });
	window.addEventListener('orientationchange', remeasure, { passive: true });
	if (document.fonts?.ready) document.fonts.ready.then(remeasure).catch(() => {});
	window.addEventListener('load', remeasure);

	if (typeof ResizeObserver !== 'undefined') {
		const ro = new ResizeObserver(() => remeasure());
		const main = document.querySelector('.journey-scroll');
		if (main) ro.observe(main);
	}

	// Sample scroll every frame rather than binding to scroll events. Lenis
	// performs real window scrolling, so this stays correct whether Lenis is
	// present, still initialising, or disabled for reduced motion — and it
	// keeps velocity decaying smoothly once scrolling stops.
	let raf = 0;
	const tick = () => {
		readScroll();
		if (performance.now() - lastTime > 90) scrollState.velocity *= 0.86;
		raf = requestAnimationFrame(tick);
	};
	raf = requestAnimationFrame(tick);

	readScroll();
	scrollState.ready = true;
	document.documentElement.classList.add('journey-ready');

	wireNav();

	return () => {
		cancelAnimationFrame(raf);
		window.removeEventListener('resize', remeasure);
		window.removeEventListener('orientationchange', remeasure);
	};
}

/* ------------------------------------------------------------------ */
/* Loop                                                                 */
/* ------------------------------------------------------------------ */

let wrapping = false;

/**
 * Wrap the journey back to its start, invisibly.
 *
 * There is no flash and no transition, because none is needed: the world is
 * periodic over LOOP_LENGTH and the DOM carries a hero clone one lap
 * downstream, so at the moment this fires the visitor is already looking at
 * exactly what they will be looking at afterwards. Scroll position and camera
 * both jump by precisely one lap and the picture does not change.
 *
 * `snap` tells the camera rig to land rather than spring, which would
 * otherwise fly the whole lap back in view.
 */
function wrapToStart(heroY: number) {
	wrapping = true;

	const lenis = getLenis();
	if (lenis) lenis.scrollTo(heroY, { immediate: true });
	window.scrollTo({ top: heroY, behavior: 'auto' });

	scrollState.targetZ = 0;
	scrollState.cameraZ = 0;
	scrollState.snap = true;
	// Silence the gates across the jump; otherwise every one of them fires in
	// the single frame the camera teleports a full lap.
	scrollState.muteGatesUntil = performance.now() + 350;

	// Re-arm on the next frame; by then scroll is nowhere near the seam.
	requestAnimationFrame(() => {
		wrapping = false;
	});
}

/** Lenis is created by GlobalScripts, so resolve it at call time, not init time. */
function getLenis(): LenisLike | null {
	return scrollState.reducedMotion ? null : (window.lenis ?? null);
}

/* ------------------------------------------------------------------ */
/* Nav — teleport flights                                              */
/* ------------------------------------------------------------------ */

function wireNav() {
	document.querySelectorAll<HTMLAnchorElement>('[data-journey-nav]').forEach((link) => {
		link.addEventListener('click', (e) => {
			const id = link.dataset.journeyNav as SectionId | undefined;
			if (!id) return;
			e.preventDefault();
			flyTo(id);
		});
	});

	// The site navbar links to sections with plain hashes. Adopt any that name
	// a real section so they fly the camera too, instead of hard-jumping the
	// page out from under it.
	document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
		if (link.dataset.journeyNav) return;
		const id = link.getAttribute('href')!.slice(1) as SectionId;
		if (!SECTIONS.some((s) => s.id === id)) return;
		link.dataset.journeyNav = id;
		link.addEventListener('click', (e) => {
			e.preventDefault();
			flyTo(id);
		});
	});

	const hash = window.location.hash.replace('#', '') as SectionId;
	if (hash && SECTIONS.some((s) => s.id === hash)) {
		requestAnimationFrame(() => flyTo(hash, true));
	}
}

/** Scroll offset that centres a section — measured, not computed from a table. */
function targetYFor(id: SectionId): number {
	const vh = window.innerHeight;
	const maxScroll = Math.max(1, document.documentElement.scrollHeight - vh);
	const el = document.getElementById(id);
	if (!el) return 0;

	// For the corridor, land on its heading rather than its midpoint — the
	// section is many screens tall and its centre is somewhere near project 6.
	const heading = id === 'projects' ? el.querySelector('[data-corridor-heading]') : null;
	return centredScrollY(heading ?? el, vh, maxScroll);
}

export function flyTo(id: SectionId, immediate = false) {
	buildAnchors();
	const targetY = targetYFor(id);
	const lenis = getLenis();

	scrollState.flying = true;
	// A nav flight covers hundreds of units fast enough to trip many gates.
	scrollState.muteGatesUntil = performance.now() + FLIGHT_MS + 120;

	if (scrollState.reducedMotion || immediate) {
		window.scrollTo({ top: targetY, behavior: 'auto' });
		scrollState.flying = false;
		return;
	}

	if (lenis) {
		lenis.scrollTo(targetY, {
			duration: FLIGHT_MS / 1000,
			easing: (t: number) => 1 - Math.pow(1 - t, 3),
			onComplete: () => {
				scrollState.flying = false;
			},
		});
	} else {
		window.scrollTo({ top: targetY, behavior: 'smooth' });
		window.setTimeout(() => {
			scrollState.flying = false;
		}, FLIGHT_MS);
	}
}

/* ------------------------------------------------------------------ */
/* DOM sync                                                            */
/* ------------------------------------------------------------------ */

function syncNav(active: SectionId) {
	document.querySelectorAll<HTMLElement>('[data-journey-nav]').forEach((el) => {
		el.classList.toggle('is-active', el.dataset.journeyNav === active);
	});
}

/**
 * Reveal DOM panels as the camera reaches them. Uses the same measurement pass
 * the camera uses, so text and world are guaranteed to arrive together — an
 * IntersectionObserver would drift against the eased camera.
 */
function syncReveals(vh: number) {
	const panels = document.querySelectorAll<HTMLElement>('[data-panel]');

	// A zero-height viewport (background tab, some headless contexts) would
	// divide to Infinity and blank every panel. Leave them fully visible.
	if (vh <= 0) {
		panels.forEach((p) => p.style.setProperty('--panel-visible', '1'));
		return;
	}

	panels.forEach((panel) => {
		const rect = panel.getBoundingClientRect();
		const centre = rect.top + rect.height / 2;
		// 1 at viewport centre, 0 at the edges.
		const d = Math.abs(centre - vh / 2) / (vh * 0.85);
		const visible = Math.max(0, 1 - d);

		panel.style.setProperty('--panel-visible', visible.toFixed(3));
		panel.classList.toggle('is-visible', visible > 0.12);
	});
}

export { PROJECTS };
