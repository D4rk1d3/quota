import * as React from "react";
import { Sidebar, TabBar } from "@/components/quota/nav";
import { ThemeToggle } from "@/components/quota/theme-toggle";
import { cn } from "@/lib/utils";

export function PageShell({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="min-h-dvh bg-[var(--bg)]">
      <Sidebar />
      <div className="md:pl-[232px]">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)]/85 px-5 py-4 backdrop-blur-md md:px-8 md:py-5">
          <div>
            <h1 className="text-[20px] font-semibold tracking-[-0.015em] text-[var(--text-primary)] md:text-[24px]">
              {title}
            </h1>
            {subtitle && <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {action}
            <ThemeToggle />
          </div>
        </header>
        <main className={cn("mx-auto max-w-[1040px] px-5 pb-28 pt-6 md:px-8 md:pb-16", className)}>
          {children}
        </main>
      </div>
      <TabBar />
    </div>
  );
}
