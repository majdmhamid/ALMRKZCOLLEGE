# Prompt: PDF signature feature

Paste everything below the line into a new Claude Code session, and attach the
reference screenshot of the documents page.

---

Build a PDF e-signature feature: an admin uploads a PDF, sends a signing link
to one or more clients, the clients draw their signature, and the admin then
places those signatures on the PDF, finalizes it, and files it in a "Signed"
section.

**Before writing any code, read this whole prompt, then reply with your
implementation plan and any questions. Wait for my confirmation before you
start building.**

## Where and with what

- Repo: `majdmhamid/ALMRKZCOLLEGE`. It currently holds only media assets for the
  college website. Create the app in a new `signing/` directory; don't touch
  `assets/` or `scripts/`.
- Stack (already decided): **Next.js (App Router, TypeScript) + Supabase**
  (Postgres, Storage, Auth, Realtime), Tailwind CSS.
- Suggested libraries (swap them if you have a good reason, and tell me why):
  `pdfjs-dist` / `react-pdf` to render pages, `signature_pad` for drawing,
  `react-rnd` (or similar) for drag and resize, `pdf-lib` to stamp the final PDF,
  `next-intl` for translations.
- Languages: **Arabic and Hebrew**, both RTL, with a language switch on the
  client signing page. The admin UI is in Hebrew by default (like the
  screenshot), and Arabic must also work there.
- Mobile first for the client page: most clients will open the link on a phone
  from WhatsApp and sign with a finger.

## UI reference: the attached screenshot

The screenshot shows another system. I want to copy it, not integrate with it.
Build the admin documents page to look and work like it:

- Top bar: "+ תיק חדש" (new case) button, notification bell with a count badge,
  a filter dropdown ("הכל" = all), and quick search ("Ctrl+K").
- Title "מסמכים" and subtitle "ארכיון מסמכים משפטיים וחוזים".
  "העלאת מסמך" (upload document) button, and a "בחר" (select) button that turns
  on multi-select for bulk actions.
- Stat cards: total documents, storage used (MB and file count), signed, waiting
  for signature, documents with an attached file. Plus a refresh button.
- A drag-and-drop upload zone (max 50 MB per file).
- The document list is grouped by **month** (collapsible), then by **day**
  (collapsible folders). Each row shows the file name, a status badge, the
  category (for example "ראיה / מוצגים", "ייפוי כוח"), and round icon buttons.
