/**
 * Canonical origin for this build.
 *
 * Derived from Astro's `site` config (exposed as import.meta.env.SITE) rather
 * than hardcoded. It used to be a literal, which meant every page's canonical
 * pointed at the old domain no matter what the deployment was — telling search
 * engines the real copy lived somewhere else and guaranteeing this host would
 * never rank for its own content.
 */
export const SITE_URL = (import.meta.env.SITE ?? 'https://portfolio.shivrajsinh.in').replace(
	/\/$/,
	''
);

/** Canonical LinkedIn profile — use everywhere (schema, contact, sameAs). */
export const LINKEDIN_URL = 'https://www.linkedin.com/in/shivrajsinh-zala/';

/** Normalize Astro/build paths to extensionless canonical paths. */
export function canonicalPath(pathname: string): string {
	let path = pathname || '/';
	if (path === '/index.html' || path === '/index') return '/';
	if (path.endsWith('.html')) path = path.slice(0, -5);
	if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
	return path || '/';
}

/** Full canonical URL for a pathname. */
export function pageUrl(pathname: string): string {
	const path = canonicalPath(pathname);
	return path === '/' ? `${SITE_URL}/` : `${SITE_URL}${path}`;
}
