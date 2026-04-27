import ContactFormPage from '@/components/contact/page';
import { JsonLd } from '@/components/seo/json-ld';
import { breadcrumbJsonLd, buildMetadata, webPageJsonLd } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return buildMetadata({
    title: locale === 'tr' ? 'Demo Talep Et' : 'Request a Demo',
    description:
      locale === 'tr'
        ? 'Krontech cozumleri icin demo talep formu.'
        : 'Request a demo for Krontech solutions.',
    canonicalPath: `/${locale}/demo-request`,
    alternatePaths: {
      tr: '/tr/demo-request',
      en: '/en/demo-request',
    },
  });
}

export default async function DemoRequestPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const activeLocale = locale === 'en' ? 'en' : 'tr';
  const title = activeLocale === 'tr' ? 'Demo Talep Et' : 'Request a Demo';

  return (
    <>
      <JsonLd
        data={webPageJsonLd({
          name: title,
          description:
            activeLocale === 'tr'
              ? 'Krontech cozumleri icin demo talep formu.'
              : 'Request a demo for Krontech solutions.',
          path: `/${activeLocale}/demo-request`,
          locale: activeLocale,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          {
            name: activeLocale === 'tr' ? 'Ana sayfa' : 'Home',
            path: `/${activeLocale}`,
          },
          { name: title, path: `/${activeLocale}/demo-request` },
        ])}
      />
      <ContactFormPage
        formType="DEMO_REQUEST"
        params={Promise.resolve({ locale: activeLocale })}
        title={{ en: 'Request a Demo', tr: 'Demo Talep Et' }}
        intro={{
          en: 'Tell us which Krontech solution you want to evaluate and our team will schedule a guided demo.',
          tr: 'Degerlendirmek istediginiz Krontech cozumunu belirtin; ekibimiz size uygun bir demo planlasin.',
        }}
        submitLabel={{ en: 'Request demo', tr: 'Demo talep et' }}
      />
    </>
  );
}
