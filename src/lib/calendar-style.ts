export function weekendOverlay(day: Date, inMonth: boolean) {
  const dow = day.getDay();
  if (dow === 6)
    return {
      text: inMonth ? "var(--weekend-sat-text)" : "var(--text-out-of-month)",
      overlay: inMonth ? "var(--overlay-weekend-sat)" : "var(--overlay-weekend-sat-dim)",
    };
  if (dow === 0)
    return {
      text: inMonth ? "var(--weekend-sun-text)" : "var(--text-out-of-month)",
      overlay: inMonth ? "var(--overlay-weekend-sun)" : "var(--overlay-weekend-sun-dim)",
    };
  return null;
}

export function cellBackground(day: Date, inMonth: boolean) {
  const weekend = weekendOverlay(day, inMonth);
  const base = inMonth ? "var(--bg-card)" : "var(--bg-out-of-month)";
  const overlays: string[] = [];
  if (weekend) overlays.push(`linear-gradient(${weekend.overlay},${weekend.overlay})`);
  return {
    backgroundColor: base,
    ...(overlays.length > 0 && { backgroundImage: overlays.join(",") }),
  };
}
