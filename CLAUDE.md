# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

GossipBox — an anonymous gossip board (Next.js App Router + TypeScript +
Tailwind, deployed to Vercel, backed by Firebase). Anyone can post a short
text gossip with optional image and emoji, and mark it NSFW. Posts stay
visible forever and the feed is sorted newest-first by `createdAt`. New
posts can require admin approval before they go public. A second, unrelated section — Kind Words (`/messages`) — sits
alongside it: named (not anonymous) paragraph messages with an optional
photo, no moderation. See [README.md](README.md) for the full feature/setup
writeup.

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
default `alexissmart` — not real security, acceptable only because that
data never leaves the browser); Firebase mode uses real Firebase
Authentication plus an `admins/{uid}` allowlist collection, enforced
server-side by `firestore.rules` (not just hidden in the UI).

**When adding a data operation:** add the local implementation, the
Firestore implementation, then wire both into `postsStore.ts` (or
`adminAuth.ts`) — never call `localBackend`/`firestoreBackend` directly
from components.

Kind Words (`KindMessage`) follows the identical split but as its own
sibling set of files — `localMessagesBackend.ts` /
`firestoreMessagesBackend.ts` / `messagesStore.ts` — rather than being
folded into the posts files above. Posts and messages are unrelated
domains (no moderation, no reactions on messages) that happen
to share the same dual-backend *pattern*; keep them in separate files
rather than merging, and follow this same sibling-files approach for any
future third domain instead of growing `postsStore.ts` to cover it.

## Moderation / approval workflow

Every `GossipPost` has a `status`: `"pending" | "approved" | "rejected"`.
The public feed query always filters to `status == "approved"`. The admin
dashboard's Pending tab (`AdminDashboard.tsx`) has no query of its own —
it subscribes to every post via `subscribeToAllPosts` and derives the
pending subset with `useMemo`; there's deliberately no separate
`subscribeToPendingPosts` anymore (it existed once and was removed as
dead code once the dashboard stopped calling it — don't re-add a
narrower query without re-wiring a caller to it). Whether a new post
starts as `pending` or `approved` is decided at creation time by a
`ModerationSettings` document/localStorage key (`requireApproval`,
defaults to `true`, declared in `src/lib/types.ts`), editable from the
admin panel.

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

## Comments

Unlike reactions (a `Record<emoji, count>`) and unlike Kind Words
(a whole separate collection), comments are a `GossipComment[]` array
embedded directly *on* the post document (`post.comments`), added via
`addComment(postId, text)` in `postsStore.ts`. In Firestore mode
(`firestoreAddComment`) this is a single `updateDoc({ comments:
arrayUnion(comment) })` — `arrayUnion` appends atomically server-side, so
two people commenting at once can't race and clobber each other the way
the reactions read-modify-write theoretically can. In local mode
(`localAddComment`) it's a plain array push since localStorage access is
single-threaded anyway. Comments are anonymous (no name field) to match
the rest of GossipBox, always visible once a post is visible (no
moderation), and not surfaced anywhere in `AdminDashboard.tsx` — adding
comment moderation/visibility there would be a deliberate follow-up, not
something already wired in.

