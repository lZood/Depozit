import AdminDashboard from "@/components/admin-dashboard";
import EmployeeDashboard from "@/components/employee-dashboard";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
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
    .maybeSingle();

  // Default to 'employee' if profile is missing
  const userRole = profile?.role || 'employee';

  if (userRole === 'admin') {
    return <AdminDashboard />;
  } else {
    return <EmployeeDashboard />;
  }
}
