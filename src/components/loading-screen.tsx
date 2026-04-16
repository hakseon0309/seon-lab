import Nav from "@/components/nav";

export default function LoadingScreen() {
  return (
    <>
      <Nav />
      <div
        className="fixed inset-x-0 top-14 bottom-14 z-30 flex items-center justify-center lg:bottom-0"
        style={{ backgroundColor: "var(--bg-base)" }}
      >
        <div
          className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{
            borderColor: "var(--border)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    </>
  );
}