`localBackend.ts`'s `readPosts()` backfills `comments: []` for any post
record saved before this field existed (same idea applies implicitly in
Firestore via `toPost`'s `data.comments ?? []`) — don't assume
`post.comments` is always present without that fallback if you add
another reader of raw stored posts.

`firestore.rules`' `comments`-only update branch enforces the array grew
by *exactly* one entry (blocking a write from silently replacing or
deleting existing comments through this same field) and length-validates
only the newly-appended entry's `text` — mirrors the `reactions`-only
branch next to it but is stricter, since an array (unlike a map) can be
wholesale overwritten in one write with no way to reject that other than
checking size().

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
- `messages/{messageId}` (Kind Words) is always publicly readable, has no
  status/moderation gate, and rejects `update`/`delete` outright — the
  only allowed write is `create`, field- and length-validated the same
  way `posts` validates `text`. Storage mirrors this with a
  `message-photos/{photoId}` path (same 8MB/image-type check as
  `gossip-images/{imageId}`) in `storage.rules`.

## Component structure

- `GossipFeed` (`src/components/GossipFeed.tsx`) is the main client
  orchestrator: subscribes to posts + moderation settings, owns the NSFW
  filter and compose-modal state, shows a post-submit toast.
- `PostCard` + `ReactionBar` + `CommentSection` render one feed item,
  including the NSFW blur/tap-to-reveal overlay. `CommentSection` is
  collapsed by default (a "💬 N comments" toggle) with its own draft-text
  state and submit button — it doesn't subscribe to anything itself, it
  just renders whatever `comments` array it's passed and calls
  `onAddComment(postId, text)`, threaded down from `GossipFeed` the same
  way `onReact` already was.
- `ComposeModal` + `EmojiPicker` handle authoring a new post.
- `/admin` (`src/app/admin/page.tsx`) renders `AdminLogin` or
  `AdminDashboard` depending on `subscribeAdminSession`. `AdminDashboard`
  (`src/components/AdminDashboard.tsx`) is a single component with an
  internal tab bar (`TABS` array — add a new `TabId` + case there to add
  a section, e.g. a future contact-info page) covering Overview (stat
  counts), Pending (approve/reject queue), All gossips (every post,
  status-filterable, status changeable in either direction), and Settings
  (moderation toggle + print/export). It drives everything from a single
  `subscribeToAllPosts` subscription and derives pending/stats/filtered
  lists from that with `useMemo` rather than subscribing multiple times.
- "Print memories" (Settings tab) is a manual selection, not just a status
  filter: `selectedIds` (a `Set<string>` of post ids) is the actual print
  set; `printFilter` only narrows which posts the checklist *shows* to
  pick from ("Select all" adds every currently-filtered candidate into
  `selectedIds`, it doesn't replace the filter with the selection — switching
  the filter never silently drops an existing selection). `printPosts`
  (`allPosts.filter(p => selectedIds.has(p.id))`) is what actually renders
  in the print view.
- The print view itself (`hidden print:block`, a keepsake card per post
  with photo/date/reaction counts) renders as a **sibling** of the real
  dashboard UI (wrapped in `print:hidden`) — both live under a top-level
  `<>...</>` in `AdminDashboard.tsx`, deliberately *not* nested inside each
  other. They used to be nested, which let the dark dashboard background
  leak into the printed page; keep them siblings if you touch this again.
  The global dark `body` background (`src/app/globals.css`) is separately
  forced white under `@media print` for the same reason. `window.print()`
  always prints the current `printPosts` selection regardless of which tab
  is on screen.

Types are centralized in `src/lib/types.ts` (`GossipPost`, `PostStatus`,
`ModerationSettings`, `REACTION_EMOJIS`, `KindMessage`, `NewMessageInput`)
— read it first when touching the data model. Posts have no expiry field;
both backends sort/query by `createdAt` descending and every approved
post stays in the feed forever.

## Kind Words (`/messages`)

A second, independent board — `src/app/messages/page.tsx` renders
`KindWordsBoard`, which is structurally a simplified sibling of
`GossipFeed` (same subscribe-in-`useEffect` + floating "+" + toast
pattern) but for `KindMessage`s instead of `GossipPost`s: `name` +
`text` (paragraph, up to `MAX_MESSAGE_LENGTH`) + optional `photoUrl`, no
`nsfw`, no `reactions`, no moderation `status` —
messages publish immediately on create. `MessageCard` shows the photo, or
an initial-letter avatar (`bg-rose-500/20` circle) when none was
attached. `ComposeMessageModal` is the compose form. `Header.tsx`
(Gossip's header) and `KindWordsBoard`'s own header cross-link `/` and
`/messages` — if you rename either route, update both links. This board
is intentionally outside the admin dashboard entirely: no pending queue,
no print/export, no stats tile — `AdminDashboard.tsx` only ever deals
with `GossipPost`s.
