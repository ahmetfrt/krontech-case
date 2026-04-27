import 'dotenv/config';
import {
  FieldType,
  FormType,
  Locale,
  PageType,
  Prisma,
  PrismaClient,
  PublishStatus,
  ResourceType,
  RoleName,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const publishedAt = new Date();

type SeedTranslation = {
  canonicalUrl?: string;
  locale: Locale;
  ogDescription?: string;
  ogTitle?: string;
  robotsFollow?: boolean;
  robotsIndex?: boolean;
  seoDescription?: string;
  seoTitle?: string;
  slug: string;
  structuredDataJson?: Prisma.InputJsonValue;
  summary?: string;
  title: string;
};

type SeedBlock = {
  configJson: Prisma.InputJsonValue;
  sortOrder: number;
  type: string;
};

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { name: RoleName.ADMIN },
    update: {},
    create: { name: RoleName.ADMIN },
  });

  const editorRole = await prisma.role.upsert({
    where: { name: RoleName.EDITOR },
    update: {},
    create: { name: RoleName.EDITOR },
  });

  const hashedPassword = await bcrypt.hash('Admin123!', 10);
  const editorPassword = await bcrypt.hash('Editor123!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@krontech.local' },
    update: {
      name: 'System Admin',
      passwordHash: hashedPassword,
      roleId: adminRole.id,
    },
    create: {
      name: 'System Admin',
      email: 'admin@krontech.local',
      passwordHash: hashedPassword,
      roleId: adminRole.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'editor@krontech.local' },
    update: {
      name: 'Content Editor',
      passwordHash: editorPassword,
      roleId: editorRole.id,
    },
    create: {
      name: 'Content Editor',
      email: 'editor@krontech.local',
      passwordHash: editorPassword,
      roleId: editorRole.id,
    },
  });

  await seedForms();
  await seedPages();
  await seedProducts();
  await seedBlogPosts();
  await seedResources();
  await seedRedirects();

  console.log('Seed completed successfully.');
}

async function seedForms() {
  await upsertForm({
    formType: FormType.CONTACT,
    name: 'Contact Form',
    successMessage: 'Thank you. Your message has been received.',
    fields: [
      ['firstName', 'First name', FieldType.TEXT, true, 0],
      ['lastName', 'Last name', FieldType.TEXT, true, 1],
      ['email', 'Email', FieldType.EMAIL, true, 2],
      ['company', 'Company', FieldType.TEXT, false, 3],
      ['phone', 'Phone', FieldType.PHONE, false, 4],
      ['message', 'Message', FieldType.TEXTAREA, true, 5],
      [
        'consent',
        'I consent to being contacted about my request.',
        FieldType.CHECKBOX,
        true,
        6,
      ],
    ],
  });

  await upsertForm({
    formType: FormType.DEMO_REQUEST,
    name: 'Demo Request Form',
    successMessage: 'Thank you. Our team will contact you to schedule a demo.',
    fields: [
      ['firstName', 'First name', FieldType.TEXT, true, 0],
      ['lastName', 'Last name', FieldType.TEXT, true, 1],
      ['email', 'Business email', FieldType.EMAIL, true, 2],
      ['company', 'Company', FieldType.TEXT, true, 3],
      ['phone', 'Phone', FieldType.PHONE, false, 4],
      ['product', 'Product interest', FieldType.SELECT, true, 5],
      ['message', 'Message', FieldType.TEXTAREA, false, 6],
      [
        'consent',
        'I consent to being contacted about my demo request.',
        FieldType.CHECKBOX,
        true,
        7,
      ],
    ],
    selectOptions: {
      product: [
        'Kron PAM',
        'Cloud PAM',
        'Password Vault',
        'Secure Remote Access',
        'Telemetry Pipeline',
        'Dynamic Data Masking',
        'AAA Server',
      ],
    },
  });
}

async function upsertForm(params: {
  fields: [string, string, FieldType, boolean, number][];
  formType: FormType;
  name: string;
  selectOptions?: Record<string, string[]>;
  successMessage: string;
}) {
  const existing = await prisma.formDefinition.findFirst({
    where: { formType: params.formType },
  });
  const form =
    existing ??
    (await prisma.formDefinition.create({
      data: {
        formType: params.formType,
        isActive: true,
        name: params.name,
        successMessage: params.successMessage,
      },
    }));

  await prisma.formDefinition.update({
    where: { id: form.id },
    data: {
      isActive: true,
      name: params.name,
      successMessage: params.successMessage,
    },
  });
  await prisma.formField.deleteMany({ where: { formDefinitionId: form.id } });
  await prisma.formField.createMany({
    data: params.fields.map(([name, label, fieldType, isRequired, sortOrder]) => ({
      fieldType,
      formDefinitionId: form.id,
      isRequired,
      label,
      name,
      optionsJson: params.selectOptions?.[name] ?? Prisma.JsonNull,
      sortOrder,
    })),
  });
}

