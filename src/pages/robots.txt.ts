import type { APIRoute } from 'astro';

/**
 * robots.txt, generated rather than static.
 *
 * It has to vary per deployment for two reasons the old hardcoded file could
 * not handle:
 *
 *  - The sitemap URLs must point at the host actually being served. The static
 *    file named shivrajsinh.in unconditionally, so a build on any other host
 *    advertised sitemaps belonging to a different site.
 *  - A staged copy must not be crawled at all. While v2 runs on its own
 *    subdomain it serves nearly the same content as the live site, and two
 *    crawlable copies compete with each other in search.
 *
 * Flip PUBLIC_INDEXABLE to "true" at cutover and this opens up on its own.
 */
export const GET: APIRoute = ({ site }) => {
	const indexable = import.meta.env.PUBLIC_INDEXABLE === 'true';
	const origin = (site?.origin ?? 'https://shivrajsinh.in').replace(/\/$/, '');

	if (!indexable) {
		return new Response(
			[
				'# Staging deployment — not for indexing.',
				'# Set PUBLIC_INDEXABLE=true on the production build to open this up.',
				'User-agent: *',
				'Disallow: /',
				'',
			].join('\n'),
			{ headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
		);
	}

	const crawlers = [
		'*',
		// AI crawlers, explicitly welcomed.
		'GPTBot',
		'ChatGPT-User',
		'Google-Extended',
		'Anthropic-AI',
		'ClaudeBot',
		'PerplexityBot',
		'Applebot',
	];

	const body = [
		...crawlers.flatMap((ua) => [`User-agent: ${ua}`, 'Allow: /', '']),
		`Sitemap: ${origin}/sitemap-index.xml`,
		`Sitemap: ${origin}/image-sitemap.xml`,
		'',
	].join('\n');

	return new Response(body, {
		headers: { 'Content-Type': 'text/plain; charset=utf-8' },
	});
};
