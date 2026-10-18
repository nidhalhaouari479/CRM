import { cn } from "@/lib/utils";

/** Initials tile for a client, project or person shown in lists. */
export function EntityAvatar({
  name,
  className,
}: {
  name: string | null | undefined;
  className?: string;
}) {
  const letters =
    (name ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase() || "?";
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-xs font-semibold text-accent-foreground",
        className,
      )}
    >
      {letters}
    </span>
  );
}
