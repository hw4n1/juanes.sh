// @ts-check
import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import cloudflare from '@astrojs/cloudflare';
import { rehypeHeadingIds, unified } from '@astrojs/markdown-remark';

/**
 * Appends a permalink anchor to every h2–h4 in post content.
 *
 * Written inline instead of pulling in `rehype-autolink-headings`: it's ~20
 * lines, it adds no new third-party package to the build, and it emits exactly
 * the markup we style in global.css.
 *
 * Astro injects heading `id`s *after* user rehype plugins run, so
 * `rehypeHeadingIds` has to be listed before this one for the ids to exist.
 */
function rehypeHeadingAnchors() {
  const headings = new Set(['h2', 'h3', 'h4']);

  /**
   * @param {import('hast').Nodes} node
   * @returns {string}
   */
  const textOf = (node) =>
    node.type === 'text' ? node.value : 'children' in node ? node.children.map(textOf).join('') : '';

  /** @param {import('hast').Nodes} node */
  const walk = (node) => {
    if (!('children' in node)) return;

    for (const child of node.children) {
      if (child.type === 'element' && headings.has(child.tagName) && child.properties?.id) {
        child.children.push({
          type: 'element',
          tagName: 'a',
          properties: {
            className: ['heading-anchor'],
            href: `#${child.properties.id}`,
            'aria-label': `Link to this section: ${textOf(child)}`,
          },
          children: [{ type: 'text', value: '#' }],
        });
      }
      walk(child);
    }
  };

  /** @param {import('hast').Root} tree */
  return (tree) => walk(tree);
}

// https://astro.build/config
export default defineConfig({
  site: 'https://juanes.sh',
  integrations: [mdx(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },

  markdown: {
    processor: unified({ rehypePlugins: [rehypeHeadingIds, rehypeHeadingAnchors] }),
    shikiConfig: {
      themes: {
        light: 'github-light',
        dark: 'one-dark-pro',
      },
      defaultColor: false,
      wrap: true,
    },
  },

  adapter: cloudflare(),
});