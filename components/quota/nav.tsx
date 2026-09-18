"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutGrid, CalendarDays, Settings, Wallet, LogOut } from "lucide-react";
import { signOut } from "@/lib/actions/auth";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutGrid },
  { href: "/calendario", label: "Calendario", icon: CalendarDays },
  { href: "/impostazioni", label: "Impostazioni", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col border-r border-[var(--border)] bg-[var(--bg)] px-4 py-6 md:flex">
      <div className="flex items-center gap-2.5 px-2 pb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[var(--accent-soft)]">
          <Wallet className="h-[18px] w-[18px] text-[var(--accent-strong)]" strokeWidth={2.2} />
        </div>
        <span className="text-[15px] font-semibold tracking-[-0.01em]">Quota</span>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-[var(--dur-base)]",
                active
                  ? "bg-[var(--surface-muted)] text-[var(--text-primary)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
              )}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <form action={signOut} className="mt-2">
        <button
          type="submit"
          className="flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-[13.5px] font-medium text-[var(--text-tertiary)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]"
        >
          <LogOut className="h-[18px] w-[18px]" strokeWidth={2} />
          Esci
        </button>
      </form>
    </aside>
  );
}

export function TabBar() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 flex items-stretch justify-around border-t border-[var(--border)] bg-[var(--bg-elevated)]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      aria-label="Navigazione principale"
    >
      {NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-w-[64px] flex-1 flex-col items-center justify-center gap-1 py-2.5"
            aria-current={active ? "page" : undefined}
          >
            <Icon
              className={cn("h-[22px] w-[22px] transition-colors", active ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]")}
              strokeWidth={active ? 2.3 : 2}
            />
            <span className={cn("text-[10.5px] font-medium transition-colors", active ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]")}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
