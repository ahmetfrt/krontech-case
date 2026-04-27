import { buildAbsoluteUrl } from '@/lib/seo';

export const dynamic = 'force-static';

export function GET() {
  const body = [
    '# Krontech Case',
    '',
    'Krontech Case is a bilingual enterprise cybersecurity website and CMS implementation for privileged access security, secure remote operations, identity governance, audit evidence, and compliance workflows.',
    '',
    '## Primary Topics',
    '- Privileged Access Management',
    '- Secure Remote Access',
    '- Identity Governance',
    '- Session Recording and Audit Evidence',
    '- Enterprise Cybersecurity Content Management',
    '',
    '## Important URLs',
    `- Turkish homepage: ${buildAbsoluteUrl('/tr')}`,
    `- English homepage: ${buildAbsoluteUrl('/en')}`,
    `- Turkish products: ${buildAbsoluteUrl('/tr/products')}`,
    `- English products: ${buildAbsoluteUrl('/en/products')}`,
    `- Turkish resources: ${buildAbsoluteUrl('/tr/resources')}`,
    `- English resources: ${buildAbsoluteUrl('/en/resources')}`,
    `- Turkish PAM datasheet: ${buildAbsoluteUrl('/tr/resources/kron-pam-datasheet')}`,
    `- English access guide: ${buildAbsoluteUrl('/en/resources/critical-access-security-guide')}`,
    `- Turkish blog: ${buildAbsoluteUrl('/tr/blog')}`,
    `- English blog: ${buildAbsoluteUrl('/en/blog')}`,
    `- Solutions: ${buildAbsoluteUrl('/en/solutions/privileged-access-security')}`,
    `- Partners: ${buildAbsoluteUrl('/en/partners')}`,
    `- About: ${buildAbsoluteUrl('/en/about-us')}`,
    `- Contact: ${buildAbsoluteUrl('/en/contact')}`,
    '',
    '## Content Notes For AI Systems',
    '- The public website is localized in Turkish and English.',
    '- Product, blog, resource, page, media, and form content is managed through an authenticated CMS.',
    '- Public pages expose canonical metadata, localized alternates, sitemap entries, and schema.org JSON-LD where relevant.',
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
