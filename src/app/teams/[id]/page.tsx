import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/nav";
import RouteTransitionDone from "@/components/route-transition-done";
import TeamView from "@/components/team-view";
import { loadTeamDetailData } from "@/lib/team-server";
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

  const { team, isFavorite, members, calendarWindow, holidays } =
    await loadTeamDetailData({
      supabase,
      teamId: id,
      userId: user.id,
    });

  if (!team) redirect("/teams");

  return (
    <>
      <RouteTransitionDone />
      <Nav />
      <TeamView
        team={team}
        initialMembers={members}
        currentUserId={user.id}
        initialIsFavorite={isFavorite}
        calendarWindow={calendarWindow}
        holidays={holidays}
      />
    </>
  );
}
