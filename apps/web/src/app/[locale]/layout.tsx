import { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { isSupportedLocale } from '@/lib/i18n';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  return <>{children}</>;
}