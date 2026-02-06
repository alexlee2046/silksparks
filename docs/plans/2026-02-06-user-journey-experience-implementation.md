# User Journey & Experience Optimization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an Experience Layer system that connects features into a cohesive journey with ritual highlight moments and unified animations.

**Architecture:** Three subsystems (Onboarding, Ritual Moments, Journey Conductor) built on a unified animation library (`lib/animations.ts`) and a journey state hook (`hooks/useJourneyState.ts`). All changes are additive — existing page logic stays intact, we layer experience guidance on top.

**Tech Stack:** React 19, Framer Motion, TypeScript, Supabase (journey_events table), Vitest

**Design Doc:** `docs/plans/2026-02-06-user-journey-experience-design.md`

---

## Task 1: Unified Animation System

**Files:**
- Create: `lib/animations.ts`
- Create: `tests/unit/lib/animations.test.ts`

**Step 1: Write the test**

```typescript
// tests/unit/lib/animations.test.ts
import { describe, it, expect } from "vitest";
import {
  transitions,
  variants,
  rituals,
  pageTransition,
  getReducedMotionVariants,
} from "../../lib/animations";

describe("animations", () => {
  describe("transitions", () => {
    it("has smooth, snappy, and ritual presets", () => {
      expect(transitions.smooth).toBeDefined();
      expect(transitions.smooth.duration).toBe(0.5);
      expect(transitions.snappy).toBeDefined();
      expect(transitions.snappy.duration).toBe(0.3);
      expect(transitions.ritual).toBeDefined();
      expect(transitions.ritual.type).toBe("spring");
    });
  });

  describe("variants", () => {
    it("has fadeIn, slideUp, stagger presets", () => {
      expect(variants.fadeIn.hidden).toHaveProperty("opacity", 0);
      expect(variants.fadeIn.visible).toHaveProperty("opacity", 1);
      expect(variants.slideUp.hidden).toHaveProperty("y", 20);
      expect(variants.stagger.visible.transition).toHaveProperty("staggerChildren");
    });
  });

  describe("rituals", () => {
    it("has cardReveal, generate, save presets", () => {
      expect(rituals.cardReveal).toBeDefined();
      expect(rituals.generate).toBeDefined();
      expect(rituals.save).toBeDefined();
    });
  });

  describe("pageTransition", () => {
    it("has initial, animate, exit states", () => {
      expect(pageTransition.initial).toHaveProperty("opacity", 0);
      expect(pageTransition.animate).toHaveProperty("opacity", 1);
      expect(pageTransition.exit).toHaveProperty("opacity", 0);
    });
  });

  describe("getReducedMotionVariants", () => {
    it("returns static variants for reduced motion", () => {
      const reduced = getReducedMotionVariants(variants.slideUp);
      expect(reduced.hidden).toHaveProperty("opacity", 1);
      expect(reduced.hidden).not.toHaveProperty("y");
      expect(reduced.visible).toHaveProperty("opacity", 1);
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/lib/animations.test.ts`
Expected: FAIL — module not found

**Step 3: Write implementation**

