// Prefix root-relative links and image sources in Markdown with the site base,
// so content files can say `/people/` and `/images/x.png` regardless of where
// the site is deployed.
export default function rehypeBase({ base = '' } = {}) {
  const prefix = base.replace(/\/$/, '');
  const fix = (v) => (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') ? prefix + v : v);
  const walk = (node) => {
    if (node.type === 'element' && node.properties) {
      if (node.tagName === 'a' && node.properties.href) node.properties.href = fix(node.properties.href);
      if (node.tagName === 'img' && node.properties.src) node.properties.src = fix(node.properties.src);
    }
    (node.children || []).forEach(walk);
  };
  return (tree) => walk(tree);
}
