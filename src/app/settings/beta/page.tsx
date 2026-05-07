import { createClient } from "@/lib/supabase/server";
import { accessCodePath, hasAppAccess } from "@/lib/access-gate";
import { CoupleStatus } from "@/lib/types";
import Nav from "@/components/nav";
import PageHeader from "@/components/page-header";
import CoupleSettingsPanel from "@/components/couple-settings-panel";
import RouteTransitionDone from "@/components/route-transition-done";
import BackButton from "@/components/back-button";
import { redirect } from "next/navigation";

export default async function BetaSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: requests }] = await Promise.all([
    supabase
      .from("user_profiles")
      .select("couple_code, access_granted_at")
      .eq("id", user.id)
      .single(),
    supabase
      .from("couple_requests")
      .select("id, requester_id, partner_id, status, created_at")
      .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)
      .limit(1),
  ]);

  if (!hasAppAccess(profile)) {
    redirect(accessCodePath("/settings/beta"));
  }

  const request = requests?.[0];
  let coupleStatus: CoupleStatus;

  if (!request) {
    coupleStatus = { couple_code: profile?.couple_code ?? "", status: "none", request_id: null, partner_id: null, partner_name: null };
  } else {
    const iAmRequester = request.requester_id === user.id;
    const partnerId = iAmRequester ? request.partner_id : request.requester_id;
    const { data: partnerProfile } = await supabase.from("user_profiles").select("display_name").eq("id", partnerId).single();
    const status = request.status === "accepted" ? "accepted" : iAmRequester ? "pending_sent" : "pending_received";
    coupleStatus = { couple_code: profile?.couple_code ?? "", status, request_id: request.id, partner_id: partnerId, partner_name: partnerProfile?.display_name ?? null };
  }

  return (
    <>
      <RouteTransitionDone />
      <Nav />
      <PageHeader maxWidth="max-w-lg">
        <div className="flex items-center gap-3">
          <BackButton href="/settings" label="설정으로" />
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            실험적 기능 사용해보기
          </h1>
        </div>
      </PageHeader>
      <main className="mx-auto w-full max-w-lg pb-tabbar lg:pb-8">
        <div className="px-4 lg:px-0">
          <CoupleSettingsPanel initialCoupleStatus={coupleStatus} />
        </div>
      </main>
    </>
  );
}
