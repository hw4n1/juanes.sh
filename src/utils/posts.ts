import { getCollection, type CollectionEntry } from 'astro:content';

/** Published posts (hides drafts in production builds), most recent first. */
export async function getPublishedPosts(): Promise<CollectionEntry<'blog'>[]> {
  const posts = await getCollection('blog', ({ data }) => (import.meta.env.PROD ? data.draft !== true : true));
  return posts.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}