async function seedPages() {
  await upsertPage({
    pageType: PageType.HOME,
    translations: [
      {
        locale: Locale.TR,
        title: 'Krontech ile guvenli erisim operasyonlari',
        slug: 'ana-sayfa',
        summary:
          'Yetkili erisim, guvenli uzaktan baglanti ve kimlik yonetimini tek platformda yonetin.',
        seoTitle: 'Krontech | Yetkili Erisim Guvenligi',
        seoDescription:
          'Krontech PAM, SRA ve IGA cozumleriyle kritik erisim yollarini koruyun.',
      },
      {
        locale: Locale.EN,
        title: 'Secure access operations with Krontech',
        slug: 'home-page',
        summary:
          'Manage privileged access, secure remote connectivity and identity governance from one platform.',
        seoTitle: 'Krontech | Privileged Access Security',
        seoDescription:
          'Protect critical access paths with Krontech PAM, SRA and IGA solutions.',
      },
    ],
    blocks: [
      {
        type: 'platform',
        sortOrder: 0,
        configJson: {
          label: 'Platform',
          title: 'Access security for critical teams',
          summary:
            'Centralize privileged accounts, session controls, approvals and audit evidence.',
        },
      },
      {
        type: 'outcomes',
        sortOrder: 1,
        configJson: {
          title: 'Operational outcomes',
          summary:
            'Reduce exposure, keep admins productive and give compliance teams searchable evidence.',
        },
      },
      {
        type: 'cms',
        sortOrder: 2,
        configJson: {
          title: 'CMS managed experience',
          summary:
            'Public pages, metadata, resources and forms are manageable from the admin panel.',
        },
      },
    ],
  });

  await upsertPage({
    pageType: PageType.STANDARD,
    translations: [
      {
        locale: Locale.TR,
        title: 'Yetkili Erisim Guvenligi',
        slug: 'solutions/privileged-access-security',
        summary:
          'Ayricalikli hesaplari, oturumlari ve onaylari risk bazli politikalarla yonetin.',
        seoTitle: 'Yetkili Erisim Guvenligi | Krontech',
      },
      {
        locale: Locale.EN,
        title: 'Privileged Access Security',
        slug: 'solutions/privileged-access-security',
        summary:
          'Govern privileged accounts, sessions and approvals with risk-aware policies.',
        seoTitle: 'Privileged Access Security | Krontech',
      },
    ],
    blocks: [
      {
        type: 'solution',
        sortOrder: 0,
        configJson: {
          title: 'Protect administrator paths',
          text: 'Discover, control and record privileged activity across hybrid environments.',
          items: [
            {
              title: 'Vaulting',
              text: 'Keep shared and privileged credentials under policy control.',
            },
            {
              title: 'Session governance',
              text: 'Record, monitor and terminate sensitive sessions when needed.',
            },
          ],
        },
      },
      {
        type: 'faq',
        sortOrder: 1,
        configJson: {
          title: 'Frequently asked questions',
          items: [
            {
              question: 'How does Kron reduce privileged access risk?',
              answer:
                'Kron combines credential vaulting, session control, approval workflows and audit evidence in one managed access security model.',
            },
            {
              question: 'Which cache layers are affected by publishing?',
              answer:
                'Publishing invalidates Redis content cache and calls Next.js revalidation for list, detail and CMS page routes.',
            },
          ],
        },
      },
    ],
  });

  await upsertPage({
    pageType: PageType.STANDARD,
    translations: [
      {
        locale: Locale.TR,
        title: 'Is Ortaklari',
        slug: 'partners',
        summary:
          'Krontech is ortaklari ile yerel uzmanlik ve kurumsal guvenlik deneyimi sunar.',
      },
      {
        locale: Locale.EN,
        title: 'Partners',
        slug: 'partners',
        summary:
          'Krontech partners deliver local expertise and enterprise security experience.',
      },
    ],
    blocks: [
      {
        type: 'partner-network',
        sortOrder: 0,
        configJson: {
          title: 'Partner-led delivery',
          text: 'Enable customers with consulting, deployment and managed service capabilities.',
          ctaLabel: 'Contact partner team',
          ctaHref: '/en/contact',
        },
      },
    ],
  });

  await upsertPage({
    pageType: PageType.STANDARD,
    translations: [
      {
        locale: Locale.TR,
        title: 'Hakkimizda',
        slug: 'about-us',
        summary:
          'Krontech kritik erisim guvenligi alaninda urun ve uzmanlik gelistirir.',
      },
      {
        locale: Locale.EN,
        title: 'About Us',
        slug: 'about-us',
        summary:
          'Krontech builds products and expertise for critical access security.',
      },
    ],
    blocks: [
      {
        type: 'company',
        sortOrder: 0,
        configJson: {
          title: 'Security software for demanding environments',
          text: 'The platform is designed for enterprises that need visibility, control and evidence.',
        },
      },
    ],
  });

  const standardPages = [
    {
      enSummary:
        'Deliver privileged access management as a managed service with repeatable controls and clear audit evidence.',
      enTitle: 'PAM as a Service',
      slug: 'pam-as-a-service',
      trSummary:
        'Ayricalikli erisim yonetimini tekrarlanabilir kontroller ve net denetim kanitiyla yonetilen servis olarak sunun.',
      trTitle: 'Servis Olarak PAM',
    },
    {
      enSummary:
        'Give operations teams controlled access to sensitive systems without exposing the network.',
      enTitle: 'Secure Remote Access',
      slug: 'secure-remote-access',
      trSummary:
        'Operasyon ekiplerine agi aciga cikarmadan hassas sistemlere kontrollu erisim verin.',
      trTitle: 'Guvenli Uzaktan Erisim',
    },
    {
      enSummary:
        'Detect, control and investigate risky privileged behavior before it becomes a business incident.',
      enTitle: 'Insider Threat Protection',
      slug: 'insider-threat-protection',
      trSummary:
        'Riskli ayricalikli davranislari is olayina donusmeden tespit edin, kontrol edin ve inceleyin.',
      trTitle: 'Ic Tehdit Korumasi',
    },
    {
      enSummary:
        'Apply least privilege policies to administrators, operators and machine identities.',
      enTitle: 'Zero Trust and Least Privilege',
      slug: 'zero-trust-and-least-privilege',
      trSummary:
        'Yoneticiler, operatorler ve makine kimlikleri icin least privilege politikalarini uygulayin.',
      trTitle: 'Zero Trust ve Least Privilege',
    },
    {
      enSummary:
        'Turn privileged access activity into searchable evidence for compliance and security reviews.',
      enTitle: 'Audit and Regulatory Compliance',
      slug: 'audit-and-regulatory-compliance',
      trSummary:
        'Ayricalikli erisim aktivitelerini uyumluluk ve guvenlik incelemeleri icin aranabilir kanita donusturun.',
      trTitle: 'Denetim ve Regulasyon Uyumlulugu',
    },
    {
      enSummary:
        'Protect distributed IoT and POS environments with centralized access and policy controls.',
      enTitle: 'Network Access Control for IoT/POS Systems',
      slug: 'network-access-control-for-iot-pos-systems',
      trSummary:
        'Dagitik IoT ve POS ortamlarini merkezi erisim ve politika kontrolleriyle koruyun.',
      trTitle: 'IoT/POS Icin Ag Erisim Kontrolu',
    },
    {
      enSummary:
        'Automate access provisioning workflows while keeping governance and auditability intact.',
      enTitle: 'Security Provisioning',
      slug: 'security-provisioning',
      trSummary:
        'Erisim provisioning akislarini yonetisim ve denetlenebilirligi koruyarak otomatiklestirin.',
      trTitle: 'Guvenlik Provisioning',
    },
    {
      enSummary:
        'Secure privileged operations in industrial and OT environments with controlled session access.',
      enTitle: 'OT Security with Kron PAM',
      slug: 'ot-security-with-kron-pam',
      trSummary:
        'Endustriyel ve OT ortamlarindaki ayricalikli operasyonlari kontrollu oturum erisimiyle guvenceye alin.',
      trTitle: 'Kron PAM ile OT Guvenligi',
    },
    {
      enSummary:
        'Move authentication, authorization and accounting workflows to Kron AAA with controlled migration steps.',
      enTitle: 'Replace Cisco CPAR with Kron AAA',
      slug: 'replace-cisco-cpar-with-kron-aaa',
      trSummary:
        'Kimlik dogrulama, yetkilendirme ve muhasebe akislarini kontrollu gecis adimlariyla Kron AAA uzerine tasiyin.',
      trTitle: 'Cisco CPAR Yerine Kron AAA',
    },
    {
      enSummary:
        'Retain and query telecom data at scale with operationally efficient storage patterns.',
      enTitle: 'Petabyte-Scale Telco Data Retention',
      slug: 'petabyte-scale-telco-data-retention',
      trSummary:
        'Telekom verisini operasyonel olarak verimli saklama desenleriyle petabyte olceginde saklayin ve sorgulayin.',
      trTitle: 'Petabyte Olceginde Telco Veri Saklama',
    },
    {
      enSummary:
        'Automate provisioning and activation flows for broadband access services.',
      enTitle: 'GPON Provisioning & Service Activation',
      slug: 'gpon-provisioning-service-activation',
      trSummary:
        'Genisbant erisim servisleri icin provisioning ve aktivasyon akislarini otomatiklestirin.',
      trTitle: 'GPON Provisioning ve Servis Aktivasyonu',
    },
    {
      enSummary:
        'Optimize log pipelines and reduce data volume without losing security context.',
      enTitle: 'Reduce Log Volume',
      slug: 'reduce-log-volume',
      trSummary:
        'Guvenlik baglamini kaybetmeden log pipeline yapilarini optimize edin ve veri hacmini azaltin.',
      trTitle: 'Log Hacmini Azaltma',
    },
    {
      enSummary:
        'Restore archived security and observability data into usable investigation workflows.',
      enTitle: 'Data Rehydration',
      slug: 'data-rehydration',
      trSummary:
        'Arsivlenmis guvenlik ve gozlemlenebilirlik verisini kullanilabilir inceleme akislarina geri kazandirin.',
      trTitle: 'Veri Rehidrasyonu',
    },
    {
      enSummary:
        'Manage security data collection, routing and retention with scalable operational controls.',
      enTitle: 'Security Data Management',
      slug: 'security-data-management',
      trSummary:
        'Guvenlik verisi toplama, yonlendirme ve saklama sureclerini olceklenebilir operasyonel kontrollerle yonetin.',
      trTitle: 'Guvenlik Verisi Yonetimi',
    },
  ] as const;

  for (const page of standardPages) {
    await upsertPage({
      pageType: PageType.STANDARD,
      translations: [
        {
          locale: Locale.TR,
          title: page.trTitle,
          slug: `solutions/${page.slug}`,
          summary: page.trSummary,
        },
        {
          locale: Locale.EN,
          title: page.enTitle,
          slug: `solutions/${page.slug}`,
          summary: page.enSummary,
        },
      ],
      blocks: [
        standardContentBlock(page.enTitle, page.enSummary, {
          trSummary: page.trSummary,
          trTitle: page.trTitle,
        }),
      ],
    });
  }

  const resourcePages = [
    {
      enSummary: 'Explore product datasheets and solution briefs.',
      enTitle: 'Datasheets',
      slug: 'datasheets',
      trSummary: 'Urun datasheetlerini ve cozum ozetlerini inceleyin.',
      trTitle: 'Datasheetler',
    },
    {
      enSummary:
        'Review examples of successful privileged access and security projects.',
      enTitle: 'Case Studies',
      slug: 'case-studies',
      trSummary:
        'Basarili ayricalikli erisim ve guvenlik projelerinden ornekleri inceleyin.',
      trTitle: 'Basari Hikayeleri',
    },
    {
      enSummary: 'Listen to expert conversations about access security.',
      enTitle: 'Podcast',
      slug: 'podcast',
      trSummary: 'Erisim guvenligi hakkinda uzman sohbetlerini dinleyin.',
      trTitle: 'Podcast',
    },
  ] as const;

  for (const page of resourcePages) {
    await upsertPage({
      pageType: PageType.STANDARD,
      translations: [
        {
          locale: Locale.TR,
          title: page.trTitle,
          slug: `resources/${page.slug}`,
          summary: page.trSummary,
        },
        {
          locale: Locale.EN,
          title: page.enTitle,
          slug: `resources/${page.slug}`,
          summary: page.enSummary,
        },
      ],
      blocks: [
        standardContentBlock(page.enTitle, page.enSummary, {
          trSummary: page.trSummary,
          trTitle: page.trTitle,
        }),
      ],
    });
  }

  const aboutPages = [
    {
      enSummary: 'Meet the leadership team behind Kron technology.',
      enTitle: 'Management',
      slug: 'management',
      trSummary: 'Kron teknolojisinin arkasindaki liderlik ekibini taniyin.',
      trTitle: 'Yonetim',
    },
    {
      enSummary: 'Review the governance team setting long-term strategy.',
      enTitle: 'Board of Directors',
      slug: 'board-of-directors',
      trSummary: 'Uzun vadeli stratejiyi belirleyen yonetim kurulunu inceleyin.',
      trTitle: 'Yonetim Kurulu',
    },
    {
      enSummary: 'Join teams building critical access security products.',
      enTitle: 'Careers',
      slug: 'careers',
      trSummary: 'Kritik erisim guvenligi urunleri gelistiren ekiplere katilin.',
      trTitle: 'Kariyer',
    },
    {
      enSummary: 'Follow Kron news, releases and company updates.',
      enTitle: 'Newsroom',
      slug: 'newsroom',
      trSummary: 'Kron haberlerini, duyurularini ve sirket guncellemelerini takip edin.',
      trTitle: 'Haberler',
    },
    {
      enSummary: 'Read the latest public announcements.',
      enTitle: 'Announcements',
      slug: 'announcements',
      trSummary: 'En son kamuya acik duyurulari okuyun.',
      trTitle: 'Duyurular',
    },
    {
      enSummary: 'Access investor-facing information and company context.',
      enTitle: 'Investor Relations',
      slug: 'investor-relations',
      trSummary: 'Yatirimcilara yonelik bilgilere ve sirket baglamina erisin.',
      trTitle: 'Yatirimci Iliskileri',
    },
    {
      enSummary: 'Review Kron brand and logo guidance.',
      enTitle: 'Logo Guidelines',
      slug: 'logo-guidelines',
      trSummary: 'Kron marka ve logo kullanim rehberini inceleyin.',
      trTitle: 'Logo Rehberi',
    },
  ] as const;

  for (const page of aboutPages) {
    await upsertPage({
      pageType: PageType.STANDARD,
      translations: [
        {
          locale: Locale.TR,
          title: page.trTitle,
          slug: `about-us/${page.slug}`,
          summary: page.trSummary,
        },
        {
          locale: Locale.EN,
          title: page.enTitle,
          slug: `about-us/${page.slug}`,
          summary: page.enSummary,
        },
      ],
      blocks: [
        standardContentBlock(page.enTitle, page.enSummary, {
          trSummary: page.trSummary,
          trTitle: page.trTitle,
        }),
      ],
    });
  }
}

