"use client";
import { Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SpeakButton({ onSpeak, label = "Listen", className, size = "sm" }: { onSpeak: () => void; label?: string; className?: string; size?: "sm" | "md" }) {
  return (
    <button type="button" onClick={onSpeak} aria-label={label} title={label}
      className={cn("inline-grid shrink-0 place-items-center rounded-full text-primary transition-colors hover:bg-primary-soft",
        size === "sm" ? "size-8 [&_svg]:size-4" : "size-10 [&_svg]:size-5", className)}>
      <Volume2 />
    </button>
  );
}
