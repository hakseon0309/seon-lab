# UI Consistency Guide

Seon Lab UI changes should follow these rules unless there is a strong product reason not to.

## Layout

- Use the teams page spacing pattern as the default for top-level pages.
- Top-level page shell:

```tsx
<main className="mx-auto w-full max-w-lg py-6 pb-24 lg:py-8 lg:pb-8">
  <div className="px-4 lg:px-0">{/* page content */}</div>
</main>
```

- For wider pages like calendars or admin tables, keep the same pattern and only change `max-w-*`.
- Do not put `px-4` directly on `main` for standard pages if sibling pages use the inner wrapper pattern.
- Mobile bottom nav is fixed, so keep `pb-24` on mobile page content.
- Mobile top nav is fixed, so rely on the shared `Nav` spacer instead of adding ad hoc top padding.

## Navigation

- `SEON LAB` in the top bar always routes to `/dashboard`.
- Mobile top nav height and bottom nav height must stay the same: `h-14`.
- Top and bottom nav should remain visible even during loading states.
- Any loading screen should render the shared `Nav` component.

## Page Header (`PageHeader` component)

Every page must render `<PageHeader>` between `<Nav />` and `<main>`. This creates a sticky sub-header on mobile (fixed below the top nav at `top-14`) and a normal flow header on desktop.

- Top-level pages: put just the `<h1>` inside.
- Sub-pages (e.g. settings sub-pages): put a back link and `<h1>` side by side inside a flex wrapper.
- Always pass `maxWidth` to match the page's `max-w-*` (e.g. `max-w-lg` for settings pages).

```tsx
// Top-level page
<PageHeader maxWidth="max-w-lg">
  <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>페이지 제목</h1>
</PageHeader>

// Sub-page with back navigation
<PageHeader maxWidth="max-w-lg">
  <div className="flex items-center gap-3">
    <Link href="/parent" className="text-sm" style={{ color: "var(--text-muted)" }}>← 상위 페이지</Link>
    <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>페이지 제목</h1>
  </div>
</PageHeader>
```

- Page descriptions or sub-text go inside `<main>`, not in the header.
- Omitting `PageHeader` breaks mobile layout — the content starts hidden behind the fixed top nav.

## Spacing

- Page titles: usually `mb-6`.
- Section cards: usually `mt-4` or `mt-8` depending on visual grouping.
- Form stacks: default to `space-y-5`.
- Card padding: default to `p-4`.
- Avoid mixing multiple horizontal padding systems inside one page.

## Cards And Surfaces

- Standard card:

```tsx
className="rounded-lg border p-4"
style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
```

- Use `var(--bg-card)` for primary surfaces.
- Use `var(--bg-surface)` for softer nested surfaces.
- Use `var(--border-light)` for standard borders.
- Settings cards are the baseline style for simple navigation rows and action panels.
- If a page contains navigational cards like team entry buttons, match the settings card language first before introducing a new list-row style.
- Default clickable card pattern:

```tsx
className="interactive-press flex items-center justify-between rounded-lg border p-4"
style={{ borderColor: "var(--border-light)", backgroundColor: "var(--bg-card)" }}
```

## Typography

- Page title: `text-xl font-bold`
- Card title / strong row label: `text-sm font-medium` or `text-sm font-semibold`
- Secondary supporting text: use `var(--text-muted)` or `var(--text-secondary)`
- Do not introduce one-off text colors if an existing token fits.

## Buttons And Interaction

- All buttons should feel pressable.
- All navigation links that behave like buttons should use `interactive-press`.
- Shared press feedback lives in `src/app/globals.css`.
- Global button double-click prevention is handled by `src/components/button-guard.tsx`.
- New clickable buttons should still use local loading/disabled state when the action is async or destructive.

## Theme Tokens

- Reuse the existing tokens in `src/app/globals.css`.
- Prefer these tokens over raw colors:
  - `--bg-base`
  - `--bg-card`
  - `--bg-surface`
  - `--text-primary`
  - `--text-secondary`
  - `--text-muted`
  - `--primary`
  - `--primary-light`
  - `--border`
  - `--border-light`
  - `--error`
  - `--success`

## Calendar Today Highlight

- Today's cell is emphasized with a **1.5px outline on top of the cell, drawn on the inside** so it does not overlap adjacent cell borders or grid gaps.
- Use `var(--today-border)` as the color.

```tsx
style={{
  outline: "1.5px solid var(--today-border)",
  outlineOffset: "-1.5px",
  position: "relative",
  zIndex: 1,
}}
```

- Do **not** use `boxShadow: "inset ..."` for today highlight — it stacks on top of existing cell borders and looks like a doubled line.
- Do not use a circular background around the day number; keep the full-cell outline pattern so both calendar views look consistent.
- Number text inside today's cell uses `font-bold`.

## Loading States

- Loading should preserve app chrome when possible.
- Prefer skeletons or in-place loading for local sections.
- If a full-page loading state is necessary, use the shared `LoadingScreen`.

## Before Merging UI Changes

- Check mobile and desktop spacing against neighboring pages.
- Confirm top-level pages align to the same left/right content edge.
- Verify fixed nav does not overlap content.
- Verify long Korean text wraps without overlapping buttons.
- Verify active, pressed, disabled, and loading states are visible and consistent.
