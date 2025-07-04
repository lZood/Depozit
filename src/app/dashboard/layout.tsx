import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayoutClient from "@/components/dashboard-layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // Default to 'employee' if profile doesn't exist for any reason
  const userRole = profile?.role || 'employee';

  return (
    <DashboardLayoutClient userRole={userRole as 'admin' | 'employee'}>
      {children}
    </DashboardLayoutClient>
  );
}