async function upsertPage(params: {
  blocks: SeedBlock[];
  pageType: PageType;
  translations: SeedTranslation[];
}) {
  const existing = await prisma.page.findFirst({
    where: slugLookup(params.translations),
  });
  const page =
    existing ??
    (await prisma.page.create({
      data: {
        pageType: params.pageType,
        publishedAt,
        status: PublishStatus.PUBLISHED,
      },
    }));

  await prisma.pageTranslation.deleteMany({
    where: translationSlugWhere(params.translations),
  });
  await prisma.pageBlock.deleteMany({ where: { pageId: page.id } });
  await prisma.page.update({
    where: { id: page.id },
    data: {
      pageType: params.pageType,
      publishedAt,
      scheduledAt: null,
      status: PublishStatus.PUBLISHED,
      translations: {
        create: params.translations.map(translationPayload),
      },
      blocks: {
        create: params.blocks,
      },
    },
  });
}

function standardContentBlock(
  title: string,
  summary: string,
  localized?: { trSummary: string; trTitle: string },
): SeedBlock {
  return {
    type: 'content',
    sortOrder: 0,
    configJson: {
      title,
      text: summary,
      ...(localized
        ? {
            trText: localized.trSummary,
            trTitle: localized.trTitle,
          }
        : {}),
      items: [
        {
          title: 'Managed in CMS',
          trTitle: 'CMS ile yonetilir',
          text: 'This page is seeded as CMS content and can be edited, scheduled, previewed and restored from the admin panel.',
          trText:
            'Bu sayfa CMS icerigi olarak seed edilir; admin panelinden duzenlenebilir, zamanlanabilir, onizlenebilir ve geri yuklenebilir.',
        },
        {
          title: 'SEO and GEO ready',
          trTitle: 'SEO ve GEO hazir',
          text: 'Metadata, canonical fields, robots settings and structured content can be maintained per language.',
          trText:
            'Metadata, canonical alanlar, robots ayarlari ve yapilandirilmis icerik dil bazinda yonetilebilir.',
        },
      ],
    },
  };
}

