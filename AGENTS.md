# Project architecture decisions

- Keep landing-specific visual roles in semantic `landing-*` tokens so the editorial campaign styling does not alter the authenticated product UI.
- Scope the authenticated editorial workspace under `.app-shell` and semantic `app-*` tokens so operational screens remain consistent without affecting public or auth pages.
- PWA is manifest-only (no service workers, no offline caching). In standalone/installed mode the landing ("/") must never render: `StandaloneLandingGate` (src/App.tsx + src/lib/standalone.ts) redirects to `/login`, or `/app/dashboard` when a session exists; regular browsers keep seeing the landing.