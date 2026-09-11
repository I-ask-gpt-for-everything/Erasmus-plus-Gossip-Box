"use client";

interface HeaderProps {
  showNsfw: boolean;
  onToggleNsfw: (value: boolean) => void;
  printMode: boolean;
  onTogglePrint: (value: boolean) => void;
}

export default function Header({
  showNsfw,
  onToggleNsfw,
  printMode,
  onTogglePrint,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-neutral-950/80 backdrop-blur-md">
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
          <label className="flex items-center gap-2 text-xs text-white/60">
            <span className="whitespace-nowrap">Show NSFW</span>
            <input
              type="checkbox"
              checked={showNsfw}
              onChange={(e) => onToggleNsfw(e.target.checked)}
              className="h-4 w-4 rounded accent-rose-500"
            />
          </label>
          <button
            onClick={() => onTogglePrint(!printMode)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              printMode
                ? "bg-rose-500/20 text-rose-300"
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            🖨️ Print
          </button>
        </div>
      </div>
    </header>
  );
}
