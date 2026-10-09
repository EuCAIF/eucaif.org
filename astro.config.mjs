import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import rehypeBase from './src/lib/rehype-base.mjs';

// Where the site is served. For GitHub Pages under eucaif.github.io/eucaif.org
// the base is '/eucaif.org'; for a custom domain at the root use base: '/'.
// const site = 'https://eucaif.github.io';
// const base = '/eucaif.org';
const site = 'https://eucaif.org';
const base = '/';
const at = (path) => `${base.replace(/\/$/, '')}${path}`;

export default defineConfig({
  site,
  base,
  redirects: {
    '/community/': at('/people/'),
    '/activities/': at('/working-groups/'),
    '/material/': at('/documents/'),
  },
  markdown: { rehypePlugins: [[rehypeBase, { base }]] },
  integrations: [mdx()],
});
