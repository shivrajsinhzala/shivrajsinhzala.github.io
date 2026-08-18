/**
 * Single source of truth for the v2 WebGL journey.
 *
 * Both the DOM overlay layer and the three.js world read from this file, so a
 * content change lands in the accessible text and the 3D geometry at once.
 * All copy is carried over verbatim from the v1 homepage.
 */

export const PALETTE = {
	black: '#0a0a0a',
	cyan: '#00f5ff',
	pink: '#e00062',
	gray: '#f0f0f0',
	orange: '#ff5e00',
	purple: '#9d00ff',
	yellow: '#ffe900',
	white: '#ffffff',

	/**
	 * Softer tints used for the 3D world only.
	 *
	 * The v1 brand neons are tuned for small accents on white — at the scale of
	 * a full sculpture face they read as harsh and slightly acidic. These are
	 * the same hue family a step lighter and less saturated, plus a mint the
	 * original palette lacked, which is what lets the tower's gradient move
	 * through five stops without any of them fighting.
	 *
	 * DOM chrome keeps the original brand colours; only the world uses these.
	 */
	softCyan: '#66d9ef',
	softPink: '#ff6b9d',
	warmYellow: '#ffd93d',
	mint: '#a8e6cf',
	violet: '#b47cff',
} as const;

export type PaletteKey = keyof typeof PALETTE;

/**
 * Sections in journey order. `z` is the camera's position along the spline in
 * world units — the single number that ties scroll, DOM, and 3D together.
 */
export type SectionId =
	| 'hero'
	| 'about'
	| 'experience'
	| 'projects'
	| 'skills'
	| 'awards'
	| 'education'
	| 'terminal'
	| 'contact'
	| 'outro';

export type Section = {
	id: SectionId;
	label: string;
	/**
	 * Depth along the corridor where this section lives.
	 *
	 * Note there is deliberately no scroll-height field here. Section heights
	 * belong to CSS, and duplicating them in JS means two numbers that must be
	 * hand-synced and silently drift apart — which is exactly what put sections
	 * at the wrong scroll offsets. The controller measures the real DOM instead,
	 * so reflow, font size, and viewport changes stay correct for free.
	 */
	z: number;
	navLabel?: string;
};

export const SECTIONS: Section[] = [
	{ id: 'hero', label: 'SHIVRAJSINH ZALA', z: 0 },
	{ id: 'about', label: 'HOW I WORK', z: -60, navLabel: 'ABOUT' },
	{ id: 'experience', label: 'WHERE I WORK', z: -140, navLabel: 'EXPERIENCE' },
	{ id: 'projects', label: 'SELECTED WORKS', z: -260, navLabel: 'WORK' },
	{ id: 'skills', label: 'MY STACK', z: -840, navLabel: 'STACK' },
	{ id: 'awards', label: 'RISING STAR 2025', z: -1040, navLabel: 'AWARDS' },
	{ id: 'education', label: 'WHERE I STUDIED', z: -1120 },
	{ id: 'terminal', label: 'TRY THE TERMINAL', z: -1200, navLabel: 'TERMINAL' },
	{ id: 'contact', label: "LET'S MAKE SOMETHING", z: -1300, navLabel: 'CONTACT' },
	// The loop tunnel. No nav entry — it is a transition, not a destination.
	{ id: 'outro', label: 'RETURN', z: -1660 },
];

export const CONTACT_Z = -1300;
export const OUTRO_Z = -1660;

/**
 * Length of one lap, in world units.
 *
 * The loop is seamless only if the world is genuinely periodic over this
 * distance — then the frame rendered just before the wrap is identical to the
 * frame just after it, and the cut has nothing to give it away. Four things
 * have to repeat exactly:
 *
 *   - the path curve  (its frequencies are harmonics of this length)
 *   - the graph grid  (1764 = 7 x 252 = 28 x 63, so both rulings tile it)
 *   - the dust field  (drawn as two copies one lap apart)
 *   - the hero itself (a second sculpture stands at -LOOP_LENGTH)
 *
 * Change this and all four have to be rechecked, which is why it lives here
 * rather than being inlined anywhere.
 */
