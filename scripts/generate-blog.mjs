#!/usr/bin/env node
/**
 * generate-blog.mjs — weekly auto blog deployer.
 *
 * Picks the next unpublished topic from scripts/topics.mjs, generates a full
 * article with Groq in two passes (brief -> draft), validates the result, and
 * writes src/content/blog/<slug>.md. The GitHub Action commits it; Cloudflare
 * Pages rebuilds the site.
 *
 * Usage:
 *   GROQ_API_KEY=... node scripts/generate-blog.mjs
 *   node scripts/generate-blog.mjs --dry-run          # print, do not write
 *   node scripts/generate-blog.mjs --slug=<slug>      # force a specific topic
 *   node scripts/generate-blog.mjs --list             # show queue status
 *
 * Env:
 *   GROQ_API_KEY  required (unless --list)
 *   GROQ_MODEL    optional, default llama-3.3-70b-versatile
 */

import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import topics from './topics.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT, 'src', 'content', 'blog');

const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const API_KEY = process.env.GROQ_API_KEY;

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIST_ONLY = args.includes('--list');
const FORCED_SLUG = args.find((a) => a.startsWith('--slug='))?.split('=')[1];

const MIN_WORDS = 1100;
const TARGET_WORDS = 1500;

/* ------------------------------------------------------------------ *
 * Voice — the part that separates a useful post from generic AI slop.
 * ------------------------------------------------------------------ */

const BANNED_PHRASES = [
	"in today's digital landscape",
	"in today's fast-paced",
	'in the ever-evolving',
	'ever-evolving landscape',
	'delve into',
	'delving into',
	'unlock the power',
	'unleash the power',
	'take your business to the next level',
	'game-changer',
	'game changer',
	'when it comes to',
	'at the end of the day',
	'it is important to note',
	"it's important to note",
	'it is worth noting',
	'in conclusion',
	'to sum up',
	'look no further',
	'the world of web',
	'navigating the',
	'embark on',
	'testament to',
	'robust solution',
	'cutting-edge solution',
	'seamlessly integrate',
	'elevate your brand',
	'digital presence is more important than ever',
	'leverage the power',
	'harness the power',
	'first and foremost',
	'without further ado',
	'rest assured',
	'dive deep',
	'deep dive into the world',
];

const STYLE_GUIDE = `
VOICE AND STYLE — follow these exactly:

You are writing AS Shivrajsinh Zala, a freelance frontend developer based in Rajkot,
Gujarat, India. First person singular ("I", "my"). You have built and maintained 30+
websites for clients across Rajkot, Morbi and the rest of Gujarat, including industrial
manufacturers and ceramic exporters. You build on WordPress, Squarespace, Shopify,
Webflow, React and Astro.

Write like a working practitioner explaining something to a client over chai, not like a
marketing department. Specifically:

- Short paragraphs. Two to four sentences. Never a wall of text.
- Concrete over abstract. "A 4MB hero image on a 4G connection" beats "slow loading media".
- Use real numbers, real timelines, real rupee figures, real tool and plugin names.
- Take positions. Say which option is worse and why. Hedging reads as having nothing to say.
- Argue against your own commercial interest at least once. It is the most credible thing
  you can do, and it is why people trust the post.
- Admit limits and trade-offs openly. Nothing is "the perfect solution".
- Indian context throughout: INR pricing, Indian payment gateways, GST, COD, Indian
  hosting realities, mid-range Android on patchy 4G as the default user.
- Indian English spelling conventions (optimise, organisation, colour) used consistently.
- No hype. No exclamation marks. No rhetorical questions as section openers.
- Do not open with a throat-clearing preamble. First sentence delivers something useful.
- Do not end with a generic summary paragraph. End with something actionable or a real
  judgement call.

ABSOLUTELY BANNED — these phrases mark text as machine-written and must never appear:
${BANNED_PHRASES.map((p) => `  - "${p}"`).join('\n')}

Also banned: starting sentences with "Moreover", "Furthermore", "Additionally".
Also banned: the em-dash-heavy cadence of listing three adjectives in a row.
Also banned: claiming certifications, awards, client names or statistics that were not
given to you in the brief. If you do not know a fact, write around it. Never invent a
client name, a case-study result, or a percentage.
`.trim();