function productSchema(
  name: string,
  description: string,
  slug: string,
): Prisma.InputJsonValue {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    url: `https://krontech.com/products/${slug}`,
    brand: {
      '@type': 'Brand',
      name: 'Krontech',
    },
  };
}

async function seedProducts() {
  const products = [
    {
      productCode: 'kron-pam',
      title: 'Kron PAM',
      enSummary:
        'Protect privileged accounts, credentials and sessions with a centrally managed access security platform.',
      trSummary:
        'Ayricalikli hesaplari, kimlik bilgilerini ve oturumlari merkezi yonetilen erisim guvenligiyle koruyun.',
    },
    {
      productCode: 'cloud-pam',
      title: 'Cloud PAM',
      enSummary:
        'Deliver privileged access management from a SaaS-ready model for zero-trust access programs.',
      trSummary:
        'Zero trust erisim programlari icin ayricalikli erisim yonetimini SaaS hazir bir modelle sunun.',
    },
    {
      productCode: 'password-vault',
      title: 'Password Vault',
      enSummary:
        'Prevent sharing of privileged passwords with encrypted vaulting and controlled checkout workflows.',
      trSummary:
        'Ayricalikli parolalarin paylasilmasini sifreli kasa ve kontrollu teslim akislariyla onleyin.',
    },
    {
      productCode: 'privileged-session-manager',
      title: 'Privileged Session Manager',
      enSummary:
        'Monitor, record and control privileged sessions across critical infrastructure.',
      trSummary:
        'Kritik altyapilardaki ayricalikli oturumlari izleyin, kaydedin ve kontrol edin.',
    },
    {
      productCode: 'database-access-manager',
      title: 'Database Access Manager',
      enSummary:
        'Control database administrator access and produce detailed evidence for sensitive data activity.',
      trSummary:
        'Veritabani yoneticisi erisimini kontrol edin ve hassas veri aktiviteleri icin detayli kanit uretin.',
    },
    {
      productCode: 'privileged-task-automation',
      title: 'Privileged Task Automation',
      enSummary:
        'Automate privileged operational tasks while preserving policy control and auditability.',
      trSummary:
        'Ayricalikli operasyonel gorevleri politika kontrolu ve denetlenebilirlikten odun vermeden otomatiklestirin.',
    },
    {
      productCode: 'endpoint-privilege-management',
      title: 'Endpoint Privilege Management',
      enSummary:
        'Authorize applications and commands on endpoints with least privilege controls.',
      trSummary:
        'Endpoint uzerindeki uygulama ve komutlari least privilege kontrolleriyle yetkilendirin.',
    },
    {
      productCode: 'user-behavior-analytics',
      title: 'User Behavior Analytics',
      enSummary:
        'Detect risky internal activity with behavioral analytics and access context.',
      trSummary:
        'Riskli ic aktiviteleri davranis analitigi ve erisim baglami ile tespit edin.',
    },
    {
      productCode: 'multi-factor-authentication',
      title: 'Multi-Factor Authentication',
      enSummary:
        'Strengthen access flows with OTP, policy, location and time-based authentication controls.',
      trSummary:
        'OTP, politika, konum ve zaman tabanli kimlik dogrulama kontrolleriyle erisim akisini guclendirin.',
    },
    {
      productCode: 'unified-access-manager',
      title: 'Unified Access Manager',
      enSummary:
        'Use integrated TACACS+ and RADIUS services for network infrastructure access governance.',
      trSummary:
        'Ag altyapisi erisim yonetimi icin entegre TACACS+ ve RADIUS servislerini kullanin.',
    },
    {
      productCode: 'aaa-server',
      title: 'AAA Server',
      enSummary:
        'Manage authentication, authorization and accounting workflows for telecom-grade environments.',
      trSummary:
        'Telekom olcegindeki ortamlarda kimlik dogrulama, yetkilendirme ve muhasebe akisini yonetin.',
    },
    {
      productCode: 'telemetry-pipeline',
      title: 'Telemetry Pipeline',
      enSummary:
        'Process, route and store observability and security data streams with scalable pipeline controls.',
      trSummary:
        'Gozlemlenebilirlik ve guvenlik veri akisini olceklenebilir pipeline kontrolleriyle isleyin, yonlendirin ve saklayin.',
    },
    {
      productCode: 'dynamic-data-masking',
      title: 'Dynamic Data Masking',
      enSummary:
        'Mask sensitive data in database workflows to reduce exposure for privileged users.',
      trSummary:
        'Ayricalikli kullanicilarin maruziyetini azaltmak icin veritabani akislari icindeki hassas veriyi maskeleyin.',
    },
    {
      productCode: 'ipdr-logging',
      title: 'IPDR Logging',
      enSummary:
        'Collect and retain broadband subscriber network activity with a purpose-built logging platform.',
      trSummary:
        'Genisbant abone ag aktivitelerini amaca ozel loglama platformuyla toplayin ve saklayin.',
    },
    {
      productCode: 'quality-assurance',
      title: 'Quality Assurance',
      enSummary:
        'Increase service quality with distributed probing and fast detection of service interruptions.',
      trSummary:
        'Dagitik prob mimarisi ve hizli kesinti tespitiyle servis kalitesini artirin.',
    },
  ] as const;

  for (const product of products) {
    await upsertProduct({
      productCode: product.productCode,
      translations: [
        {
          locale: Locale.TR,
          title: product.title,
          slug: product.productCode,
          summary: product.trSummary,
          seoTitle: `${product.title} | Krontech`,
          structuredDataJson: productSchema(
            product.title,
            product.trSummary,
            product.productCode,
          ),
        },
        {
          locale: Locale.EN,
          title: product.title,
          slug: product.productCode,
          summary: product.enSummary,
          seoTitle: `${product.title} | Krontech`,
          structuredDataJson: productSchema(
            product.title,
            product.enSummary,
            product.productCode,
          ),
        },
      ],
    });
  }
}

