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
	{ id: 'skills', label: 'MY STACK', z: -820, navLabel: 'STACK' },
	{ id: 'awards', label: 'RISING STAR 2025', z: -960, navLabel: 'AWARDS' },
	{ id: 'education', label: 'WHERE I STUDIED', z: -1060 },
	{ id: 'terminal', label: 'TRY THE TERMINAL', z: -1160, navLabel: 'TERMINAL' },
	{ id: 'contact', label: "LET'S MAKE SOMETHING", z: -1280, navLabel: 'CONTACT' },
	// The loop tunnel. No nav entry — it is a transition, not a destination.
	{ id: 'outro', label: 'RETURN', z: -1660 },
];

export const CONTACT_Z = -1280;
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
export const TUNNEL_GATES = 11;
export const TUNNEL_START_Z = -1330;
export const TUNNEL_END_Z = -1680;
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
	{ z: -820, color: PALETTE.mint },
	{ z: -960, color: PALETTE.warmYellow },
	{ z: -1160, color: '#00ff88' },
	{ z: -1280, color: PALETTE.violet },
	{ z: -1660, color: PALETTE.softCyan },
	// Must match the z = 0 stop exactly, or the wrap shows a colour shift.
	{ z: -1764, color: PALETTE.violet },
];

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
	blurb: string;
	level: number;
	note: string;
	accent: string;
};

export const SKILLS: Skill[] = [
	{
		num: '01',
		name: 'WORDPRESS',
		blurb: 'My bread and butter. Themes, plugins, custom post types, WooCommerce.',
		level: 95,
		note: '95% — I build, fix, and optimize WP sites',
		accent: PALETTE.white,
	},
	{
		num: '02',
		name: 'SQUARESPACE',
		blurb: 'Making templates look custom. Custom CSS, commerce setups, domain management.',
		level: 90,
		note: '90% — Template? Custom? Both.',
		accent: PALETTE.cyan,
	},
	{
		num: '03',
		name: 'WEBFLOW',
		blurb: 'For clients who want that designer feel without WP maintenance.',
		level: 85,
		note: '85% — CMS & interactions',
		accent: PALETTE.pink,
	},
	{
		num: '04',
		name: 'SHOPIFY',
		blurb: 'Store setup, product listings, theme customization, payment integrations.',
		level: 80,
		note: '80% — E-commerce that actually sells',
		accent: PALETTE.orange,
	},
	{
		num: '05',
		name: 'DIGITAL MARKETING',
		blurb: 'Amazon listings, SEO, product photography, social media, brand strategy.',
		level: 78,
		note: '78% — Listings that rank & convert',
		accent: PALETTE.yellow,
	},
	{
		num: '06',
		name: 'AI TOOLS',
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
