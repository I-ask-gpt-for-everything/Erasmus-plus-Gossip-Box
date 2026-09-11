"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Gossip", icon: "🤫" },
  { href: "/messages", label: "Kind Words", icon: "💌" },
  { href: "/photos", label: "Photos & Personal Info", icon: "📸" },
  { href: "/admin", label: "Admin", icon: "⚙️" },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="print:hidden sticky top-0 z-40 flex h-screen w-16 sm:w-56 shrink-0 flex-col border-r border-white/10 bg-neutral-950">
      <div className="px-2 py-5 sm:px-4">
        <p className="hidden sm:block text-lg font-bold text-white tracking-tight">
          🤫 GossipBox
        </p>
        <p className="text-center sm:hidden text-xl">🤫</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={`flex items-center gap-3 rounded-xl px-2.5 sm:px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="hidden sm:inline truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