async function upsertProduct(params: {
  productCode: string;
  translations: SeedTranslation[];
}) {
  const product = await prisma.product.upsert({
    where: { productCode: params.productCode },
    update: {
      publishedAt,
      scheduledAt: null,
      status: PublishStatus.PUBLISHED,
    },
    create: {
      productCode: params.productCode,
      publishedAt,
      status: PublishStatus.PUBLISHED,
    },
  });

  await prisma.productTranslation.deleteMany({
    where: translationSlugWhere(params.translations),
  });
  await prisma.productTranslation.createMany({
    data: params.translations.map((translation) => ({
      ...productTranslationPayload(translation),
      productId: product.id,
    })),
  });
}

async function seedBlogPosts() {
  await upsertBlogPost({
    authorName: 'Krontech Team',
    translations: [
      {
        locale: Locale.TR,
        title: 'Yetkili erisim riskini azaltmanin uc yolu',
        slug: 'yetkili-erisim-riskini-azaltmanin-uc-yolu',
        summary:
          'Kritik hesaplari korumak icin kasa, oturum ve onay akislari birlikte calismali.',
      },
      {
        locale: Locale.EN,
        title: 'Three ways to reduce privileged access risk',
        slug: 'three-ways-to-reduce-privileged-access-risk',
        summary:
          'Vaulting, session controls and approvals should work together to protect critical accounts.',
      },
    ],
  });

  await upsertBlogPost({
    authorName: 'Krontech Team',
    translations: [
      {
        locale: Locale.TR,
        title: 'Guvenli uzaktan erisimde denetlenebilirlik',
        slug: 'guvenli-uzaktan-erisimde-denetlenebilirlik',
        summary:
          'Uzaktan operasyonlar icin kayit, politika ve kanit uretimi birlikte tasarlanmalidir.',
      },
      {
        locale: Locale.EN,
        title: 'Auditability in secure remote access',
        slug: 'auditability-in-secure-remote-access',
        summary:
          'Recording, policy and evidence should be designed together for remote operations.',
      },
    ],
  });
}

