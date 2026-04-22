import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";
import PageHeader from "@/components/page-header";
import RouteTransitionDone from "@/components/route-transition-done";
import SettingsForm from "@/components/settings-form";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, ownedTeamsRes] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("display_name, ics_url, is_admin")
      .eq("id", user.id)
      .single(),
    supabase
      .from("teams")
      .select("id, name")
      .eq("created_by", user.id),
  ]);

  const profile = profileRes.data;
  const ownedTeams = (ownedTeamsRes.data ?? []) as { id: string; name: string }[];

  return (
    <>
      <RouteTransitionDone />
      <Nav />
      <PageHeader maxWidth="max-w-lg">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          설정
        </h1>
      </PageHeader>
      <main className="mx-auto w-full max-w-lg py-6 pb-24 lg:py-8 lg:pb-8">
        <SettingsForm
          initialDisplayName={profile?.display_name ?? ""}
          initialIcsUrl={profile?.ics_url ?? ""}
          isAdmin={!!profile?.is_admin}
          ownedTeams={ownedTeams}
        />
      </main>
    </>
  );
}
