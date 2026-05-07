export interface UserProfile {
  id: string;
  display_name: string;
  ics_url: string | null;
  last_synced: string | null;
  is_admin?: boolean;
  avatar_url?: string | null;
  avatar_path?: string | null;
  onboarding_completed_at?: string | null;
  access_granted_at?: string | null;
  created_at: string;
}

export interface AdminUserRow {
  id: string;
  display_name: string;
  is_admin: boolean;
  teams: { id: string; name: string }[];
}

export interface AdminTeamRow {
  id: string;
  name: string;
  is_corp_team: boolean;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  uid: string;
  summary: string;
  start_at: string;
  end_at: string;
  location: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  invite_code: string;
  invite_expires_at: string | null;
  is_corp_team: boolean;
  image_url?: string | null;
  image_path?: string | null;
  created_by: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
  share_schedule?: boolean;
  user_profiles?: UserProfile;
}

export interface CafeteriaLocation {
  id: string;
  name: string;
  lunch_start: string;
  lunch_end: string;
  dinner_start: string;
  dinner_end: string;
  created_at: string;
}

export interface CoupleRequest {
  id: string;
  requester_id: string;
  partner_id: string;
  status: "pending" | "accepted";
  created_at: string;
}

export interface CoupleStatus {
  couple_code: string;
  status: "none" | "pending_sent" | "pending_received" | "accepted";
  request_id: string | null;
  partner_id: string | null;
  partner_name: string | null;
}

export interface CafeteriaMenuItem {
  id: string;
  location_id: string;
  date: string;
  meal_type: "lunch" | "dinner" | "salad";
  item_name: string;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
}

export type BoardKind = "post" | "chat";

export interface Board {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  write_role: "admin" | "leader" | "member";
  allow_comments: boolean;
  allow_anonymous: boolean;
  has_status: boolean;
  kind: BoardKind;
  team_scoped: boolean;
  sort_order: number;
  created_at: string;
}

export interface TeamLite {
  id: string;
  name: string;
}

export interface SwapEvent {
  summary: string;
  start_at: string;
  end_at: string;
}

export interface SwapPost extends BoardPost {
  team_id: string;
  team_name: string;
  team_image_url?: string | null;
  team_ids?: string[];
  team_names?: string[];
  team_image_urls?: (string | null)[];
  swap_date: string | null;
  swap_status: "open" | "done";
  completed_at: string | null;
  // swap_date 에 해당하는 작성자의 근무 일정. null 이면 휴무.
  swap_event: SwapEvent | null;
  swap_match_tone?: "neutral" | "match" | "mismatch";
}

export interface BoardMessage {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author_name?: string;
  author_avatar_url?: string | null;
}

export interface NotificationRow {
  id: string;
  kind: "message" | "comment";
  post_id: string;
  post_title: string;
  board_slug: string;
  board_kind: BoardKind;
  last_actor_name: string | null;
  last_actor_avatar_url?: string | null;
  preview: string | null;
  unread_count: number;
  read_at: string | null;
  updated_at: string;
}

export interface BoardPost {
  id: string;
  board_id: string;
  author_id: string | null;
  is_anonymous: boolean;
  title: string;
  body: string;
  is_pinned: boolean;
  status: "requested" | "accepted" | "resolved" | null;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar_url?: string | null;
}

export interface BoardComment {
  id: string;
  post_id: string;
  author_id: string | null;
  is_anonymous: boolean;
  body: string;
  created_at: string;
  updated_at: string;
  author_name?: string;
  author_avatar_url?: string | null;
}

export interface BoardManager {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
}
