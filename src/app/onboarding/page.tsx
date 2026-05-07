import OnboardingForm from "@/components/onboarding-form";
import RouteTransitionDone from "@/components/route-transition-done";
import { accessCodePath, hasAppAccess } from "@/lib/access-gate";
import { CORP_TEAM_NAMES } from "@/lib/corp-teams";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

function emailLocalPart(email?: string | null) {
  if (!email) return "";
  return email.split("@")[0] || "";
}

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, ics_url, avatar_url, onboarding_completed_at, access_granted_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!hasAppAccess(profile)) {
    redirect(accessCodePath("/onboarding"));
  }

  if (profile?.onboarding_completed_at) {
    redirect("/dashboard");
  }

  return (
    <>
      <RouteTransitionDone />
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-6">
        <OnboardingForm
          initialDisplayName={emailLocalPart(user.email) || profile?.display_name || ""}
          initialIcsUrl={profile?.ics_url ?? ""}
          initialAvatarUrl={profile?.avatar_url ?? null}
          teamNames={[...CORP_TEAM_NAMES]}
        />
      </main>
    </>
  );
}
