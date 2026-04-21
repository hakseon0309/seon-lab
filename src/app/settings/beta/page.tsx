import { createClient } from "@/lib/supabase/server";
import { CoupleStatus } from "@/lib/types";
import Nav from "@/components/nav";
import PageHeader from "@/components/page-header";
import CoupleSettingsPanel from "@/components/couple-settings-panel";
import RouteTransitionDone from "@/components/route-transition-done";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function BetaSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, { data: requests }] = await Promise.all([
    supabase.from("user_profiles").select("couple_code").eq("id", user.id).single(),
    supabase.from("couple_requests").select("*").or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`).limit(1),
  ]);

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
          <Link
            href="/settings"
            className="text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            ← 설정
          </Link>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            실험적 기능 사용해보기
          </h1>
        </div>
      </PageHeader>
      <main className="mx-auto w-full max-w-lg py-6 pb-24 lg:py-8 lg:pb-8">
        <div className="px-4 lg:px-0">
          <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
            아직 다듬는 중인 기능들을 먼저 써볼 수 있는 공간입니다.
          </p>
          <CoupleSettingsPanel initialCoupleStatus={coupleStatus} />
        </div>
      </main>
    </>
  );
}
