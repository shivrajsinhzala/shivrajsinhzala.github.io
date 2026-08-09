/**
 * services.ts
 *
 * Content model for the local service landing pages
 * (/wordpress-developer-rajkot, /squarespace-developer-morbi, ...).
 *
 * Each entry is written by hand with city-specific substance. These are NOT
 * templated doorway pages — the industry context, proof points, pricing frames
 * and FAQs differ per city because the client bases genuinely differ.
 */

export type ServiceFaq = {
	question: string;
	answer: string;
};

export type ServiceSection = {
	heading: string;
	body: string[];
};

export type ServicePage = {
	slug: string;
	platform: 'WordPress' | 'Squarespace';
	city: 'Rajkot' | 'Morbi';
	/** <title> — front-loaded with the head term. */
	title: string;
	metaDescription: string;
	/** Big on-page H1. */
	h1: string;
	/** One-line positioning statement under the H1. */
	tagline: string;
	/** Opening paragraphs — the answer-first block Google likes to lift. */
	intro: string[];
	/** What's included, as scannable deliverables. */
	deliverables: string[];
	/** Long-form body sections. */
	sections: ServiceSection[];
	/** Local proof — real projects from the portfolio. */
	proof: { name: string; url?: string; note: string }[];
	faqs: ServiceFaq[];
	/** Related internal links (slug -> label) for contextual interlinking. */
	related: { href: string; label: string }[];
	accent: string;
};

const RAJKOT_INDUSTRY =
	'Rajkot runs on engineering — CNC machining, castings, submersible pumps, bearings, auto components and a very large jewellery trade.';
const MORBI_INDUSTRY =
	'Morbi is the ceramic capital of India — vitrified tiles, sanitaryware, wall tiles and the clock and papermill clusters around them, with a huge share of output going to export buyers.';