export const LOOP_LENGTH = 1764;

/**
 * Gates in the return tunnel. They tighten and speed up toward the end so the
 * loop feels like an acceleration into a warp rather than the corridor simply
 * running out.
 */
export const TUNNEL_GATES = 16;
export const TUNNEL_START_Z = -1330;
export const TUNNEL_END_Z = -1806;
export const HERO_Z = 0;

/**
 * Fog tint per section.
 *
 * The void is black everywhere, which makes every stretch of the corridor feel
 * like the same stretch. Drifting the fog toward a different hue per section
 * gives each place its own air without ever lifting the background off black —
 * these are multiplied down hard before use.
 */
export const FOG_STOPS: Array<{ z: number; color: string }> = [
	{ z: 0, color: PALETTE.violet },
	{ z: -140, color: PALETTE.softCyan },
	{ z: -300, color: PALETTE.softPink },
	{ z: -560, color: PALETTE.warmYellow },
	{ z: -840, color: PALETTE.mint },
	{ z: -1040, color: PALETTE.warmYellow },
	{ z: -1200, color: '#00ff88' },
	{ z: -1300, color: PALETTE.violet },
	{ z: -1660, color: PALETTE.softCyan },
	// Must match the z = 0 stop exactly, or the wrap shows a colour shift.
	{ z: -1764, color: PALETTE.violet },
];

/**
 * Skills are spread along the corridor rather than clustered in a ring: the
 * visitor scrolls *through* the stack, meeting one logo at a time with its
 * proficiency, which is legible in a way six simultaneous boxes were not.
 */
export const SKILL_START_Z = -870;
export const SKILL_SPACING = 24;

export function skillZ(index: number): number {
	return SKILL_START_Z - index * SKILL_SPACING;
}

export function sectionZ(id: SectionId): number {
	return SECTIONS.find((s) => s.id === id)?.z ?? 0;
}

// ---------------------------------------------------------------------------
// PROJECTS — corridor of monoliths. `side` alternates them across the corridor.
// ---------------------------------------------------------------------------

export type Project = {
	num: string;
	title: string;
	stack: string;
	image: string;
	href: string | null;
	cta: 'LIVE' | 'REPO' | 'GITHUB' | 'PRIVATE';
	accent: string;
	alt: string;
};

