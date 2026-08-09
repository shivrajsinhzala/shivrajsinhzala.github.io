// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    react(),
    sitemap({
      // Never list a noindex page in the sitemap — Search Console flags the
      // conflicting signal and it wastes crawl budget.
      filter: (page) =>
        !['/resume-pdf', '/janki'].includes(new URL(page).pathname.replace(/\/$/, '')),
      changefreq: 'weekly',
      lastmod: new Date(),
    }),
  ],
  site: 'https://shivrajsinh.in',
  build: {
    format: 'file'
  }

  // NOTE: redirects for the consolidated 2026 blog posts now live in
  // public/_redirects, so Cloudflare Pages serves real HTTP 301s at the edge.
  //
  // They are deliberately NOT declared here as well. Astro's static `redirects`
  // emits a meta-refresh HTML page carrying <meta name="robots" content="noindex">,
  // which Google may act on before following the refresh — dropping the URL
  // instead of consolidating its ranking signals into the target. Declaring them
  // in both places would also generate .html files that shadow the edge rules.
  //
  // Trade-off: `astro dev` and `astro preview` no longer follow these redirects,
  // since _redirects is a Cloudflare Pages feature. Verify them against the
  // deployed site, not locally.
});