import { createFileRoute, redirect } from "@tanstack/react-router";
import { adminMe } from "@/lib/admin.functions";

// /admin entry: send signed-in admins to the dashboard, everyone else to sign-in.
export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Admin — Mbrojtja Digjitale" }, { name: "robots", content: "noindex" }] }),
  beforeLoad: async () => {
    const { user } = await adminMe();
    throw redirect({ to: user ? "/admin/dashboard" : "/admin/login" });
  },
});
