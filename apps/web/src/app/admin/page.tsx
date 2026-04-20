'use client';

import { ProtectedAdmin } from '@/components/admin/protected-admin';

export default function AdminDashboardPage() {
  return (
    <ProtectedAdmin>
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p>Admin paneline hoş geldiniz.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-xl border p-4">
            <h2 className="font-semibold">Content</h2>
            <p className="text-sm text-gray-600">
              Pages, products, blog, resources
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <h2 className="font-semibold">Forms</h2>
            <p className="text-sm text-gray-600">
              Form tanımları ve submission’lar
            </p>
          </div>
          <div className="rounded-xl border p-4">
            <h2 className="font-semibold">Media</h2>
            <p className="text-sm text-gray-600">
              MinIO tabanlı medya kayıtları
            </p>
          </div>
        </div>
      </div>
    </ProtectedAdmin>
  );
}