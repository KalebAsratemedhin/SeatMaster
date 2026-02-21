"use client";

import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-background group/calendar p-3 [--cell-size:--spacing(8)]",
        className
      )}
      classNames={{
        ...defaultClassNames,
        root: cn("w-fit", defaultClassNames.root),
        months: cn("flex flex-col gap-4 sm:flex-row", defaultClassNames.months),
        month: cn("flex flex-col gap-4", defaultClassNames.month),
        month_caption: cn(
          "flex justify-center pt-1 relative h-(--cell-size)",
          defaultClassNames.month_caption
        ),
        nav: cn(
          "flex items-center gap-1 absolute top-1 inset-x-0 justify-between",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: "ghost" }),
          "size-(--cell-size) absolute left-1 p-0",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost" }),
          "size-(--cell-size) absolute right-1 p-0",
          defaultClassNames.button_next
        ),
        caption_label: cn("text-sm font-medium", defaultClassNames.caption_label),
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground rounded-md w-(--cell-size) font-normal text-[0.8rem]",
          defaultClassNames.weekday
        ),
        week: cn("flex mt-2 w-full", defaultClassNames.week),
        day: cn(
          "relative w-(--cell-size) h-(--cell-size) p-0 text-center text-sm focus-within:relative",
          defaultClassNames.day
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "size-(--cell-size) p-0 font-normal aria-selected:opacity-100 data-[selected]:bg-primary data-[selected]:text-primary-foreground data-[today]:bg-accent data-[today]:text-accent-foreground data-[outside]:text-muted-foreground data-[outside]:opacity-50 data-[disabled]:text-muted-foreground data-[disabled]:opacity-50",
          defaultClassNames.day_button
        ),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...p }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className="size-4" {...p} />
          ) : (
            <ChevronRightIcon className="size-4" {...p} />
          ),
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
