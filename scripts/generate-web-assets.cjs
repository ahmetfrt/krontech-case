const fs = require('fs');
const path = require('path');
const sharp = require('../apps/web/node_modules/sharp');

const root = path.resolve(__dirname, '..');
const outDir = path.join(root, 'apps/web/public/images');

fs.mkdirSync(outDir, { recursive: true });

function shell(text) {
  return String(text).replace(/[&<>"]/g, (char) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
    };

    return map[char];
  });
}

function svg({ accent, kind, title }) {
  const metrics = [
    ['Sessions', 128],
    ['Approvals', 42],
    ['Evidence', 92],
  ];
  const flows = [
    ['Identity check', 630],
    ['Policy approval', 520],
    ['Session recording', 455],
    ['Audit indexing', 585],
  ];

  return `
<svg width="1600" height="1000" viewBox="0 0 1600 1000" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#07111f"/>
      <stop offset="0.55" stop-color="#10243f"/>
      <stop offset="1" stop-color="#f5f7fa"/>
    </linearGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.14"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.04"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="28" stdDeviation="26" flood-color="#000" flood-opacity="0.28"/>
    </filter>
  </defs>
  <rect width="1600" height="1000" fill="url(#bg)"/>
  <path d="M0 760 C250 610 430 830 650 690 C900 530 1010 570 1240 430 C1400 330 1500 300 1600 250 L1600 1000 L0 1000 Z" fill="#d71920" opacity="0.88"/>
  <path d="M0 815 C280 705 455 900 710 745 C945 602 1075 640 1288 505 C1430 415 1515 395 1600 360" fill="none" stroke="#ffffff" stroke-width="5" opacity="0.34"/>
  <g filter="url(#shadow)">
    <rect x="170" y="145" width="1260" height="670" rx="34" fill="#081221" stroke="#ffffff" stroke-opacity="0.15"/>
    <rect x="210" y="200" width="1180" height="120" rx="18" fill="url(#panel)"/>
    <text x="250" y="252" fill="#9bd3ff" font-family="Arial, Helvetica, sans-serif" font-size="28" font-weight="700" letter-spacing="5">KRONTECH ${shell(kind)}</text>
    <text x="250" y="296" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="44" font-weight="800">${shell(title)}</text>
    <rect x="1160" y="235" width="160" height="42" rx="10" fill="#22c55e" fill-opacity="0.16"/>
    <text x="1198" y="264" fill="#86efac" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">ONLINE</text>
    <g transform="translate(235 380)">
      ${metrics
        .map(
          ([label, value], index) => `
      <rect x="${index * 285}" y="0" width="240" height="132" rx="18" fill="#ffffff" fill-opacity="0.08" stroke="#ffffff" stroke-opacity="0.13"/>
      <text x="${index * 285 + 26}" y="46" fill="#cbd5e1" font-family="Arial, Helvetica, sans-serif" font-size="22">${label}</text>
      <text x="${index * 285 + 26}" y="100" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="800">${value}</text>`,
        )
        .join('')}
    </g>
    <g transform="translate(235 575)">
      ${flows
        .map(
          ([label, width], index) => `
      <text x="0" y="${index * 52}" fill="#e2e8f0" font-family="Arial, Helvetica, sans-serif" font-size="23">${label}</text>
      <rect x="330" y="${index * 52 - 20}" width="650" height="16" rx="8" fill="#ffffff" fill-opacity="0.12"/>
      <rect x="330" y="${index * 52 - 20}" width="${width}" height="16" rx="8" fill="${index === 1 ? accent : '#d71920'}"/>`,
        )
        .join('')}
    </g>
  </g>
</svg>`;
}

async function writeAsset(name, options) {
  const input = Buffer.from(svg(options));
  await sharp(input)
    .resize(1600, 1000)
    .webp({ quality: 82 })
    .toFile(path.join(outDir, `${name}.webp`));
  await sharp(input)
    .resize(1600, 1000)
    .avif({ quality: 48 })
    .toFile(path.join(outDir, `${name}.avif`));
}

async function main() {
  await writeAsset('kron-access-command', {
    accent: '#38bdf8',
    kind: 'SECURITY',
    title: 'Access Command Center',
  });
  await writeAsset('kron-product-fallback', {
    accent: '#f59e0b',
    kind: 'PRODUCT',
    title: 'Product Security View',
  });
  await writeAsset('kron-resource-library', {
    accent: '#22c55e',
    kind: 'RESOURCES',
    title: 'Cybersecurity Resource Library',
  });
  await writeAsset('kron-blog-fallback', {
    accent: '#a78bfa',
    kind: 'INSIGHTS',
    title: 'Security Insight Desk',
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
