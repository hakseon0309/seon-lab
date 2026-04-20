import { createClient } from "@/lib/supabase/server";
import { Team, CalendarEvent, UserProfile } from "@/lib/types";
import Nav from "@/components/nav";
import RouteTransitionDone from "@/components/route-transition-done";
import TeamView, { MemberWithEvents } from "@/components/team-view";
import { redirect } from "next/navigation";

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: teamData } = await supabase
    .from("teams")
    .select("*")
    .eq("id", id)
    .single();

  if (!teamData) redirect("/teams");
  const team = teamData as Team;

  const { data: memberRows } = await supabase
    .from("team_members")
    .select("user_id")
    .eq("team_id", id);

  const userIds = (memberRows ?? []).map((m: { user_id: string }) => m.user_id);

  const members: MemberWithEvents[] = [];
  if (userIds.length > 0) {
    const [{ data: profiles }, { data: allEvents }] = await Promise.all([
      supabase.from("user_profiles").select("*").in("id", userIds),
      supabase
        .from("events")
        .select("*")
        .in("user_id", userIds)
        .order("start_at", { ascending: true }),
    ]);

    for (const userId of userIds) {
      const profile = (profiles as UserProfile[] | null)?.find((p) => p.id === userId);
      if (!profile) continue;
      members.push({
        profile,
        events: ((allEvents as CalendarEvent[] | null) ?? []).filter((e) => e.user_id === userId),
      });
    }
  }

  return (
    <>
      <RouteTransitionDone />
      <Nav />
      <TeamView team={team} initialMembers={members} currentUserId={user.id} />
    </>
  );
}
