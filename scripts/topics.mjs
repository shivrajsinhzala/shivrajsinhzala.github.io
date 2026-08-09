/**
 * topics.mjs — the editorial queue for the weekly auto-published blog.
 *
 * The generator walks this list in order and publishes the first topic whose
 * slug does not already exist in src/content/blog/. So the queue is roughly a
 * publishing calendar: one entry per week, top to bottom.
 *
 * Ordering strategy:
 *   1. Commercial local-intent posts first (they feed the service pages)
 *   2. Comparison / decision posts (high intent, easy to rank, link-worthy)
 *   3. Personal-brand posts (rank for "Shivrajsinh Zala" / "Shivrajsinh")
 *   4. Technical depth (topical authority, earns links)
 *
 * Each entry is a BRIEF, not a title. The model writes the title.
 *
 * Fields:
 *   slug      — final URL segment. Keep it keyword-led and stable.
 *   keyword   — the single primary keyword the post must earn.
 *   secondary — supporting terms to work in naturally.
 *   angle     — what makes this post worth existing. Be specific; this is the
 *               field that most determines whether the output is generic slop.
 *   audience  — who is reading and what they are deciding.
 *   mustCover — concrete points the draft has to include. Anchors the model in
 *               facts instead of letting it pad with generalities.
 *   links     — internal links the post should contain (path + natural anchor).
 *   tag       — display tag on the card.
 */

const RAJKOT_WP = { href: '/wordpress-developer-rajkot', anchor: 'WordPress developer in Rajkot' };
const RAJKOT_SQ = { href: '/squarespace-developer-rajkot', anchor: 'Squarespace developer in Rajkot' };
const MORBI_WP = { href: '/wordpress-developer-morbi', anchor: 'WordPress developer in Morbi' };
const MORBI_SQ = { href: '/squarespace-developer-morbi', anchor: 'Squarespace developer in Morbi' };
const SERVICES = { href: '/services', anchor: 'web development services in Rajkot and Morbi' };
const CONTACT = { href: '/contact', anchor: 'get in touch' };
const PILLAR = { href: '/blog/modern-web-development-guide', anchor: 'complete guide to modern web development' };

