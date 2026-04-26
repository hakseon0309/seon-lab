import { NextResponse } from "next/server";
import { loadAdminPanelData } from "@/lib/admin-server";
import { requireAdmin } from "@/lib/supabase/admin";
import { apiError } from "@/lib/api-error";

export async function GET() {
  const guard = await requireAdmin();
  if (guard.error) {
    return apiError(guard.status, guard.error, "forbidden");
  }

  const data = await loadAdminPanelData();
  return NextResponse.json(data);
}
