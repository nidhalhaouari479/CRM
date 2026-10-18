import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Card footer showing the visible range plus previous / next links. */
export function TablePagination({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  if (total <= pageSize) return null;
  const first = (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  const hasPrevious = page > 1;
  const hasNext = last < total;
  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 border-t px-4 py-3"
    >
      <p className="tabular text-sm text-muted-foreground">
        <span className="font-medium text-foreground">
          {first}–{last}
        </span>{" "}
        sur {total}
      </p>
      <div className="flex gap-2">
        <Button
          render={<Link href={hrefFor(page - 1)} />}
          nativeButton={false}
          variant="outline"
          size="sm"
          disabled={!hasPrevious}
          aria-disabled={!hasPrevious}
          tabIndex={hasPrevious ? undefined : -1}
        >
          <ChevronLeft aria-hidden="true" />
          Précédent
        </Button>
        <Button
          render={<Link href={hrefFor(page + 1)} />}
          nativeButton={false}
          variant="outline"
          size="sm"
          disabled={!hasNext}
          aria-disabled={!hasNext}
          tabIndex={hasNext ? undefined : -1}
        >
          Suivant
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}