export const topics = [
	{
		slug: 'website-cost-rajkot-2026',
		keyword: 'website design cost in Rajkot',
		secondary: ['web development price Rajkot', 'WordPress website cost Gujarat', 'website charges Rajkot'],
		angle:
			'A blunt, numbers-first breakdown of what a website actually costs in Rajkot in 2026 and why quotes vary 10x between vendors. Name the cheap-quote traps: rented themes, hostage hosting, "SEO included" that means nothing, and per-page pricing that punishes you for growing.',
		audience:
			'A Rajkot business owner collecting quotes who cannot tell why one vendor says ₹8,000 and another says ₹80,000.',
		mustCover: [
			'Price bands with what is genuinely included at each: template job, custom design, custom build, e-commerce',
			'The recurring costs nobody mentions upfront: hosting, domain, SSL, maintenance, plugin licences',
			'Why the cheapest quote usually costs more over three years, with a concrete worked example',
			'Red flags in a quote: no written scope, no source-code ownership, hosting locked in the vendor account',
			'Questions to ask any vendor before paying an advance',
		],
		links: [RAJKOT_WP, RAJKOT_SQ, SERVICES],
		tag: 'PRICING',
	},
	{
		slug: 'wordpress-vs-squarespace-india',
		keyword: 'WordPress vs Squarespace',
		secondary: ['Squarespace or WordPress India', 'best CMS for small business India', 'Squarespace India pricing'],
		angle:
			'A decision guide written by someone who builds on both and is not selling one. Frame it around total cost of ownership over three years and who maintains the thing, not feature checklists.',
		audience: 'An Indian small-business owner or marketing lead choosing a platform before commissioning a build.',
		mustCover: [
			'The real deciding factors: catalogue size, integration depth, who maintains it, multi-language needs',
			'Three-year total cost comparison including maintenance labour, not just subscription fees',
			'Where Squarespace hard-stops: no server-side code, limited catalogue filtering, no deep integrations',
			'Where WordPress hard-stops: it needs an owner, security patching and plugin discipline',
			'Payment gateway reality in India for both platforms (Razorpay, PayU, Cashfree, Stripe availability)',
			'A short verdict table mapping business type to recommended platform',
		],
		links: [RAJKOT_SQ, RAJKOT_WP, SERVICES],
		tag: 'COMPARISON',
	},
	{
		slug: 'ceramic-tile-website-morbi-export-buyers',
		keyword: 'website for ceramic tile company in Morbi',
		secondary: ['Morbi tile exporter website', 'sanitaryware website design', 'ceramic manufacturer website India'],
		angle:
			'What an export buyer in Dubai, Lagos or Bogotá actually looks for in the first 30 seconds on a Morbi tile factory website — and why most Morbi sites fail that test. Written from the buyer side.',
		audience:
			'A Morbi ceramic, tile or sanitaryware manufacturer whose website generates almost no direct enquiries.',
		mustCover: [
			'The buyer screening sequence: is this a real factory, do they have my sizes, can I get specs without emailing',
			'Catalogue architecture for tiles: series as the entity, size/finish/surface as filters, not duplicate products',
			'Why hiding the catalogue behind a contact form loses to the competitor who does not',
			'Image weight — tile photography is heavy, and how to serve it fast internationally',
			'Testing load times from the regions buyers actually browse from, not from Gujarat',
			'Credibility signals that convert: certifications, capacity, factory photos, consistency with IndiaMART and Alibaba listings',
		],
		links: [MORBI_WP, MORBI_SQ, SERVICES],
		tag: 'INDUSTRY',
	},
	{
		slug: 'shivrajsinh-zala-frontend-developer-rajkot',
		keyword: 'Shivrajsinh Zala',
		secondary: ['Shivrajsinh', 'Shivrajsinh Zala developer', 'Shivrajsinh Zala Rajkot'],
		angle:
			'A first-person professional profile: who I am, how I got here, how I actually work, and what I will and will not take on. Substance and specifics, not a CV in prose. This is the page that should own my name in search.',
		audience: 'Someone who heard my name from a referral, a recruiter, or a client checking me out before a call.',
		mustCover: [
			'Background: Rajkot-based frontend developer, studied at OMVVIM College Morbi and B H Gardi College of Engineering & Technology',
			'What I build: custom WordPress themes, Squarespace 7.1, Shopify, Webflow, React and Astro frontends, GSAP animation',
			'30+ websites built and maintained, including industrial and export clients across Rajkot and Morbi',
			'How I work: fixed scope, fixed price, staging visible throughout, full handover with no lock-in',
			'What I turn down and why — being specific here is more credible than claiming to do everything',
			'How to reach me and what a first conversation looks like',
		],
		links: [SERVICES, RAJKOT_WP, CONTACT],
		tag: 'ABOUT',
	},
	{
		slug: 'why-your-wordpress-site-is-slow',
		keyword: 'WordPress site slow fix',
		secondary: ['WordPress speed optimization', 'Core Web Vitals WordPress', 'Elementor slow site'],
		angle:
			'A diagnostic walkthrough, ordered by how much each fix actually moves the needle. Explicitly argue against the standard advice of installing a caching plugin first, and explain why that hides problems instead of fixing them.',
		audience: 'A site owner or marketer whose PageSpeed score is red and who has already tried a caching plugin.',
		mustCover: [
			'How to diagnose before changing anything: field data in Search Console vs lab data in Lighthouse',
			'The real top causes ranked: oversized images, page-builder bloat, render-blocking fonts, third-party scripts, unoptimised database queries',
			'Why LCP, INP and CLS each fail for different reasons and need different fixes',
			'Why caching goes last, not first',
			'When optimisation stops being worth it and a rebuild is cheaper',
			'A short checklist the reader can run today',
		],
		links: [RAJKOT_WP, PILLAR, SERVICES],
		tag: 'TECHNICAL',
	},
	{
		slug: 'local-seo-guide-gujarat-businesses',
		keyword: 'local SEO for small business in Gujarat',
		secondary: ['Google Business Profile India', 'rank on Google Maps Rajkot', 'local SEO Rajkot'],
		angle:
			'A practical local SEO sequence for a Gujarat business with no marketing team, ordered by effort-to-payoff. Concrete actions, not theory.',
		audience: 'A Rajkot or Morbi business owner who wants to appear when someone nearby searches for what they sell.',
		mustCover: [
			'Google Business Profile setup done properly: categories, service areas, photos, products, Q&A',
			'NAP consistency across the site, GBP, JustDial, IndiaMART and social profiles — and why mismatches hurt',
			'Review generation that does not violate Google policy',
			'On-site local signals: LocalBusiness schema, city-specific service pages, embedded map, real address',
			'Why one page targeting five cities beats nothing but loses to five genuinely distinct pages',
			'What to measure monthly and what to ignore',
		],
		links: [SERVICES, RAJKOT_WP, MORBI_WP],
		tag: 'SEO',
	},
	{
		slug: 'woocommerce-vs-shopify-india',
		keyword: 'WooCommerce vs Shopify India',
		secondary: ['best ecommerce platform India', 'Shopify India pricing', 'WooCommerce payment gateway India'],
		angle:
			'A cost-and-control comparison specific to Indian sellers: transaction fees, GST handling, gateway options, COD workflows and shipping integrations. Most comparisons on this topic are written for the US market and are misleading here.',
		audience: 'An Indian business launching or replatforming an online store.',
		mustCover: [
			'True monthly cost at ₹1L, ₹10L and ₹50L monthly GMV including transaction fees and apps',
			'GST invoicing and compliance on each platform',
			'COD workflows — a first-class requirement in India and an afterthought on Shopify',
			'Shipping aggregator integrations (Shiprocket, Delhivery) on both',
			'Who should pick which, stated plainly',
		],
		links: [RAJKOT_WP, SERVICES, PILLAR],
		tag: 'E-COMMERCE',
	},
	{
		slug: 'squarespace-seo-checklist',
		keyword: 'Squarespace SEO',
		secondary: ['Squarespace SEO checklist', 'is Squarespace good for SEO', 'Squarespace schema markup'],
		angle:
			'Everything Squarespace does not do for you, in the order you should do it. Counter the two lazy takes — "Squarespace is bad for SEO" and "Squarespace handles SEO automatically" — both of which are wrong.',
		audience: 'A Squarespace site owner whose site looks good and ranks for nothing.',
		mustCover: [
			'What Squarespace genuinely handles: clean URLs, mobile rendering, sitemaps, SSL',
			'What it does not: structured data, intent-driven titles, internal linking, image discipline',
			'Adding JSON-LD schema via code injection, with an explanation of where it goes and why',
			'Image compression before upload — the single biggest Squarespace performance failure',
			'Rewriting page titles for search intent rather than for navigation labels',
			'Connecting Search Console and reading it monthly',
		],
		links: [RAJKOT_SQ, MORBI_SQ, SERVICES],
		tag: 'SEO',
	},
	{
		slug: 'manufacturer-website-checklist-rajkot',
		keyword: 'website for manufacturing company in Rajkot',
		secondary: ['engineering company website India', 'B2B manufacturer website', 'industrial website design Rajkot'],
		angle:
			'A build checklist for Rajkot engineering and casting firms whose buyers are procurement managers, not consumers. B2B buying behaviour drives every structural decision, and almost no template accounts for it.',
		audience: 'A Rajkot manufacturer of pumps, castings, bearings or auto components with a weak or absent website.',
		mustCover: [
			'Procurement research behaviour: long anonymous research, then one enquiry to a shortlist',
			'Specification tables, downloadable datasheets and drawings as a ranking and conversion asset',
			'Capability and capacity pages that answer supplier-qualification questions before they are asked',
			'Enquiry forms that capture part numbers and quantities instead of a bare message box',
			'Certifications, quality process and export markets as trust signals',
			'Why the About page matters far more in B2B than in B2C',
		],
		links: [RAJKOT_WP, SERVICES, MORBI_WP],
		tag: 'INDUSTRY',
	},
	{
		slug: 'hire-freelance-web-developer-vs-agency',
		keyword: 'freelance web developer vs agency',
		secondary: ['hire web developer Rajkot', 'freelance developer India', 'web design agency cost'],
		angle:
			'An honest account of the trade-offs from someone who is the freelancer — including the cases where an agency is genuinely the better choice. Credibility comes from arguing against my own interest.',
		audience: 'A business owner deciding how to resource a website project.',
		mustCover: [
			'Where freelancers win: cost, direct communication, no handoff to juniors, faster decisions',
			'Where agencies win: continuity, bench depth, multi-discipline campaigns, procurement compliance',
			'The bus-factor problem and how to protect against it contractually',
			'What to demand either way: written scope, source-code ownership, hosting in your own account, documented handover',
			'Warning signs in both models',
		],
		links: [SERVICES, CONTACT, RAJKOT_WP],
		tag: 'HIRING',
	},
	{
		slug: 'website-migration-without-losing-rankings',
		keyword: 'website migration without losing SEO',
		secondary: ['301 redirect map', 'replatform website SEO', 'redesign without losing traffic'],
		angle:
			'The redirect-mapping step that almost every replatform skips, and the traffic collapse that follows. Written as a runbook with a before/during/after sequence.',
		audience: 'Anyone about to redesign or replatform a site that currently gets organic traffic.',
		mustCover: [
			'Crawl and inventory the existing site before touching anything',
			'Building a URL-to-URL 301 map, including the pages you plan to delete',
			'What breaks silently: lost internal links, orphaned pages, changed canonical tags, blocked staging robots.txt shipped to production',
			'Launch-day sequence and what to verify in the first hour',
			'The 30-day monitoring window in Search Console and what a normal dip looks like versus a real problem',
		],
		links: [SERVICES, RAJKOT_WP, RAJKOT_SQ],
		tag: 'SEO',
	},
	{
		slug: 'gsap-scroll-animations-that-dont-hurt-performance',
		keyword: 'GSAP ScrollTrigger performance',
		secondary: ['scroll animation web performance', 'GSAP best practices', 'smooth scroll INP'],
		angle:
			'Scroll animation is where good-looking sites go to die on mobile. A practical guide to keeping GSAP work off the main thread and out of your INP score.',
		audience: 'A frontend developer or a business owner who was sold a heavily animated site that now feels sluggish.',
		mustCover: [
			'Animating transform and opacity only, and why animating layout properties is the core mistake',
			'ScrollTrigger batching, and killing triggers properly on route change',
			'Respecting prefers-reduced-motion as an accessibility requirement, not a nicety',
			'How smooth-scroll libraries interact with INP and when to drop them',
			'Measuring the cost honestly on a mid-range Android, not a MacBook',
		],
		links: [PILLAR, RAJKOT_WP, SERVICES],
		tag: 'TECHNICAL',
	},
];

export default topics;