async function upsertBlogPost(params: {
  authorName: string;
  translations: SeedTranslation[];
}) {
  const existing = await prisma.blogPost.findFirst({
    where: slugLookup(params.translations),
  });
  const post =
    existing ??
    (await prisma.blogPost.create({
      data: {
        authorName: params.authorName,
        publishedAt,
        status: PublishStatus.PUBLISHED,
      },
    }));

  await prisma.blogPostTranslation.deleteMany({
    where: translationSlugWhere(params.translations),
  });
  await prisma.blogPost.update({
    where: { id: post.id },
    data: {
      authorName: params.authorName,
      publishedAt,
      scheduledAt: null,
      status: PublishStatus.PUBLISHED,
      translations: {
        create: params.translations.map((translation) => ({
          ...blogTranslationPayload(translation),
          content:
            translation.summary ??
            'Krontech content is managed from the CMS and rendered by the public site.',
          excerpt: translation.summary,
        })),
      },
    },
  });
}

async function seedResources() {
  await upsertResource({
    resourceType: ResourceType.DATASHEET,
    externalUrl: 'https://krontech.com/',
    translations: [
      {
        locale: Locale.TR,
        title: 'Kron PAM datasheet',
        slug: 'kron-pam-datasheet',
        summary:
          'Kron PAM ozellikleri, kullanim senaryolari ve teknik yetenekleri.',
      },
      {
        locale: Locale.EN,
        title: 'Kron PAM datasheet',
        slug: 'kron-pam-datasheet',
        summary:
          'Kron PAM capabilities, use cases and technical functionality.',
      },
    ],
  });

  await upsertResource({
    resourceType: ResourceType.WHITEPAPER,
    externalUrl: 'https://krontech.com/',
    translations: [
      {
        locale: Locale.TR,
        title: 'Kritik erisim guvenligi rehberi',
        slug: 'kritik-erisim-guvenligi-rehberi',
        summary:
          'PAM, SRA ve IGA kontrollerini birlikte tasarlamak icin pratik rehber.',
      },
      {
        locale: Locale.EN,
        title: 'Critical access security guide',
        slug: 'critical-access-security-guide',
        summary:
          'A practical guide for designing PAM, SRA and IGA controls together.',
      },
    ],
  });
}