```typescript
// lib/animations.ts
import type { Variants, Transition } from "framer-motion";

// ============ 3 Transition Rhythms ============

export const transitions = {
  /** Pages, cards, content sections */
  smooth: {
    duration: 0.5,
    ease: [0.22, 1, 0.36, 1],
  } as Transition,

  /** Buttons, micro-interactions, toggles */
  snappy: {
    duration: 0.3,
    ease: "easeOut",
  } as Transition,

  /** Card reveal, report generation, save — high-impact moments */
  ritual: {
    type: "spring",
    stiffness: 80,
    damping: 12,
    mass: 1,
  } as Transition,
};

// ============ Regular Variants ============

export const variants = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: transitions.smooth },
  } as Variants,

  slideUp: {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: transitions.smooth },
  } as Variants,

  stagger: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
  } as Variants,

  staggerItem: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: transitions.smooth,
    },
  } as Variants,
};

// ============ Ritual Variants ============

export const rituals = {
  /** Tarot card reveal: float up → flip → halo → settle */
  cardReveal: {
    hidden: { opacity: 0, y: 40, scale: 0.9, rotateY: 180 },
    float: { opacity: 1, y: -20, scale: 1.05, rotateY: 180, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
    flip: { opacity: 1, y: 0, scale: 1.1, rotateY: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    settle: { opacity: 1, y: 0, scale: 1, rotateY: 0, transition: transitions.ritual },
  } as Variants,

  /** Report generation: pulse → expand → content appear */
  generate: {
    hidden: { opacity: 0, scale: 0.8 },
    pulse: { opacity: 1, scale: [1, 1.05, 1], transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" } },
    expand: { opacity: 1, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
    visible: { opacity: 1, scale: 1 },
  } as Variants,

  /** Save to grimoire: shrink → fly → feedback */
  save: {
    idle: { opacity: 1, scale: 1, x: 0, y: 0 },
    shrink: { opacity: 0.8, scale: 0.6, transition: { duration: 0.3 } },
    fly: { opacity: 0, scale: 0.3, x: 0, y: -200, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
  } as Variants,
};

// ============ Page Transition ============

export const pageTransition = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.25 } },
};

// ============ Reduced Motion Support ============

/**
 * Returns a copy of the given variants with all motion stripped,
 * keeping only opacity: 1 for both hidden and visible states.
 */
export function getReducedMotionVariants(v: Variants): Variants {
  const result: Variants = {};
  for (const key of Object.keys(v)) {
    result[key] = { opacity: 1 };
  }
  return result;
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/lib/animations.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/animations.ts tests/unit/lib/animations.test.ts
git commit -m "feat: add unified animation system (lib/animations.ts)"
```

---

## Task 2: Journey State Hook

**Files:**
- Create: `hooks/useJourneyState.ts`
- Modify: `hooks/index.ts` (add export)
- Create: `tests/unit/hooks/useJourneyState.test.ts`

**Step 1: Write the test**

```typescript
// tests/unit/hooks/useJourneyState.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useJourneyState } from "../../hooks/useJourneyState";

// Mock useUser
vi.mock("../../context/UserContext", () => ({
  useUser: () => ({
    session: null,
    isBirthDataComplete: false,
  }),
}));

describe("useJourneyState", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("detects first visit", () => {
    const { result } = renderHook(() => useJourneyState());
    expect(result.current.isFirstVisit).toBe(true);
  });

  it("marks visit after first access", () => {
    const { result } = renderHook(() => useJourneyState());
    act(() => result.current.markVisited());
    expect(result.current.isFirstVisit).toBe(false);
  });

  it("tracks completed features", () => {
    const { result } = renderHook(() => useJourneyState());
    act(() => result.current.completeFeature("tarot"));
    expect(result.current.completedFeatures).toContain("tarot");
    expect(result.current.lastFeature).toBe("tarot");
  });

  it("does not duplicate features", () => {
    const { result } = renderHook(() => useJourneyState());
    act(() => {
      result.current.completeFeature("tarot");
      result.current.completeFeature("tarot");
    });
    expect(result.current.completedFeatures.filter((f) => f === "tarot").length).toBe(1);
  });

  it("returns hasAccount false when no session", () => {
    const { result } = renderHook(() => useJourneyState());
    expect(result.current.hasAccount).toBe(false);
  });

  it("returns hasBirthData false when incomplete", () => {
    const { result } = renderHook(() => useJourneyState());
    expect(result.current.hasBirthData).toBe(false);
  });

  it("suggests tarot for first-time visitor", () => {
    const { result } = renderHook(() => useJourneyState());
    expect(result.current.suggestedNext).toBe("tarot");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/hooks/useJourneyState.test.ts`
Expected: FAIL

**Step 3: Write implementation**

