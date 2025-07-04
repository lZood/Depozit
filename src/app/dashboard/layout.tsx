import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardLayoutClient from "@/components/dashboard-layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('[DashboardLayout] Rendering server component...');
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('[DashboardLayout] User from Supabase:', user ? `Logged in as ${user.email}`: 'No user found');
  if (!user) {
    console.log('[DashboardLayout] No user found, redirecting to /');
    redirect("/");
  }

  console.log(`[DashboardLayout] Fetching profile for user ID: ${user.id}`);
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  console.log('[DashboardLayout] Fetched profile:', profile);

  // Default to 'employee' if profile doesn't exist for any reason
  const userRole = profile?.role || 'employee';
  console.log('[DashboardLayout] User role determined:', userRole);

  return (
    <DashboardLayoutClient userRole={userRole as 'admin' | 'employee'}>
      {children}
    </DashboardLayoutClient>
  );
}
