"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "./utils";
import { buttonVariants } from "./button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: React.ComponentProps<typeof DayPicker>) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-semibold text-white",
        nav: "flex items-center gap-1",
        nav_button: cn(
          "size-7 bg-white/10 hover:bg-white/20 border-white/20 p-0 rounded-lg transition-all text-white hover:text-[#B3A369]",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-x-1",
        head_row: "flex",
        head_cell:
          "text-[#B3A369] rounded-md w-9 font-semibold text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md",
        ),
        day: cn(
          "size-9 p-0 font-normal text-white hover:bg-white/10 rounded-lg transition-all",
        ),
        day_range_start:
          "day-range-start",
        day_range_end:
          "day-range-end",
        day_selected:
          "bg-gradient-to-br from-[#B3A369] to-[#d4c58a] text-[#003057] font-bold hover:from-[#d4c58a] hover:to-[#B3A369] focus:from-[#B3A369] focus:to-[#d4c58a] shadow-lg",
        day_today: "bg-white/20 text-white font-semibold border border-[#B3A369]/50",
        day_outside:
          "day-outside text-gray-600 opacity-50",
        day_disabled: "text-gray-600 opacity-30 cursor-not-allowed",
        day_range_middle:
          "aria-selected:bg-white/10 aria-selected:text-white",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("size-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("size-4", className)} {...props} />
        ),
      }}
      {...props}
    />
  );
}

export { Calendar };