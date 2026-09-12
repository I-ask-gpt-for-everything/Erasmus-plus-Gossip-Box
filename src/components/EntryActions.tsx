"use client";

interface EntryActionsProps {
  isOwner: boolean;
  isAdmin: boolean;
  /** Singular noun for the thing being acted on, e.g. "message" or "entry". */
  label: string;
  onEdit: () => void;
  onDelete: () => void;
}

// The edit/delete controls shared by MessageCard and PhotoEntryCard. The two
// boards keep their data modules separate on purpose (see CLAUDE.md), but this
// is presentation, and keeping one copy means the wording and the
// owner-or-admin condition can't drift between them.
export default function EntryActions({
  isOwner,
  isAdmin,
  label,
  onEdit,
  onDelete,
}: EntryActionsProps) {
  if (!isOwner && !isAdmin) return null;

  function handleDelete() {
    // Deliberately not "this can't be undone" — deleting is a soft delete, so
    // the document survives and an admin can still flip it back in the
    // Firebase console. It does disappear from the board for everyone.
    if (window.confirm(`Delete this ${label}? It will disappear from the board.`)) {
      onDelete();
    }
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        onClick={onEdit}
        className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-white/80 transition-colors"
        aria-label={`Edit ${label}`}
      >
        ✏️
      </button>
      <button
        onClick={handleDelete}
        className="rounded-full p-1.5 text-white/40 hover:bg-white/10 hover:text-red-300 transition-colors"
        aria-label={`Delete ${label}`}
      >
        🗑️
      </button>
    </div>
  );
}
