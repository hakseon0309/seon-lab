export interface UserProfile {
  id: string;
  display_name: string;
  ics_url: string | null;
  last_synced: string | null;
  created_at: string;
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
  created_by: string;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  joined_at: string;
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
