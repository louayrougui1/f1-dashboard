# AGENTS.md

**`PROMPT.md` is the authoritative product spec — read it fully before changing behavior.** This is a React + TypeScript + Vite + Tailwind CSS v4 F1 dashboard. All data comes live from the Jolpica F1 API (`https://api.jolpi.ca/ergast/f1/`). Never hardcode or mock F1 data ("DO NOT CHEAT" section of the spec).

## Commands

- `npm run dev` — Vite dev server (port 5173)
- `npm run build` — `tsc -b` typecheck + production build to `dist/`
- `npm run preview` — serve the production build (port 4173)

No lint/test tooling is configured; `tsc -b` is the verification gate. Run it before finishing.

## shadcn/ui

The app uses shadcn/ui (Radix base) on top of the F1 design system. `components.json` at the root; primitives live in `src/components/ui/` (button, card, badge, table, skeleton, separator, sheet, scroll-area, progress, tooltip, select) and `cn()` in `src/lib/utils.ts`. Add components via `npx shadcn@latest add <name>` (registry style is `radix-nova`; note `--base radix` is NOT a valid flag).

- **Theming**: `src/index.css` keeps the app's own `@theme` tokens (`accent`, `muted`, `surface`, `line`, …) as the source of truth for the F1 utilities (`text-muted`, `bg-accent`, …). The shadcn `@theme inline` block deliberately does NOT remap `--color-accent`/`--color-muted` (avoids clobbering the F1 tokens); shadcn's `:root` vars (`--background`, `--card`, `--primary`, `--border`, …) are set to the F1 palette in hex. The app is dark-only; the default `.dark` block was removed.
- **Migration scope**: Refresh/Retry/hamburger buttons → `Button`; status chips + round badges + FL tag → `Badge`; constructor points bar → `Progress`; loading states → `Skeleton`; section rules → `Separator`; mobile nav → `Sheet` drawer (replaces the old pills); sidebar nav → `ScrollArea`. Hero (`RaceStatusCards`), `StatStrip`, `SeasonTimeline`, `Countdown`, podium rows, `SectionHeading` and table row internals stay custom F1 compositions that compose shadcn primitives.
- **TooltipProvider wraps the whole app** in `App.tsx` (required for the Refresh tooltip).

## Architecture

- `src/lib/api.ts` — the only place that talks to the API. Raw `fetch()` with timeout + abort, per-endpoint fetchers, and normalization of raw Jolpica JSON into domain types. Do not add `fetch()` calls in components.
- `src/lib/types.ts` — normalized domain types.
- `src/lib/format.ts` — all display formatting + missing-value handling. Missing data renders as `N/A` or `--`; the UI must never show `undefined`/`null`/`NaN`/`[object Object]`.
- `src/lib/useDashboard.ts` — data state hook: season + round selection state. `seasonId` is `'current'` (live season) or a year string from `seasonYears` (current down to `SEASON_FLOOR = 2000`); `round: number | null` where `null` follows the season's last completed round. The featured race is `round ?? lastRace.round` and the results slice fetches `/{season}/{featuredRound}/results.json`. In-memory cache keyed per context (`schedule:2025`, `drivers:2025`, `results:2025:3`) so season/round switches and Refresh are instant; Refresh clears the cache to force a network refetch (spinner + `UPDATED` timestamp must still update). Per-slice retry; derived `lastRace`/`nextRace`, `seasonComplete` (no upcoming rounds), and `championDriver`/`championConstructor` (standings P1) feed the hero's Season Summary / Championship Status panels.
- `src/lib/nav.ts` — nav model (`NAV_GROUPS` with target section ids) + section scroll targets; drives the sidebar and the mobile `Sheet` drawer.
- `src/components/` — presentational modules: `Sidebar` (sidebar + `MobileNavSheet` drawer + `useScrollSpy`/`useNavActive` active-state), `Header` (slim `TopBar` with season+round `Select`s via `Selectors.tsx`, Refresh `Button` + `UPDATED HH:MM:SS`), `RaceStatusCards` (hero: dominant FEATURED RACE panel — podium when the selected round has run, else event details + countdown — beside a context panel: NEXT EVENT + countdown when the featured race has results, `ChampionshipStatus` when a live-season upcoming round is selected, `SeasonSummary` when the season is complete), `StatStrip` (with season-progress band), `Standings`, `LastRaceResults` (with prev/next round `Button`s), `FastestLap` (full-width banner with `text-6xl/7xl` numeral), `Visualizations` (full-width interactive `SeasonTimeline` — rounds are `<button aria-pressed>` that select a round), `Countdown`, and `Skeleton`/`ErrorState` primitives. Red accent is used only as a signal (P1, active nav, labels, hairline rules, hero wash) — sections must not read as a wall of identical cards.

