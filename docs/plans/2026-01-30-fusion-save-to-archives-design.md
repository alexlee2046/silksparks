# Fusion Reading - Save to Archives

**Date**: 2026-01-30
**Status**: Ready for Implementation

## Overview

Implement "Save to Archives" functionality for the Fusion Reading page, allowing users to save their East-West fusion analysis for future reference.

## Goals

- Enable users to save Fusion Reading results to their archives
- Drive user registration by prompting login for save functionality
- Maintain seamless UX with auto-save after login

## Architecture

### User Flow

```
User clicks Save → Check login status
  ├─ Logged in → saveArchive() → Success toast → Button shows "Saved ✓"
  └─ Not logged in → Store pending data in localStorage → Show login modal
       → Login success → Auto-save from localStorage → Success toast
```

### Data Structure

Archive record stored in `archives` table:

```typescript
{
  user_id: string,
  type: "Astrology",  // Reuse existing type
  title: "Fusion: Jia Wood · Scorpio",
  summary: "Element Harmony: 78% - Your Wood essence combines with Scorpio's depth...",
  content: {
    version: "1.0",
    birthData: { date, time, location },
    dayMaster: { stem, stemName, element, elementName },
    sunSign: "Scorpio",
    harmonyScore: 78,
    planets: { Sun, Moon, Mercury, ... },
    fourPillars: { year, month, day, hour },
    wuXingDistribution: { 木: 25, 火: 20, 土: 15, 金: 20, 水: 20 },
    fusionInsights: [{ id, title, type, description }, ...]
  },
  image_url: null
}
```

### Key Design Decisions

1. **Reuse "Astrology" type** - No database migration needed; differentiate via title prefix "Fusion:"

2. **localStorage for pending save** - Survives page refresh during login flow
   - Key: `fusion_pending_save`
   - Cleared after successful save

3. **Supabase-style return type** - `{ data, error }` pattern for consistency

## Implementation

### New Function: `saveArchive`

Location: `hooks/useArchives.ts`

```typescript
export async function saveArchive(data: {
  userId: string;
  type: "Astrology" | "Tarot" | "Five Elements";
  title: string;
  summary: string;
  content: Record<string, unknown>;
}): Promise<{ data: { id: string } | null; error: Error | null }>
```

### Component State

Location: `pages/FusionReading.tsx`

```typescript
const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
```

### Button States

| State | Display | Behavior |
|-------|---------|----------|
| `idle` | "Save to Archives" | Clickable |
| `saving` | Spinner + "Saving..." | Disabled |
| `saved` | "Saved ✓" | Disabled |
| `error` | "Save to Archives" | Clickable, error toast shown |

### Auto-save After Login

```typescript
useEffect(() => {
  const pendingData = localStorage.getItem('fusion_pending_save');
  if (session && pendingData) {
    // Parse and save
    // Clear localStorage on success
  }
}, [session]);
```

## Files to Change

| File | Change |
|------|--------|
| `hooks/useArchives.ts` | Add `saveArchive()` function |
| `pages/FusionReading.tsx` | Add save logic, state management, auto-save |
| `messages/en.json` | Add "Saving...", "Saved", error messages |
| `messages/zh.json` | Chinese translations |

## Out of Scope

- Share functionality (future iteration)
- Image generation for archives
- New archive type "Fusion" (keep using "Astrology")

## Testing Plan

1. **Logged-in user**: Click save → verify archive created in database
2. **Guest user**: Click save → login → verify auto-save completes
3. **Error handling**: Simulate network error → verify error state and retry
4. **Duplicate prevention**: Save twice → verify button stays disabled after first save
