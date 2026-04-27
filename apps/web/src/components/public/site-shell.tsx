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
    demo: 'Request Demo',
    admin: 'Admin',
    language: 'TR',
    languageHref: '/tr',
    footer:
      'Privileged access, secure remote operations, and identity governance for enterprise teams.',
  },
  tr: {
    contact: 'Iletisim',
    demo: 'Demo Talep',
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
              <div key={group.href} className="group relative">
                <Link
                  href={localizedHref(activeLocale, group.href)}
                  className="inline-flex h-16 items-center transition hover:text-[#d71920]"
                >
                  {group.label[activeLocale]}
                </Link>
                <div className="invisible absolute left-1/2 top-full z-50 w-[720px] max-w-[calc(100vw-48px)] -translate-x-1/2 border border-slate-200 bg-white p-5 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                  <div className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-red-600">
                    {group.label[activeLocale]}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((item, itemIndex) => (
                      <Link
                        key={`${item.href}-${itemIndex}`}
                        href={localizedHref(activeLocale, item.href)}
                        target={item.external ? '_blank' : undefined}
                        rel={item.external ? 'noreferrer' : undefined}
                        className="rounded-md px-3 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 hover:text-[#d71920]"
                      >
                        {item.label[activeLocale]}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
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
              href={`/${activeLocale}/demo-request`}
              className="hidden rounded-md border border-[#d71920] px-4 py-2 text-sm font-semibold text-[#d71920] transition hover:bg-[#d71920] hover:text-white md:inline-flex"
            >
              {t.demo}
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
            href={`/${activeLocale}/demo-request`}
            className="shrink-0 rounded-md border border-slate-200 bg-white px-3 py-2"
          >
            {t.demo}
          </Link>
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
              href={`/${activeLocale}/demo-request`}
              className="hover:text-[#d71920]"
            >
              {t.demo}
            </Link>
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
