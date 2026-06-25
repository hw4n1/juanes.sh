import type { CollectionEntry } from 'astro:content';

/**
 * rel=canonical for a post: if the frontmatter declares canonicalURL, use
 * that (a syndicated/migrated post); otherwise its own URL on juanes.sh is
 * the canonical. Critical to avoid losing SEO when republishing on
 * Medium/LinkedIn.
 */
export function canonicalForPost(post: CollectionEntry<'blog'>, site: URL): string {
  if (post.data.canonicalURL) return post.data.canonicalURL;
  return new URL(`/blog/${post.id}/`, site).toString();
}