export const PROJECTS: Project[] = [
	{
		num: '01',
		title: 'LoanFlow',
		stack: 'NEXT.JS / PRISMA / RAZORPAY',
		image: '/assets/images/project-loanflow.webp',
		href: 'https://loanflow.shivrajsinh.in',
		cta: 'LIVE',
		accent: PALETTE.purple,
		alt: 'LoanFlow — Loan management web app built with Next.js, Prisma and Razorpay',
	},
	{
		num: '02',
		title: 'WebCraft Builder',
		stack: 'REACT / VITE / TAILWIND / NODE.JS',
		image: '/assets/images/project-website-builder.webp',
		href: 'https://app.shivrajsinh.in',
		cta: 'LIVE',
		accent: PALETTE.cyan,
		alt: 'Website Builder Platform — Full-stack web app built with React, Vite, Tailwind CSS and Node.js',
	},
	{
		num: '03',
		title: 'Venus Pumps & Motors',
		stack: 'WORDPRESS / CLIENT SITE',
		image: '/assets/images/project-venus-pumps.webp',
		href: 'https://venuspumpsandmotors.com',
		cta: 'LIVE',
		accent: PALETTE.orange,
		alt: 'Venus Pumps & Motors — Industrial pumps and motors manufacturer website built with WordPress',
	},
	{
		num: '04',
		title: 'Solar Quartz',
		stack: 'SHOPIFY / AMAZON / DIGITAL MARKETING',
		image: '/assets/images/project-solar-quartz.webp',
		href: 'https://thedecorartisan.com',
		cta: 'LIVE',
		accent: PALETTE.yellow,
		alt: 'Solar Quartz — Premium decorative wall clocks Shopify store with Amazon listing and digital marketing',
	},
	{
		num: '05',
		title: 'Craft Design Studio',
		stack: 'ASTRO / REACT / GSAP / TAILWIND',
		image: '/assets/images/project-craft-design-studio.webp',
		href: 'https://craftdesignstudio.in',
		cta: 'LIVE',
		accent: PALETTE.yellow,
		alt: 'Craft Design Studio — Design studio website built with Astro, React and GSAP',
	},
	{
		num: '06',
		title: 'Shivam RO Water Solution',
		stack: 'NEXT.JS / TAILWIND / CLOUDFLARE D1',
		image: '/assets/images/project-shivam-ro.webp',
		href: 'https://shivamwatersolution.in',
		cta: 'LIVE',
		accent: PALETTE.cyan,
		alt: 'Shivam RO Water Solution — Water purifier business website built with Next.js, Tailwind CSS and Cloudflare D1',
	},
	{
		num: '07',
		title: 'Sahil Enterprise',
		stack: 'ASTRO / REACT / GSAP / TAILWIND',
		image: '/assets/images/project-sahil-enterprise.webp',
		href: 'https://sahilenterprisemorbi.com',
		cta: 'LIVE',
		accent: PALETTE.orange,
		alt: 'Sahil Enterprise — Business website built with Astro, React and GSAP',
	},
	{
		num: '08',
		title: 'Gardi Chat App',
		stack: 'REACT / TAILWIND / FIREBASE',
		image: '/assets/images/project-gardi-chat.webp',
		href: 'https://github.com/shivrajsinhzala/gardichatapp',
		cta: 'REPO',
		accent: PALETTE.cyan,
		alt: 'Gardi Chat App — Real-time college communication platform built with React, Tailwind and Firebase',
	},
	{
		num: '09',
		title: 'ToDesktop Clone',
		stack: 'REACT / TAILWIND',
		image: '/assets/images/project-todesktop.webp',
		href: 'https://github.com/shivrajsinhzala/ToDesktop_react',
		cta: 'REPO',
		accent: PALETTE.pink,
		alt: 'ToDesktop Clone — Pixel-perfect website clone built with React and Tailwind CSS',
	},
	{
		num: '10',
		title: 'Quote Generator',
		stack: 'REACT / TAILWIND',
		image: '/assets/images/project-quotegen.webp',
		href: 'https://github.com/shivrajsinhzala',
		cta: 'GITHUB',
		accent: PALETTE.orange,
		alt: 'ADInfocom Quote Generator — Business quotation tool built with React and Tailwind CSS',
	},
	{
		num: '11',
		title: 'AI Price Comparator',
		stack: 'EXTENSION / GEMINI AI',
		image: '/assets/images/project-price-compare.webp',
		href: null,
		cta: 'PRIVATE',
		accent: PALETTE.cyan,
		alt: 'AI Price Comparator — Chrome extension using Gemini AI to compare prices across e-commerce stores',
	},
	{
		num: '12',
		title: 'Somnath Khata',
		stack: 'REACT / WEB APP / TAILWIND',
		image: '/assets/images/project-somnath.webp',
		href: 'https://github.com/shivrajsinhzala/somnath-khata',
		cta: 'REPO',
		accent: PALETTE.purple,
		alt: 'Somnath Khata — Dairy management system for tracking customers, transactions and generating reports',
	},
];

/** Corridor geometry: each monolith's world position, alternating sides. */
export const PROJECT_START_Z = -300;
export const PROJECT_SPACING = 42;
export const PROJECT_SIDE_X = 23;

/**
 * `spread` narrows the corridor on portrait/phone viewports so both walls stay
 * inside the frustum instead of sliding off the edges of the screen.
 */
export function projectTransform(index: number, spread = 1) {
	const side = index % 2 === 0 ? -1 : 1;
	return {
		position: [
			side * PROJECT_SIDE_X * spread,
			0,
			PROJECT_START_Z - index * PROJECT_SPACING,
		] as const,
		rotationY: side * 0.42,
		side,
	};
}

/** Z the camera reaches after the last monolith, where the end card sits. */
export const PROJECT_END_Z = PROJECT_START_Z - PROJECTS.length * PROJECT_SPACING;

// ---------------------------------------------------------------------------
// SKILLS — lattice blocks, height driven by level
// ---------------------------------------------------------------------------