```typescript
// hooks/useJourneyState.ts
import { useState, useCallback, useMemo } from "react";
import { useUser } from "../context/UserContext";

type Feature = "tarot" | "astrology" | "fusion" | "shop" | "experts";

const STORAGE_KEY = "silksparks_journey";
const VISITED_KEY = "silksparks_visited";

interface StoredJourney {
  completedFeatures: Feature[];
  lastFeature: Feature | null;
}

function loadJourney(): StoredJourney {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { completedFeatures: [], lastFeature: null };
}

function saveJourney(journey: StoredJourney) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journey));
}

export function useJourneyState() {
  const { session, isBirthDataComplete } = useUser();

  const [isFirstVisit, setIsFirstVisit] = useState(
    () => !localStorage.getItem(VISITED_KEY)
  );
  const [journey, setJourney] = useState<StoredJourney>(loadJourney);

  const hasAccount = !!session?.user;
  const hasBirthData = isBirthDataComplete;

  const markVisited = useCallback(() => {
    localStorage.setItem(VISITED_KEY, "true");
    setIsFirstVisit(false);
  }, []);

  const completeFeature = useCallback((feature: Feature) => {
    setJourney((prev) => {
      if (prev.completedFeatures.includes(feature)) {
        const updated = { ...prev, lastFeature: feature };
        saveJourney(updated);
        return updated;
      }
      const updated = {
        completedFeatures: [...prev.completedFeatures, feature],
        lastFeature: feature,
      };
      saveJourney(updated);
      return updated;
    });
  }, []);

  const suggestedNext = useMemo((): Feature | "register" => {
    const { completedFeatures } = journey;

    // First visit or haven't done tarot → tarot
    if (!completedFeatures.includes("tarot")) return "tarot";

    // Done tarot, no birth data → astrology
    if (!hasBirthData) return "astrology";

    // Has birth data, hasn't done fusion → fusion
    if (!completedFeatures.includes("fusion")) return "fusion";

    // Not registered → register
    if (!hasAccount) return "register";

    // Done everything, suggest shop or experts
    if (!completedFeatures.includes("shop")) return "shop";
    return "experts";
  }, [journey, hasBirthData, hasAccount]);

  return {
    isFirstVisit,
    hasAccount,
    hasBirthData,
    completedFeatures: journey.completedFeatures,
    lastFeature: journey.lastFeature,
    suggestedNext,
    markVisited,
    completeFeature,
  };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/hooks/useJourneyState.test.ts`
Expected: PASS

**Step 5: Add export to hooks/index.ts**

Append to `hooks/index.ts`:
```typescript
// Journey state
export { useJourneyState } from "./useJourneyState";
```

**Step 6: Commit**

```bash
git add hooks/useJourneyState.ts hooks/index.ts tests/unit/hooks/useJourneyState.test.ts
git commit -m "feat: add useJourneyState hook for experience tracking"
```

---

## Task 3: Journey Event Tracking

**Files:**
- Create: `hooks/useJourneyTrack.ts`
- Modify: `hooks/index.ts` (add export)
- Create: `tests/unit/hooks/useJourneyTrack.test.ts`
- Create: `supabase/migrations/20260206_journey_events.sql` (for reference)

**Step 1: Write the test**

```typescript
// tests/unit/hooks/useJourneyTrack.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useJourneyTrack } from "../../hooks/useJourneyTrack";

// Mock supabase
vi.mock("../../services/supabase", () => ({
  supabase: {
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ error: null })),
    })),
  },
}));

describe("useJourneyTrack", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns a track function", () => {
    const { result } = renderHook(() => useJourneyTrack());
    expect(typeof result.current.track).toBe("function");
  });

  it("generates and persists a session ID", () => {
    const { result } = renderHook(() => useJourneyTrack());
    result.current.track("first_visit", {});
    const sessionId = localStorage.getItem("silksparks_session_id");
    expect(sessionId).toBeTruthy();
    expect(sessionId!.length).toBeGreaterThan(10);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/hooks/useJourneyTrack.test.ts`
Expected: FAIL

**Step 3: Write implementation**

```typescript
// hooks/useJourneyTrack.ts
import { useCallback, useRef } from "react";
import { supabase } from "../services/supabase";
import { useUser } from "../context/UserContext";

const SESSION_KEY = "silksparks_session_id";

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function useJourneyTrack() {
  const { session } = useUser();
  const sessionIdRef = useRef(getSessionId());

  const track = useCallback(
    (eventType: string, eventData: Record<string, unknown> = {}) => {
      const payload = {
        session_id: sessionIdRef.current,
        user_id: session?.user?.id ?? null,
        event_type: eventType,
        event_data: eventData,
      };

      // Fire and forget — don't block UI
      setTimeout(() => {
        supabase.from("journey_events").insert(payload).then(({ error }) => {
          if (error) console.warn("[JourneyTrack]", error.message);
        });
      }, 0);
    },
    [session?.user?.id],
  );

  return { track };
}
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/hooks/useJourneyTrack.test.ts`
Expected: PASS

**Step 5: Add export + write migration SQL**

Append to `hooks/index.ts`:
```typescript
export { useJourneyTrack } from "./useJourneyTrack";
```

