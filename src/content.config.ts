import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    lang: z.enum(['es', 'en']).default('en'),
    // Set this only if the post is syndicated from elsewhere or already has
    // its own canonical different from its juanes.sh URL. Otherwise its own
    // URL on juanes.sh is the canonical (see src/utils/seo.ts).
    canonicalURL: z.url().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
