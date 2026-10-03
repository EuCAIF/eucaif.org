// Infer each member's main research themes from the arXiv categories of
// their INSPIRE papers and write them into src/data/members.yml.
//
// Hand-entered `themes:` keys in members.yml always take precedence: entries
// that already have a `themes` key are left untouched. The file is edited
// textually (not re-dumped) so its formatting is preserved.

import { readFileSync, writeFileSync } from 'fs';
import { load } from 'js-yaml';

const MEMBERS_PATH = new URL('../src/data/members.yml', import.meta.url);

// Canonical theme order. Keep in sync with people.astro / global.css.
export const THEMES = [
  { slug: 'theoretical',   name: 'Theoretical physics' },
  { slug: 'particle',      name: 'Particle physics' },
  { slug: 'nuclear',       name: 'Nuclear physics' },
  { slug: 'astroparticle', name: 'Astroparticle physics' },
  { slug: 'gravitational', name: 'Gravitational waves' },
  { slug: 'cosmology',     name: 'Cosmology' },
  { slug: 'accelerator',   name: 'Accelerator physics' },
];

// arXiv category -> theme slug(s). Everything not listed here is ignored
// (cs.*, stat.*, physics.data-an, physics.ins-det, astro-ph.IM, astro-ph.GA, ...).
// A category may feed several themes: lattice QCD is both particle and nuclear physics.
const CATEGORY_TO_THEME = {
  'hep-th': 'theoretical',
  'math-ph': 'theoretical',
  'hep-ph': 'particle',
  'hep-ex': 'particle',
  'hep-lat': ['particle', 'nuclear'],
  'nucl-th': 'nuclear',
  'nucl-ex': 'nuclear',
  'astro-ph.HE': 'astroparticle',
  'gr-qc': 'gravitational',
  'astro-ph.CO': 'cosmology',
  'physics.acc-ph': 'accelerator',
};

const MAX_THEMES = 3;
const MIN_FRACTION = 0.15;
const DELAY_MS = 150;

async function fetchCategories(bai) {
  const url = `https://inspirehep.net/api/literature?q=a%20${encodeURIComponent(bai)}&size=250&fields=arxiv_eprints.categories&sort=mostrecent`;
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  WARN: API error for ${bai}: ${res.status}, skipping`);
    return null;
  }
  const data = await res.json();
  const hits = data.hits?.hits || [];
  const counts = {};
  let papers = 0;
  for (const hit of hits) {
    const cats = hit.metadata?.arxiv_eprints?.flatMap(e => e.categories || []) || [];
    if (cats.length === 0) continue;
    papers++;
    // Count each category at most once per paper.
    for (const c of new Set(cats)) counts[c] = (counts[c] || 0) + 1;
  }
  return { counts, papers, hits: hits.length };
}

function inferThemes(catCounts) {
  const themeCounts = {};
  for (const [cat, n] of Object.entries(catCounts)) {
    const mapped = CATEGORY_TO_THEME[cat];
    if (!mapped) continue;
    for (const theme of [].concat(mapped)) themeCounts[theme] = (themeCounts[theme] || 0) + n;
  }
  const total = Object.values(themeCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return { themes: [], themeCounts, total };
  const ranked = Object.entries(themeCounts).sort((a, b) => b[1] - a[1]);
  const themes = ranked
    .filter(([, n], i) => i === 0 || n / total >= MIN_FRACTION)
    .slice(0, MAX_THEMES)
    .map(([t]) => t);
  return { themes, themeCounts, total };
}

// Insert `  themes: [...]` as the last key of the matching entry, editing the
// raw text so the file keeps its formatting.
function addThemesToText(text, member, themes) {
  const lines = text.split('\n');
  const start = lines.findIndex((l, i) =>
    l === `- given_name: ${member.given_name}` && lines[i + 1] === `  surname: ${member.surname}`);
  if (start < 0) {
    console.warn(`  WARN: could not locate entry for ${member.given_name} ${member.surname} in members.yml`);
    return text;
  }
  let end = start + 1;
  while (end < lines.length && lines[end].startsWith('  ')) end++;
  lines.splice(end, 0, `  themes: [${themes.join(', ')}]`);
  return lines.join('\n');
}

async function main() {
  let text = readFileSync(MEMBERS_PATH, 'utf-8');
  const members = load(text);

  const withInspire = members.filter(m => m.inspire);
  console.log(`Inferring themes for ${withInspire.length} members with INSPIRE ids ` +
    `(${members.length - withInspire.length} without)...\n`);

  const rows = [];
  let written = 0, kept = 0, empty = 0, failed = 0;

  for (const m of withInspire) {
    const name = `${m.given_name} ${m.surname}`;
    process.stdout.write(`  ${name} (${m.inspire})...`);
    const result = await fetchCategories(m.inspire);
    await new Promise(r => setTimeout(r, DELAY_MS));
    if (!result) { failed++; rows.push({ name, status: 'API error', themes: [], counts: '' }); continue; }

    const { themes, themeCounts, total } = inferThemes(result.counts);
    const countsStr = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])
      .map(([t, n]) => `${t} ${n}`).join(', ');
    console.log(` ${result.hits} papers, ${result.papers} with arXiv categories, ${total} mapped`);

    let status;
    if (m.themes) {
      status = `hand-entered [${m.themes.join(', ')}]`;
      kept++;
    } else if (themes.length === 0) {
      status = 'no mapped categories';
      empty++;
    } else {
      text = addThemesToText(text, m, themes);
      status = 'written';
      written++;
    }
    rows.push({ name, status, themes, counts: countsStr });
  }

  writeFileSync(MEMBERS_PATH, text);

  // Summary table for human sanity-checking.
  const w1 = Math.max(...rows.map(r => r.name.length), 4);
  const w2 = Math.max(...rows.map(r => r.themes.join(', ').length), 15);
  console.log('\n' + 'Name'.padEnd(w1) + '  ' + 'Inferred themes'.padEnd(w2) + '  Counts (mapped categories)  Status');
  console.log('-'.repeat(w1) + '  ' + '-'.repeat(w2) + '  ' + '-'.repeat(26) + '  ------');
  for (const r of rows) {
    console.log(r.name.padEnd(w1) + '  ' + r.themes.join(', ').padEnd(w2) + '  ' + r.counts + (r.counts ? '  ' : '') + `[${r.status}]`);
  }
  console.log(`\nWritten: ${written}, kept hand-entered: ${kept}, no mapped categories: ${empty}, API errors: ${failed}, ` +
    `no INSPIRE id: ${members.length - withInspire.length}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
