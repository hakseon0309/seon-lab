import Link from "next/link";
import TeamAvatarControl from "@/components/team-avatar-control";
import { Team } from "@/lib/types";

interface FavoriteTeamsProps {
  teams: Team[];
}

export default function FavoriteTeams({ teams }: FavoriteTeamsProps) {
  return (
    <section
      className="border-t px-4 py-5 lg:px-0"
      style={{ borderColor: "var(--border-light)" }}
    >
      <h2
        className="mb-3 text-base font-bold"
        style={{ color: "var(--text-primary)" }}
      >
        즐겨찾기한 팀
      </h2>

      {teams.length === 0 ? (
        <p
          className="py-6 text-center text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          즐겨찾기 한 팀이 없습니다.
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {teams.map((team) => (
            <Link
              key={team.id}
              href={`/teams/${team.id}`}
              className="interactive-press flex min-w-[9rem] items-center gap-2 rounded-lg border px-3 py-2"
              style={{
                borderColor: "var(--border-light)",
                backgroundColor: "var(--bg-card)",
              }}
            >
              <TeamAvatarControl team={team} sizeClass="h-9 w-9" />
              <span
                className="min-w-0 truncate text-sm font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {team.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
