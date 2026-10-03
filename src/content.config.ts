import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Content collections. Each building block of the site is one Markdown file:
// frontmatter holds the structured fields, the body holds the prose.
// Members (src/data/members.yml) and publications (generated) stay YAML.

const sections = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/sections' }),
  schema: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
  }),
});

const researchDomains = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/research-domains' }),
  schema: z.object({
    title: z.string(),
    image: z.string(),
    order: z.number(),
  }),
});

const workingGroups = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/working-groups' }),
  schema: z.object({
    code: z.string(),
    title: z.string(),
    order: z.number(),
    image: z.string().optional(),
  }),
});

const materials = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/materials' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    links: z.array(z.object({ label: z.string(), url: z.string().url() })),
  }),
});

const membership = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/membership' }),
  schema: z.object({
    title: z.string(),
    order: z.number(),
    highlight: z.boolean().default(false),
  }),
});

export const collections = { sections, researchDomains, workingGroups, materials, membership };
