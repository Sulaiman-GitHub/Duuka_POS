import { PageHeader } from "@/components/ui";
import { pageGuard } from "@/lib/guard";

export default async function DashboardPage() {
  await pageGuard("dashboard.view");
  return <PageHeader title="Dashboard" subtitle="Coming next" />;
}