/* ------------------------------------------------------------------ *
 * Groq client
 * ------------------------------------------------------------------ */

async function groq(messages, { json = false, maxTokens = 8000, temperature = 0.7 } = {}) {
	const body = {
		model: MODEL,
		messages,
		temperature,
		max_tokens: maxTokens,
		top_p: 0.9,
	};
	if (json) body.response_format = { type: 'json_object' };

	let lastErr;
	for (let attempt = 1; attempt <= 4; attempt++) {
		try {
			const res = await fetch(API_URL, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${API_KEY}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(body),
			});

			if (res.status === 429 || res.status >= 500) {
				const wait = Number(res.headers.get('retry-after')) * 1000 || attempt * 8000;
				console.log(`  ↻ ${res.status} from Groq, retrying in ${Math.round(wait / 1000)}s...`);
				await new Promise((r) => setTimeout(r, wait));
				continue;
			}

			if (!res.ok) {
				throw new Error(`Groq ${res.status}: ${await res.text()}`);
			}

			const data = await res.json();
			const content = data.choices?.[0]?.message?.content;
			if (!content) throw new Error('Groq returned an empty completion');
			return content;
		} catch (err) {
			lastErr = err;
			if (attempt === 4) break;
			await new Promise((r) => setTimeout(r, attempt * 5000));
		}
	}
	throw lastErr;
}

/* ------------------------------------------------------------------ *
 * Pass 1 — editorial brief + metadata
 * ------------------------------------------------------------------ */

async function generateBrief(topic) {
	const system = `You are a senior SEO content strategist who has ranked hundreds of pages for
local service businesses in India. You plan articles that earn rankings because they are
genuinely more useful than what is already ranking, not because they repeat a keyword.

You output strict JSON only. No markdown, no commentary.`;

	const user = `Plan an article.

PRIMARY KEYWORD (the article must be able to rank for this): ${topic.keyword}
SUPPORTING TERMS: ${topic.secondary.join(', ')}
ANGLE: ${topic.angle}
READER: ${topic.audience}
MUST COVER:
${topic.mustCover.map((m) => `  - ${m}`).join('\n')}

Return JSON with exactly this shape:

{
  "title": "60-70 char headline. Must contain the primary keyword or a very close variant. Specific and concrete. No colon-subtitle cliché. No 'Ultimate Guide'. No year unless it genuinely matters.",
  "description": "150-160 char meta description. Written to earn a click from a search result, not to summarise. Contains the primary keyword naturally.",
  "keywords": ["6-9 realistic search terms this post targets, including the primary keyword and long-tail variants"],
  "sections": [
    {
      "heading": "H2 heading. Descriptive and specific, phrased the way a reader would think about it. Not a keyword stuffed into a heading.",
      "covers": "One or two sentences describing exactly what this section argues and what concrete detail it must include.",
      "wordTarget": 200
    }
  ],
  "faqs": [
    {
      "question": "A question a real person types into Google about this topic. Natural phrasing, not keyword phrasing.",
      "answer": "A direct, complete 40-70 word answer. Answer in the first sentence, then support it. No preamble."
    }
  ]
}

Requirements:
- 5 to 7 sections, whose combined wordTarget is between ${MIN_WORDS} and ${TARGET_WORDS + 300}.
- The sections together must cover every MUST COVER point. Distribute them sensibly.
- The first section must deliver the core answer immediately. Do not plan an "introduction"
  section that merely sets up the topic.
- The last section must be a judgement, a decision framework, or a checklist. Not a summary.
- Exactly 5 FAQs, all genuinely distinct from the section headings.
- Every FAQ answer must be self-contained enough to stand alone as a featured snippet.`;

	const raw = await groq(
		[
			{ role: 'system', content: system },
			{ role: 'user', content: user },
		],
		{ json: true, temperature: 0.6, maxTokens: 3000 }
	);

	const brief = JSON.parse(raw);
	if (!brief.title || !Array.isArray(brief.sections) || !Array.isArray(brief.faqs)) {
		throw new Error('Brief JSON missing required fields');
	}
	return brief;
}