Create migration file `supabase/migrations/20260206_journey_events.sql`:
```sql
CREATE TABLE journey_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_journey_events_session ON journey_events(session_id);
CREATE INDEX idx_journey_events_type ON journey_events(event_type);
CREATE INDEX idx_journey_events_created ON journey_events(created_at);

ALTER TABLE journey_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert journey events"
  ON journey_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Users read own events"
  ON journey_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin read all events"
  ON journey_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));
```

**Step 6: Commit**

```bash
git add hooks/useJourneyTrack.ts hooks/index.ts tests/unit/hooks/useJourneyTrack.test.ts supabase/migrations/20260206_journey_events.sql
git commit -m "feat: add journey event tracking hook and migration"
```

---

## Task 4: JourneyNext Recommendation Component

**Files:**
- Create: `components/JourneyNext.tsx`
- Create: `tests/unit/components/JourneyNext.test.tsx`

**Step 1: Write the test**

```typescript
// tests/unit/components/JourneyNext.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { JourneyNext } from "../../components/JourneyNext";

// Mock hooks
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("../../hooks/useJourneyState", () => ({
  useJourneyState: () => ({
    hasAccount: false,
    hasBirthData: false,
    completedFeatures: [],
    lastFeature: null,
    suggestedNext: "astrology",
  }),
}));

vi.mock("../../hooks/useJourneyTrack", () => ({
  useJourneyTrack: () => ({ track: vi.fn() }),
}));

describe("JourneyNext", () => {
  it("renders recommendation for tarot → astrology", () => {
    render(<JourneyNext currentFeature="tarot" />);
    expect(screen.getByTestId("journey-next")).toBeInTheDocument();
  });

  it("can be dismissed", () => {
    render(<JourneyNext currentFeature="tarot" />);
    const dismissBtn = screen.getByLabelText("Dismiss recommendation");
    fireEvent.click(dismissBtn);
    expect(screen.queryByTestId("journey-next")).not.toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/components/JourneyNext.test.tsx`
Expected: FAIL

**Step 3: Write implementation**

