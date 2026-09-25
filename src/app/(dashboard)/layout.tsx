import { ensureOpenLoginSession, requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/layout/app-header";
import { AppSidebar } from "@/components/layout/app-sidebar";
import type { Notification } from "@/lib/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireProfile();
  await ensureOpenLoginSession(profile.id);
  const supabase = await createClient();
  const { data: notificationsData } = await supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(8);
  const notifications = (notificationsData ?? []) as Notification[];
  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r lg:block">
        <AppSidebar role={profile.role} />
      </aside>
      <div className="lg:pl-64">
        <AppHeader profile={profile} notifications={notifications} />
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
