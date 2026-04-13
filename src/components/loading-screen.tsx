export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "var(--bg-base)" }}>
      <div
        className="h-8 w-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{
          borderColor: "var(--border)",
          borderTopColor: "transparent",
        }}
      />
    </div>
  );
}
