# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

GossipBox — an anonymous gossip board (Next.js App Router + TypeScript +
Tailwind, deployed to Vercel, backed by Firebase). Anyone can post a short
text gossip with optional image and emoji, mark it NSFW, and choose how
long it stays visible. New posts can require admin approval before they
go public. See [README.md](README.md) for the full feature/setup writeup.

## Commands

```bash
npm run dev      # start dev server at localhost:3000 (Turbopack)
npm run build    # production build (also type-checks)
npm run start    # run a production build
npm run lint     # eslint
npx tsc --noEmit # type-check only, faster than a full build
```

There is no test suite configured in this repo yet.

## Architecture: dual-backend data layer

The entire app is designed to run either against Firebase or, with zero
config, against `localStorage` in the same browser — this is the single
most important thing to understand before touching data logic.

`src/lib/firebase.ts` exports `isFirebaseConfigured` (true only if
`NEXT_PUBLIC_FIREBASE_API_KEY` and `NEXT_PUBLIC_FIREBASE_PROJECT_ID` are
set). Every data-access module is split into two parallel implementations
switched on that flag:

- `src/lib/postsStore.ts` — the only module components import from. Each
  exported function (`subscribeToPosts`, `createPost`, `toggleReaction`,
  `approvePost`, etc.) just dispatches to...
- `src/lib/localBackend.ts` — localStorage-backed implementation, using a
  module-level `EventTarget` as a pub/sub bus so multiple subscribers
  (feed + admin queue) stay in sync within the same tab, plus a `storage`
  event listener for cross-tab sync.
- `src/lib/firestoreBackend.ts` — Firestore/Storage-backed implementation
  using `onSnapshot` queries.

`src/lib/adminAuth.ts` follows the same split pattern for admin sessions:
local mode uses a passcode compared client-side (`NEXT_PUBLIC_LOCAL_ADMIN_PASSCODE`,
default `admin1234` — not real security, acceptable only because that
data never leaves the browser); Firebase mode uses real Firebase
Authentication plus an `admins/{uid}` allowlist collection, enforced
server-side by `firestore.rules` (not just hidden in the UI).

**When adding a data operation:** add the local implementation, the
Firestore implementation, then wire both into `postsStore.ts` (or
`adminAuth.ts`) — never call `localBackend`/`firestoreBackend` directly
from components.

## Moderation / approval workflow

Every `GossipPost` has a `status`: `"pending" | "approved" | "rejected"`.
The public feed query always filters to `status == "approved"`; the admin
queue (`/admin`) filters to `"pending"`. Whether a new post starts as
`pending` or `approved` is decided at creation time by a `ModerationSettings`
document/localStorage key (`requireApproval`, defaults to `true`,
declared in `src/lib/types.ts`), editable from the admin panel.

In Firebase mode this default is re-validated server-side: `firestore.rules`
reads `settings/moderation` via `get()` inside the `create` rule and
rejects any post whose `status` doesn't match what the setting currently
requires. If you change how initial status is computed on the client,
update `firestore.rules` to match or writes will start failing.

## Reactions

`REACTION_EMOJIS` in `src/lib/types.ts` is the fixed emoji palette
(❤️😂😮😢🔥👍). Each post stores a `reactions: Record<string, number>` map
of emoji → count. `src/lib/reactionTracker.ts` tracks, purely client-side
in `localStorage`, which emojis *this browser* has already reacted with
per post (independent of which backend is active) so `ReactionBar` can
toggle the active state — there's no server-side identity to dedupe
reactions by.

## Firestore security rules

`firestore.rules` and `storage.rules` are the real enforcement boundary
when Firebase is configured — the client/UI checks are only for UX. They
must be deployed manually (`firebase deploy --only firestore:rules,storage:rules`);
editing the `.rules` files in this repo does nothing to a live Firebase
project until redeployed. Key invariants encoded there:

- A post is only readable once `status == "approved"`, unless the reader
  is in `admins/{uid}`.
- Only an admin may change a post's `status`; anyone may update the
  `reactions` map (that's the reaction-toggle write).
- The `admins` collection can't be written by clients at all — the first
  admin is bootstrapped manually via the Firebase console (see README
  "Admin approval" section for the exact steps).

## Component structure

- `GossipFeed` (`src/components/GossipFeed.tsx`) is the main client
  orchestrator: subscribes to posts + moderation settings, owns the NSFW
  filter and compose-modal state, shows a post-submit toast.
- `PostCard` + `ReactionBar` render one feed item, including the NSFW
  blur/tap-to-reveal overlay.
- `ComposeModal` + `EmojiPicker` handle authoring a new post.
- `/admin` (`src/app/admin/page.tsx`) renders `AdminLogin` or `AdminPanel`
  depending on `subscribeAdminSession` — `AdminPanel` holds the
  moderation-setting toggle and the pending-post approve/reject queue.

Types are centralized in `src/lib/types.ts` (`GossipPost`, `PostStatus`,
`ModerationSettings`, `VisibilityDuration` + `visibilityToExpiresAt`,
`REACTION_EMOJIS`) — read it first when touching the data model.
