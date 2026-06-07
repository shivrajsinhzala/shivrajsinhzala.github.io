export type BlogPost = {
	slug: string;
	title: string;
	description: string;
	date: string;
	tag: string;
};

export const blogPosts: BlogPost[] = [
	{
		slug: 'modern-web-development-guide',
		title: 'The Ultimate Guide to Modern Web Development, E-Commerce, & Brutalist Design',
		description: 'A comprehensive deep-dive into advanced frontend engineering, custom WordPress theme design, Shopify & Webflow strategies, GSAP ScrollTrigger animations, and the brutalist aesthetic.',
		date: '2026-06-08',
		tag: 'GUIDE',
	}
];
