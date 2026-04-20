'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { clearAdminToken } from '@/lib/admin/auth';

const links = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/pages', label: 'Pages' },
  { href: '/admin/products', label: 'Products' },
  { href: '/admin/blog', label: 'Blog' },
  { href: '/admin/resources', label: 'Resources' },
  { href: '/admin/forms', label: 'Forms' },
  { href: '/admin/media', label: 'Media' },
];

export function AdminNav() {
  const router = useRouter();
  const pathname = usePathname();

  function handleLogout() {
    clearAdminToken();
    router.push('/admin/login');
  }

  return (
    <aside className="w-64 border-r bg-gray-50 p-4 min-h-screen">
      <div className="mb-6 text-xl font-bold">Admin Panel</div>

      <nav className="space-y-2">
        {links.map((link) => {
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded px-3 py-2 ${
                active ? 'bg-black text-white' : 'hover:bg-gray-200'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="mt-6 rounded bg-red-600 px-3 py-2 text-white"
      >
        Logout
      </button>
    </aside>
  );
}