export type Skill = {
	num: string;
	name: string;
	/** True for the real brand marks (solid shapes); false for stroked glyphs. */
	solidLogo?: boolean;
	/**
	 * SVG files under /assets/logos/, extruded into real geometry. Used in
	 * preference to `logo`, and silently ignored when a file is missing, so a
	 * removed asset degrades rather than breaking the build.
	 */
	logoFiles?: string[];
	/** Shown when no mark can be drawn at all. */
	fallbackLabel?: string;
	/**
	 * 24x24 SVG path for the brand mark, rasterised onto the slab in the 3D
	 * scene. The first four are the real logos, carried over from v1; the last
	 * two are disciplines rather than products, so they get authored glyphs
	 * instead of an invented brand mark.
	 */
	logo: string;
	blurb: string;
	level: number;
	note: string;
	accent: string;
};

export const SKILLS: Skill[] = [
	{
		num: '01',
		name: 'WORDPRESS',
		solidLogo: true,
		logo: 'M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.15-2.85-.15-.585-.03-.661.855-.075.885 0 0 .54.061 1.125.09l1.68 4.605-2.37 7.08L5.354 6.9c.649-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.69-.015C4.911 3.15 8.235 1.215 12 1.215c2.809 0 5.365 1.072 7.286 2.833-.046-.003-.091-.009-.141-.009-1.06 0-1.812.923-1.812 1.914 0 .89.513 1.643 1.06 2.531.411.72.89 1.643.89 2.977 0 .915-.354 1.994-.821 3.479l-1.075 3.585-3.9-11.61.001.014zM12 22.784c-1.059 0-2.081-.153-3.048-.437l3.237-9.406 3.315 9.087c.024.053.05.101.078.149-1.12.393-2.325.609-3.582.609M1.211 12c0-1.564.336-3.05.935-4.39L7.29 21.709C3.694 19.96 1.212 16.271 1.211 12M12 0C5.385 0 0 5.385 0 12s5.385 12 12 12 12-5.385 12-12S18.615 0 12 0',
		blurb: 'My bread and butter. Themes, plugins, custom post types, WooCommerce.',
		level: 95,
		note: '95% — I build, fix, and optimize WP sites',
		accent: PALETTE.white,
	},
	{
		num: '02',
		name: 'SQUARESPACE',
		solidLogo: true,
		logo: 'M22.655 8.719c-1.802-1.801-4.726-1.801-6.564 0l-7.351 7.35c-.45.45-.45 1.2 0 1.65.45.449 1.2.449 1.65 0l7.351-7.351c.899-.899 2.362-.899 3.264 0 .9.9.9 2.364 0 3.264l-7.239 7.239c.9.899 2.362.899 3.263 0l5.589-5.589c1.836-1.838 1.836-4.763.037-6.563zm-2.475 2.437c-.451-.45-1.201-.45-1.65 0l-7.354 7.389c-.9.899-2.361.899-3.262 0-.45-.45-1.2-.45-1.65 0s-.45 1.2 0 1.649c1.801 1.801 4.726 1.801 6.564 0l7.351-7.35c.449-.487.449-1.239.001-1.688zm-2.439-7.35c-1.801-1.801-4.726-1.801-6.564 0l-7.351 7.351c-.45.449-.45 1.199 0 1.649s1.2.45 1.65 0l7.395-7.351c.9-.899 2.371-.899 3.27 0 .451.45 1.201.45 1.65 0 .421-.487.421-1.199-.029-1.649h-.021zm-2.475 2.437c-.45-.45-1.2-.45-1.65 0l-7.351 7.389c-.899.9-2.363.9-3.265 0-.9-.899-.9-2.363 0-3.264l7.239-7.239c-.9-.9-2.362-.9-3.263 0L1.35 8.719c-1.8 1.8-1.8 4.725 0 6.563 1.801 1.801 4.725 1.801 6.564 0l7.35-7.351c.451-.488.451-1.238 0-1.688h.002z',
		blurb: 'Making templates look custom. Custom CSS, commerce setups, domain management.',
		level: 90,
		note: '90% — Template? Custom? Both.',
		accent: PALETTE.cyan,
	},
	{
		num: '03',
		name: 'WEBFLOW',
		solidLogo: true,
		logo: 'm24 4.515-7.658 14.97H9.149l3.205-6.204h-.144C9.566 16.713 5.621 18.973 0 19.485v-6.118s3.596-.213 5.71-2.435H0V4.515h6.417v5.278l.144-.001 2.622-5.277h4.854v5.244h.144l2.72-5.244H24Z',
		blurb: 'For clients who want that designer feel without WP maintenance.',
		level: 85,
		note: '85% — CMS & interactions',
		accent: PALETTE.pink,
	},
	{
		num: '04',
		name: 'SHOPIFY',
		solidLogo: true,
		logo: 'M15.337 23.979l7.216-1.561s-2.604-17.613-2.625-17.73c-.018-.116-.114-.192-.211-.192s-1.929-.136-1.929-.136-1.275-1.274-1.439-1.411c-.045-.037-.075-.057-.121-.074l-.914 21.104h.023zM11.71 11.305s-.81-.424-1.774-.424c-1.447 0-1.504.906-1.504 1.141 0 1.232 3.24 1.715 3.24 4.629 0 2.295-1.44 3.76-3.406 3.76-2.354 0-3.54-1.465-3.54-1.465l.646-2.086s1.245 1.066 2.28 1.066c.675 0 .975-.545.975-.932 0-1.619-2.654-1.694-2.654-4.359-.034-2.237 1.571-4.416 4.827-4.416 1.257 0 1.875.361 1.875.361l-.945 2.715-.02.01zM11.17.83c.136 0 .271.038.405.135-.984.465-2.064 1.639-2.508 3.992-.656.213-1.293.405-1.889.578C7.697 3.75 8.951.84 11.17.84V.83zm1.235 2.949v.135c-.754.232-1.583.484-2.394.736.466-1.777 1.333-2.645 2.085-2.971.193.501.309 1.176.309 2.1zm.539-2.234c.694.074 1.141.867 1.429 1.755-.349.114-.735.231-1.158.366v-.252c0-.752-.096-1.371-.271-1.871v.002zm2.992 1.289c-.02 0-.06.021-.078.021s-.289.075-.714.21c-.423-1.233-1.176-2.37-2.508-2.37h-.115C12.135.209 11.669 0 11.265 0 8.159 0 6.675 3.877 6.21 5.846c-1.194.365-2.063.636-2.16.674-.675.213-.694.232-.772.87-.075.462-1.83 14.063-1.83 14.063L15.009 24l.927-21.166z',
		blurb: 'Store setup, product listings, theme customization, payment integrations.',
		level: 80,
		note: '80% — E-commerce that actually sells',
		accent: PALETTE.orange,
	},
	{
		num: '05',
		name: 'DIGITAL MARKETING',
		logo: 'M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z M14 8.5a4 4 0 0 1 0 7 M17 5.5a8 8 0 0 1 0 13',
		blurb: 'Amazon listings, SEO, product photography, social media, brand strategy.',
		level: 78,
		note: '78% — Listings that rank & convert',
		accent: PALETTE.yellow,
	},
	{
		num: '06',
		name: 'AI TOOLS',
		logoFiles: ['/assets/logos/openai.svg', '/assets/logos/claude.svg'],
		fallbackLabel: 'AI',
		logo: 'M9 5h6a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3z M12 2v3 M9.5 11h1.2 M13.3 11h1.2 M10 14.5h4 M3.5 10v4 M20.5 10v4',
		blurb: 'I use AI to speed up workflow. You probably do too.',
		level: 92,
		note: '92% — Prompt engineering counts',
		accent: PALETTE.purple,
	},
];

