"use client";

interface HeaderProps {
  showNsfw: boolean;
  onToggleNsfw: (value: boolean) => void;
  isDemoMode: boolean;
}

export default function Header({ showNsfw, onToggleNsfw, isDemoMode }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            🤫 GossipBox
          </h1>
          <p className="text-xs text-white/40">
            100% anonymous · say what you really think
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isDemoMode && (
            <span className="hidden sm:inline rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-amber-300">
              Local demo mode
            </span>
          )}
          <label className="flex items-center gap-2 text-xs text-white/60">
            <span className="whitespace-nowrap">Show NSFW</span>
            <input
              type="checkbox"
              checked={showNsfw}
              onChange={(e) => onToggleNsfw(e.target.checked)}
              className="h-4 w-4 rounded accent-rose-500"
            />
          </label>
        </div>
      </div>
    </header>
  );
}
