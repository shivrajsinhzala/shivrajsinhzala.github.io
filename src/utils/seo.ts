export const SITE_URL = 'https://shivrajsinh.in';

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
