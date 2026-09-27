# PDF e-signature (`signing/`)

Admin uploads a PDF → shares signing links (copy / WhatsApp) → clients verify their
Israeli ID and draw a signature on their phone → admin places signatures on the
PDF → finalize (stamped with pdf-lib into a new PDF) → file under "Signed".

Arabic + Hebrew, RTL. Next.js 16 (App Router) + Supabase + Tailwind v4.
Looks like the college website (green #158942 / #88bb3c, Almarai + Heebo).

- **Setup (Arabic, non-technical):** [SETUP.md](SETUP.md)
- **Run with fake data (no Supabase):** `npm run dev:mock` → http://localhost:3100
- **Tests:** `npm test` — ID check digit, token hashing/encryption, and the SQL
  migrations + RLS policies on PGlite (real Postgres in WASM).
- **Screenshots:** start `dev:mock`, then `npm run screenshots` → `screenshots/`
- **End-to-end signing check:** with `dev:mock` running on fresh data, `node scripts/e2e-sign.mjs`
  (admin copies a link → phone verifies ID → reads → draws → submits → admin updates live)
- **Placement editor check:** `node scripts/e2e-editor.mjs` (drag, resize, reload, zoom, delete, history)

## Layout

| Path | What |
|---|---|
| `supabase/migrations/` | Schema, RLS, storage buckets, realtime (`npm run db:migrate`) |
| `src/lib/security/` | Israeli ID validation, tokens (SHA-256 + AES-GCM), ID HMAC, signed cookies |
| `src/server/` | Server-only: auth, rate limiting, request info |
| `src/app/admin/` | Admin UI (requires a Supabase user **with** an `admin_profiles` row) |
| `src/app/sign/[token]/` | Public signing page — never talks to Supabase directly |
| `messages/` | `he.json`, `ar.json` |

## Security model

- Tokens: 32 random bytes, base64url. DB stores SHA-256 (lookup) + AES-256-GCM copy (so the admin can copy the link again).
- ID numbers: HMAC-SHA256 with `ID_HMAC_SECRET`; only the last 3 digits are kept in clear.
- All buckets private; files reach browsers only as short-lived signed URLs.
- RLS on every table: admins only. Rate-limit and lockout tables have no policies (service role only).
- Server code talks to Postgres directly (`SUPABASE_DB_URL`, transaction pooler) for real
  transactions; Storage and Auth go through supabase-js with the service-role key. In mock mode the
  same SQL runs on PGlite with the real migrations.
- PDFs upload straight from the admin's browser to Storage via a signed upload URL
  (Vercel caps request bodies at 4.5 MB).
