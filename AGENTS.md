# Project architecture decisions

- Keep landing-specific visual roles in semantic `landing-*` tokens so the editorial campaign styling does not alter the authenticated product UI.
- Scope the authenticated editorial workspace under `.app-shell` and semantic `app-*` tokens so operational screens remain consistent without affecting public or auth pages.