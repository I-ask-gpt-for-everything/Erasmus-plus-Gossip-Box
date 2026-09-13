# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

GossipBox — an anonymous gossip board (Next.js App Router + TypeScript +
Tailwind, deployed on Firebase App Hosting, backed by Firebase). Anyone can post a short
text gossip with optional image and emoji, and mark it NSFW. Posts stay
visible forever and the feed is sorted newest-first by `createdAt`. New
posts can require admin approval before they go public. Two more,
unrelated sections sit alongside it, both named (not anonymous) and
unmoderated: **Kind Words** (`/messages`) — a paragraph message with an
optional photo — and **Photos & Personal Info** (`/photos`) — a photo
link, an Instagram handle, and/or an uploaded picture. A persistent
left `Sidebar` (all routes, `src/components/Sidebar.tsx`) links all four
sections (`/`, `/messages`, `/photos`, `/admin`). See
[README.md](README.md) for the full feature/setup writeup and
[ARCHITECTURE.md](ARCHITECTURE.md) for a deeper technical reference
(data model, security rules, routing/component maps, diagrams).

## Commands

```bash
npm run dev      # start dev server at localhost:3000 (Turbopack)
npm run build    # production build (also type-checks)
npm run start    # run a production build
npm run lint     # eslint
npx tsc --noEmit # type-check only, faster than a full build
```

There is no test suite configured in this repo yet.

## Generating ids: always `uuid()`, never `crypto.randomUUID()`

Use `import { v4 as uuid } from "uuid"` for every generated id and Storage
object name. `crypto.randomUUID()` is `undefined` outside a secure context,
so it throws the moment the app is opened over plain `http://` — which is
exactly how you test on a phone against the dev server
(`http://192.168.x.x:3000`). It had crept into the Firestore backends while
the local backends used `uuid()` throughout, which made image uploads and
comment posting fail on precisely the connection used for device testing,
and work everywhere else. `uuid` is already a dependency.

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

Kind Words (`KindMessage`) and Photos & Personal Info (`PhotoEntry`) each
follow the identical split but as their own sibling sets of files —
`localMessagesBackend.ts` / `firestoreMessagesBackend.ts` /
`messagesStore.ts`, and `localPhotosBackend.ts` /
`firestorePhotosBackend.ts` / `photosStore.ts` — rather than being folded
into the posts files above. Posts, messages, and photo entries are
unrelated domains (no moderation, no reactions outside of Gossip) that
happen to share the same dual-backend *pattern*; keep them in separate
files rather than merging, and follow this same sibling-files approach
for any future additional board instead of growing `postsStore.ts` to
cover it.

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
must be deployed manually (`firebase deploy --only firestore:rules,storage`);
editing the `.rules` files in this repo does nothing to a live Firebase
project until redeployed. Key invariants encoded there:

- A post is only readable once `status == "approved"`, unless the reader
  is in `admins/{uid}`.
