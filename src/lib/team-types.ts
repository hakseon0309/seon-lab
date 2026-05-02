import { CalendarEvent, UserProfile } from "@/lib/types";

export interface MemberWithEvents {
  profile: UserProfile;
  joinedAt: string | null;
  shareSchedule: boolean;
  events: CalendarEvent[];
}

export interface TeamMemberItem {
  profile: UserProfile;
  joinedAt: string | null;
  shareSchedule: boolean;
}