async function upsertResource(params: {
  externalUrl: string;
  resourceType: ResourceType;
  translations: SeedTranslation[];
}) {
  const existing = await prisma.resource.findFirst({
    where: slugLookup(params.translations),
  });
  const resource =
    existing ??
    (await prisma.resource.create({
      data: {
        externalUrl: params.externalUrl,
        publishedAt,
        resourceType: params.resourceType,
        status: PublishStatus.PUBLISHED,
      },
    }));

  await prisma.resourceTranslation.deleteMany({
    where: translationSlugWhere(params.translations),
  });
  await prisma.resource.update({
    where: { id: resource.id },
    data: {
      externalUrl: params.externalUrl,
      publishedAt,
      scheduledAt: null,
      status: PublishStatus.PUBLISHED,
      resourceType: params.resourceType,
      translations: {
        create: params.translations.map((translation) => ({
          ...translationPayload(translation),
        })),
      },
    },
  });
}

async function seedRedirects() {
  const rules = [
    ['/tr/urunler', '/tr/products', 301],
    ['/en/products.html', '/en/products', 301],
    ['/tr/kaynaklar', '/tr/resources', 301],
    ['/en/contact-us', '/en/contact', 301],
    ['/tr/demo-talep', '/tr/demo-request', 301],
    ['/en/request-demo', '/en/demo-request', 301],
    ['/en/privileged-access-management', '/en/products/kron-pam', 301],
    ['/tr/privileged-access-management', '/tr/products/kron-pam', 301],
    ['/en/datasheets', '/en/resources/datasheets', 301],
    ['/en/case-studies', '/en/resources/case-studies', 301],
    ['/tr/datasheets', '/tr/resources/datasheets', 301],
    ['/tr/case-studies', '/tr/resources/case-studies', 301],
  ] as const;

  for (const [sourcePath, targetPath, statusCode] of rules) {
    await prisma.redirectRule.upsert({
      where: { sourcePath },
      update: {
        isActive: true,
        statusCode,
        targetPath,
      },
      create: {
        isActive: true,
        sourcePath,
        statusCode,
        targetPath,
      },
    });
  }
}