```typescript
// components/JourneyNext.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { variants } from "../lib/animations";
import { useJourneyState } from "../hooks/useJourneyState";
import { useJourneyTrack } from "../hooks/useJourneyTrack";
import { PATHS } from "../lib/paths";

type Feature = "tarot" | "astrology" | "fusion" | "shop" | "experts";

interface Props {
  currentFeature: Feature;
}

interface Recommendation {
  target: Feature | "register";
  path: string;
  icon: string;
  title: string;
  description: string;
}

function getRecommendation(
  current: Feature,
  hasBirthData: boolean,
  hasAccount: boolean,
  completedFeatures: string[],
): Recommendation | null {
  if (current === "tarot") {
    if (!hasBirthData) {
      return {
        target: "astrology",
        path: PATHS.HOROSCOPE,
        icon: "astronomy",
        title: "Unlock Your Star Chart",
        description: "Your card hints at transformation — your star chart can tell you why.",
      };
    }
    if (!completedFeatures.includes("fusion")) {
      return {
        target: "fusion",
        path: PATHS.FUSION,
        icon: "yin_yang",
        title: "East Meets West",
        description: "Combine your BaZi with this card for a deeper perspective.",
      };
    }
    if (!hasAccount) {
      return {
        target: "register",
        path: PATHS.DASHBOARD,
        icon: "bookmark",
        title: "Save Your Journey",
        description: "Save to your Grimoire and track how your cards evolve.",
      };
    }
  }

  if (current === "astrology") {
    if (!completedFeatures.includes("tarot")) {
      return {
        target: "tarot",
        path: PATHS.TAROT,
        icon: "psychology",
        title: "Try Today's Tarot",
        description: "Your chart shows strong intuition — let the cards confirm it.",
      };
    }
    if (hasBirthData && !completedFeatures.includes("fusion")) {
      return {
        target: "fusion",
        path: PATHS.FUSION,
        icon: "yin_yang",
        title: "Complete Fusion Reading",
        description: "East meets West — see the complete picture.",
      };
    }
  }

  if (current === "fusion") {
    if (!completedFeatures.includes("shop")) {
      return {
        target: "shop",
        path: PATHS.SHOP,
        icon: "storefront",
        title: "Curated for You",
        description: "Crystals and accessories that resonate with your energy.",
      };
    }
    return {
      target: "experts",
      path: PATHS.EXPERTS,
      icon: "group",
      title: "One-on-One Guidance",
      description: "Want a deeper, personalized reading with an expert?",
    };
  }

  return null;
}

export const JourneyNext: React.FC<Props> = ({ currentFeature }) => {
  const navigate = useNavigate();
  const { hasAccount, hasBirthData, completedFeatures } = useJourneyState();
  const { track } = useJourneyTrack();
  const [dismissed, setDismissed] = useState(false);

  const recommendation = getRecommendation(
    currentFeature,
    hasBirthData,
    hasAccount,
    completedFeatures,
  );

  if (!recommendation || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        data-testid="journey-next"
        variants={variants.slideUp}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="mt-12 mb-8 w-full max-w-2xl mx-auto"
      >
        <div className="relative flex items-start gap-4 p-6 rounded-2xl bg-surface/60 backdrop-blur-md border border-surface-border hover:border-primary/30 transition-colors group cursor-pointer"
          onClick={() => {
            track("journey_next_click", { from: currentFeature, to: recommendation.target });
            navigate(recommendation.path);
          }}
        >
          {/* Left accent line */}
          <div className="absolute left-0 top-4 bottom-4 w-0.5 bg-primary rounded-full" />

          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-primary text-xl">
              {recommendation.icon}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-foreground font-semibold text-sm mb-1 group-hover:text-primary transition-colors">
              {recommendation.title}
            </h3>
            <p className="text-text-muted text-sm leading-relaxed">
              {recommendation.description}
            </p>
          </div>

          <span className="material-symbols-outlined text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all text-lg mt-1">
            arrow_forward
          </span>

          {/* Dismiss button */}
          <button
            aria-label="Dismiss recommendation"
            className="absolute top-2 right-2 p-1 text-text-muted/50 hover:text-text-muted rounded-full"
            onClick={(e) => {
              e.stopPropagation();
              track("journey_next_dismiss", { from: currentFeature });
              setDismissed(true);
            }}
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
```

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/components/JourneyNext.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add components/JourneyNext.tsx tests/unit/components/JourneyNext.test.tsx
git commit -m "feat: add JourneyNext recommendation component"
```

---

## Task 5: Home Page — Replace Inline Animations with Unified System

**Files:**
- Modify: `pages/Home.tsx`

**Step 1: Replace inline variants with imports**

In `pages/Home.tsx`, remove the inline `containerVariants` and `itemVariants` definitions (~lines 140-155). Replace with:

```typescript
import { variants } from "../lib/animations";
```

Then replace all usages:
- `containerVariants` → `variants.stagger`
- `itemVariants` → `variants.staggerItem`

**Step 2: Run existing tests**

Run: `npx vitest run tests/unit/pages/Home.test.tsx`
Expected: PASS (no behavioral change)

**Step 3: Commit**

```bash
git add pages/Home.tsx
git commit -m "refactor: replace Home inline animations with unified system"
```

---

## Task 6: Home Page — Dynamic CTA Based on Journey State

**Files:**
- Modify: `pages/Home.tsx`

**Step 1: Add journey-aware CTA logic**

Import `useJourneyState` and rewrite the Hero CTA section:

- First visit / no tarot done → Primary: "Draw Today's Tarot" (to PATHS.TAROT), Secondary: "Enter birth info" (opens BirthDataForm)
- Has done tarot, no birth data → Primary: "Unlock Your Star Chart" (opens BirthDataForm), Secondary: "Daily Tarot"
- Has birth data → Primary: "Today's Fusion Reading" (to PATHS.FUSION), Secondary: "Daily Tarot"

Also: hide `FusionInsightCarousel` when `isFirstVisit` is true.

**Step 2: Fix ProductCard empty onClick**

Replace the empty `onClick` handler on ProductCard with:
```typescript
onClick={() => navigate(PATHS.PRODUCT(product.id))}
```

**Step 3: Add `data-testid` attributes for new CTAs**

- `data-testid="hero-cta-primary"`
- `data-testid="hero-cta-secondary"`

**Step 4: Run existing tests + manual verification**

Run: `npx vitest run tests/unit/pages/Home.test.tsx`
Run: `npm run build` (verify no compile errors)
Expected: PASS

**Step 5: Commit**

```bash
git add pages/Home.tsx
git commit -m "feat: dynamic Home CTA based on journey state"
```

---

## Task 7: Home Page — Dynamic Feature Card Ordering

**Files:**
- Modify: `pages/Home.tsx`

**Step 1: Add dynamic ordering logic**

Based on `useJourneyState`, reorder the 3 FeatureCards:
- First visit → Tarot first (index 0)
- Done tarot, no birth data → Fusion first
- Has birth data, not done fusion → Fusion first
- Default → current order (Fusion → Tarot → Experts)

Add a small checkmark indicator on completed features (top-right of FeatureCard):
```tsx
{completedFeatures.includes(featureKey) && (
  <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
    <span className="material-symbols-outlined text-green-400 text-xs">check</span>
  </div>
)}
```

**Step 2: Run tests + build**

Run: `npx vitest run tests/unit/pages/Home.test.tsx`
Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add pages/Home.tsx
git commit -m "feat: dynamic feature card ordering and completion indicators"
```

