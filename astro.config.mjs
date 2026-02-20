import { defineConfig } from 'astro/config';

import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://eucaif.github.io',
  base: '/eucaif.org',
  integrations: [mdx()]
});