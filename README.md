# Raktsankalp Social Media Tracker

A mobile-first calendar for recording Raktsankalp's daily publishing activity across YouTube, Instagram, Facebook, X, and LinkedIn.

## Included

- Monthly public calendar with completion indicators and posting statistics
- Daily detail pages with links, proof images, notes, and recorded timestamps
- Secure administrator login with an HTTP-only session cookie
- Admin calendar, today's progress, quick-complete, copy-previous-day, and per-platform editing
- JPG, JPEG, PNG, and WEBP screenshot uploads up to 5 MB
- Clipboard paste support for screenshots directly into upload fields
- Responsive mobile, tablet, and desktop layouts

## Local setup

```bash
npm install
npm run dev
```

Copy `.env.example` to `.env.local` for self-hosted development. In Lovable Cloud, server secrets are managed securely and the public values are injected automatically.

## Cloud setup

1. Enable Lovable Cloud for the project.
2. Create the `social-proof` storage bucket with a 5 MB limit.
3. Apply the SQL in `supabase/schema.sql` when using a separate self-hosted backend. Lovable Cloud already has the matching schema and access rules.
4. Set `ADMIN_ID`, `ADMIN_PASSWORD`, and a strong `SESSION_SECRET` as server-only environment values.
5. Run `npm run build` and deploy the project to Vercel.

The public calendar only reads rows. All admin writes and uploads are protected by the server session; the service role key is never sent to the browser.
