# Formula 1 Broadcast-Grade Dashboard

Build a complete, production-quality Formula 1 analytics dashboard using modern frontend technologies.

The goal is **not** to create a simple CRUD dashboard or a generic SaaS admin panel. Build something that feels like a **premium F1 broadcast control center / telemetry product**: information-dense, fast, polished, responsive, and visually distinctive.

You have freedom to choose the implementation architecture and supporting libraries.

---

## 1. TECHNOLOGY & ARCHITECTURE

Use a modern frontend stack.

### Preferred stack

- React
- TypeScript
- Tailwind CSS
- shadcn/ui or another high-quality component library where appropriate
- Vite or another sensible React build setup

You are not restricted to the technologies listed below. They are preferred defaults, not hard requirements. Choose the technology and libraries that produce the best maintainable result. Do not introduce dependencies unless they provide meaningful value.
For example:

- Recharts / Nivo / another charting library
- Lucide icons
- date/time utilities
- animation libraries such as Framer Motion
- TanStack Query for API/data management
- React Router if multiple views make sense

Do not add libraries simply for the sake of adding them.

Prefer a small, coherent dependency set.

### Architecture

Structure the application cleanly.

Separate:

- API/data-fetching logic
- domain/data transformation
- UI components
- layout components
- reusable components
- charts/visualizations
- loading/error states
- application state

Avoid putting the entire application into one giant component.

Create reusable components for things such as:

- race cards
- standings tables
- driver rows
- constructor rows
- metric cards
- timing displays
- charts
- status badges
- loading skeletons
- error states
- responsive navigation

---

# 2. DATA SOURCE

Use the public Jolpica F1 API:

https://api.jolpi.ca/ergast/f1/

All Formula 1 data shown in the UI must come dynamically from the API.

Do not invent or fabricate F1 data.

Do not hardcode:

- drivers
- constructors/teams
- races
- standings
- points
- race results
- fastest laps
- dates
- circuits
- race times
- championship positions

If the API does not provide a particular piece of information, gracefully display:

`N/A`

or

`--`

rather than inventing a value.

The application should dynamically determine:

- current season
- completed races
- most recent completed race
- next upcoming race
- driver championship standings
- constructor championship standings
- most recent race results
- fastest lap information

---

# 3. IMPORTANT API REQUIREMENT

Design the API layer carefully.

Use:

- async/await
- proper error handling
- request abstraction
- reusable API functions
- response normalization/transformation where useful

Do not scatter raw `fetch()` calls throughout React components.

For example, conceptually create an API layer capable of handling:

- current season
- race calendar
- driver standings
- constructor standings
- race results
- fastest lap information

The exact implementation is up to you.

Handle:

- network failures
- API errors
- malformed responses
- missing fields
- empty results
- unexpected API structures

The UI must never render:

`undefined`

`null`

`NaN`

or broken values.

---

# 4. VISUAL DIRECTION

The visual language should be inspired by:

- Formula 1 TV broadcast graphics
- professional race-control interfaces
- premium telemetry software
- modern motorsport data platforms
- high-end sports analytics products

Do NOT make it look like a generic Bootstrap dashboard.

Do NOT make it look like a cryptocurrency dashboard.

Do NOT make it cyberpunk.

Do NOT use excessive glassmorphism.

Do NOT use excessive gradients.

Do NOT use neon effects.

Do NOT use fluorescent green.

Do NOT use bright cyan.

Do NOT use huge decorative hero sections that waste screen space.

The product should feel like a serious professional tool.

---

# 5. COLOR SYSTEM

Base palette:

- Background: `#0F1115`
- Secondary background: `#161920`
- Surface/card: `#1E222D`
- Primary accent: F1 red `#E10600`
- Main text: `#E1E6ED`
- Muted text: `#8C96A6`
- Borders: `rgba(255,255,255,0.08)`

Use the red accent deliberately.

Red should identify important actions, active states, race status, and key Formula 1 elements.

Do not turn the entire interface red.

Use restrained status colors for things like:

- positive/improving
- warning
- error
- neutral

Keep the overall palette sophisticated and muted.

---

# 6. TYPOGRAPHY

Use a clean system sans-serif stack.

Prioritize readability and hierarchy.

Use tabular/monospaced numerals for:

- championship positions
- points
- lap times
- gaps
- race times
- lap numbers
- telemetry values
- countdown values

Numbers should visually align in tables.

Use strong typographic hierarchy without relying on enormous font sizes.

---

# 7. OVERALL APP STRUCTURE

Create a polished application shell.

A possible structure:

```text
┌─────────────────────────────────────────────────────────────┐
│ F1 DATA / 2026                         LIVE / UPDATED       │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│ Overview     │              Dashboard                       │
│              │                                              │
│ Races        │   Race Status                                │
│              │   ┌──────────────┐ ┌──────────────┐         │
│ Drivers      │   │ Last Race    │ │ Next Race    │         │
│              │   └──────────────┘ └──────────────┘         │
│ Constructors │                                              │
│              │   Championship                                │
│ Results      │   ┌──────────────────────────────────────┐   │
│              │   │ Driver standings                     │   │
│              │   └──────────────────────────────────────┘   │
│              │                                              │
│              │   Recent Race Results                        │
│              │   ┌──────────────────────────────────────┐   │
│              │   │ Timing/results table                 │   │
│              │   └──────────────────────────────────────┘   │
└──────────────┴──────────────────────────────────────────────┘
```

You may improve this structure if you have a better UX.

The priority is:

**information density + clarity + hierarchy + responsiveness.**

---

# 8. HEADER

Create a professional application header.

Display:

- Formula 1 branding/product name
- current season
- current application/view
- last updated timestamp
- refresh button
- loading indicator during refresh

The refresh interaction should feel polished.

Example:

`2026 SEASON`

`UPDATED 14:32:08`

`REFRESH`

When refreshing:

- disable the refresh button
- show a subtle spinner
- preserve the existing UI where possible
- update the timestamp when complete

Do not make the entire application flash or disappear during refresh.

---

# 9. RACE STATUS

Create two prominent race-status cards.

## Most Recent Race

Display dynamically:

- Grand Prix name
- circuit
- country
- date
- P1
- P2
- P3
- winner/team information where available

Make the podium visually distinct.

P1 should receive the strongest visual treatment.

P2 and P3 should have subtle differentiation.

## Next Upcoming Race

Display:

- Grand Prix
- circuit
- country
- date
- race start time when available
- countdown

The countdown should update automatically.

Example:

`04D 13H 42M`

If the API does not provide a race time:

`TIME N/A`

Do not fabricate one.

---

# 10. DRIVER CHAMPIONSHIP

Create a premium championship standings section.

Show at least the top 10 drivers.

Columns:

- POS
- DRIVER
- TEAM
- POINTS
- WINS

The table should be compact but highly readable.

Requirements:

- sticky header where appropriate
- tabular numerals
- subtle row separators
- hover state
- clear current ranking
- visual treatment for P1/P2/P3
- responsive behavior on mobile

Driver names should have strong hierarchy.

Constructor/team information should be visually secondary.

---

# 11. CONSTRUCTOR CHAMPIONSHIP

Create a constructor championship section.

Display:

- position
- constructor
- points
- wins

Use the same visual language as the driver standings.

Maintain consistent alignment between numerical columns.

---

# 12. LAST RACE RESULTS

Create a detailed results table for the most recent completed Grand Prix.

Show at least the top 10.

Columns:

- POS
- DRIVER
- TEAM
- GRID
- STATUS
- TIME / GAP
- POINTS

If time/gap is unavailable, use `N/A`.

If status is unavailable, use `N/A`.

Make completed/running/DNF-style states visually understandable without relying solely on color.

---

# 13. FASTEST LAP

Create a dedicated fastest-lap module for the most recent completed race.

Display:

- driver
- team
- position
- lap number
- fastest lap time
- points where available

Make this section visually interesting.

The lap time should be one of the strongest typographic elements on the page.

Example visual hierarchy:

```text
FASTEST LAP

1:21.482

VERSTAPPEN
Red Bull Racing

LAP 42
P1
+ POINTS
```

But all values must come from the API.

---

# 14. ADDITIONAL DATA VISUALIZATION

Where appropriate, enhance the dashboard with meaningful visualizations.

Do not add charts simply to fill space.

Useful possibilities include:

### Championship progression

A chart showing championship points over completed races.

### Recent race pace

A visual comparison of top drivers from the latest race.

### Constructor performance

A compact comparison of constructor points.

### Race calendar timeline

A visual timeline of the season with completed/upcoming races.

Only implement visualizations that can be supported by real API data.

If the API does not provide sufficient historical data, do not fabricate it.

---

# 15. INFORMATION DENSITY

The dashboard should feel dense but not cluttered.

Use:

- compact cards
- tight spacing
- clear separators
- strong alignment
- consistent column widths
- restrained border radius
- small metadata labels
- large numerical values only where meaningful

Avoid:

- giant empty spaces
- oversized cards
- excessive rounded containers
- unnecessary decorative illustrations
- excessive shadows
- excessive animations

Think:

**race control workstation, not marketing landing page.**

---

# 16. RESPONSIVE DESIGN

The application must work extremely well on:

- large desktop
- laptop
- tablet
- mobile

Desktop can use:

- sidebar
- multi-column layouts
- dense tables

Tablet should intelligently collapse columns.

Mobile should become a genuinely usable mobile experience rather than simply shrinking the desktop layout.

Possible mobile behavior:

- collapsible navigation
- horizontally scrollable data tables only where unavoidable
- cards stacked vertically
- important metrics prioritized
- less important columns hidden or moved into secondary information
- touch-friendly controls

Avoid page-level horizontal overflow.

---

# 17. LOADING EXPERIENCE

Do not simply display:

`Loading...`

Create polished loading states.