export const servicePages: ServicePage[] = [
	{
		slug: 'wordpress-developer-rajkot',
		platform: 'WordPress',
		city: 'Rajkot',
		title: 'WordPress Developer in Rajkot | Shivrajsinh Zala',
		metaDescription:
			'Freelance WordPress developer in Rajkot, Gujarat. Custom themes, WooCommerce, speed optimisation and migrations off page builders. 30+ sites built. Direct work with Shivrajsinh Zala — no agency layer.',
		h1: 'WordPress Developer in Rajkot',
		tagline: 'Custom themes, WooCommerce and rescue work for Rajkot businesses — built by hand, not dragged in a builder.',
		intro: [
			'I am Shivrajsinh Zala, a freelance WordPress developer based in Rajkot, Gujarat. I build custom WordPress themes and WooCommerce stores for manufacturers, exporters and local service businesses, and I fix the slow, plugin-bloated sites that agencies leave behind.',
			'You work with me directly. There is no account manager in between, no ticket queue, and no handoff to a junior once the project is signed. I have built and maintained 30+ websites, and most of my Rajkot clients came from someone else recommending me.',
		],
		deliverables: [
			'Custom WordPress theme built from scratch — no Elementor, no Divi, no 40-plugin stack',
			'WooCommerce setup with Indian payment gateways (Razorpay, PayU, Cashfree) and GST-aware invoicing',
			'Product / catalogue architecture that actually matches how your buyers search',
			'Core Web Vitals work — real LCP and INP fixes, not a caching plugin and a prayer',
			'Migration off Wix, GoDaddy builder or a broken page-builder site, with redirects mapped so you keep your rankings',
			'On-page SEO groundwork: schema, internal linking, XML sitemaps, Search Console setup',
			'Staging environment, version control, and a handover doc so you are never locked to me',
		],
		sections: [
			{
				heading: 'What Rajkot businesses actually need from a website',
				body: [
					`${RAJKOT_INDUSTRY} Almost every enquiry I get from Rajkot falls into one of two buckets: a manufacturer who needs a credible English-language site that a foreign buyer will trust, or a local service business that needs to show up in Google Maps and convert the calls it already gets.`,
					'Those are different builds. An export-facing manufacturer needs a product catalogue with specification tables, downloadable PDFs, clean technical pages and fast loading over slow international connections. A local service business needs speed, a phone number above the fold, location pages and reviews wired into schema. Selling the same template to both is why so many Rajkot sites underperform.',
					'I scope the build around which one you are before writing a line of code.',
				],
			},
			{
				heading: 'Why custom themes instead of page builders',
				body: [
					'Most of the WordPress rescue work I do in Rajkot is the same story. A site was built in Elementor or Divi three years ago, it now loads in eight seconds on mobile, it carries 35 plugins, and nobody can change anything without breaking the layout. The business is paying in lost enquiries every month.',
					'A hand-built theme ships a fraction of the CSS and JavaScript, has no builder runtime to render on every page load, and does not break when a plugin updates. It costs more up front and less every year after. For anything you intend to keep for more than a year, it is the cheaper option.',
					'Where a client genuinely needs to edit layouts themselves, I use the native WordPress block editor with locked custom blocks — editable where it should be, not everywhere.',
				],
			},
			{
				heading: 'Speed and Core Web Vitals',
				body: [
					'Google measures Largest Contentful Paint, Interaction to Next Paint and Cumulative Layout Shift on real visits, not on a lab test. A green Lighthouse score on your laptop means very little if your buyers are on a mid-range Android on a patchy 4G connection, which in practice most of them are.',
					'I work the real causes: uncompressed hero images, render-blocking fonts, unbounded third-party scripts, layout shift from late-loading elements, and database queries that scale badly as your catalogue grows. Caching goes on last, once the underlying page is actually light.',
				],
			},
			{
				heading: 'How an engagement runs',
				body: [
					'We start with a call where I ask what the site is supposed to do commercially — enquiries, orders, credibility for a buyer visit. Then a written scope with a fixed price and a delivery date, so there is no drift.',
					'I build on a staging URL you can watch the whole time. You review at wireframe, at design, and at build, and revisions inside the agreed scope are included. On launch I handle DNS, SSL, redirects, Search Console and Analytics, then hand over documentation and admin access that is genuinely yours.',
				],
			},
		],
		proof: [
			{ name: 'Venus Pumps', note: 'Manufacturing site for a Rajkot pump maker — product catalogue with specification tables built for export enquiries.' },
			{ name: 'Shivam RO', note: 'Water treatment company site with a service-area structure and enquiry-first layout.' },
			{ name: 'Solar Quartz', note: 'Industrial product site with technical spec pages and downloadable datasheets.' },
		],
		faqs: [
			{
				question: 'How much does a WordPress website cost in Rajkot?',
				answer:
					'A straightforward business site with a custom theme typically lands in the ₹25,000–₹60,000 range. A WooCommerce store with payment gateways, a real product catalogue and migration work is usually ₹60,000–₹1,50,000 depending on catalogue size and integrations. I quote a fixed price against a written scope after one call — I do not bill hourly, so you are not exposed to overrun.',
			},
			{
				question: 'How long does a WordPress project take?',
				answer:
					'A five to eight page business site is usually two to three weeks from approved design. A WooCommerce build with catalogue migration is typically four to six weeks. Speed-optimisation or rescue work on an existing site is often done in three to five days.',
			},
			{
				question: 'Do you work with clients outside Rajkot?',
				answer:
					'Yes. I am based in Rajkot and I meet local clients in person when it helps, but most of the work happens remotely. I regularly work with businesses in Morbi, Jamnagar, Ahmedabad and Surat, and with a few clients outside India.',
			},
			{
				question: 'Can you fix my existing WordPress site instead of rebuilding it?',
				answer:
					'Often, yes. If the underlying theme is sane, I can strip plugin bloat, fix Core Web Vitals, repair broken SEO and clean up the security posture for far less than a rebuild. If the site is a heavily nested page-builder layout, a rebuild is usually cheaper than the ongoing repairs. I will tell you honestly which one you are looking at.',
			},
			{
				question: 'Will I be able to update the website myself?',
				answer:
					'Yes. I build editable content areas using the native WordPress editor and hand over a short walkthrough document plus full admin access. You are not locked to me for routine changes, and you own the hosting and domain accounts.',
			},
			{
				question: 'Do you also handle hosting and maintenance?',
				answer:
					'I set up hosting in your own account rather than reselling it to you, so you keep control. Ongoing maintenance — updates, backups, uptime monitoring and small changes — is available as an optional monthly retainer, but it is never a condition of the build.',
			},
		],
		related: [
			{ href: '/squarespace-developer-rajkot', label: 'Squarespace Developer in Rajkot' },
			{ href: '/wordpress-developer-morbi', label: 'WordPress Developer in Morbi' },
			{ href: '/blog/modern-web-development-guide', label: 'Guide: Custom WordPress theme development' },
		],
		accent: '#00FF88',
	},
	{
		slug: 'squarespace-developer-rajkot',
		platform: 'Squarespace',
		city: 'Rajkot',
		title: 'Squarespace Developer in Rajkot | Shivrajsinh Zala',
		metaDescription:
			'Freelance Squarespace developer in Rajkot, Gujarat. Custom Squarespace 7.1 design, Figma-to-Squarespace builds, custom code injection and SEO. Work directly with Shivrajsinh Zala.',
		h1: 'Squarespace Developer in Rajkot',
		tagline: 'Squarespace sites that do not look like Squarespace — custom code, real design, and SEO that holds up.',
		intro: [
			'I am Shivrajsinh Zala, a freelance Squarespace developer in Rajkot, Gujarat. I take Squarespace past its templates: custom CSS and JavaScript, Figma designs implemented properly, and the technical SEO work the platform does not do for you.',
			'Squarespace is the right call for a specific kind of client — someone who wants a polished, low-maintenance site and does not want to think about plugins, updates or hosting ever again. My job is to make sure it does not look like every other Squarespace site on the internet.',
		],
		deliverables: [
			'Squarespace 7.1 build with a fully custom visual design, not a lightly recoloured template',
			'Pixel-accurate implementation of Figma, Sketch or XD designs',
			'Custom CSS and code-injection work for layouts Squarespace does not ship natively',
			'Squarespace Commerce setup — products, variants, shipping rules, checkout flow',
			'Technical SEO: title and meta structure, schema injection, clean URLs, Search Console',
			'Performance tuning inside Squarespace constraints — image discipline, font loading, script cleanup',
			'Training session plus written documentation so your team can run the site',
		],
		sections: [
			{
				heading: 'When Squarespace is the right choice — and when it is not',
				body: [
					'Squarespace wins when you want a beautiful, reliable site with near-zero maintenance burden: studios, consultancies, clinics, boutique brands, portfolios, single-location businesses. Hosting, SSL, updates and security are handled. Nothing breaks at 2am because a plugin auto-updated.',
					'Squarespace is the wrong choice when you need a large filterable catalogue, complex B2B pricing, deep third-party integrations, multi-language content or full control over markup. Those are WordPress problems. I build on both platforms and I have no incentive to push you toward one, so I will say plainly which side of that line you fall on.',
					`${RAJKOT_INDUSTRY} For a Rajkot manufacturer with a 400-SKU catalogue, I will usually steer you to WordPress. For a Rajkot design studio, clinic, café or professional practice, Squarespace is frequently the better business decision.`,
				],
			},
			{
				heading: 'Making Squarespace look custom',
				body: [
					'The reason Squarespace sites are recognisable is that most of them are a stock template with the colours changed. The platform actually allows far more than that — custom CSS applies site-wide, code injection lets you add real JavaScript, and code blocks let you build sections the native editor cannot.',
					'I use that headroom for asymmetric layouts, custom typography and spacing systems, scroll-driven animation, bespoke navigation, and section designs built specifically for your content. The result is a site that reads as designed rather than assembled, while your team still edits everything in the normal Squarespace editor.',
					'The discipline that matters: custom code must degrade gracefully. I write it so that if Squarespace changes something underneath, the page falls back to a plain working layout instead of collapsing.',
				],
			},
			{
				heading: 'SEO on Squarespace',
				body: [
					'Squarespace handles the basics — clean URLs, mobile rendering, automatic sitemaps, SSL. It leaves the parts that actually differentiate you: structured data, deliberate internal linking, page titles written for search intent rather than for navigation, and image handling.',
					'I inject JSON-LD schema through code injection, restructure titles and descriptions around what people actually type, build genuine internal linking between service pages, and compress and correctly size images — which is the single biggest Squarespace performance problem I see, because the platform will happily serve a 4MB hero photograph.',
				],
			},
			{
				heading: 'Working together',
				body: [
					'Fixed scope, fixed price, fixed date. I share a staging site early and you watch it come together rather than waiting for a reveal at the end.',
					'On handover you get a walkthrough recording, written documentation of any custom code and what it does, and full ownership of the Squarespace account. If you later hire someone else, they inherit a site with commented code and no mysteries.',
				],
			},
		],
		proof: [
			{ name: 'Craft Design Studio', note: 'Design-led studio site — custom layout and typographic system.' },
			{ name: 'Just Digital Gurus', note: 'Ongoing Squarespace and Webflow implementation from Figma and Sketch files for agency clients.' },
			{ name: 'Somnath Khata', note: 'Custom dairy management web app — customers, transactions and reporting.' },
		],
		faqs: [
			{
				question: 'How much does a Squarespace website cost in Rajkot?',
				answer:
					'A custom-designed Squarespace 7.1 site generally runs ₹20,000–₹50,000 for design and build. Adding Squarespace Commerce with product setup and shipping rules typically takes it to ₹45,000–₹90,000. That is my fee only — Squarespace subscription is billed separately by Squarespace, in your own account.',
			},
			{
				question: 'Is Squarespace good for SEO?',
				answer:
					'Squarespace is technically sound out of the box — clean URLs, mobile-friendly rendering, automatic sitemaps, SSL. It will not do the work that actually moves rankings: structured data, intent-driven titles, internal linking and image discipline. Those need a person. A well-optimised Squarespace site competes fine with a well-optimised WordPress site.',
			},
			{
				question: 'Can you add custom features Squarespace does not support?',
				answer:
					'Within limits, yes. Custom CSS, JavaScript and code injection cover a lot — bespoke layouts, animations, calculators, third-party embeds and custom forms. What is genuinely not possible is server-side logic, since you cannot run backend code on Squarespace. If your requirement needs a server, I will tell you at the quoting stage rather than after you have paid.',
			},
			{
				question: 'Should I choose Squarespace or WordPress?',
				answer:
					'Squarespace if you want low maintenance, a small-to-medium site and a design-forward brand presence. WordPress if you need a large catalogue, deep integrations, multi-language content or full markup control. I build both, so I have no reason to sell you the wrong one — I will make a recommendation on the first call.',
			},
			{
				question: 'Can you redesign my existing Squarespace site?',
				answer:
					'Yes, and it is a common request. I can redesign in place on a duplicated site so your live site stays untouched until launch day, keeping your existing URLs and content intact so nothing you have already earned in search is lost.',
			},
			{
				question: 'Do you migrate sites from Wix or WordPress to Squarespace?',
				answer:
					'Yes. Migration includes content transfer, a rebuild of the design, and a mapped 301 redirect plan so your existing search rankings carry over. The redirect mapping is the part most migrations skip, and it is the reason so many businesses lose traffic after a replatform.',
			},
		],
		related: [
			{ href: '/wordpress-developer-rajkot', label: 'WordPress Developer in Rajkot' },
			{ href: '/squarespace-developer-morbi', label: 'Squarespace Developer in Morbi' },
			{ href: '/blog/modern-web-development-guide', label: 'Guide: choosing a platform for your build' },
		],
		accent: '#00F5FF',
	},
	{
		slug: 'wordpress-developer-morbi',
		platform: 'WordPress',
		city: 'Morbi',
		title: 'WordPress Developer in Morbi | Shivrajsinh Zala',
		metaDescription:
			'Freelance WordPress developer in Morbi, Gujarat. Custom themes and WooCommerce for ceramic, tile and sanitaryware exporters. Catalogue-heavy sites built for international buyers.',
		h1: 'WordPress Developer in Morbi',
		tagline: 'Export-ready WordPress sites for Morbi ceramic, tile and sanitaryware businesses.',
		intro: [
			'I am Shivrajsinh Zala, a freelance WordPress developer working with businesses in Morbi, Gujarat. I studied at OMVVIM College in Morbi, so this is not a market I am guessing about — I build catalogue-heavy WordPress sites for tile, sanitaryware and ceramic manufacturers whose buyers are usually sitting in another country.',
			'The brief in Morbi is almost always the same: a serious international buyer needs to find you, believe you are real, browse a large product range without friction, and send an enquiry. Everything else on the site is decoration.',
		],
		deliverables: [
			'Custom WordPress theme built around a large, filterable product catalogue',
			'Tile and sanitaryware product architecture — size, finish, surface, series, application filters',
			'Downloadable catalogue PDFs, spec sheets and high-resolution image handling',
			'Enquiry and RFQ forms built for export workflows, not generic contact forms',
			'Fast loading over international connections, where your buyers actually are',
			'Multi-language support where it earns its keep, with correct hreflang implementation',
			'Trade-fair and directory alignment — consistent details across IndiaMART, Alibaba and your own site',
		],
		sections: [
			{
				heading: 'What a Morbi ceramic website has to do',
				body: [
					`${MORBI_INDUSTRY} That shapes the website completely. Your visitor is often an importer, distributor or project buyer in the Gulf, Africa, Europe or South America, comparing you against a dozen other Morbi factories they found the same week.`,
					'They are checking three things fast: is this a real factory with real capacity, does the range include what I need in the sizes I need, and can I get technical detail without emailing first. A site that hides the catalogue behind a contact form loses to the one that does not.',
					'So the build priorities are a browsable catalogue with genuine filtering, honest factory and capacity information, downloadable specifications, and an enquiry flow that captures product codes and quantities instead of a bare message box.',
				],
			},
			{
				heading: 'Catalogue architecture is the whole project',
				body: [
					'A Morbi tile catalogue is not twenty products. It is often several hundred SKUs across series, sizes, finishes and surface types, and the same design exists in multiple formats. Modelled badly, this becomes an unusable list and a performance disaster.',
					'I model it properly: series as the primary entity, with size, finish, surface and application as filterable attributes rather than duplicate products. That gives buyers real filtering, gives you one place to update a design, and gives search engines clean indexable pages per series instead of thousands of near-duplicate URLs competing with each other.',
					'Image handling matters just as much. Tile photography is heavy by nature. I use responsive image sets, modern formats and lazy loading so a buyer on a slow connection in Lagos or Lima still sees your range instead of a blank screen.',
				],
			},
			{
				heading: 'Speed across international connections',
				body: [
					'Your hosting may be in India while your buyers are not. A site that feels instant in Morbi can take six seconds in Dubai and longer in West Africa. Most factory sites I audit have never been tested from outside India at all.',
					'I test from the regions your buyers are actually in, put a CDN in front of static assets, keep the page payload genuinely small, and cut third-party scripts that add weight without adding anything. The result is a site that performs where it needs to, not just on a laptop in Gujarat.',
				],
			},
			{
				heading: 'Credibility signals that convert export buyers',
				body: [
					'International buyers are screening for risk. Certifications, factory photographs, production capacity, export markets already served, and a physical address that matches what they find elsewhere all do real conversion work.',
					'I build these in deliberately — a proper factory and infrastructure section, certification display, an export-markets map, and consistent company details across your site, IndiaMART, Alibaba and trade-fair listings. Buyers cross-check, and inconsistencies cost you enquiries.',
				],
			},
		],
		proof: [
			{ name: 'Sahil Enterprise', url: 'https://sahilenterprisemorbi.com', note: 'Live Morbi business site — product presentation and enquiry flow built for trade buyers.' },
			{ name: 'Solar Quartz', note: 'Industrial product site with technical specifications and downloadable datasheets.' },
			{ name: 'Venus Pumps', note: 'Manufacturer catalogue with specification tables and export-facing enquiry handling.' },
		],
		faqs: [
			{
				question: 'How much does a website cost for a Morbi ceramic or tile company?',
				answer:
					'A catalogue-driven manufacturer site with custom theme, filterable product range and export enquiry flow typically runs ₹45,000–₹1,20,000, mainly depending on catalogue size and how much of your product data needs cleaning up first. A simpler brochure-style site with a small range starts around ₹30,000. Fixed price against a written scope, quoted after one call.',
			},
			{
				question: 'Can you handle a catalogue with several hundred tile SKUs?',
				answer:
					'Yes, and it is most of what I do for Morbi clients. The key is modelling series as the primary entity with size, finish and surface as attributes rather than creating a separate product for every combination. That keeps the catalogue maintainable, keeps the site fast, and avoids flooding Google with near-duplicate pages.',
			},
			{
				question: 'Do you build multi-language websites for export buyers?',
				answer:
					'Yes, where it genuinely helps. Arabic and Spanish are the two that most often pay for themselves for Morbi exporters. I implement it with correct hreflang tags so Google serves the right language version. I will advise against it if your buyer base is already reading English fine — badly maintained translations do more harm than no translation.',
			},
			{
				question: 'Are you based in Morbi?',
				answer:
					'I am based in Rajkot, about an hour from Morbi, and I studied at OMVVIM College in Morbi. I visit for factory shoots and in-person meetings when a project calls for it, and handle the rest remotely.',
			},
			{
				question: 'Can you integrate the website with IndiaMART or Alibaba?',
				answer:
					'Direct catalogue sync is limited by what those platforms expose, but I make sure your own site is the authoritative version and that your company details, certifications and product naming stay consistent across all three. Buyers cross-check between platforms, and mismatches read as a red flag.',
			},
			{
				question: 'Will the site work well on mobile for overseas buyers?',
				answer:
					'Yes — and it is tested from the regions your buyers are in, not just locally. A large share of export enquiries now arrive from mobile, often over WhatsApp after a mobile browse, so the catalogue and enquiry flow are built mobile-first rather than shrunk down from desktop.',
			},
		],
		related: [
			{ href: '/squarespace-developer-morbi', label: 'Squarespace Developer in Morbi' },
			{ href: '/wordpress-developer-rajkot', label: 'WordPress Developer in Rajkot' },
			{ href: '/blog/modern-web-development-guide', label: 'Guide: WooCommerce and catalogue builds' },
		],
		accent: '#FF6B00',
	},
	{
		slug: 'squarespace-developer-morbi',
		platform: 'Squarespace',
		city: 'Morbi',
		title: 'Squarespace Developer in Morbi | Shivrajsinh Zala',
		metaDescription:
			'Freelance Squarespace developer for Morbi businesses. Custom Squarespace 7.1 design, Figma implementation and export-ready brand sites for ceramic and trading companies.',
		h1: 'Squarespace Developer in Morbi',
		tagline: 'Clean, low-maintenance Squarespace sites for Morbi brands, traders and studios.',
		intro: [
			'I am Shivrajsinh Zala, a freelance Squarespace developer working with businesses in and around Morbi, Gujarat. I build custom-designed Squarespace 7.1 sites — real design work and custom code, not a recoloured template.',
			'Squarespace suits a particular Morbi client well: a trading company, a brand-led ceramic house with a curated range, an export agency, or a professional practice that wants a sharp, credible site and never wants to think about hosting, updates or security again.',
		],
		deliverables: [
			'Custom-designed Squarespace 7.1 build tailored to your brand',
			'Figma or Sketch designs implemented accurately, down to spacing and type',
			'Custom CSS and code injection for layouts the native editor cannot produce',
			'Curated product or portfolio presentation with strong image treatment',
			'Enquiry forms routed to the people who actually answer them',
			'Technical SEO — schema injection, title structure, Search Console, sitemaps',
			'Team training and written documentation for ongoing edits',
		],
		sections: [
			{
				heading: 'Squarespace or WordPress for a Morbi business?',
				body: [
					`${MORBI_INDUSTRY} That gives you two quite different website problems, and they need different platforms.`,
					'If you are a factory with several hundred SKUs across series, sizes and finishes, you need WordPress. Squarespace Commerce is not built to filter a catalogue at that scale, and forcing it will produce a site that frustrates buyers. I will say so rather than take the project.',
					'If you are a trading company, an export agency, a curated brand with a focused range, or a professional practice, Squarespace is often the better business decision. Lower maintenance burden, nothing to patch, no plugin conflicts, and a design-forward result — for a genuinely lower total cost over three years.',
				],
			},
			{
				heading: 'Design that carries weight with international buyers',
				body: [
					'For a Morbi company presenting to overseas buyers, the site is frequently the first impression before any call happens. A template that a buyer has seen on fifty other sites quietly undercuts the impression you are trying to make.',
					'I design and build custom within Squarespace: bespoke section layouts, a typographic system that belongs to your brand, deliberate image treatment, and considered motion. It reads as a company that invested in how it presents itself — which is exactly the signal an export buyer is reading for.',
				],
			},
			{
				heading: 'Performance and image discipline',
				body: [
					'The single biggest Squarespace performance failure I see is images. The platform will cheerfully serve enormous uncompressed photographs, and ceramic and product photography is heavy to begin with. A gallery page can easily hit 15MB if nobody is paying attention.',
					'I compress and correctly size everything before upload, use Squarespace image loading properly, defer what can be deferred, and test from the regions your buyers browse from. A Squarespace site can be genuinely fast — it just does not happen by default.',
				],
			},
			{
				heading: 'What working with me looks like',
				body: [
					'One call to establish what the site is commercially for, then a written fixed-price scope with a delivery date. You watch the build on a staging site rather than waiting for a reveal.',
					'At handover you get full ownership of the Squarespace account, a walkthrough recording, and documentation of every piece of custom code. Nothing about the site depends on me still being around.',
				],
			},
		],
		proof: [
			{ name: 'Sahil Enterprise', url: 'https://sahilenterprisemorbi.com', note: 'Morbi business site — product presentation built around trade enquiries.' },
			{ name: 'Craft Design Studio', note: 'Brand-led studio site with a custom layout and typographic system.' },
			{ name: 'Just Digital Gurus', note: 'Squarespace and Webflow implementation from Figma and Sketch files for agency clients.' },
		],
		faqs: [
			{
				question: 'How much does a Squarespace website cost for a Morbi business?',
				answer:
					'A custom-designed Squarespace 7.1 site is typically ₹20,000–₹50,000 for design and build, rising to ₹45,000–₹90,000 with Squarespace Commerce and product setup. That is my fee — the Squarespace subscription is billed separately by Squarespace, in an account you own.',
			},
			{
				question: 'Is Squarespace suitable for a ceramic or tile company?',
				answer:
					'It depends entirely on catalogue size. For a curated range — say under about 60 products — Squarespace works well and looks excellent. For a full factory catalogue of several hundred SKUs across series, sizes and finishes, you need WordPress with proper filtering. I build both and will tell you honestly which side you are on before quoting.',
			},
			{
				question: 'Do you visit Morbi for meetings?',
				answer:
					'Yes. I am based in Rajkot, roughly an hour away, and I studied at OMVVIM College in Morbi. I come out for kickoff meetings and photography when a project warrants it, and handle everything else remotely.',
			},
			{
				question: 'Can Squarespace handle enquiries from international buyers?',
				answer:
					'Yes. Squarespace forms handle enquiry capture reliably and can route to multiple recipients, and I wire them so submissions reach the people who actually respond. For higher-volume RFQ workflows with product codes and quantities, WordPress gives more room, and I will flag that if it applies to you.',
			},
			{
				question: 'What happens if I want to move off Squarespace later?',
				answer:
					'Your content is exportable and I document the site structure at handover, so a future migration to WordPress is straightforward. I map 301 redirects during any migration I run so you keep the search rankings you built up — that is the step most replatforms skip, and the reason they lose traffic.',
			},
			{
				question: 'Do you offer ongoing support after launch?',
				answer:
					'Yes, as an optional retainer for content updates and small design changes. It is never a requirement — Squarespace needs no security patching or plugin updates, so most clients handle routine edits themselves after the training session.',
			},
		],
		related: [
			{ href: '/wordpress-developer-morbi', label: 'WordPress Developer in Morbi' },
			{ href: '/squarespace-developer-rajkot', label: 'Squarespace Developer in Rajkot' },
			{ href: '/blog/modern-web-development-guide', label: 'Guide: platform selection and build strategy' },
		],
		accent: '#B026FF',
	},
];

export function getService(slug: string): ServicePage {
	const found = servicePages.find((s) => s.slug === slug);
	if (!found) throw new Error(`Unknown service slug: ${slug}`);
	return found;
}
