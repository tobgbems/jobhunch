"use client";

import { Star } from "lucide-react";
import * as React from "react";

type StarRatingProps = {
  value: number;
  onChange?: (next: number) => void;
  sizeClassName?: string;
  readOnly?: boolean;
};

export function StarRating({ value, onChange, sizeClassName, readOnly }: StarRatingProps) {
  const resolvedSize =
    sizeClassName ?? (readOnly || !onChange ? "size-5" : "size-8");
  const safeValue = Number.isFinite(value) ? Math.max(0, Math.min(5, value)) : 0;

  return (
    <div className="flex items-center gap-1" aria-label={`Rating: ${safeValue} out of 5`}>
      {Array.from({ length: 5 }).map((_, idx) => {
        const starValue = idx + 1;
        const filled = starValue <= safeValue;
        return (
          <button
            key={starValue}
            type="button"
            disabled={readOnly || !onChange}
            onClick={() => onChange?.(starValue)}
            className="group inline-flex items-center justify-center rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            aria-label={`Set rating to ${starValue}`}
          >
            <Star
              className={[
                resolvedSize,
                filled ? "fill-[#F5A623] text-[#F5A623]" : "fill-transparent text-[#C9C9C9] group-hover:text-[#F5A623]",
              ].join(" ")}
              strokeWidth={1.75}
            />
          </button>
        );
      })}
    </div>
  );
}