Use:

- skeleton rows
- skeleton cards
- subtle placeholders
- loading indicators

The initial loading experience should resemble the final layout.

During refresh, avoid destroying already-visible content unnecessarily.

---

# 18. ERROR HANDLING

Create a polished inline error state.

Example:

```text
DATA CONNECTION ERROR

Unable to retrieve Formula 1 data.

Please check your connection and try again.

[ Retry ]
```

The error state should:

- be visually integrated into the dashboard
- clearly explain the problem
- provide a Retry button
- not crash the entire application

If one optional data section fails, consider allowing the rest of the dashboard to remain usable.

---

# 19. INTERACTION & MICRO-UX

Interactions should feel professional.

Use approximately 150–250ms transitions.

Add subtle hover states to:

- buttons
- table rows
- cards where appropriate
- navigation items

Buttons should provide:

- hover
- active
- disabled
- loading

states.

Do not over-animate.

No flashy transitions.

No glowing effects.

---

# 20. NAVIGATION / EXPANDABILITY

You are encouraged to design the application so it can naturally grow into multiple views.

For example:

- Overview
- Race Calendar
- Drivers
- Constructors
- Race Results
- Driver Details
- Race Details

You do not necessarily need to implement every view initially.

However, structure the application so adding them later would be straightforward.

If routing improves the experience, use React Router.

---

# 21. ACCESSIBILITY

Build the interface professionally.

Include:

- semantic HTML
- keyboard-accessible controls
- visible focus states
- appropriate ARIA labels where needed
- sufficient contrast
- accessible buttons
- accessible tables
- meaningful loading/error announcements where appropriate

Do not rely exclusively on color to communicate status.

---

# 22. DATA FORMATTING

Create reusable formatting functions.

Examples:

- driver names
- dates
- race times
- countdowns
- points
- positions
- lap times
- gaps

Handle missing values consistently.

Never expose raw API objects directly in the UI.

Never display:

- `undefined`
- `null`
- `NaN`
- `[object Object]`

Use:

`N/A`

or:

`--`

---

# 23. PERFORMANCE

The application should feel fast.

Consider:

- caching API responses
- minimizing unnecessary requests
- parallelizing independent requests
- memoizing expensive transformations
- avoiding unnecessary re-renders
- lazy loading secondary views if appropriate

Do not sacrifice maintainability for premature optimization.

---

# 24. QUALITY BAR

Treat this as a real product rather than a coding exercise.

Before considering the task complete, inspect the UI carefully.

Look for:

- inconsistent spacing
- awkward typography
- broken responsive layouts
- overflowing tables
- misaligned numbers
- inconsistent card heights
- excessive whitespace
- weak visual hierarchy
- poor mobile navigation
- broken loading states
- broken error states
- missing API data
- invalid assumptions about API responses

Fix these issues.

---

# 25. VERIFICATION

Before finishing:

1. Start the application.
2. Verify that the API requests actually work.
3. Inspect the API responses.
4. Verify that real data is rendered.
5. Verify driver standings.
6. Verify constructor standings.
7. Verify most recent race.
8. Verify next race.
9. Verify last race results.
10. Verify fastest lap.
11. Verify missing fields do not break the UI.
12. Test the Refresh action.
13. Test Retry after an error.
14. Test loading states.
15. Test desktop layout.
16. Test tablet layout.
17. Test mobile layout.
18. Check browser console for JavaScript errors.
19. Fix any problems discovered.
20. Only then consider the implementation complete.

---

# 26. IMPORTANT AGENT FREEDOM

Do not interpret this specification as requiring a specific implementation.

You have freedom to make reasonable product and engineering decisions.

You may:

- use React
- use TypeScript
- use Tailwind
- use shadcn/ui
- use another component system if justified
- use charting libraries
- use icon libraries
- introduce routing
- introduce data-fetching/caching libraries
- create reusable abstractions
- restructure the layout
- improve UX
- improve information hierarchy
- add useful data visualizations
- add tasteful animations
- add responsive navigation
- add additional useful dashboard modules

The requirements describe the **product and quality bar**, not a rigid implementation.

If you determine that a different technical or UX decision produces a significantly better result, make that decision.

---

# 27. DO NOT CHEAT

Do not:

- hardcode F1 data
- invent drivers
- invent races
- invent points
- invent results
- use fake telemetry
- create fake charts from fabricated data
- replace the API with static JSON
- use placeholder F1 information in the final UI
- hide broken functionality behind mock data

Real API data must drive the application.

If data is unavailable, show an appropriate empty/N/A state.

---

# FINAL GOAL

The finished application should feel like a product that could plausibly be used by:

- an F1 analyst
- a motorsport journalist
- a race engineer
- a serious F1 fan
- a professional sports-data platform

It should immediately communicate:

**Formula 1 + live data + professional analytics + premium broadcast aesthetic.**

Prioritize **polish, information hierarchy, real data, responsiveness, usability, and visual consistency** over simply satisfying a checklist of components.