## Gotchas (verified against the API and browser)

- Jolpica shapes: results `Time.time` is full race time for the winner, otherwise a `+gap`. `FastestLap.rank === "1"` is the fastest lap holder (in the last-race results). Statuses are `Finished`/`Lapped`/`Retired`.
- Race dates are `YYYY-MM-DD` + `time` in UTC (`...Z`); parse as `${date}T${time}`. `lastRace`/`nextRace` are derived by comparing `start` to `now` — there is no finished/upcoming flag in the API.
- `current/last/results.json` returns the most recently completed round, so results/standings round numbers may differ from the calendar-derived last race. (The app fetches `/{season}/{round}/results.json` explicitly for the featured round, so it does not rely on this endpoint.)
- **Sticky table headers**: tables use `border-separate` (sticky `tr` fails with `border-collapse` in Chromium) and must NOT be wrapped in `overflow-x-auto` OR `overflow-hidden` (either wrapper becomes the scroll container and kills sticky). The shadcn `Table` component renders its own `overflow-x-auto` wrapper, so the standings tables use a bare `<table>` + the shadcn `TableHead`/`TableCell`/`TableRow`/`TableBody` subcomponents; only the LastRaceResults table uses the full `Table` (its wrapper provides the mobile horizontal scroll — it has no sticky header).
- **Responsive**: driver names in tables are capped with `max-w-[7.5rem]` truncation (9.5rem constructor cap) and the driver code column is hidden below `sm`; POS/WINS cells use `px-2 sm:px-4`; the next-race countdown row uses `flex-wrap` — all required to avoid horizontal page overflow at 320px. Decor badges that only add width on tiny screens are hidden below `sm`: standings `GAP` column, `LEADER` badge, hero `WINNER` badge; the hero grid panels and title use `min-w-0` + a `sm:`-scaled title so the grid never grows to its content min-width. The TopBar's two `Select`s use responsive item labels (`2026` / `R11` below `sm`, `2026 · CURRENT` / `R11 · Hungarian` from `sm`) and `max-w`/`line-clamp` triggers; the `viewLabel` title is hidden below `sm` and the `UPDATED` stamp below `lg` so the bar stays one row (49px) at 320px — the fixed 56px sticky pin must not change.
- Sticky pins at `top-14` (56px) below the fixed TopBar; a sticky cell can never leave its containing table's bounds (standard CSS) — a scroll-to-max test will show it "unstick" once the table scrolls past, which is expected.

## Visual system (spec §4–§6)

Dark palette via Tailwind v4 `@theme` tokens in `src/index.css`: bg `#0F1115`, bg-secondary `#161920`, surface `#1E222D`, surface-2, accent `#E10600`, text `#E1E6ED`, muted `#8C96A6`, gold/silver/bronze (podium), good/warn/error, borders `rgba(255,255,255,0.08)` via `line`/`line-strong`. shadcn maps its `:root` CSS vars onto the same palette (`--background`/`--card`/`--primary`/`--border`/…). Broadcast-art direction: red accent is only a signal, uppercase `label`/`label-lg` kickers (`R11`, `LAP`, `START TIME`, `UPDATED`), `mono-num`/`tabular` utilities for all numerals, `main-wash`/`hero-wash` background washes, no neon/glassmorphism/cyan/fluorescent-green.

## Verification before done (spec §25)

`npm run build`, start dev server, confirm real data renders (standings, last race, next race, results, fastest lap), test Refresh (no flash), Retry (per-section error keeps the rest usable), missing fields, and 320px/375px/768px/desktop layouts with no horizontal page overflow; check browser console for JS errors.