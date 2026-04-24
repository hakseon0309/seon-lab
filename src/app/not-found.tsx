import Link from "next/link";
import Nav from "@/components/nav";
import PageHeader from "@/components/page-header";
import RouteTransitionDone from "@/components/route-transition-done";

export default function NotFound() {
  return (
    <>
      <RouteTransitionDone />
      <Nav />
      <PageHeader>
        <div />
      </PageHeader>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 pb-tabbar lg:pb-8 text-center">
        <h1
          className="text-lg font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          페이지를 찾을 수 없어요
        </h1>
        <p
          className="mt-2 max-w-sm text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          주소가 잘못되었거나 삭제된 페이지일 수 있어요.
        </p>
        <Link
          href="/dashboard"
          className="interactive-press mt-6 rounded-lg px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--text-on-primary)",
          }}
        >
          홈으로
        </Link>
      </main>
    </>
  );
}
