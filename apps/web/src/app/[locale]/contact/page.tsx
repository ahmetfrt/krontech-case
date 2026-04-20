import ContactFormPage from '@/components/contact/contact-form-page';
import { buildMetadata } from '@/lib/seo';

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
  return <ContactFormPage params={params} />;
}