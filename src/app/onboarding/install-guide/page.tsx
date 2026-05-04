import OnboardingInstallGuide from "@/components/onboarding-install-guide";
import RouteTransitionDone from "@/components/route-transition-done";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingInstallGuidePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) {
    redirect("/onboarding");
  }

  return (
    <>
      <RouteTransitionDone />
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-6">
        <OnboardingInstallGuide />
      </main>
    </>
  );
}
