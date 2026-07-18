# L20 student starter instructions

The task is limited to the HTTP request boundary of `POST /api/tickets`.

- Use pnpm only.
- Keep the existing API, SQLite persistence and urgency rule.
- Distinguish media type, JSON parsing, shape/type validation and domain rules.
- Reject invalid requests before persistence.
- Preserve valid free-form text as data; do not add generic character bans.
- Do not edit `scripts/check-requests.js` to obtain green.
- Avoid new dependencies and unrelated refactors.
- Verify with `pnpm check`, `pnpm test` and `pnpm check:requests`.
