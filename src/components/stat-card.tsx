import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tones = {
  blue: "bg-info-muted text-info",
  green: "bg-success-muted text-success",
  amber: "bg-warning-muted text-warning",
  violet: "bg-violet-muted text-violet",
  red: "bg-destructive-muted text-destructive",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: keyof typeof tones;
}) {
  return (
    <Card className="shadow-card transition-shadow duration-200 hover:shadow-raised">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="tabular mt-2 truncate text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {hint && (
            <p className="mt-1.5 text-xs text-subtle-foreground">{hint}</p>
          )}
        </div>
        <div
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-lg",
            tones[tone],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}
