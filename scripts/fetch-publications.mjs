import { readFileSync, writeFileSync } from 'fs';
import { load, dump } from 'js-yaml';

const MEMBERS_PATH = new URL('../src/data/members.yml', import.meta.url);
const OUTPUT_PATH = new URL('../src/data/publications.yml', import.meta.url);

const KEYWORDS = [
  'machine learning', 'deep learning', 'neural network', 'artificial intelligence',
  'simulation-based inference', 'normalizing flow', 'generative model', 'diffusion model',
  'transformer', 'graph neural', 'variational', 'bayesian neural', 'surrogate model',
  'emulator', 'likelihood-free', 'foundation model', 'reinforcement learning',
  'classification', 'regression', 'anomaly detection', 'generative adversarial',
  'autoencoder', 'contrastive learning', 'representation learning',
];

function matchesKeywords(title, abstract) {
  const text = `${title} ${abstract}`.toLowerCase();
  return KEYWORDS.some(kw => text.includes(kw));
}

function sixMonthsAgo() {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  return d.toISOString().slice(0, 10);
}

async function fetchForAuthor(bai, since) {
  const q = `a ${bai} and de > ${since}`;
  const url = `https://inspirehep.net/api/literature?sort=mostrecent&size=250&fields=titles,authors.full_name,arxiv_eprints,preprint_date,abstracts&q=${encodeURIComponent(q)}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  WARN: API error for ${bai}: ${res.status}`);
    return [];
  }
  const data = await res.json();
  return (data.hits?.hits || []).map(hit => {
    const m = hit.metadata;
    return {
      inspire_id: String(hit.id),
      title: m.titles?.[0]?.title || '',
      authors: (m.authors || []).map(a => a.full_name),
      arxiv: m.arxiv_eprints?.[0]?.value || null,
      date: m.preprint_date || null,
      abstract: m.abstracts?.[0]?.value || '',
    };
  });
}

async function main() {
  const members = load(readFileSync(MEMBERS_PATH, 'utf-8'));
  const bais = members.filter(m => m.inspire).map(m => m.inspire);
  const baiSet = new Set(bais);
  const since = sixMonthsAgo();

  console.log(`Fetching papers since ${since} for ${bais.length} authors...`);

  const allPapers = new Map(); // inspire_id -> paper
  const paperAuthors = new Map(); // inspire_id -> Set of BAIs

  for (const bai of bais) {
    process.stdout.write(`  ${bai}...`);
    const papers = await fetchForAuthor(bai, since);
    let count = 0;
    for (const p of papers) {
      if (!allPapers.has(p.inspire_id)) {
        allPapers.set(p.inspire_id, p);
        paperAuthors.set(p.inspire_id, new Set());
      }
      paperAuthors.get(p.inspire_id).add(bai);
      count++;
    }
    console.log(` ${count} papers`);

    // Small delay to be nice to the API
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nTotal unique papers: ${allPapers.size}`);

  // Filter by keywords
  const filtered = [];
  for (const [id, paper] of allPapers) {
    if (matchesKeywords(paper.title, paper.abstract)) {
      filtered.push({
        title: paper.title,
        authors: paper.authors,
        eucaif_authors: [...paperAuthors.get(id)],
        arxiv: paper.arxiv,
        date: paper.date,
        abstract: paper.abstract,
      });
    }
  }

  // Sort by date descending
  filtered.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  console.log(`After keyword filtering: ${filtered.length} papers`);

  writeFileSync(OUTPUT_PATH, dump(filtered, { lineWidth: -1, quotingType: '"' }));
  console.log(`Written to ${OUTPUT_PATH.pathname}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
