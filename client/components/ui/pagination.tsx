"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 25];

const MAX_VISIBLE_PAGES = 5;

type PaginationProps = {
  total: number;
  pageSize: number;
  page: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

function getPageNumbers(current: number, totalPages: number): (number | "ellipsis")[] {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const pages: (number | "ellipsis")[] = [];
  const half = Math.floor(MAX_VISIBLE_PAGES / 2);
  let start = Math.max(0, current - half);
  let end = Math.min(totalPages, start + MAX_VISIBLE_PAGES);
  if (end - start < MAX_VISIBLE_PAGES) {
    start = Math.max(0, end - MAX_VISIBLE_PAGES);
  }
  if (start > 0) {
    pages.push(0);
    if (start > 1) pages.push("ellipsis");
  }
  for (let i = start; i < end; i++) pages.push(i);
  if (end < totalPages) {
    if (end < totalPages - 1) pages.push("ellipsis");
    pages.push(totalPages - 1);
  }
  return pages;
}

export function Pagination({
  total,
  pageSize,
  page,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total === 0) return null;

  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">Per page</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) => onPageSizeChange(Number(v))}
        >
          <SelectTrigger className="w-[72px] h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGE_SIZE_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onPageChange(Math.max(0, page - 1))}
          disabled={page === 0}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <div className="flex items-center gap-1 mx-1">
          {pageNumbers.map((p, i) =>
            p === "ellipsis" ? (
              <span key={`e-${i}`} className="px-2 text-slate-400">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={page === p ? "default" : "outline"}
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => onPageChange(p)}
              >
                {p + 1}
              </Button>
            )
          )}
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
          disabled={page >= totalPages - 1}
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
