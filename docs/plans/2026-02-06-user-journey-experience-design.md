# User Journey & Experience Optimization Design

> Date: 2026-02-06
> Status: Approved
> Scope: Core journey continuity + Visual ritual moments + Unified animation system
> Timeline: ~10 working days (2 weeks)

---

## 1. Problem Statement

Current state: each feature page (Tarot, Astrology, Fusion, Shop, Experts) is a dead end. Users complete one experience and leave. There is no cohesive thread connecting features into a journey.

Evidence from codebase:
- Home page `ProductCard` onClick is empty (`// Product detail view not implemented`)
- No post-completion recommendations on any feature page
- TarotShareCard component exists but not fully integrated
- Animation parameters are defined inline per-page, inconsistent across app
- New users see a "enter birth data" CTA first, which is high-friction

## 2. Design Direction

**Golden Path (new user):**
```
Home → Daily Tarot (free, zero friction) → Card reveal wow moment → AI interpretation
  → "Want deeper insight? Try your star chart" → Enter birth data → Fusion/Astrology
  → "Save your results" → Register
  → Return (check-in + new daily tarot)
```

**Visual Direction:** East-West Fusion executed with minimalist restraint
- Silk = Eastern flowing elegance (光晕 with silk texture)
- Spark = Western cosmic energy (stardust particles)
- Applied only at key ritual moments, not everywhere

## 3. Architecture: Experience Layer

```
+-------------------------------------+
|         Experience Layer            |
+----------+----------+---------------+
| Onboarding| Ritual   | Journey       |
| System    | Moments  | Conductor     |
+----------+----------+---------------+
| First visit| Card     | Post-complete |
| Path guide | reveal   | recommendations|
| Progressive| Report   | Context-aware |
| disclosure | gen      | transitions   |
+----------+----------+---------------+
         |
+-------------------------------------+
|      Unified Animation System       |
|  transitions / variants / rituals   |
+-------------------------------------+
```

## 4. Unified Animation System

**File:** `lib/animations.ts`

**Design Principles:**
- Only 3 transition rhythms globally, no per-page custom durations
- Two tiers: regular (page/card) and ritual (reveal/generate)
- All animations respect `prefers-reduced-motion`, degrade to simple fade

**Core API:**

```typescript
// 3 rhythms — globally unified
transitions.smooth   // 0.5s, cubic-bezier(0.22,1,0.36,1) — pages/cards
transitions.snappy   // 0.3s, easeOut — buttons/micro-interactions
transitions.ritual   // 0.8s, spring — card reveal/report gen highlights

// Regular animation variants
variants.fadeIn       // Fade in
variants.slideUp      // Slide up from below (list items, cards)
variants.stagger      // Container-level stagger, children appear sequentially

// Ritual animation variants
rituals.cardReveal    // Tarot reveal: float → flip → halo
rituals.generate      // Report generation: pulse → expand → content fade-in
rituals.save          // Save confirmation: shrink → fly to target → feedback

// Page transitions
pageTransition        // Unified initial/animate/exit
```

**Replacement Strategy:** Remove all inline `containerVariants`, `itemVariants` from Home.tsx, TarotDaily.tsx etc. Replace with imports from `lib/animations.ts`.

## 5. Onboarding System

**No tutorial modals, no step overlays.** Guide through visual weight and progressive disclosure.

**State Hook:**

```typescript
// hooks/useJourneyState.ts
interface JourneyState {
  isFirstVisit: boolean;        // localStorage flag
  hasAccount: boolean;          // session exists
  hasBirthData: boolean;        // birthData complete
  completedFeatures: string[];  // ['tarot', 'astrology', 'fusion']
  lastFeature: string | null;   // most recently completed feature
}
```

Stored in localStorage + UserContext.

**Home Page Behavior by User State:**

| User State | Hero CTA | Features Order | Extra Element |
|-----------|----------|----------------|---------------|
| First visit | "Draw today's tarot" (prominent) | Tarot first, with pulse glow | Subtle hint: "No signup needed" |
| Done tarot, no birth data | "Unlock your star chart" | Fusion first | Tarot card shows "Done check" |
| Has birth data, not registered | "Save your cosmic profile" | Normal order | Registration incentive bar |
| Registered user | "Today's Fusion Reading" | Based on recent behavior | Check-in reminder |