/* ------------------------------------------------------------------ *
 * Pass 2 — the draft
 * ------------------------------------------------------------------ */

async function generateDraft(topic, brief) {
	const system = `You are Shivrajsinh Zala, a freelance frontend developer in Rajkot, Gujarat.
You are writing an article for your own website. You are a practitioner writing from
experience, not a copywriter.

${STYLE_GUIDE}

OUTPUT FORMAT — critical:
- Output GitHub-flavoured Markdown only. No frontmatter. No code fences around the whole output.
- Do NOT output an H1 (#). The page renders the title separately. Start at H2 (##).
- Use the exact H2 headings supplied in the outline, in order.
- H3 (###) subheadings are allowed inside sections where they genuinely help.
- Use bullet lists and at most one markdown table where they carry information better than prose.
- Bold sparingly, for genuinely key terms only.`;

	const linkInstructions = topic.links
		.map((l) => `  - Link to ${l.href} using natural anchor text close to "${l.anchor}"`)
		.join('\n');

	const outline = brief.sections
		.map((s, i) => `${i + 1}. ## ${s.heading}\n   Covers: ${s.covers}\n   Approx ${s.wordTarget} words.`)
		.join('\n\n');

	const user = `Write the full article now.

TITLE (already decided, do not restate it as a heading): ${brief.title}
PRIMARY KEYWORD: ${topic.keyword}
SUPPORTING TERMS to use naturally where they fit: ${topic.secondary.join(', ')}
READER: ${topic.audience}

OUTLINE — follow exactly, in order, using these H2 headings verbatim:

${outline}

INTERNAL LINKS — include every one of these, placed where they are genuinely relevant
inside body prose. Never dump them in a list at the end. Never link the same URL twice.
${linkInstructions}

LENGTH: ${MIN_WORDS}-${TARGET_WORDS + 300} words total. Depth over padding — if a section
runs short because there is nothing more worth saying, that is correct.

KEYWORD USE: the primary keyword should appear naturally roughly 4-7 times across the
article, including in the first 100 words and in at least one H2. Never force it into a
sentence where a pronoun or a shorter phrase would read better. Awkward keyword insertion
is worse for rankings than fewer mentions.

Remember: no H1, no frontmatter, no closing summary paragraph, none of the banned phrases,
and no invented facts, client names or statistics.`;

	return groq(
		[
			{ role: 'system', content: system },
			{ role: 'user', content: user },
		],
		{ temperature: 0.75, maxTokens: 8000 }
	);
}

/* ------------------------------------------------------------------ *
 * Cleanup + validation
 * ------------------------------------------------------------------ */