// ---------------------------------------------------------------------------
// EXPERIENCE / EDUCATION / STATS
// ---------------------------------------------------------------------------

/** Employer, linked wherever the name appears so the company earns the backlink. */
export const COMPANY = {
	name: 'Just Digital Gurus',
	url: 'https://justdigitalgurus.com',
} as const;

export const EXPERIENCE = {
	role: 'Frontend Developer',
	company: COMPANY.name,
	companyUrl: COMPANY.url,
	location: 'Rajkot, Gujarat',
	period: 'FEB 2025 — PRESENT',
	tasks: [
		'Build and maintain 30+ client websites',
		'WordPress theme customization & plugin management',
		'Squarespace design implementation',
		'GSAP animations & frontend interactions',
		'AI-assisted development workflow',
	],
};

export const STATS = [
	{ value: '30+', label: 'WEBSITES BUILT', accent: PALETTE.cyan },
	{ value: '2+', label: 'YEARS EXP', accent: PALETTE.pink },
	{ value: '5+', label: 'PLATFORMS', accent: PALETTE.yellow },
	{ value: '∞', label: 'CUPS OF CHAI', accent: PALETTE.orange },
];

export const EDUCATION = [
	{
		badge: 'MCA',
		degree: 'Master of Computer Applications',
		school: 'B H Gardi College of Engineering & Technology, Rajkot',
		board: 'GTU',
		years: '2023 — 2025',
		accent: PALETTE.pink,
	},
	{
		badge: 'BCA',
		degree: 'Bachelor of Computer Applications',
		school: 'OMVVIM College, Morbi',
		board: 'Saurashtra University',
		years: '2020 — 2023',
		accent: PALETTE.cyan,
	},
];