**Key Details:**
- First-visit tarot CTA uses `rituals` breathing glow — attracts attention without being aggressive
- "No signup needed" in smallest font size, lowers defensive psychology
- No features are hidden, only visual weight shifts to suggest "start here"
- FusionInsightCarousel hidden on first visit (no context yet), shown after user has done Fusion

## 6. Journey Conductor — Post-Completion Recommendations

**Component:** `components/JourneyNext.tsx`

Not generic "you might like" — contextual recommendations with causal connection to what was just completed.

**Recommendation Rules:**

| Just Completed | User State | Recommend | Copy |
|---------------|-----------|-----------|------|
| Tarot Daily | No birth data | Astrology | "Your card hints at transformation — your star chart can tell you why" |
| Tarot Daily | Has birth data | Fusion | "Combine your BaZi with this card for a different perspective" |
| Tarot Daily | Not registered | Register | "Save to your Grimoire, track how your cards evolve" |
| Astrology Report | Haven't done tarot | Tarot | "Your chart shows strong intuition — try today's tarot" |
| Astrology Report | Has birth data | Fusion | "East meets West — see the complete picture" |
| Fusion | Haven't browsed shop | Shop | "Crystals and accessories that resonate with your energy" |
| Fusion | All features done | Experts | "Want a one-on-one deep reading?" |

**Visual Design:**
- Appears at natural end of page content, not a popup
- Uses `variants.slideUp` to enter
- Card style: semi-transparent glass, thin vertical primary-color line on left
- One primary recommendation + optional secondary (small text link)
- Includes dismiss option, never forced

## 7. Ritual Moments — 4 Key Highlights

### 7.1 Tarot Card Reveal (Highest Priority)

Current: card selected → result shown immediately.

New staged ritual:
```
Phase 1 (0.3s): Selected card floats up, other cards fade and sink
Phase 2 (0.5s): Card moves to screen center, slight scale up
Phase 3 (0.6s): Silk-textured halo expands from card center (East element)
         + rotateY 180deg flip to reveal face
Phase 4 (0.4s): Card settles, stardust particles drift from edges (West element)
Phase 5 (0.3s): Interpretation area slides up from below
```

Halo: CSS radial-gradient animation, no Canvas needed.
Stardust: 3-5 absolutely positioned dots with motion animation, no particle system.

### 7.2 Fusion Report Generation

Current: loading spinner.

New:
```
Phase 1: Yin-yang taiji symbol slowly rotates, bagua symbols light up sequentially
Phase 2: Western zodiac symbols converge from outer ring
Phase 3: Eastern and Western symbols merge into a single light point
Phase 4: Light point expands into report content
```

Framer Motion sequence, total ~2-3 seconds.

### 7.3 Save to Grimoire

Current: toast notification.

New: content card shrinks → flies along arc toward archives icon in navigation → icon pulses feedback. ~0.8 seconds.

### 7.4 First Star Chart Generation

After birth data submission, star chart draws outward from center point, planets "land" at their positions one by one. Leverages existing React Three Fiber infrastructure.

**Performance Notes:**
- All ritual animations use `transform` and `opacity` only (GPU accelerated)
- `will-change` applied only during animation, removed after
- `prefers-reduced-motion`: all rituals degrade to simple fade transitions

## 8. Page Transition System

**Approach:** Wrap route layer in `App.tsx` with `AnimatePresence`, all pages use unified `pageTransition`.

```
Enter: opacity 0→1, y 12px→0  (0.4s smooth)
Exit:  opacity 1→0, y 0→-8px  (0.25s)
```

**Not doing:**
- No directional transitions (slide left/right) — complexity for low gain
- No shared element animations — high implementation cost, buggy
- Not applied to Admin pages — admin stays fast and direct

**Additional handling:**
- Entering feature page from Home: scroll position reset to top
- Returning to Home: restore previous scroll position (scrollRestoration)
- Suspense fallback: replace LoadingSpinner with skeleton fade-in consistent with page transitions, avoid "flash of white"

