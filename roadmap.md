# Phase 2 — My Bike & Maintenance Management

- [x] Data model: multi-bike garage state (bikes, tasks, completions, services, documents) in localStorage.
- [x] Garage logic: task status (overdue/due soon/upcoming/completed), cost totals, seed from demo data.
- [x] Forms: add/edit bike, task, complete task, service record, document — with validation.
- [x] My Bike page: bike switcher, add/edit/delete bike, five sections each once, detail modals.
- [x] Home dashboard: active bike, next task, maintenance status, view-all shortcut.
- [x] Profile page reads the live garage (bike count, active bike, bike list).
- [x] Unit tests for garage rules; Playwright acceptance tests 1–7.
- [x] Report pass/fail per acceptance test.

## Results

- Acceptance tests 1–7 all pass in the browser (add bike, switch bike, task add/edit/complete, service add/edit, refresh persistence, per-bike separation, regression on other pages + theme).
- 19 unit tests pass; type check clean; build OK; no console or runtime errors.
- Maintenance intervals labelled as user-set reminders; fuel figure labelled as sample data.

# Phase 2 Enhancement — Centralised Mileage Management

- [x] Data model: per-bike mileage record (odometer, unit, last-updated, history entries) + fuel records with mileage.
- [x] Garage logic: mileage update validation, trip entry, correction with audit trail, stale-reminder helper.
- [x] Update Mileage dialog: manual / trip / correction modes, live difference, validation, confirmation.
- [x] My Bike: mileage section with odometer, last-updated label, history list; fuel logging with prefilled mileage.
- [x] Home: Update mileage action + dismissible stale-mileage reminder.
- [x] Unit tests for acceptance tests 1–8 logic; Playwright end-to-end run of tests 1–8.
- [x] Report test results and remaining issues.

## Results

- All 8 acceptance tests pass in the browser (update propagation, remaining/overdue recalc, service + fuel prefill, per-bike isolation, refresh persistence, lower-reading rejection + correction audit, historical records untouched).
- 29 unit tests pass; type check clean; build OK; no console or runtime errors.
- Fixed during testing: cleared a stale Vite deps cache (duplicate optimized React after adding sonner) that left preview event handlers dead; editing a bike's odometer now routes through Update mileage so every change is audited.

# Phase 3 — Fuel Management & Station Finder

- [x] FuelRecord: full-tank flag; FuelForm: full/partial toggle + live price-per-litre.
- [x] src/lib/fuel.ts: UK MPG (full-to-full), totals, last fill, monthly spend series.
- [x] Mileage sync: new fill-up with higher odometer updates central mileage history.
- [x] Fuel page: "Find petrol" / "My fuel" tabs; My fuel = stats, monthly chart, history, log/edit/delete, bike switcher.
- [x] Finder: brand + distance filters, favourites (persisted), station details + directions link.
- [x] Seed records marked full-tank so demo MPG computes; demo labelling kept.
- [x] Unit tests for fuel maths; Playwright acceptance; verify Phases 1–2 intact.

## Phase 3 results

- All browser checks pass: finder filters (brand, distance, favourites), favourite persistence, map/list views, station details + directions link, stats/MPG/monthly chart, log fuel with odometer prefill + live price-per-litre + central mileage sync, edit/delete, refresh persistence, Phases 1–2 regression.
- 38 unit tests pass (9 new fuel-maths tests); type check clean; build OK; no console errors.
- Station data and prices remain clearly labelled demo data; no external map APIs used.

# Phase 4 — Community & Social Ecosystem (local-only, per user decision)

- [x] Social data model: riders, posts (photos/hashtags/comments), clubs, rides, notifications; seed + validation.
- [x] useSocial store (throttle:social) with all actions + ownership/permission rules.
- [x] Feed: compose with multi-photo upload (validated), hashtags, bike link, like/comment/reply/save/report/edit/delete.
- [x] Discover: rider search, follow/unfollow, public profiles with posts and follower counts.
- [x] Clubs: create, public/private, join/leave, admins/moderators, announcements, member directory, discussion.
- [x] Rides: create with meet point/destination/date/limit, join/leave, statuses, organiser management.
- [x] Notifications tab: unread tracking, mark read; demo items labelled.
- [x] Unit tests for permissions/limits/status logic; Playwright acceptance; Phases 1–3 regression.

## Phase 4 results

- All 15 browser checks pass: feed (compose with hashtags/bike/photos, like, comment, reply, save, edit/delete own, report, block), discover (search, follow, profiles with followers/mutuals), clubs (create, public/private gating, join/leave, announcements, member management), rides (create with limits, join/leave, statuses, organiser cancel), notifications (unread, mark read), refresh persistence, Phases 1–3 regression.
- 65 unit tests pass (27 new social-logic tests); type check clean; build OK; no console errors.
- Per user decision: community is local-only (localStorage), demo riders/posts/notifications labelled as sample data; photo uploads validated (JPEG/PNG/WebP, max 2 MB, max 4) and stored as data URLs.

# Phase 5 — Rider Profile, Settings & Production Readiness (local-only)

- [x] Profile data layer: editable rider profile (photo, name, username, bio, location, interests, experience, brands), privacy + notification preferences, feedback entries — `throttle:profile`, synced with the social "me" rider.
- [x] Profile page: full rider profile with stats, garage integration (bikes, specs, mileage, maintenance, fuel), own posts, settings entry.
- [x] Settings page (/settings): Account, Privacy, Notifications, Appearance, Security, Support sections.
- [x] Unit tests for profile rules; Playwright audit of all six routes, both themes, mobile + desktop.
- [x] Report: completed, outstanding, required configuration, test results.

## Results

- Profile: editable photo/name/username/bio/location/interests/experience/brands, stats derived from live garage + social state, garage integration (specs, mileage, next task, MPG, services), own posts/clubs/rides, settings entry.
- Settings (/settings): Account (local email edit; password/sign-out marked as needing Lovable Cloud), Privacy (visibility toggles + blocked riders with unblock), Notifications (master + 4 categories), Appearance (theme + units), Security (local-data explanation + reset), Support (help centre, feedback form saved locally, terms/privacy).
- Fixed during audit: settings email field now re-syncs after localStorage hydrates.
- 78 unit tests pass (13 new profile tests); typecheck clean; build OK; Playwright audit 11/11 across all six routes, both themes, 390px + 1280px; no console errors; no horizontal overflow.
- Outstanding: real auth, password recovery, cross-device sync and push notifications require Lovable Cloud (user chose local-only).
