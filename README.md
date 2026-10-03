# eucaif.org

Website of the European Coalition for AI in Fundamental Physics, built with
[Astro](https://astro.build) and deployed to GitHub Pages on every push to `main`.

## Where to edit what

| To change… | Edit |
|---|---|
| Upcoming / latest conference, contact addresses, hero style (photo or animation) and image | `src/data/site.yml` |
| Home-page prose (tagline, Purpose and Scope, conference text, About) | `src/content/sections/*.md` |
| The seven research domains on the home page | `src/content/research-domains/*.md` |
| Working groups | `src/content/working-groups/*.md` (one file per group) |
| Documents page entries | `src/content/documents/*.md` (one file per report) |
| Membership levels on the join page | `src/content/membership/*.md` and `src/content/sections/join-*.md` |
| Contact page | `src/content/sections/contact.md` |
| People (board, advisory board, fellows, junior fellows) | `src/data/members.yml` |
| Research-theme dots on the People page | `themes:` field in `src/data/members.yml` (hand-set values win over inferred ones) |
| Images, PDFs | `public/images/`, `public/documents/` |
| Menu, footer | `src/components/Nav.astro`, `src/components/Footer.astro` |
| Colours, type, layout | `src/styles/global.css` |

Each Markdown file has a short frontmatter block (title, order, image, …) and the
prose below it. Links inside Markdown are written root-relative (`/people/`,
`/documents/file.pdf`); the site base is added at build time.

Do not edit `src/data/publications.yml` by hand: it is generated.

## Scripts

```bash
npm run dev            # local dev server with live reload
npm run build          # production build into dist/
npm run preview        # serve dist/ locally
npm run fetch-pubs     # refresh publications.yml from INSPIRE (last 12 months)
npm run infer-themes   # fill missing `themes:` in members.yml from INSPIRE arXiv categories
```

Publications are also refreshed automatically every Monday by the
`update-publications` GitHub Action, which commits the result.

## Deployment

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.
The site is served under `https://eucaif.github.io/eucaif.org/`; the base path is
set once in `astro.config.mjs` (`base`). To move to a custom domain at the root,
change `site` and set `base: '/'`.
