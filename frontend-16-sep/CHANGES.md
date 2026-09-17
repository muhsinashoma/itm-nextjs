# ITM Next.js — Fix & Improvement Changelog

## Responsive Fixes

### Critical
- **Mobile Sidebar** — Added Sheet/drawer overlay for mobile navigation (< md breakpoint). 
  Sidebar was completely hidden on mobile with no replacement. Now accessible via hamburger button.
- **Dashboard Layout** — Left sidebar now `hidden md:flex` with proper sheet fallback on mobile.
  Right sidebar restricted to `hidden lg:block` to avoid overlapping on tablets.
- **Auth Page** — Rebuilt with a clean split layout: brand panel (desktop) + form panel (mobile-first).
  Proper padding, max-width constraints, and Enter-key support added.

### Major
- **Header Nav** — Desktop links visible only. Mobile shows hamburger + ITM brand text.
  Search input hidden on mobile (button toggle instead). All items fit without overflow.
- **Right Sidebar** — Only visible on `lg+` screens. Overflow-x hidden to prevent content bleed.
- **Data Tables** — All DataTable instances wrapped in `overflow-x-auto` with `min-w-[600px]` 
  so tables scroll horizontally on narrow screens instead of clipping.
- **Dashboard Grid** — Cards use `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`. Charts no longer 
  have fixed heights that break on small card widths.
- **Footer** — Dev team text hidden on `< sm`. Cleaner justify-between on all sizes.

## UI / Design Improvements

- **Sidebar Sections** — Menu items grouped into 3 labeled sections: Inventory, Operations, Admin.
  Section labels use uppercase 10px tracking. Much easier to scan.
- **Active State** — Parent menu items highlight when a child route is active.
  Active child auto-expands parent on page load.
- **Sidebar Icons** — Replaced `+/-` toggles with Chevron icons. Colorful per-item icon system retained.
- **Sidebar Profile** — User info shows role + truncated email. Dropdown is cleaner.
- **Header Nav** — Active route uses `bg-primary/10 text-primary` pill instead of underline.
  Logout styled as destructive without always-underline hack.
- **Loading States** — Replaced bare `<p>Loading...</p>` with animated skeleton loaders 
  across all report pages and data pages.
- **Auth Page** — Demo credentials hidden. Added "Use Demo Account" button that auto-fills fields.
  Added brand stats panel (12,867 assets, 1,540+ employees, etc.) on left side.
  Added loading spinner on submit, Enter-key login support.
- **Dashboard Cards** — Redesigned with `DashCard` wrapper, `CardHeader` with badge-style growth 
  indicators. Charts properly separated from legend lists with divider. Copy fixed.
- **Card Titles Fixed** — "Service Request inprocess" → "Service Requests In Progress".
  "In inprocess" → "In Progress".
- **Overview Chart** — Redesigned with three data series (Open, In Progress, Closed).
  Range selector uses segmented pill style. Removed hardcoded `bg-white`.
- **Theme Colors** — All `bg-white`, `text-gray-500`, `bg-gray-50`, `border-gray-200` 
  replaced with CSS variable equivalents (`bg-card`, `text-muted-foreground`, `bg-muted`, `border-border`).
  Themes now work correctly in dark, soft-dark, blue, amber, and company modes.
- **Chart Label Colors** — Fixed `fill="#111827"` hardcoded labels → `fill="var(--foreground)"` 
  for dark mode compatibility.
- **Primary Color** — Updated default primary from monochrome gray to `oklch(0.45 0.16 250)` 
  (a clean blue). Company theme updated to use a softer red scheme with white cards.
- **CSS** — Added smooth scrollbar styles, shimmer skeleton animation, improved focus rings.
- **Backup Files Removed** — 55 date-prefixed backup files removed from source tree. 
  Use git history instead.

## No Functional Changes
- All API routes unchanged
- All data services unchanged  
- All existing navigation paths unchanged
- All models and types unchanged
