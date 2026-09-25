"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.ComponentProps<"div"> {
  name: string;
  color?: string;
  size?: "sm" | "md" | "lg";
}

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const sizeMap = {
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-[13px]",
  lg: "h-14 w-14 text-[18px]",
};

function Avatar({ name, color = "var(--accent)", size = "md", className, ...props }: AvatarProps) {
  return (
    <div
      data-slot="avatar"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-white select-none",
        sizeMap[size],
        className
      )}
      style={{ backgroundColor: color }}
      {...props}
    >
      {initialsOf(name)}
    </div>
  );
}

export { Avatar };