---

## Task 8: Integrate JourneyNext into TarotDaily

**Files:**
- Modify: `pages/features/TarotDaily.tsx`

**Step 1: Add JourneyNext after interpretation**

Import `JourneyNext` and `useJourneyState`. After the interpretation section (when `readingState === "revealed"` and interpretation is loaded), render:

```tsx
{interpretation && !isAILoading && (
  <JourneyNext currentFeature="tarot" />
)}
```

Also call `completeFeature("tarot")` when interpretation is successfully loaded.

**Step 2: Add journey tracking**

Import `useJourneyTrack`. Track:
- `track("feature_complete", { feature: "tarot" })` when interpretation loads
- `track("cta_click", { cta: "tarot" })` in `handleStartReading`

**Step 3: Run existing tests**

Run: `npx vitest run tests/unit/pages/features/TarotDaily.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add pages/features/TarotDaily.tsx
git commit -m "feat: integrate JourneyNext and tracking into TarotDaily"
```

---

## Task 9: Integrate JourneyNext into AstrologyReport and FusionReading

**Files:**
- Modify: `pages/features/AstrologyReport.tsx`
- Modify: `pages/FusionReading.tsx`

**Step 1: AstrologyReport**

Same pattern as TarotDaily:
- Import `JourneyNext`, `useJourneyState`, `useJourneyTrack`
- Add `<JourneyNext currentFeature="astrology" />` after report content
- Call `completeFeature("astrology")` when report is generated
- Track `feature_complete` event

**Step 2: FusionReading**

Same pattern:
- Add `<JourneyNext currentFeature="fusion" />` after fusion report content
- Call `completeFeature("fusion")` when fusion insights are generated
- Track `feature_complete` event

**Step 3: Run tests**

Run: `npx vitest run tests/unit/pages/features/AstrologyReport.test.tsx`
Run: `npm run build`
Expected: PASS

**Step 4: Commit**

```bash
git add pages/features/AstrologyReport.tsx pages/FusionReading.tsx
git commit -m "feat: integrate JourneyNext into AstrologyReport and FusionReading"
```

---

## Task 10: Tarot Card Reveal Ritual Animation

**Files:**
- Modify: `pages/features/TarotDaily.tsx`
- Modify: `pages/features/TarotCard.tsx` (if card flip logic lives here)

**Step 1: Study current card reveal flow**

The current flow in `handleCardSelect`:
1. `setReadingState("drawing")`
2. After 1500ms timeout: sets card data, `setReadingState("revealed")`

Replace the abrupt reveal with staged ritual using `rituals.cardReveal` from `lib/animations.ts`.

**Step 2: Implement staged reveal**

Add a new intermediate state `"revealing"` between `"drawing"` and `"revealed"`:
- `drawing` → card floats up (Phase 1-2)
- `revealing` → flip animation (Phase 3-4)
- `revealed` → settle + interpretation slides in (Phase 5)

Use Framer Motion `animate` prop with the `rituals.cardReveal` variants:
```tsx
<motion.div
  animate={readingState === "drawing" ? "float" : readingState === "revealing" ? "flip" : "settle"}
  variants={rituals.cardReveal}
  style={{ perspective: 1000 }}
>
```

