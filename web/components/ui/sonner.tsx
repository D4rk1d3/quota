"use client";
import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme();
  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast:
            "group toast rounded-[var(--radius-md)]! border! border-[var(--border)]! bg-[var(--surface)]! text-[var(--text-primary)]! shadow-[var(--shadow-elevated)]!",
          description: "text-[var(--text-secondary)]!",
          actionButton: "bg-[var(--accent)]! text-white!",
        },
      }}
      {...props}
    />
  );
}

export { Toaster };
