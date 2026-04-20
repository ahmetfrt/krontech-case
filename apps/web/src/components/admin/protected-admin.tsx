'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminToken } from '@/lib/admin/auth';

export function ProtectedAdmin({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getAdminToken();

    if (!token) {
      router.push('/admin/login');
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return <p>Yükleniyor...</p>;
  }

  return <>{children}</>;
}