import { NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { user_id, team_id } = await req.json();
  if (!user_id || !team_id) {
    return NextResponse.json({ error: "user_id and team_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("team_members")
    .insert({ user_id, team_id })
    .select()
    .single();

  if (error && !error.message.includes("duplicate")) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  revalidatePath("/admin");
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin();
  if ("error" in guard) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  const { user_id, team_id } = await req.json();
  if (!user_id || !team_id) {
    return NextResponse.json({ error: "user_id and team_id required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("team_members")
    .delete()
    .eq("user_id", user_id)
    .eq("team_id", team_id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePath("/admin");
  return NextResponse.json({ success: true });
}
