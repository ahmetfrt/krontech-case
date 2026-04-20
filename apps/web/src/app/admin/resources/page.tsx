import { ResourceListPage } from '@/components/admin/resource-list-page';

export default function AdminResourcesPage() {
  return <ResourceListPage title="Resources" endpoint="/resources" />;
}