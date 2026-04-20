import { ResourceListPage } from '@/components/admin/resource-list-page';

export default function AdminProductsPage() {
  return <ResourceListPage title="Products" endpoint="/products" />;
}