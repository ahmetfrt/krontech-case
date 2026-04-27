export type PublicNavigationItem = {
  href: string;
  label: Record<'en' | 'tr', string>;
};

export type PublicNavigationGroup = {
  href: string;
  items: PublicNavigationItem[];
  label: Record<'en' | 'tr', string>;
};

export const publicNavigation: PublicNavigationGroup[] = [
  {
    href: '/products',
    label: { en: 'Products', tr: 'Urunler' },
    items: [
      {
        href: '/products/kron-pam',
        label: { en: 'Kron PAM', tr: 'Kron PAM' },
      },
      {
        href: '/products/kron-sra',
        label: { en: 'Kron SRA', tr: 'Kron SRA' },
      },
      {
        href: '/products/kron-iga',
        label: { en: 'Kron IGA', tr: 'Kron IGA' },
      },
    ],
  },
  {
    href: '/solutions',
    label: { en: 'Solutions', tr: 'Cozumler' },
    items: [
      {
        href: '/solutions/privileged-access-security',
        label: {
          en: 'Privileged Access Security',
          tr: 'Yetkili Erisim Guvenligi',
        },
      },
      {
        href: '/solutions/secure-remote-access',
        label: {
          en: 'Secure Remote Access',
          tr: 'Guvenli Uzaktan Erisim',
        },
      },
    ],
  },
  {
    href: '/partners',
    label: { en: 'Partners', tr: 'Is Ortaklari' },
    items: [
      {
        href: '/partners',
        label: { en: 'Partner Network', tr: 'Is Ortaklari Agi' },
      },
    ],
  },
  {
    href: '/resources',
    label: { en: 'Resources', tr: 'Kaynaklar' },
    items: [
      { href: '/blog', label: { en: 'Blog', tr: 'Blog' } },
      {
        href: '/resources',
        label: { en: 'Resource Library', tr: 'Kaynak Kutuphanesi' },
      },
    ],
  },
  {
    href: '/about-us',
    label: { en: 'About Us', tr: 'Hakkimizda' },
    items: [
      {
        href: '/about-us',
        label: { en: 'Company', tr: 'Sirket' },
      },
      {
        href: '/about-us/careers',
        label: { en: 'Careers', tr: 'Kariyer' },
      },
    ],
  },
];

export function localizedHref(locale: 'en' | 'tr', href: string) {
  return `/${locale}${href}`;
}
