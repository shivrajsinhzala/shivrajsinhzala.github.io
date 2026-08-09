import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Blog collection.
 *
 * Posts are plain markdown in src/content/blog/. They are written either by
 * hand or by scripts/generate-blog.mjs (the weekly Groq-powered generator),
 * and rendered by src/pages/blog/[...slug].astro.
 */
const blog = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		/** ISO date, e.g. 2026-08-10 */
		date: z.string(),
		updated: z.string().optional(),
		tag: z.string().default('ARTICLE'),
		/** Primary keyword the post targets — used for internal reporting only. */
		keyword: z.string().optional(),
		keywords: z.array(z.string()).default([]),
		image: z.string().default('/assets/images/og-image.png'),
		imageAlt: z.string().default('Shivrajsinh Zala — Frontend Developer, Rajkot'),
		/** FAQ block rendered as visible content AND FAQPage schema. */
		faqs: z
			.array(z.object({ question: z.string(), answer: z.string() }))
			.default([]),
		/** Set true to keep a post out of the index and out of search. */
		draft: z.boolean().default(false),
		/** Marks machine-drafted posts so they can be audited later. */
		generatedBy: z.string().optional(),
	}),
});

export const collections = { blog };
