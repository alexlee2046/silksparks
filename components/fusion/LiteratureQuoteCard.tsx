/**
 * Literature Quote Card Component
 *
 * Displays classical literature quotes with expandable translation.
 */

import React, { useState } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { LiteratureQuote } from "../../lib/literature/types";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LiteratureQuoteCardProps {
  quote: LiteratureQuote;
  defaultExpanded?: boolean;
  variant?: "default" | "compact" | "inline";
  className?: string;
}

export const LiteratureQuoteCard: React.FC<LiteratureQuoteCardProps> = ({
  quote,
  defaultExpanded = false,
  variant = "default",
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  if (variant === "inline") {
    return (
      <blockquote
        className={cn(
          "border-l-2 border-accent/50 pl-3 py-1 italic text-text-muted",
          className
        )}
      >
        <span className="text-accent/70">《{quote.source}》</span>
        {quote.chapter && (
          <span className="text-text-muted/70">·{quote.chapter}</span>
        )}
        ：「{quote.originalText}」
        <span className="block not-italic text-sm mt-1">
          {quote.translation}
        </span>
      </blockquote>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={cn(
          "bg-surface/30 border border-surface-border/50 rounded-lg p-3",
          className
        )}
      >
        <div className="flex items-start gap-2">
          <span className="text-accent text-xl leading-none">"</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-text leading-relaxed">
              {quote.originalText}
            </p>
            <p className="text-xs text-text-muted mt-1">{quote.translation}</p>
            <p className="text-xs text-accent/60 mt-1">
              —《{quote.source}》
              {quote.chapter && `·${quote.chapter}`}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={cn(
        "bg-surface/30 border border-surface-border rounded-xl overflow-hidden",
        "transition-all duration-300",
        className
      )}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "w-full px-4 py-3 flex items-start gap-3 text-left",
          "hover:bg-surface/50 transition-colors"
        )}
      >
        <span className="text-accent text-2xl leading-none mt-0.5">"</span>
        <div className="flex-1 min-w-0">
          <p className="text-base text-text font-medium leading-relaxed">
            {quote.originalText}
          </p>
          <p className="text-sm text-accent/60 mt-1">
            —《{quote.source}》
            {quote.chapter && `·${quote.chapter}`}
          </p>
        </div>
        <svg
          className={cn(
            "w-5 h-5 text-text-muted transition-transform flex-shrink-0",
            isExpanded && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Expandable Content */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          isExpanded ? "max-h-96" : "max-h-0"
        )}
      >
        <div className="px-4 pb-4 pt-2 border-t border-surface-border/50">
          {/* Translation */}
          <div className="mb-3">
            <h4 className="text-xs text-text-muted uppercase tracking-wider mb-1">
              白话解读
            </h4>
            <p className="text-sm text-text leading-relaxed">
              {quote.translation}
            </p>
          </div>

          {/* Context (if available) */}
          {quote.context && (
            <div>
              <h4 className="text-xs text-text-muted uppercase tracking-wider mb-1">
                应用场景
              </h4>
              <p className="text-sm text-text-muted leading-relaxed">
                {quote.context}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiteratureQuoteCard;