Add silk-textured halo CSS:
```css
.card-halo {
  background: radial-gradient(
    ellipse at center,
    rgba(244, 192, 37, 0.15) 0%,
    rgba(168, 85, 247, 0.08) 40%,
    transparent 70%
  );
  animation: halo-pulse 1.5s ease-out forwards;
}

@keyframes halo-pulse {
  0% { transform: scale(0.5); opacity: 0; }
  50% { opacity: 1; }
  100% { transform: scale(2); opacity: 0; }
}
```

**Step 3: Add stardust particles**

After flip completes, render 5 small dots with staggered motion:
```tsx
{readingState === "revealed" && (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    {[...Array(5)].map((_, i) => (
      <motion.div
        key={i}
        className="absolute w-1 h-1 rounded-full bg-primary/60"
        initial={{ opacity: 0, x: 0, y: 0 }}
        animate={{
          opacity: [0, 1, 0],
          x: (Math.random() - 0.5) * 200,
          y: (Math.random() - 0.5) * 200,
        }}
        transition={{ duration: 1.5, delay: i * 0.1 }}
        style={{ left: "50%", top: "50%" }}
      />
    ))}
  </div>
)}
```

**Step 4: Respect reduced motion**

Check `useAnimationsEnabled()`. If disabled, skip directly to `"revealed"` state.

**Step 5: Run tests + manual verification**

Run: `npx vitest run tests/unit/pages/features/TarotDaily.test.tsx`
Run: `npm run dev` and test card draw flow visually
Expected: Tests PASS, card reveal has staged animation

**Step 6: Commit**

```bash
git add pages/features/TarotDaily.tsx pages/features/TarotCard.tsx index.css
git commit -m "feat: add ritual card reveal animation for tarot"
```

---

## Task 11: Fusion Report Generation Animation

**Files:**
- Modify: `pages/FusionReading.tsx`

**Step 1: Replace loading state with ritual animation**

Currently FusionReading likely shows a spinner during generation. Replace with a staged animation using `rituals.generate`:

- Phase 1: Yin-yang symbol rotating with `animate={{ rotate: 360 }}` on loop
- Phase 2: Content expanding from center using `rituals.generate.expand`

The yin-yang symbol: use the existing "☯" text or the `yin_yang` material icon.

**Step 2: Respect reduced motion**

If `useAnimationsEnabled()` returns false, show simple loading spinner.

**Step 3: Run tests + manual check**

Run: `npm run build`
Run: `npm run dev` and trigger a Fusion reading

**Step 4: Commit**

```bash
git add pages/FusionReading.tsx
git commit -m "feat: add ritual generation animation for Fusion reading"
```

---

## Task 12: Save to Grimoire Flight Animation

**Files:**
- Modify: `pages/features/TarotDaily.tsx`

**Step 1: Replace toast with flight animation**

In `handleSaveToGrimoire`, after successful save:
1. Apply `rituals.save` variants to the card/content area
2. Animate shrink → fly upward
3. After animation completes (0.8s), show the success state

```tsx
const [saveAnimState, setSaveAnimState] = useState<"idle" | "shrink" | "fly" | "done">("idle");

// In handleSaveToGrimoire, after successful save:
setSaveAnimState("shrink");
setTimeout(() => setSaveAnimState("fly"), 300);
setTimeout(() => {
  setSaveAnimState("done");
  setIsSavedToGrimoire(true);
  // Keep toast as fallback confirmation
  toast.success("Saved to your Grimoire!");
}, 800);
```

**Step 2: Wrap save button area with motion.div**

```tsx
<motion.div
  animate={saveAnimState}
  variants={rituals.save}
>
  {/* existing save button */}
</motion.div>
```

**Step 3: Run tests + manual check**

Run: `npx vitest run tests/unit/pages/features/TarotDaily.test.tsx`
Expected: PASS

**Step 4: Commit**

```bash
git add pages/features/TarotDaily.tsx
git commit -m "feat: add save-to-grimoire flight animation"
```

---

## Task 13: Unified Page Transitions

**Files:**
- Modify: `App.tsx`

**Step 1: Update AnimatedPage to use unified pageTransition**

Replace the current `AnimatedPage` component (lines 148-165) with:

```tsx
import { pageTransition } from "./lib/animations";
import { useAnimationsEnabled } from "./hooks";

const AnimatedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const animationsEnabled = useAnimationsEnabled();

  if (!animationsEnabled) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={pageTransition.initial}
        animate={pageTransition.animate}
        exit={pageTransition.exit}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
```

**Step 2: Replace Suspense fallback**

