import React from "react";
import type { FilterSectionProps } from "./types";

export const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  icon,
  items,
  selectedItems,
  onToggle,
}) => (
  <div className="space-y-4">
    <button className="flex items-center justify-between w-full group">
      <div className="flex items-center gap-3 text-foreground font-medium text-sm">
        <span
          className={`material-symbols-outlined text-primary text-[20px] ${items ? "fill" : ""}`}
        >
          {icon}
        </span>{" "}
        {title}
      </div>
      <span className="material-symbols-outlined text-text-muted text-[20px] group-hover:text-foreground transition-colors">
        expand_more
      </span>
    </button>
    {items && (
      <div className="pl-8 space-y-3">
        {items.map((item: string) => (
          <label
            key={item}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center">
              <input
                type="checkbox"
                className="peer appearance-none h-4 w-4 border border-surface-border rounded bg-surface-border/30 checked:bg-primary checked:border-primary transition-all cursor-pointer"
                checked={selectedItems?.includes(item)}
                onChange={() => onToggle && onToggle(item)}
              />
              <span className="absolute inset-0 flex items-center justify-center text-black opacity-0 peer-checked:opacity-100 material-symbols-outlined text-[12px] pointer-events-none">
                check
              </span>
            </div>
            <span className="text-text-muted text-sm group-hover:text-foreground transition-colors">
              {item}
            </span>
          </label>
        ))}
      </div>
    )}
  </div>
);
