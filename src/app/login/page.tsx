import { redirect } from "next/navigation";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

function safeNextPath(next?: string) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "";
  return `?next=${encodeURIComponent(next)}`;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  redirect(`/${safeNextPath(next)}`);
}
