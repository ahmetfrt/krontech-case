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
      product: ['Kron PAM', 'Kron SRA', 'Kron IGA'],
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

async function seedProducts() {
  await upsertProduct({
    productCode: 'kron-pam',
    translations: [
      {
        locale: Locale.TR,
        title: 'Kron PAM',
        slug: 'kron-pam',
        summary:
          'Yetkili hesaplari, kasalari ve oturumlari tek merkezden yonetin.',
        seoTitle: 'Kron PAM | Yetkili Erisim Yonetimi',
      },
      {
        locale: Locale.EN,
        title: 'Kron PAM',
        slug: 'kron-pam',
        summary:
          'Manage privileged accounts, vaults and sessions from one control plane.',
        seoTitle: 'Kron PAM | Privileged Access Management',
      },
    ],
  });

  await upsertProduct({
    productCode: 'kron-sra',
    translations: [
      {
        locale: Locale.TR,
        title: 'Kron SRA',
        slug: 'kron-sra',
        summary:
          'Operasyon ekiplerine agi aciga cikarmadan guvenli uzaktan erisim verin.',
      },
      {
        locale: Locale.EN,
        title: 'Kron SRA',
        slug: 'kron-sra',
        summary:
          'Give operators secure remote access without exposing the network.',
      },
    ],
  });

  await upsertProduct({
    productCode: 'kron-iga',
    translations: [
      {
        locale: Locale.TR,
        title: 'Kron IGA',
        slug: 'kron-iga',
        summary:
          'Kimlik yasam dongusu, rol ve yetki sureclerini denetlenebilir hale getirin.',
      },
      {
        locale: Locale.EN,
        title: 'Kron IGA',
        slug: 'kron-iga',
        summary:
          'Make identity lifecycle, role and entitlement processes auditable.',
      },
    ],
  });
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
