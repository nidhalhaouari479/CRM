import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed bg-slate-50/50 p-8 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-white text-slate-400 shadow-sm">
        <Icon className="size-5" />
      </span>
      <h3 className="mt-4 font-medium">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
    </div>
  );
}