**Existing basis:** `AnimatedPage` component already exists in `App.tsx` but usage is inconsistent. This unifies all pages through it.

## 9. Home Page Specific Changes

### Hero CTA Restructure

Current: fake input box + single button (birth data focused, high friction).

New: dual CTA layout:
```
Primary CTA (large): "Draw today's tarot" — zero friction, instant experience
Secondary CTA (small): "Enter birth info for full star chart" — for ready users
```

- First visit: primary CTA has `rituals` breathing glow, secondary is subtle
- User with birth data: primary becomes "Today's Fusion Reading", secondary becomes "Daily Tarot"
- Switch logic based on `useJourneyState`

### Features Section

- Current: 3 FeatureCards in fixed order (Fusion → Tarot → Experts)
- New: dynamic ordering based on user state (see Onboarding table in section 5)
- Completed features get small checkmark top-right, but NOT grayed out

### Products Section Fix

- Fix empty `onClick` on ProductCard — navigate to `PRODUCT_DETAIL`
- If user has done tarot/astrology, add small text: "Resonates with your [sign/card] energy"

### Remove/Conditionally Show

- FusionInsightCarousel: hidden on first visit, shown after user has completed Fusion

## 10. Experience Data Tracking

**Database:**

```sql
CREATE TABLE journey_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id),
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE journey_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own events" ON journey_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert" ON journey_events
  FOR INSERT WITH CHECK (true);

-- Admin read all
CREATE POLICY "Admin read all events" ON journey_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
```

**Key Events:**

| event_type | Meaning | event_data |
|-----------|---------|-----------|
| `first_visit` | First arrival | `{ referrer }` |
| `cta_click` | Which CTA clicked | `{ cta: 'tarot' \| 'birthdata' \| 'fusion' }` |
| `feature_complete` | Completed a feature | `{ feature, duration_sec }` |
| `journey_next_click` | Clicked recommendation | `{ from, to }` |
| `journey_next_dismiss` | Dismissed recommendation | `{ from }` |
| `signup_trigger` | What triggered signup | `{ trigger: 'save' \| 'cta' \| 'checkin' }` |
| `ritual_complete` | Watched ritual animation | `{ ritual, skipped: bool }` |

**Implementation:**
- `useJourneyTrack()` hook, pages call `track('feature_complete', { feature: 'tarot' })`
- Anonymous session via localStorage UUID, backfill `user_id` on login
- Async send via `navigator.sendBeacon` or `setTimeout`, no performance impact

**Key Metrics (SQL queryable):**
- First visit → feature completion rate
- Recommendation click rate vs dismiss rate
- Signup conversion source distribution
- Average session depth (features completed per session)

## 11. Implementation Schedule

```
Week 1:
  Day 1-2: Unified Animation System (lib/animations.ts)
           └→ Foundation for all subsequent work

  Day 2-3: useJourneyState hook + journey_events DB table
           └→ Foundation for onboarding and recommendations

  Day 3-5: Home Page Overhaul
           └→ Dual CTA + dynamic Features + Products fix

Week 2:
  Day 6-7: Journey Conductor (JourneyNext component)
           └→ Integrate into TarotDaily, AstrologyReport, FusionReading

  Day 8-9: Ritual Moments
           ├→ Tarot card reveal ceremony (highest priority)
           ├→ Fusion generation animation
           └→ Save to Grimoire flight animation

  Day 10:  Page Transitions + Polish
           ├→ AnimatePresence unification
           ├→ Suspense skeleton screens
           └→ prefers-reduced-motion degradation verification
```

**Dependency Chain:**
- Animation system → everything (must be first)
- JourneyState → Home overhaul + recommendation system
- Home overhaul and recommendations can be parallelized
- Ritual Moments are independent, can be done anytime

## 12. Out of Scope

- Referral/invite system (designed in growth plan, separate feature work)
- Points redemption page (separate feature work)
- Remotion video sharing (independent project, large scope)
- Star chart 3D ritual (depends on R3F, higher risk, deferred)
- Admin dashboard changes

---

*Generated with Claude Code — 2026-02-06*
