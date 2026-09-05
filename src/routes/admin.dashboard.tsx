import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "@/components/AdminShell";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Overview — Mbrojtja Digjitale" },
      { name: "description", content: "Administration overview for Mbrojtja Digjitale." },
      { property: "og:title", content: "Admin Overview — Mbrojtja Digjitale" },
      { property: "og:description", content: "Administration overview for Mbrojtja Digjitale." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  return (
    <AdminShell>
      <div className="space-y-4 p-4">
        <h1 className="text-xl font-semibold">Overview</h1>
        <Card className="p-4 text-sm text-muted-foreground">
          Welcome to the admin area.
        </Card>
      </div>
    </AdminShell>
  );
}