function cleanMarkdown(md) {
	let out = md.trim();

	// Strip a stray ```markdown wrapper if the model added one.
	out = out.replace(/^```(?:markdown|md)?\s*\n/, '').replace(/\n```\s*$/, '');

	// Remove any H1 the model produced despite instructions.
	out = out.replace(/^#\s+.*$/gm, '').trim();

	// Drop a leading "Title:" or "Meta description:" line if one leaked through.
	out = out.replace(/^(title|meta description|description|slug)\s*:.*$/gim, '').trim();

	// Normalise excessive blank lines.
	out = out.replace(/\n{3,}/g, '\n\n');

	return out;
}

function validate(md, topic, brief) {
	const problems = [];
	const words = md.split(/\s+/).filter(Boolean).length;

	if (words < MIN_WORDS * 0.75) {
		problems.push(`too short: ${words} words (need ~${MIN_WORDS})`);
	}

	const lower = md.toLowerCase();
	const found = BANNED_PHRASES.filter((p) => lower.includes(p));
	if (found.length) problems.push(`banned phrases present: ${found.join(', ')}`);

	if (/^#\s/m.test(md)) problems.push('contains an H1');
	if (!/^##\s/m.test(md)) problems.push('contains no H2 headings');

	const missingLinks = topic.links.filter((l) => !md.includes(`(${l.href})`));
	if (missingLinks.length) {
		problems.push(`missing internal links: ${missingLinks.map((l) => l.href).join(', ')}`);
	}

	// Placeholder text the model sometimes leaves behind.
	if (/\[(insert|your|client name|xx+)\b/i.test(md)) problems.push('contains placeholder text');

	return { words, problems };
}

/**
 * Repair pass — hand the problems back and ask for a corrected full draft.
 * Cheaper and more reliable than regenerating from scratch.
 */
async function repairDraft(md, problems, topic) {
	const linkList = topic.links.map((l) => `${l.href} (anchor near "${l.anchor}")`).join(', ');
	const user = `The draft below has these problems:

${problems.map((p) => `- ${p}`).join('\n')}

Rewrite the FULL article fixing every problem. Keep everything that is already good —
same headings, same order, same voice, same arguments. Change only what is necessary.

If banned phrases were flagged, rewrite those sentences entirely rather than swapping a word.
If internal links are missing, work them into relevant body prose as markdown links: ${linkList}
If it was too short, add genuine substance — specific examples, numbers, trade-offs — not padding.

Output the corrected markdown only. No H1, no frontmatter, no commentary.

--- DRAFT ---
${md}`;

	return groq(
		[
			{ role: 'system', content: `You are Shivrajsinh Zala, editing your own article.\n\n${STYLE_GUIDE}` },
			{ role: 'user', content: user },
		],
		{ temperature: 0.6, maxTokens: 8000 }
	);
}

/* ------------------------------------------------------------------ *
 * Frontmatter
 * ------------------------------------------------------------------ */

const yamlStr = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ').trim()}"`;

function buildFrontmatter(topic, brief, today) {
	const lines = [
		'---',
		`title: ${yamlStr(brief.title)}`,
		`description: ${yamlStr(brief.description)}`,
		`date: "${today}"`,
		`tag: ${yamlStr(topic.tag)}`,
		`keyword: ${yamlStr(topic.keyword)}`,
		'keywords:',
		...(brief.keywords ?? []).map((k) => `  - ${yamlStr(k)}`),
		`image: "/assets/images/og-image.png"`,
		`imageAlt: ${yamlStr(`${brief.title} — Shivrajsinh Zala, Rajkot`)}`,
		`generatedBy: ${yamlStr(`groq:${MODEL}`)}`,
		'faqs:',
		...brief.faqs.flatMap((f) => [`  - question: ${yamlStr(f.question)}`, `    answer: ${yamlStr(f.answer)}`]),
		'---',
		'',
	];
	return lines.join('\n');
}

/* ------------------------------------------------------------------ *
 * Queue
 * ------------------------------------------------------------------ */

async function publishedSlugs() {
	if (!existsSync(CONTENT_DIR)) return new Set();
	const files = await readdir(CONTENT_DIR);
	return new Set(files.filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')));
}

/**
 * astro.config.mjs holds 301s for the old consolidated blog posts. A generated
 * slug that collides with one would produce a page Astro then redirects away
 * from — silently wasting the post. Fail loudly instead.
 */
async function assertNoRedirectCollision(slug) {
	const { readFile } = await import('node:fs/promises');
	const config = await readFile(path.join(ROOT, 'astro.config.mjs'), 'utf8');
	if (config.includes(`'/blog/${slug}'`) || config.includes(`"/blog/${slug}"`)) {
		throw new Error(
			`Slug "${slug}" collides with a redirect in astro.config.mjs. ` +
				`Rename the topic in scripts/topics.mjs or remove the redirect.`
		);
	}
}

async function pickTopic() {
	const done = await publishedSlugs();

	if (FORCED_SLUG) {
		const t = topics.find((x) => x.slug === FORCED_SLUG);
		if (!t) throw new Error(`No topic with slug "${FORCED_SLUG}" in scripts/topics.mjs`);
		return t;
	}

	return topics.find((t) => !done.has(t.slug)) ?? null;
}

/* ------------------------------------------------------------------ *
 * Main
 * ------------------------------------------------------------------ */

async function main() {
	if (LIST_ONLY) {
		const done = await publishedSlugs();
		console.log(`\nEditorial queue (${topics.length} topics)\n`);
		for (const t of topics) {
			console.log(`  ${done.has(t.slug) ? '✅ published' : '⬜ queued   '}  ${t.slug}`);
		}
		const remaining = topics.filter((t) => !done.has(t.slug)).length;
		console.log(`\n${remaining} remaining — about ${remaining} weeks of runway.\n`);
		return;
	}

	if (!API_KEY) {
		console.error('GROQ_API_KEY is not set. Get a free key at https://console.groq.com/keys');
		process.exit(1);
	}

	const topic = await pickTopic();
	if (!topic) {
		console.log('Editorial queue is empty — every topic in scripts/topics.mjs is published.');
		console.log('Add new topics to the queue to keep the weekly schedule running.');
		return;
	}

	await assertNoRedirectCollision(topic.slug);

	console.log(`\n📝 Topic: ${topic.slug}`);
	console.log(`   Keyword: ${topic.keyword}`);
	console.log(`   Model:   ${MODEL}\n`);

	console.log('  → Pass 1: editorial brief...');
	const brief = await generateBrief(topic);
	console.log(`     Title: ${brief.title}`);
	console.log(`     ${brief.sections.length} sections, ${brief.faqs.length} FAQs`);

	console.log('  → Pass 2: full draft...');
	let markdown = cleanMarkdown(await generateDraft(topic, brief));

	let { words, problems } = validate(markdown, topic, brief);
	console.log(`     ${words} words`);

	let repairs = 0;
	while (problems.length && repairs < 2) {
		repairs++;
		console.log(`  → Repair pass ${repairs}: ${problems.join(' | ')}`);
		markdown = cleanMarkdown(await repairDraft(markdown, problems, topic));
		({ words, problems } = validate(markdown, topic, brief));
		console.log(`     ${words} words`);
	}

	if (problems.length) {
		console.error(`\n❌ Draft still failing validation after ${repairs} repairs:`);
		problems.forEach((p) => console.error(`   - ${p}`));
		console.error('\nNot publishing. Re-run to try again, or fix the brief in scripts/topics.mjs.');
		process.exit(1);
	}

	const today = new Date().toISOString().slice(0, 10);
	const file = buildFrontmatter(topic, brief, today) + markdown + '\n';

	if (DRY_RUN) {
		console.log('\n--- DRY RUN OUTPUT ---\n');
		console.log(file);
		console.log('\n--- END (nothing written) ---\n');
		return;
	}

	await mkdir(CONTENT_DIR, { recursive: true });
	const outPath = path.join(CONTENT_DIR, `${topic.slug}.md`);
	await writeFile(outPath, file, 'utf8');

	console.log(`\n✅ Published: src/content/blog/${topic.slug}.md`);
	console.log(`   ${words} words · ${brief.faqs.length} FAQs · https://shivrajsinh.in/blog/${topic.slug}\n`);

	// Surface values for the GitHub Action's commit message.
	if (process.env.GITHUB_OUTPUT) {
		const { appendFileSync } = await import('node:fs');
		appendFileSync(
			process.env.GITHUB_OUTPUT,
			`slug=${topic.slug}\ntitle=${brief.title.replace(/\n/g, ' ')}\npublished=true\n`
		);
	}
}

main().catch((err) => {
	console.error('\n❌ Generation failed:', err.message);
	process.exit(1);
});
