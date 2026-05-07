import AccessCodeForm from "@/components/access-code-form";
import RouteTransitionDone from "@/components/route-transition-done";
import {
  accessCodePath,
  emailIsAllowed,
  grantAppAccess,
  hasAppAccess,
  loadAccessProfile,
  routeAfterAccess,
  safeNextPath,
} from "@/lib/access-gate";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface AccessCodePageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function AccessCodePage({
  searchParams,
}: AccessCodePageProps) {
  const { next } = await searchParams;
  const safeNext = safeNextPath(next);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/?next=${encodeURIComponent(accessCodePath(safeNext))}`);
  }

  const profile = await loadAccessProfile(supabase, user.id);
  if (hasAppAccess(profile)) {
    redirect(routeAfterAccess(profile, safeNext));
  }

  const admin = createAdminClient();
  const allowed = await emailIsAllowed(admin, user.email);
  if (allowed) {
    const result = await grantAppAccess({
      admin,
      userId: user.id,
      email: user.email,
      source: "admin",
    });
    if (result.ok) {
      redirect(routeAfterAccess(profile, safeNext));
    }
  }

  return (
    <>
      <RouteTransitionDone />
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-4 py-6">
        <AccessCodeForm next={safeNext} />
      </main>
    </>
  );
}
