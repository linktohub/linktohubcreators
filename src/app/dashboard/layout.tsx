import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/dashboard/nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) redirect("/auth/login");
  const user = session.user;

  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!creator) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-[#050508] text-white flex">
      <DashboardNav creator={creator} />
      <main className="flex-1 ml-0 md:ml-60 min-h-screen">
        {children}
      </main>
    </div>
  );
}
