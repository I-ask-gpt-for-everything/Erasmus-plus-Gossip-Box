# GossipBox

An anonymous gossip board. Anyone can post a short text gossip, optionally
with an image and emoji, and mark it NSFW. No accounts, no names — just a
feed, sorted newest-first, where every post stays visible forever. New
posts can require admin approval before they go public. Every post also
has its own anonymous comment thread (collapsed by default, tap "💬" to
open it).

This is a first prototype built from a whiteboard sketch: a feed grid of
posts with emoji reactions, a floating "+" to post, and an NSFW flag. See
[ARCHITECTURE.md](ARCHITECTURE.md) for a technical deep-dive (data model,
security rules, dual-backend design) if you're extending the app.

Alongside it are two more, unrelated sections — the opposite of the
gossip feed: named, not anonymous, and unmoderated.

- **Kind Words** (`/messages`) — anyone can leave a paragraph-length
  message with their name and an optional photo.
- **Photos & Personal Info** (`/photos`) — anyone can share a username
  plus any combination of a message, a pasted photo link, an Instagram
  handle, and/or an uploaded picture.

A persistent left sidebar (icon-only on mobile) links all three sections
plus `/admin`.

## Stack

- **Next.js (App Router) + TypeScript + Tailwind** — deploys straight to Vercel.
- **Firebase** — Firestore for posts, Storage for images.
- **Local demo mode** — if no Firebase config is present, the app
  transparently falls back to `localStorage` so you can run and demo it
  immediately without setting up a Firebase project first.

## Run it locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without any Firebase
env vars set, you're in **local demo mode**: posts are saved to your
browser's localStorage. This is enough to fully click through the
prototype, it just won't sync between devices/browsers.

## Connecting a real Firebase project

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com).
2. Enable **Firestore Database** and **Storage** (start in production mode).
3. Deploy the included security rules:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init firestore storage   # point at this repo's firestore.rules / storage.rules
   firebase deploy --only firestore:rules,storage
   ```
4. In Project settings → General → Your apps, create a Web app and copy the
   config values into a `.env.local` (see `.env.local.example`):
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```
5. Restart `npm run dev`. The app now reads/writes real Firestore data and
   uploads images to Storage in real time.

## Admin dashboard

Signing in at **`/admin`** opens a small dashboard with four tabs:

- **Overview** — counts of total / pending / approved / rejected / NSFW gossips.
- **Pending** — the approve/reject review queue.
- **All gossips** — every post regardless of status, filterable, with the
  ability to retroactively approve/reject any post (e.g. take down an
  already-approved one).
- **Settings** — the moderation toggle described below, plus **print
  memories**: filter by status to browse candidates, check off exactly the
  gossips you want (a "Select all" button bulk-adds everything currently
  filtered), then Print. The output is a keepsake-style page — one card
  per gossip with its photo, date, and reaction counts, not just a plain
  text dump (browser print dialog, so "Save as PDF" works too). The tab
  bar is where future admin sections — e.g. a contact information page —
  are expected to be added.

Every new gossip is created with a `status` of `pending` or `approved`,
controlled by a moderation setting ("Require approval before a gossip
goes public") that defaults to **on**. The public feed only shows
`approved` posts; an admin reviews `pending` ones on the Pending tab and
approves or rejects each one, and can flip the moderation setting off to
let posts publish immediately instead.

**Local demo mode:** `/admin` is protected by a simple passcode (override
with `NEXT_PUBLIC_LOCAL_ADMIN_PASSCODE`). This is
just a UX gate for the prototype, not real security — fine since all the
data already lives only in your own browser's localStorage.

**With Firebase configured:** `/admin` requires signing in with Firebase
Authentication, and only accounts listed in the `admins` collection can
actually approve/reject posts or change the moderation setting — this is
enforced server-side by `firestore.rules`, not just hidden in the UI.
Since this app only ever has one admin account, the login screen only
asks for a **password**; it signs in with a fixed email address baked in
as `ADMIN_EMAIL` in `src/components/AdminLogin.tsx` (override via
`NEXT_PUBLIC_ADMIN_EMAIL` if you want a different address). To bootstrap
your admin account:

1. In the Firebase console, go to **Authentication → Sign-in method** and
   enable the **Email/Password** provider (if it isn't already).
2. Go to **Authentication → Users → Add user**, using the same email as
   `ADMIN_EMAIL`/`NEXT_PUBLIC_ADMIN_EMAIL`, and choose your own password.
3. Copy that user's UID.
4. In **Firestore Database**, create a document at `admins/<uid>` (any
   fields, e.g. `{ email: "you@example.com" }` — only its existence is
   checked).
5. Sign in at `/admin` with that password.

A second admin needs their own email — either change `ADMIN_EMAIL` to a
shared account both of you know the password for, or extend
`AdminLogin.tsx` back to an email+password form if you want distinct
per-person accounts.

## Kind Words

`/messages` is a separate, unmoderated board — anyone can post a name +
paragraph + optional photo and it's live immediately, no admin approval
step, no NSFW flag, no expiry. It's stored in its own `messages`
Firestore collection / `gossipbox_messages` localStorage key, uploads
photos to a separate `message-photos/` Storage path, and isn't part of
the admin dashboard at all — there's nothing to moderate there yet.

## Photos & Personal Info

`/photos` is a third, similarly unmoderated board for sharing a username
plus any combination of a message, a pasted photo link (shown as a plain
link, not necessarily an image), an Instagram handle, and an uploaded
picture — at least one of those besides the username is required to
post. Live immediately, same as Kind Words: no approval step, no NSFW
flag, no expiry. Stored in its own `photoEntries` Firestore collection /
`gossipbox_photo_entries` localStorage key, uploads pictures to a
`photo-entries/` Storage path, and also isn't part of the admin
dashboard.

## Deploying to Vercel

```bash
vercel
```

Add the same `NEXT_PUBLIC_FIREBASE_*` variables in the Vercel project's
Environment Variables settings so production talks to your real Firebase
project instead of running in local demo mode.

## Prototype notes / not-yet-hardened

- "Anonymous" currently means no accounts at all for regular users —
  anyone can post, and there's no rate limiting or spam protection yet.
- Reaction state ("did I already react with 😂 to this post") is tracked
  per-browser in localStorage, not tied to an identity — clearing storage
  resets it, and a user could in principle react more than once from
  different browsers.
- Rejected posts stay in Firestore/localStorage with `status: "rejected"`
  (for an audit trail) — there's no admin UI to permanently delete a post
  yet.
