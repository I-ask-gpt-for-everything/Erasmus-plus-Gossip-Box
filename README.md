# GossipBox

An anonymous gossip board. Anyone can post a short text gossip, optionally
with an image and emoji, mark it NSFW, and choose how long it stays
visible. No accounts, no names — just a feed. New posts can require admin
approval before they go public.

This is a first prototype built from a whiteboard sketch: a feed grid of
posts with emoji reactions, a floating "+" to post, an NSFW flag, and
image + time-visibility controls.

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
   firebase deploy --only firestore:rules,storage:rules
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

(Optional) Set a Firestore TTL policy on the `expiresAt` field so posts
with a time-limited visibility are actually deleted server-side — the app
already hides expired posts client-side, but a TTL policy cleans up the
underlying documents.

## Admin approval

Every new gossip is created with a `status` of `pending` or `approved`,
controlled by a moderation setting ("Require approval before a gossip
goes public") that defaults to **on**. The public feed only shows
`approved` posts; an admin reviews `pending` ones at **`/admin`** and
approves or rejects each one, and can flip the moderation setting off to
let posts publish immediately instead.

**Local demo mode:** `/admin` is protected by a simple passcode (default
`admin1234`, override with `NEXT_PUBLIC_LOCAL_ADMIN_PASSCODE`). This is
just a UX gate for the prototype, not real security — fine since all the
data already lives only in your own browser's localStorage.

**With Firebase configured:** `/admin` requires signing in with Firebase
Authentication, and only accounts listed in the `admins` collection can
actually approve/reject posts or change the moderation setting — this is
enforced server-side by `firestore.rules`, not just hidden in the UI. To
bootstrap your first admin:

1. In the Firebase console, go to **Authentication → Users → Add user**
   and create an email/password account for yourself.
2. Copy that user's UID.
3. In **Firestore Database**, create a document at `admins/<uid>` (any
   fields, e.g. `{ email: "you@example.com" }` — only its existence is
   checked).
4. Sign in at `/admin` with that email/password.

Additional admins are added the same way (steps 1–3) by an existing admin
or project owner.

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
