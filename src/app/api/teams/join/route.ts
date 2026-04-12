import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { invite_code } = await request.json();
  const code = (invite_code as string).trim().toUpperCase();

  // Find team by invite code
  const { data: team } = await supabase
    .from("teams")
    .select("id, name, invite_expires_at")
    .eq("invite_code", code)
    .single();

  if (!team) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  if (team.invite_expires_at && new Date(team.invite_expires_at) < new Date()) {
    return NextResponse.json({ error: "Invite code expired" }, { status: 410 });
  }

  // Check if already a member
  const { data: existing } = await supabase
    .from("team_members")
    .select("id")
    .eq("team_id", team.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ team_id: team.id, already_member: true });
  }

  const { error } = await supabase
    .from("team_members")
    .insert({ team_id: team.id, user_id: user.id });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ team_id: team.id, team_name: team.name });
}
