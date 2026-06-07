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

  integrations: [react(), sitemap()],
  site: 'https://shivrajsinh.in',
  build: {
    format: 'file'
  },
  redirects: {
    '/blog/best-frontend-developer-rajkot-gujarat-2026': '/blog/modern-web-development-guide',
    '/blog/hire-shivrajsinh-zala-frontend-developer-rajkot': '/blog/modern-web-development-guide',
    '/blog/about-shivrajsinh-zala-frontend-developer': '/blog/modern-web-development-guide',
    '/blog/shivrajsinh-zala-tech-stack-react-gsap-tailwind': '/blog/modern-web-development-guide',
    '/blog/gsap-scrolltrigger-animations-portfolio-2026': '/blog/modern-web-development-guide',
    '/blog/shivrajsinh-zala-wordpress-developer-custom-themes': '/blog/modern-web-development-guide',
    '/blog/custom-wordpress-development-2026': '/blog/modern-web-development-guide',
    '/blog/shivrajsinh-zala-ecommerce-developer-shopify-webflow': '/blog/modern-web-development-guide',
    '/blog/shopify-vs-webflow-ecommerce': '/blog/modern-web-development-guide',
    '/blog/shivrajsinh-zala-developer-journey-rajkot-gujarat': '/blog/modern-web-development-guide',
    '/blog/brutalist-web-design-frontend': '/blog/modern-web-development-guide',
    '/blog/interview-shivrajsinh-zala-rajkot-web-design': '/blog/modern-web-development-guide'
  }
});