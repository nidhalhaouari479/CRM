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
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : red.includes(value)
      ? "border-red-200 bg-red-50 text-red-700"
      : amber.includes(value)
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : blue.includes(value)
          ? "border-blue-200 bg-blue-50 text-blue-700"
          : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <Badge variant="outline" className={cn("font-medium", className)}>
      {frenchLabel(value)}
    </Badge>
  );
}
