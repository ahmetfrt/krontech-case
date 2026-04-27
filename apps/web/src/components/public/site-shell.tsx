import Link from 'next/link';
import type { ReactNode } from 'react';
import { localizedHref, publicNavigation } from '@/lib/navigation';

type SiteShellProps = {
  children: ReactNode;
  locale: string;
};

const copy = {
  en: {
    contact: 'Contact',
    admin: 'Admin',
    language: 'TR',
    languageHref: '/tr',
    footer:
      'Privileged access, secure remote operations, and identity governance for enterprise teams.',
  },
  tr: {
    contact: 'Iletisim',
    admin: 'Yonetim',
    language: 'EN',
    languageHref: '/en',
    footer:
      'Kurumsal ekipler icin yetkili erisim, guvenli uzaktan operasyon ve kimlik yonetimi.',
  },
} as const;

function normalizeLocale(locale: string) {
  return locale === 'en' ? 'en' : 'tr';
}

export function SiteShell({ children, locale }: SiteShellProps) {
  const activeLocale = normalizeLocale(locale);
  const t = copy[activeLocale];

  return (
    <div className="flex min-h-screen flex-col bg-[#f5f7fa] text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            href={`/${activeLocale}`}
            className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.24em] text-slate-950"
            aria-label="Krontech home"
          >
            <span className="grid size-8 place-items-center rounded-md bg-[#d71920] text-xs font-black tracking-normal text-white">
              K
            </span>
            <span>Krontech</span>
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-slate-700 lg:flex">
            {publicNavigation.map((group) => (
              <Link
                key={group.href}
                href={localizedHref(activeLocale, group.href)}
                className="transition hover:text-[#d71920]"
              >
                {group.label[activeLocale]}
              </Link>
            ))}
            <Link
              href={`/${activeLocale}/contact`}
              className="transition hover:text-[#d71920]"
            >
              {t.contact}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href={t.languageHref}
              className="grid h-9 min-w-10 place-items-center rounded-md border border-slate-200 px-3 text-sm font-semibold text-slate-700 transition hover:border-[#d71920] hover:text-[#d71920]"
            >
              {t.language}
            </Link>
            <Link
              href="/admin"
              className="hidden rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#d71920] sm:inline-flex"
            >
              {t.admin}
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-7xl gap-3 overflow-x-auto px-4 pb-3 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 sm:px-6 lg:hidden lg:px-8">
          {publicNavigation.map((group) => (
            <Link
              key={group.href}
              href={localizedHref(activeLocale, group.href)}
              className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2"
            >
              {group.label[activeLocale]}
            </Link>
          ))}
          <Link
            href={`/${activeLocale}/contact`}
            className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2"
          >
            {t.contact}
          </Link>
        </nav>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-8 text-sm text-slate-600 sm:px-6 md:grid-cols-[1fr_auto] lg:px-8">
          <p>{t.footer}</p>
          <div className="flex flex-wrap gap-4 font-medium text-slate-800">
            {publicNavigation.map((group) => (
              <Link
                key={group.href}
                href={localizedHref(activeLocale, group.href)}
                className="hover:text-[#d71920]"
              >
                {group.label[activeLocale]}
              </Link>
            ))}
            <Link
              href={`/${activeLocale}/contact`}
              className="hover:text-[#d71920]"
            >
              {t.contact}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