- Only an admin may change a post's `status`; anyone may update the
  `reactions` map (that's the reaction-toggle write).
- The `admins` collection can't be written by clients at all — the first
  admin is bootstrapped manually via the Firebase console (see README
  "Admin approval" section for the exact steps).
- `messages/{messageId}` (Kind Words) is **unconditionally** publicly
  readable — soft-deleted documents included — and has no
  status/moderation gate. The read rule deliberately does *not* gate on
  `deleted`: Firestore evaluates list rules against a query's potential
  result set, so the unconstrained `orderBy('createdAt')` listen both
  boards use is rejected outright for any reader once the rule depends on
  a per-document field, and adding `where('deleted','==',false)` instead
  would hide every document written before that field existed (equality
  filters skip documents missing the field, and `update` only ever allows
  `deleted → true`, so there's no client-side backfill). Both backends
  filter `deleted` out of the subscription callback instead. `create` is
  field- and length-validated the same way `posts` validates `text`, plus
  a required `authorId` string (see "Editing and deleting" under Kind
  Words below for what that is). `update` allows exactly two shapes: a
  content edit (`name`/`text`/`photoUrl`, same validation as create), or
  a soft-delete (`deleted` flipped to `true` only — never back to
  `false` through this rule). Neither shape carries a server-side author
  check: `authorId` is publicly readable, so any rule comparing it
  against a client-supplied value enforces nothing — ownership is a UI
  affordance only, and the rule's job is to constrain the *shape* of the
  write. `delete` (the real Firestore operation) is
  still `if false` — nothing is ever hard-deleted. Storage mirrors this
  with a `message-photos/{photoId}` path (same 8MB/image-type check as
  `gossip-images/{imageId}`) in `storage.rules`; replacing or
  soft-deleting a photo does **not** clean up its old Storage object
  (matches this app's no-expiry, nothing-ever-really-goes-away posture
  elsewhere — `deleteObject` is intentionally unused).
- `photoEntries/{entryId}` (Photos & Personal Info) follows the same
  unconditionally-readable, shape-validated-update, soft-delete-only
  shape as `messages`, but its `create`/content-edit validation (which
  also allows an optional `city`, ≤60 chars)
  additionally requires `username` plus at least one of a non-empty
  `text`, a non-empty `photoLink`, or a non-null `photoUrl` — mirroring
  the client's `canSubmit` check in `ComposePhotoEntryModal.tsx`. Storage
  mirrors this with a `photo-entries/{photoId}` path (same 8MB/image-type
  check as the other two media paths) in `storage.rules`.
- A check against an optional field must use `.get(key, default)`, not
  bare dot-access — dot-accessing a field that doesn't exist on a
  document throws an evaluation error rather than returning `null`, and
  an error on one side of `||`/`&&` still denies the whole rule. This
  bites on every pre-existing `messages`/`photoEntries` document written
  before the `authorId`/`deleted` fields existed. It's why
  `validMediaUrl()` is called as
  `validMediaUrl(request.resource.data.get('photoUrl', null))` rather
  than passing `request.resource.data.photoUrl`: the content-edit branch
  is reached by any write touching only `name`/`text` too, so on a
  document that has no `photoUrl` field at all the bare access would
  error instead of evaluating, and the edit would be denied. Note
  that `request.resource.data` is the *merged* post-write document, so it
  inherits this hazard from the stored document — being written in the
  same request is what makes a field safe to dot-access, not being
  mentioned in the rule.

## Component structure

- `Sidebar` (`src/components/Sidebar.tsx`) is mounted once at the layout
  level (`src/app/layout.tsx`), not per-page — it's the persistent left
  nav across all four routes (`/`, `/messages`, `/photos`, `/admin`) via a
  static `NAV_ITEMS` array, collapsing to an icon-only rail below the `sm`
  breakpoint. It's also where all cross-board navigation lives now — see
  the note at the end of the "Kind Words" section below if you're looking
  for where boards link to each other.
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
`ModerationSettings`, `REACTION_EMOJIS`, `KindMessage`, `NewMessageInput`,
`PhotoEntry`, `NewPhotoEntryInput`)
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
attached. `ComposeMessageModal` is the compose form. Cross-board
navigation lives in the global `Sidebar` (see "Component structure"
above), not in `Header.tsx` or a board's own header — if you rename a
route, update `NAV_ITEMS` in `Sidebar.tsx`. This board is intentionally
outside the admin dashboard entirely: no pending queue, no print/export,
no stats tile — `AdminDashboard.tsx` only ever deals with `GossipPost`s.
(Admins *can* still edit/delete individual messages, just directly on
the board itself rather than through `AdminDashboard.tsx` — see "Editing
and deleting" below.)

## Photos & Personal Info (`/photos`)

A third independent board, structurally identical to Kind Words but with
more optional fields — `src/app/photos/page.tsx` renders `PhotosBoard`,
which follows the same subscribe-in-`useEffect` + floating "+" + toast
pattern for `PhotoEntry` instead of `KindMessage`: `username` (required)
plus *any combination* of `text`, a pasted `photoLink` (rendered as a
plain clickable link, not necessarily an image), an `instagram` handle
(rendered as a link to `instagram.com/<handle>`, accepting either a bare
handle or a full URL — see `instagramHref()` in `PhotoEntryCard.tsx`),
the `city` they live in (plain text, shown as `📍 City` in the card's
header subline), and/or an actual uploaded `photoUrl`. The compose form's
submit button requires `username` plus **at least one** of `text` /
`photoLink` / uploaded photo (see `canSubmit` in
`ComposePhotoEntryModal.tsx`) — unlike Kind Words, where `text` alone is
mandatory. `instagram` and `city` are extras and deliberately don't count
toward that requirement. `city` was added after entries already existed,
so both backends backfill it to `null` and `firestore.rules` validates
it through `validCity(request.resource.data.get('city', null))`. `PhotoEntryCard` shows the
uploaded photo, or an initial-letter avatar (`bg-sky-500/20` circle,
Photos' accent color vs. Kind Words' rose) when none was attached. No
`nsfw`, no `reactions`, no moderation `status` — entries publish
immediately, and this board is outside the admin dashboard the same way
Kind Words is. Editing and deleting follow the identical mechanism
described under Kind Words below — `updatePhotoEntry`/`deletePhotoEntry`
in `photosStore.ts`, same `authorId`/soft-delete shape, same
`ComposePhotoEntryModal` `initialValue` prop for edit mode.

## Editing and deleting (Kind Words and Photos & Personal Info)

Both boards let the original poster's own browser edit or delete their
entry, and let a logged-in admin do the same to anyone's — this is
**not** enforced through `AdminDashboard.tsx` (both boards stay outside
it, per above); instead `KindWordsBoard`/`PhotosBoard` each subscribe to
`subscribeAdminSession` directly and pass `isAdmin` straight down to
`MessageCard`/`PhotoEntryCard`, which render edit/delete icon buttons
whenever `isOwner || isAdmin`.

"Own browser" is tracked by `src/lib/authorTracker.ts`'s `getAuthorId()`
— a `uuid()` persisted in `localStorage` (`gossipbox_author_id`), stamped
onto every `KindMessage`/`PhotoEntry` as `authorId` at creation, and
compared client-side (`entry.authorId === getAuthorId()`) to compute
`isOwner`. That comparison is the **only** place ownership is checked:
`firestore.rules` has no server-side counterpart, deliberately, because
both collections stay publicly readable (see "Firestore security rules"
above) — the id is visible to anyone who reads the document, so a rule
comparing it against a client-supplied value would enforce nothing while
looking like it did. So it's a UI affordance that prevents
accidental/casual cross-editing and nothing more, the same class of
tradeoff already accepted for reactions ("no server-side identity to
dedupe reactions by") and the local admin passcode. Real per-author
enforcement would need Firebase Anonymous Auth, which was deliberately
not added here as disproportionate scope.

Two footguns in `getAuthorId()` that the guards there exist for: both
`localStorage` accesses are wrapped in `try`/`catch` (a browser with site
data blocked throws on the access itself, and both boards call this
during render, so an exception takes the whole page down), and it uses
`uuid()` (see below). It returns `""` on the server, which is also what a
pre-`authorId` document backfills to, so `isOwner` comparisons must
reject the empty id (`!!myAuthorId && entry.authorId === myAuthorId`)
rather than let `"" === ""` grant edit rights over every legacy entry.

"Delete" (`deleteMessage`/`deletePhotoEntry` in `messagesStore.ts`/
`photosStore.ts`) is a **soft delete** — it sets `deleted: true` rather
than calling Firestore's real `delete`, both to match the rest of this
app's "nothing ever truly disappears" posture (rejected `GossipPost`s
persist forever too) and because a real `delete` request carries no
`request.resource.data`, so a `firestore.rules` `allow delete` can only
ever check pre-existing `resource.data` — it can't validate a
client-asserted author claim the way `allow update` can via
`request.resource.data.diff(resource.data)`. Both backends' `emit`/
`onSnapshot` subscriptions filter out `deleted === true` entries before
calling back, so a soft-deleted entry simply vanishes from the feed —
there's no undelete path in the app (only via the Firebase console).

Editing reuses the same `NewMessageInput`/`NewPhotoEntryInput` shape as
creation: `ComposeMessageModal`/`ComposePhotoEntryModal` take an optional
`initialValue` prop that seeds form state (including the photo preview,
straight from the existing `photoUrl`) and swaps the header/button copy
to "Edit…"/"Save changes". `resolveImageUrl(imageDataUrl, pathPrefix)` in
`src/lib/firestoreImageUpload.ts` turns the submitted image field into
one of three outcomes — nothing (`null`, or the empty string a cleared
field can produce) clears it, a `data:` URL means a fresh pick (upload
it), anything else is the untouched existing `https://` URL (pass
through, no re-upload). **Every** Firestore image path goes through it:
create and update for messages and photoEntries, plus `firestoreCreatePost`'s
`gossip-images` upload. They each used to carry their own copy, so put any
change to upload behaviour here rather than re-inlining it. Replaced or
removed Storage images are never cleaned up, consistent with the
no-Storage-cleanup note above.
