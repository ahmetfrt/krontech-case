import ContactFormPage from '@/components/contact/page';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbJsonLd, buildMetadata, contactPageJsonLd } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return buildMetadata({
    title: locale === 'tr' ? 'İletişim' : 'Contact',
    description:
      locale === 'tr'
        ? 'Krontech ile iletişime geçin'
        : 'Get in touch with Krontech',
    canonicalPath: `/${locale}/contact`,
    alternatePaths: {
      tr: '/tr/contact',
      en: '/en/contact',
    },
  });
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <>
      <JsonLd data={contactPageJsonLd({ path: `/${locale}/contact`, locale })} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: locale === 'tr' ? 'Ana sayfa' : 'Home', path: `/${locale}` },
          {
            name: locale === 'tr' ? 'Iletisim' : 'Contact',
            path: `/${locale}/contact`,
          },
        ])}
      />
      <ContactFormPage params={Promise.resolve({ locale })} />
    </>
  );
}