- Status badges: blue "לחתימתך" (waiting for **the admin's** signature), orange
  "ממתין לחתימה" (waiting for the client). Add "נחתם ✓" (signed, needs
  placement) and "סופי" (finalized).
- Row action buttons, and what each one must do:
  - 👁 view, ⬇ download, ✏ edit details, 🗑 delete (with confirmation)
  - **orange clipboard = copy the signing link** (see "Sharing" below)
  - **green arrows = move to the Signed section**
  - **blue pen = the admin signs this document too**

## The flow

### 1. Admin creates a signing request

Upload a PDF and fill in:
- title, category
- an optional **description** of what the client is signing. It is sent
  together with the link.
- **link mode**, chosen per document:
  - **One link per signer:** the admin adds each signer's name and Israeli ID
    number (ת.ז), plus an optional phone number. Each signer gets their own link.
  - **One shared link:** a single link. Each person who opens it types their own
    name and ID number, then signs. Optional maximum number of signers.
- "admin signs too" toggle. When on, the row gets the blue "לחתימתך" badge and
  the blue pen button.

### 2. Sharing: the admin sends the link, not the system

No email or SMS sending. The orange clipboard button copies a ready-to-paste
message: the optional description, then the link. Next to it, a WhatsApp button
opens `https://wa.me/<phone>?text=<message>` (without a phone number if none was
given). In per-signer mode, show one copy and one WhatsApp button per signer.
The admin can **revoke** a link and **generate a new one**. Links do not expire.

### 3. The client signs

`/sign/[token]`:
1. Language switch (Arabic / Hebrew). The document title and description are
   shown.
2. **ID check:**
   - Per-signer mode: the client types their ID number, and it must match the
     one the admin entered.
   - Shared mode: the client types their full name and ID number. Validate the
     ID's check digit. The same ID can't sign the same document twice.
   - Allow 5 wrong attempts, then lock that link until the admin resets it.
3. The PDF is shown read-only only after the ID check passes. The client
   scrolls through the pages.
4. An "I have read the document" checkbox, then the signature.
   **Drawing with a finger or mouse is the only method by default.** The other
   methods (type your name; checkbox plus typed name) appear only if the admin
   turned them on in Settings.
5. Submit, then a thank-you screen. Opening the link again shows "already signed".

The client never places the signature on the PDF. The client only produces a
signature image.

### 4. Admin gets notified

A badge only, no email or push. When anyone signs, the bell count goes up and
the row's status updates **live**, with no refresh (Supabase Realtime). Show
progress on multi-signer documents, for example "1/2 חתמו" (1 of 2 signed).

### 5. Placement editor: the core of this feature

Clicking a document with signatures opens an editor:
- The PDF pages are in the main area, with page navigation and zoom.
- A panel **on the left** lists every signature collected for this document:
  the signature image, signer name, and date/time signed. The admin's own
  signature is there too if "admin signs too" is on.
- The admin **drags** a signature from the panel onto a page. Each drag creates
  a **new copy**, so the same signature can be placed as many times as needed
  (for example on every page).
- Each placed signature can be **moved** and **resized freely** (corner handles
  for any size; an optional aspect-ratio lock is fine), and deleted.
- Positions autosave.
- Warn if a signer's signature hasn't been placed anywhere.

### 6. Finalize

The "Finalize" button (only when every expected signer has signed):
- The server loads the **original** PDF and stamps each placement's PNG at its
  position with `pdf-lib`. It saves a **new** final PDF and never overwrites the
  original.
- The document becomes locked: the editor is read-only and download gives the
  final PDF.
- "Unlock / edit again" discards the final PDF and returns to the editor. Log it.

### 7. Move to Signed

- The green arrows button moves a signed or finalized document to the **Signed**
  page ("נחתמו"). With "בחר" on, several documents can be moved at once.
- The Signed page uses the same month → day layout. Documents can be moved back.
- The move is always manual. Never move a document automatically.

### 8. Admin signs too (blue pen)

The admin draws their signature once. Save it on their profile and offer to
reuse it next time. It then appears in the editor's left panel like any other
signature.

### 9. Settings page

- Signature methods: drawing is always on; toggles for "type name" and
  "checkbox + name".
- Default link mode for new documents.
- Default message template placed before the link.

## Backend design (implement this, or propose changes in your plan)

### Tables (Supabase Postgres, SQL migrations in the repo)

- `documents`: id, title, category, description, original_pdf_path,
  original_sha256, final_pdf_path, final_sha256, page_count, link_mode
  (`per_signer` | `shared`), shared_token_hash, max_signers,
  admin_signs (bool), status (`draft` | `pending` | `signed` | `finalized`),
  in_signed_section (bool), moved_to_signed_at, finalized_at, created_by,
  created_at, updated_at.
- `signers`: id, document_id, name, id_number_hash, phone, token_hash
  (per-signer mode only), is_admin, status (`pending` | `signed`),
  failed_attempts, locked, signature_path, signature_method, signed_at,
  signed_ip, signed_user_agent.
- `placements`: id, document_id, signer_id, page, x, y, width, height. Store
  x/y/width/height **as fractions of the page (0–1)** so they don't depend on
  zoom level. Convert to PDF points only when stamping, and handle page
  rotation and CropBox offsets.
- `settings`: a single row with the settings above.
- `admin_profiles`: user_id, display_name, saved_signature_path.
- `audit_events`: document_id, signer_id, event (created, link_copied,
  link_revoked, opened, id_failed, id_verified, signed, placed, finalized,
  unlocked, moved_to_signed, moved_back), ip, user_agent, created_at. Show it as
  a history tab on the document.

### Security rules

- Tokens are 32 random bytes, base64url. Store **only a SHA-256 hash** in the
  database.
- ID numbers are stored as an HMAC with a server secret, never in plain text.
  Validate the check digit.
- All Storage buckets are private. The client page never talks to Supabase
  directly. Everything goes through Next.js server routes or server actions
  using the service-role key (server-side only). PDFs go to the client as
  short-lived signed URLs, and only after the ID check passes.
- RLS on every table: only authenticated admins can read or write. There is no
  public sign-up; admins are created by hand in Supabase. Assume one admin for
  now, but don't hard-code that.
- Rate-limit the ID check and the signature submit.
- Signature images: validate that it is a PNG and its size, then trim
  whitespace and keep a transparent background.
- Record the SHA-256 of the original and final PDF for the audit trail.

## Working in this cloud session

This session's network allows only package registries and GitHub, so you
probably **can't reach a real Supabase project** from here. Check this, and
don't pretend otherwise. So:
- Put the schema in SQL migration files and all secrets in `.env.example`.
- Unit test the risky logic without Supabase: ID validation, token hashing,
  fraction ↔ PDF-point conversion (including rotated pages), and pdf-lib
  stamping, checked against a sample PDF.
- Where you can, run the UI with mocked data and take Playwright screenshots of
  the admin list, the client signing page on a phone-sized viewport, and the
  placement editor, so I can see them.
- Write `signing/SETUP.md` in **plain Arabic** (like `كيف-نشتغل-سوا.md` in the
  repo root) explaining how I create the Supabase project, run the migrations,
  create my admin user, fill in `.env.local`, and run and deploy the app
  (Vercel).

## How to deliver

Build in phases, and commit and push after each one:
1. Scaffold, schema, auth, i18n/RTL
2. Admin list page and upload
3. Links, sharing, and the client signing page
4. Placement editor
5. Finalize and the Signed section
6. Admin signature and Settings

After each phase, tell me in a few lines what works and what doesn't yet.
Don't claim something works unless you ran it. Out of scope for now: email or
SMS sending, link expiry, multiple admin roles, and an audit certificate page
inside the PDF.
