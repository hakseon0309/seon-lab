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
