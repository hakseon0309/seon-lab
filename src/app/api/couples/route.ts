import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { apiError, apiErrors, parseJsonBody } from "@/lib/api-error";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("couple_code")
    .eq("id", user.id)
    .single();

  const { data: requests } = await supabase
    .from("couple_requests")
    .select("*")
    .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)
    .limit(1);

  const request = requests?.[0];

  if (!request) {
    return NextResponse.json({
      couple_code: profile?.couple_code ?? null,
      status: "none",
      request_id: null,
      partner_id: null,
      partner_name: null,
    });
  }

  const iAmRequester = request.requester_id === user.id;
  const partnerId = iAmRequester ? request.partner_id : request.requester_id;

  const { data: partnerProfile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("id", partnerId)
    .single();

  const status =
    request.status === "accepted"
      ? "accepted"
      : iAmRequester
        ? "pending_sent"
        : "pending_received";

  return NextResponse.json({
    couple_code: profile?.couple_code ?? null,
    status,
    request_id: request.id,
    partner_id: partnerId,
    partner_name: partnerProfile?.display_name ?? null,
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return apiErrors.unauthorized();

  const parsed = await parseJsonBody<{ couple_code?: unknown }>(req);
  if (!parsed.ok) return parsed.response;
  const { couple_code } = parsed.body;
  if (!couple_code || typeof couple_code !== "string" || !couple_code.trim()) {
    return apiErrors.badRequest("코드를 입력해주세요");
  }

  const { data: existing } = await supabase
    .from("couple_requests")
    .select("id")
    .or(`requester_id.eq.${user.id},partner_id.eq.${user.id}`)
    .limit(1);

  if (existing && existing.length > 0) {
    return apiErrors.badRequest("이미 연결 중인 상태입니다");
  }

  const { data: partnerProfile } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("couple_code", couple_code.trim().toLowerCase())
    .single();

  if (!partnerProfile) return apiErrors.notFound("존재하지 않는 코드입니다");

  if (partnerProfile.id === user.id) {
    return apiErrors.badRequest("본인과는 연결할 수 없습니다");
  }

  const { data: partnerExisting } = await supabase
    .from("couple_requests")
    .select("id")
    .or(`requester_id.eq.${partnerProfile.id},partner_id.eq.${partnerProfile.id}`)
    .limit(1);

  if (partnerExisting && partnerExisting.length > 0) {
    return apiErrors.badRequest("상대방이 이미 다른 연결 중입니다");
  }

  const { error } = await supabase
    .from("couple_requests")
    .insert({ requester_id: user.id, partner_id: partnerProfile.id });

  if (error) return apiError(500, error.message);

  return NextResponse.json({ success: true });
}
