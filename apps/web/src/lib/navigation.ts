export type PublicNavigationItem = {
  external?: boolean;
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
        label: {
          en: 'Privileged Access Management',
          tr: 'Yetkili Erisim Yonetimi',
        },
      },
      {
        href: '/products/kron-pam',
        label: { en: 'Kron PAM', tr: 'Kron PAM' },
      },
      {
        href: '/products/cloud-pam',
        label: { en: 'Cloud PAM', tr: 'Cloud PAM' },
      },
      {
        href: '/products/password-vault',
        label: { en: 'Password Vault', tr: 'Password Vault' },
      },
      {
        href: '/products/privileged-session-manager',
        label: {
          en: 'Privileged Session Manager',
          tr: 'Privileged Session Manager',
        },
      },
      {
        href: '/products/database-access-manager',
        label: { en: 'Database Access Manager', tr: 'Database Access Manager' },
      },
      {
        href: '/products/privileged-task-automation',
        label: {
          en: 'Privileged Task Automation',
          tr: 'Privileged Task Automation',
        },
      },
      {
        href: '/products/endpoint-privilege-management',
        label: {
          en: 'Endpoint Privilege Management',
          tr: 'Endpoint Privilege Management',
        },
      },
      {
        href: '/products/user-behavior-analytics',
        label: { en: 'User Behavior Analytics', tr: 'User Behavior Analytics' },
      },
      {
        href: '/products/multi-factor-authentication',
        label: {
          en: 'Multi-Factor Authentication',
          tr: 'Multi-Factor Authentication',
        },
      },
      {
        href: '/products/unified-access-manager',
        label: { en: 'Unified Access Manager', tr: 'Unified Access Manager' },
      },
      { href: '/products/aaa-server', label: { en: 'AAA Server', tr: 'AAA Server' } },
      {
        href: '/products/aaa-server',
        label: {
          en: 'AAA Server & Subscriber Management',
          tr: 'AAA Server ve Abone Yonetimi',
        },
      },
      {
        href: '/products/telemetry-pipeline',
        label: { en: 'Telemetry Pipeline', tr: 'Telemetry Pipeline' },
      },
      {
        href: '/products/dynamic-data-masking',
        label: { en: 'Dynamic Data Masking', tr: 'Dynamic Data Masking' },
      },
      {
        href: '/products/ipdr-logging',
        label: { en: 'IPDR Logging', tr: 'IPDR Logging' },
      },
      {
        href: '/products/quality-assurance',
        label: { en: 'Quality Assurance', tr: 'Quality Assurance' },
      },
    ],
  },
  {
    href: '/solutions/privileged-access-security',
    label: { en: 'Solutions', tr: 'Cozumler' },
    items: [
      {
        href: '/solutions/pam-as-a-service',
        label: { en: 'PAM as a Service', tr: 'Servis Olarak PAM' },
      },
      {
        href: '/solutions/secure-remote-access',
        label: { en: 'Secure Remote Access', tr: 'Guvenli Uzaktan Erisim' },
      },
      {
        href: '/solutions/insider-threat-protection',
        label: {
          en: 'Insider Threat Protection',
          tr: 'Ic Tehdit Korumasi',
        },
      },
      {
        href: '/solutions/zero-trust-and-least-privilege',
        label: {
          en: 'Zero Trust and Least Privilege',
          tr: 'Zero Trust ve Least Privilege',
        },
      },
      {
        href: '/solutions/audit-and-regulatory-compliance',
        label: {
          en: 'Audit and Regulatory Compliance',
          tr: 'Denetim ve Regulasyon Uyumlulugu',
        },
      },
      {
        href: '/solutions/network-access-control-for-iot-pos-systems',
        label: {
          en: 'Network Access Control for IoT/POS',
          tr: 'IoT/POS Icin Ag Erisim Kontrolu',
        },
      },
      {
        href: '/solutions/security-provisioning',
        label: { en: 'Security Provisioning', tr: 'Guvenlik Provisioning' },
      },
      {
        href: '/solutions/ot-security-with-kron-pam',
        label: { en: 'OT Security with Kron PAM', tr: 'Kron PAM ile OT Guvenligi' },
      },
      {
        href: '/solutions/replace-cisco-cpar-with-kron-aaa',
        label: {
          en: 'Replace Cisco CPAR with Kron AAA',
          tr: 'Cisco CPAR Yerine Kron AAA',
        },
      },
      {
        href: '/solutions/petabyte-scale-telco-data-retention',
        label: {
          en: 'Petabyte-Scale Telco Data Retention',
          tr: 'Petabyte Olceginde Telco Veri Saklama',
        },
      },
      {
        href: '/solutions/gpon-provisioning-service-activation',
        label: {
          en: 'GPON Provisioning & Service Activation',
          tr: 'GPON Provisioning ve Servis Aktivasyonu',
        },
      },
      {
        href: '/solutions/reduce-log-volume',
        label: { en: 'Reduce Log Volume', tr: 'Log Hacmini Azaltma' },
      },
      {
        href: '/solutions/data-rehydration',
        label: { en: 'Data Rehydration', tr: 'Veri Rehidrasyonu' },
      },
      {
        href: '/solutions/security-data-management',
        label: {
          en: 'Security Data Management',
          tr: 'Guvenlik Verisi Yonetimi',
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
        label: { en: 'Partner Community', tr: 'Is Ortaklari Toplulugu' },
      },
      {
        external: true,
        href: 'https://partner.krontech.com/',
        label: { en: 'Partner Portal', tr: 'Partner Portal' },
      },
      {
        external: true,
        href: 'https://partner.krontech.com/events',
        label: { en: 'Events', tr: 'Etkinlikler' },
      },
    ],
  },
  {
    href: '/resources',
    label: { en: 'Resources', tr: 'Kaynaklar' },
    items: [
      {
        href: '/resources/datasheets',
        label: { en: 'Datasheets', tr: 'Datasheetler' },
      },
      {
        href: '/resources/case-studies',
        label: { en: 'Case Studies', tr: 'Basari Hikayeleri' },
      },
      { href: '/blog', label: { en: 'Blog', tr: 'Blog' } },
      { href: '/resources/podcast', label: { en: 'Podcast', tr: 'Podcast' } },
    ],
  },
  {
    href: '/about-us',
    label: { en: 'About Us', tr: 'Hakkimizda' },
    items: [
      { href: '/about-us', label: { en: 'About Us', tr: 'Hakkimizda' } },
      { href: '/about-us/management', label: { en: 'Management', tr: 'Yonetim' } },
      {
        href: '/about-us/board-of-directors',
        label: { en: 'Board of Directors', tr: 'Yonetim Kurulu' },
      },
      { href: '/about-us/careers', label: { en: 'Careers', tr: 'Kariyer' } },
      { href: '/about-us/newsroom', label: { en: 'Newsroom', tr: 'Haberler' } },
      {
        href: '/about-us/announcements',
        label: { en: 'Announcements', tr: 'Duyurular' },
      },
      {
        href: '/about-us/investor-relations',
        label: { en: 'Investor Relations', tr: 'Yatirimci Iliskileri' },
      },
      {
        href: '/about-us/logo-guidelines',
        label: { en: 'Logo Guidelines', tr: 'Logo Rehberi' },
      },
    ],
  },
];

export function localizedHref(locale: 'en' | 'tr', href: string) {
  if (/^https?:\/\//.test(href)) {
    return href;
  }

  return `/${locale}${href}`;
}