function slugLookup(translations: SeedTranslation[]) {
  return {
    OR: translations.map((translation) => ({
      translations: {
        some: {
          slug: translation.slug,
        },
      },
    })),
  };
}

function translationSlugWhere(translations: SeedTranslation[]) {
  return {
    OR: translations.map((translation) => ({
      locale: translation.locale,
      slug: translation.slug,
    })),
  };
}

function translationPayload(translation: SeedTranslation) {
  return {
    canonicalUrl: translation.canonicalUrl,
    locale: translation.locale,
    ogDescription: translation.ogDescription,
    ogTitle: translation.ogTitle,
    robotsFollow: translation.robotsFollow ?? true,
    robotsIndex: translation.robotsIndex ?? true,
    seoDescription: translation.seoDescription ?? translation.summary,
    seoTitle: translation.seoTitle ?? translation.title,
    slug: translation.slug,
    structuredDataJson: translation.structuredDataJson,
    summary: translation.summary,
    title: translation.title,
  };
}

function productTranslationPayload(translation: SeedTranslation) {
  return {
    canonicalUrl: translation.canonicalUrl,
    locale: translation.locale,
    ogDescription: translation.ogDescription,
    ogTitle: translation.ogTitle,
    robotsFollow: translation.robotsFollow ?? true,
    robotsIndex: translation.robotsIndex ?? true,
    seoDescription: translation.seoDescription ?? translation.summary,
    seoTitle: translation.seoTitle ?? translation.title,
    slug: translation.slug,
    structuredDataJson: translation.structuredDataJson,
    title: translation.title,
    longDescription:
      translation.summary ??
      'Krontech product content is managed from the CMS.',
    shortDescription: translation.summary,
  };
}

function blogTranslationPayload(translation: SeedTranslation) {
  return {
    canonicalUrl: translation.canonicalUrl,
    locale: translation.locale,
    ogDescription: translation.ogDescription,
    ogTitle: translation.ogTitle,
    robotsFollow: translation.robotsFollow ?? true,
    robotsIndex: translation.robotsIndex ?? true,
    seoDescription: translation.seoDescription ?? translation.summary,
    seoTitle: translation.seoTitle ?? translation.title,
    slug: translation.slug,
    structuredDataJson: translation.structuredDataJson,
    title: translation.title,
  };
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