export const AWARD = {
	heading: 'RISING',
	highlight: 'STAR 2025',
	bodyBefore: 'I was honored with the Rising Star Award in 2025 from ',
	bodyAfter:
		', recognizing outstanding performance, dedication, and potential in frontend development.',
	quote: '"For demonstrating remarkable potential, dedication, and a strong commitment to excellence."',
	model: '/assets/models/rising-star-award.glb',
};

export const AI_TAGS = ['ChatGPT', 'Claude', 'Copilot', 'Gemini', 'HUMAN BRAIN FIRST'];

export const MARQUEE_TEXT =
	'◆ YES, THIS PORTFOLIO WAS BUILT USING AI ◆ NO, I DON\'T CARE IF YOU JUDGE ME ◆ YES, I\'M STILL A GREAT DEVELOPER ◆ GSAP POWERED ◆ SCROLLTRIGGER ANIMATED ◆ AWWWARDS-READY ';

export type ContactLink = {
	label: string;
	value: string;
	href: string | null;
	cta: string;
	accent: string;
	icon: string;
};

export const CONTACT_LINKS: ContactLink[] = [
	{
		label: 'Direct message',
		value: 'Send an Inquiry Form',
		href: '/contact',
		cta: 'WRITE FORM →',
		accent: PALETTE.yellow,
		icon: 'message-square',
	},
	{
		label: 'Email me at',
		value: 'hello@shivrajsinh.in',
		href: 'mailto:hello@shivrajsinh.in',
		cta: 'EMAIL →',
		accent: PALETTE.orange,
		icon: 'mail',
	},
	{
		label: 'Telegram',
		value: '@ShivrajsinhZala',
		href: 'https://t.me/ShivrajsinhZala',
		cta: 'DM →',
		accent: PALETTE.cyan,
		icon: 'send',
	},
	{
		label: 'GitHub',
		value: 'shivrajsinhzala',
		href: 'https://github.com/shivrajsinhzala',
		cta: 'FOLLOW →',
		accent: '#00ff88',
		icon: 'github',
	},
	{
		label: 'LinkedIn',
		value: 'Shivrajsinh Zala',
		href: 'https://www.linkedin.com/in/shivrajsinh-zala/',
		cta: 'CONNECT →',
		accent: '#0077b5',
		icon: 'linkedin',
	},
	{
		label: 'Instagram',
		value: '@shivrajsinh.sh',
		href: 'https://www.instagram.com/shivrajsinh.sh',
		cta: 'FOLLOW →',
		accent: PALETTE.pink,
		icon: 'instagram',
	},
	{
		label: 'Based in',
		value: 'Rajkot, Gujarat, India 🇮🇳',
		href: null,
		cta: 'IST +5:30',
		accent: PALETTE.yellow,
		icon: 'map-pin',
	},
];