Replace `<LoadingSpinner />` in Suspense with a skeleton-like fade:
```tsx
<Suspense fallback={
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 0.5 }}
    className="w-full min-h-[60vh] flex items-center justify-center"
  >
    <LoadingSpinner />
  </motion.div>
}>
```

**Step 3: Add scroll reset on navigation**

Add `useEffect` in `AppContent` to scroll to top on route change (except when going back to Home):

```tsx
useEffect(() => {
  if (location.pathname !== "/") {
    window.scrollTo(0, 0);
  }
}, [location.pathname]);
```

**Step 4: Run build + verify**

Run: `npm run build`
Run: `npm run lint`
Expected: PASS

**Step 5: Commit**

```bash
git add App.tsx
git commit -m "feat: unified page transitions with reduced-motion support"
```

---

## Task 14: First-Visit Onboarding — Breathing Glow CTA

**Files:**
- Modify: `pages/Home.tsx`
- Modify: `index.css` (add glow keyframe)

**Step 1: Add breathing glow CSS**

In `index.css`:
```css
@keyframes breathing-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(244, 192, 37, 0.3); }
  50% { box-shadow: 0 0 40px rgba(244, 192, 37, 0.6), 0 0 60px rgba(244, 192, 37, 0.2); }
}

.cta-breathing {
  animation: breathing-glow 2.5s ease-in-out infinite;
}
```

**Step 2: Apply to primary CTA on first visit**

In Home.tsx, conditionally add `cta-breathing` class to the primary CTA button when `isFirstVisit` is true.

Also add the "No signup needed" hint below:
```tsx
{isFirstVisit && (
  <p className="text-[10px] text-text-muted/60 text-center mt-2 tracking-wide">
    No signup needed — instant experience
  </p>
)}
```

**Step 3: Mark visited on first CTA click**

Call `markVisited()` when user clicks primary CTA.

**Step 4: Run build + verify**

Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add pages/Home.tsx index.css
git commit -m "feat: add breathing glow CTA and first-visit hints"
```

---

## Task 15: Final Polish & Verification

**Files:**
- All modified files

**Step 1: Run full lint**

Run: `npm run lint`
Fix any new warnings/errors.

**Step 2: Run full test suite**

Run: `npx vitest run`
Verify no regressions (existing failures are pre-existing, see MEMORY.md).

**Step 3: Run build**

Run: `npm run build`
Verify clean build with no new warnings.

**Step 4: Run typecheck**

Run: `npm run typecheck`
Verify no new type errors.

**Step 5: Manual smoke test**

Run: `npm run dev`
Test the full journey:
1. Open in incognito → see tarot-first CTA with breathing glow
2. Click "Draw Today's Tarot" → see card reveal ritual
3. After interpretation → see JourneyNext recommendation
4. Click recommendation → smooth page transition
5. Complete feature → see next recommendation
6. Save to Grimoire → see flight animation

**Step 6: Final commit**

```bash
git add -A
git commit -m "chore: final polish for user journey experience optimization"
```

---

## Summary of New/Modified Files

| Action | File | Purpose |
|--------|------|---------|
| Create | `lib/animations.ts` | Unified animation system |
| Create | `hooks/useJourneyState.ts` | Journey state tracking |
| Create | `hooks/useJourneyTrack.ts` | Event analytics |
| Create | `components/JourneyNext.tsx` | Recommendation component |
| Create | `supabase/migrations/20260206_journey_events.sql` | DB migration |
| Create | `tests/unit/lib/animations.test.ts` | Animation tests |
| Create | `tests/unit/hooks/useJourneyState.test.ts` | Journey state tests |
| Create | `tests/unit/hooks/useJourneyTrack.test.ts` | Tracking tests |
| Create | `tests/unit/components/JourneyNext.test.tsx` | Recommendation tests |
| Modify | `hooks/index.ts` | Add new exports |
| Modify | `pages/Home.tsx` | Dynamic CTA + ordering + glow |
| Modify | `pages/features/TarotDaily.tsx` | Ritual reveal + JourneyNext + save anim |
| Modify | `pages/features/AstrologyReport.tsx` | JourneyNext integration |
| Modify | `pages/FusionReading.tsx` | JourneyNext + generation anim |
| Modify | `App.tsx` | Unified page transitions |
| Modify | `index.css` | Breathing glow keyframe |
