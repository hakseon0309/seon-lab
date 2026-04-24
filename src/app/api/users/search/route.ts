import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";
import { apiError } from "@/lib/api-error";

export async function GET(request: Request) {
  const guard = await requireAdmin();
  if (guard.error) return apiError(guard.status, guard.error, "forbidden");

  const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
  if (q.length === 0) return NextResponse.json({ users: [] });

  const admin = createAdminClient();

  const { data: profileMatches } = await admin
    .from("user_profiles")
    .select("id, display_name, avatar_url")
    .ilike("display_name", `%${q}%`)
    .limit(20);

  const byName = new Map<
    string,
    { id: string; display_name: string; avatar_url: string | null; email: string | null }
  >();
  for (const p of (profileMatches ?? []) as {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  }[]) {
    byName.set(p.id, {
      id: p.id,
      display_name: p.display_name || "이름 없음",
      avatar_url: p.avatar_url ?? null,
      email: null,
    });
  }

  // Email search via auth.users (admin API).
  try {
    const { data: authList } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const lowered = q.toLowerCase();
    const emailHits = (authList?.users ?? []).filter((u) =>
      (u.email ?? "").toLowerCase().includes(lowered)
    );
    if (emailHits.length > 0) {
      const ids = emailHits.map((u) => u.id);
      const { data: profiles } = await admin
        .from("user_profiles")
        .select("id, display_name, avatar_url")
        .in("id", ids);
      const profileMap = new Map(
        ((profiles ?? []) as {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
        }[]).map((p) => [p.id, p])
      );
      for (const u of emailHits) {
        const p = profileMap.get(u.id);
        byName.set(u.id, {
          id: u.id,
          display_name: p?.display_name || "이름 없음",
          avatar_url: p?.avatar_url ?? null,
          email: u.email ?? null,
        });
      }
    }
    // Attach email to name-matched rows where possible.
    for (const row of byName.values()) {
      if (row.email) continue;
      const match = (authList?.users ?? []).find((u) => u.id === row.id);
      if (match) row.email = match.email ?? null;
    }
  } catch {
    // ignore email lookup errors
  }

  return NextResponse.json({ users: Array.from(byName.values()).slice(0, 30) });
}
