import { frenchLabel } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const green = [
  "Paid",
  "Completed",
  "Confirmed",
  "Converted",
  "Active",
  "Closed",
  "Done",
];
const amber = [
  "Waiting",
  "Partially Paid",
  "Proposal",
  "On Hold",
  "In Discussion",
  "Pending",
  "Open",
  "Todo",
];
const red = ["Lost", "Cancelled", "Refunded", "Inactive", "Overdue", "Blocked"];
const blue = ["Reviewed", "In Progress"];

export function StatusBadge({ value }: { value: string }) {
  const className = green.includes(value)
    ? "border-success/25 bg-success-muted text-success before:bg-success"
    : red.includes(value)
      ? "border-destructive/25 bg-destructive-muted text-destructive before:bg-destructive"
      : amber.includes(value)
        ? "border-warning/25 bg-warning-muted text-warning before:bg-warning"
        : blue.includes(value)
          ? "border-info/25 bg-info-muted text-info before:bg-info"
          : "border-border bg-muted text-muted-foreground before:bg-subtle-foreground";
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 font-medium before:size-1.5 before:shrink-0 before:rounded-full",
        className,
      )}
    >
      {frenchLabel(value)}
    </Badge>
  );
}
