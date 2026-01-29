# Fusion Reading - Save to Archives Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable users to save their Fusion Reading results to archives, with auto-save after login for guests.

**Architecture:** Add `saveArchive()` function to hooks, implement save state machine in FusionReading page, use localStorage for pending saves during login flow.

**Tech Stack:** React, TypeScript, Supabase, localStorage, react-hot-toast

---

## Task 1: Add i18n Messages for Save States

**Files:**
- Modify: `messages/en.json:126-142`
- Modify: `messages/zh.json` (corresponding section)

**Step 1: Add English save state messages**

Add these keys inside `fusion.page` object after `sunSign`:

```json
"saving": "Saving...",
"saved": "Saved ✓",
"saveError": "Failed to save. Tap to retry.",
"saveSuccess": "Reading saved to archives!"
```

**Step 2: Add Chinese save state messages**

Add corresponding Chinese translations in `zh.json`:

```json
"saving": "保存中...",
"saved": "已保存 ✓",
"saveError": "保存失败，点击重试",
"saveSuccess": "解读已保存至档案！"
```

**Step 3: Verify i18n compilation**

Run: `npm run build`
Expected: Build succeeds with no i18n errors

**Step 4: Commit**

```bash
git add messages/en.json messages/zh.json
git commit -m "feat(i18n): add fusion save state messages"
```

---

## Task 2: Add saveArchive Function to useArchives Hook

**Files:**
- Modify: `hooks/useArchives.ts:1-104`

**Step 1: Define SaveArchiveParams interface**

Add after line 4 (after `ArchiveItem` import):

```typescript
export interface SaveArchiveParams {
  userId: string;
  type: "Astrology" | "Tarot" | "Five Elements";
  title: string;
  summary: string;
  content: Record<string, unknown>;
  imageUrl?: string;
}

export interface SaveArchiveResult {
  data: { id: string } | null;
  error: Error | null;
}
```

**Step 2: Add saveArchive function**

Add after `invalidateArchivesCache()` function (after line 103):

```typescript
/**
 * Save a new archive entry
 * Returns { data, error } following Supabase conventions
 */
export async function saveArchive(
  params: SaveArchiveParams
): Promise<SaveArchiveResult> {
  try {
    const { data, error } = await supabase
      .from("archives")
      .insert({
        user_id: params.userId,
        type: params.type,
        title: params.title,
        summary: params.summary,
        content: params.content,
        image_url: params.imageUrl ?? null,
      })
      .select("id")
      .single();

    if (error) throw error;

    // Invalidate cache so next fetch includes new item
    invalidateArchivesCache();

    return { data: { id: data.id }, error: null };
  } catch (e) {
    console.error("[saveArchive] Error:", e);
    return {
      data: null,
      error: e instanceof Error ? e : new Error("Failed to save archive"),
    };
  }
}
```

**Step 3: Verify TypeScript compilation**

Run: `npm run typecheck`
Expected: No type errors

**Step 4: Commit**

```bash
git add hooks/useArchives.ts
git commit -m "feat(archives): add saveArchive function with Supabase-style return"
```

---

## Task 3: Implement Save Logic in FusionReading Page

**Files:**
- Modify: `pages/FusionReading.tsx`

**Step 1: Add imports**

Add to imports (around line 8):

```typescript
import { useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { saveArchive } from "../hooks/useArchives";
```

**Step 2: Add save state**

Add after line 52 (after `expandedSection` state):

```typescript
const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
```

**Step 3: Add PENDING_SAVE_KEY constant**

Add after `ZODIAC_SYMBOLS` constant (around line 42):

```typescript
const PENDING_SAVE_KEY = "fusion_pending_save";
```

**Step 4: Create buildArchiveData helper function**

Add before the component (around line 44):

```typescript
interface FusionArchiveContent {
  version: string;
  birthData: {
    date: string;
    time: string;
    location: { name: string; lat: number; lng: number } | null;
  };
  dayMaster: {
    stem: string;
    stemName: string;
    element: string;
    elementName: string;
  };
  sunSign: string;
  harmonyScore: number;
  planets: Record<string, string>;
  fourPillars: Record<string, { stem: string; branch: string }>;
  wuXingDistribution: Record<string, number>;
  fusionInsights: Array<{
    id: string;
    title: string;
    type: string;
    description: string;
  }>;
}
```

**Step 5: Implement handleSave function**

Add inside component (after fusionInsights useMemo, around line 160):

```typescript
const handleSave = useCallback(async () => {
  if (!session?.user?.id) {
    // Store data for later save after login
    const pendingData: FusionArchiveContent = {
      version: "1.0",
      birthData: {
        date: effectiveBirthData?.date?.toISOString() ?? "",
        time: effectiveBirthData?.time ?? "",
        location: effectiveBirthData?.location ?? null,
      },
      dayMaster: dayMasterInfo ?? { stem: "", stemName: "", element: "", elementName: "" },
      sunSign: sunSign ?? "",
      harmonyScore,
      planets: planets ?? {},
      fourPillars: baziChart?.fourPillars ?? {},
      wuXingDistribution: baziChart?.wuXingDistribution ?? {},
      fusionInsights,
    };
    localStorage.setItem(PENDING_SAVE_KEY, JSON.stringify(pendingData));
    toast(m["birthChart.guest.savePrompt"](), { icon: "🔐" });
    return;
  }

  if (saveState === 'saving' || saveState === 'saved') return;

  setSaveState('saving');

  const archiveContent: FusionArchiveContent = {
    version: "1.0",
    birthData: {
      date: effectiveBirthData?.date?.toISOString() ?? "",
      time: effectiveBirthData?.time ?? "",
      location: effectiveBirthData?.location ?? null,
    },
    dayMaster: dayMasterInfo ?? { stem: "", stemName: "", element: "", elementName: "" },
    sunSign: sunSign ?? "",
    harmonyScore,
    planets: planets ?? {},
    fourPillars: baziChart?.fourPillars ?? {},
    wuXingDistribution: baziChart?.wuXingDistribution ?? {},
    fusionInsights,
  };

  const { error } = await saveArchive({
    userId: session.user.id,
    type: "Astrology",
    title: `Fusion: ${dayMasterInfo?.elementName ?? "Unknown"} · ${sunSign ?? "Unknown"}`,
    summary: `Element Harmony: ${harmonyScore}% - ${fusionInsights[0]?.description?.slice(0, 100) ?? ""}...`,
    content: archiveContent as unknown as Record<string, unknown>,
  });

  if (error) {
    setSaveState('error');
    toast.error(m["fusion.page.saveError"]());
  } else {
    setSaveState('saved');
    toast.success(m["fusion.page.saveSuccess"]());
  }
}, [session, saveState, effectiveBirthData, dayMasterInfo, sunSign, harmonyScore, planets, baziChart, fusionInsights]);
```

**Step 6: Implement auto-save after login useEffect**

Add after handleSave (around line 210):

```typescript
// Auto-save pending data after login
useEffect(() => {
  const autoSave = async () => {
    const pendingDataStr = localStorage.getItem(PENDING_SAVE_KEY);
    if (!session?.user?.id || !pendingDataStr) return;

    try {
      const pendingData = JSON.parse(pendingDataStr) as FusionArchiveContent;

      setSaveState('saving');

      const { error } = await saveArchive({
        userId: session.user.id,
        type: "Astrology",
        title: `Fusion: ${pendingData.dayMaster.elementName || "Unknown"} · ${pendingData.sunSign || "Unknown"}`,
        summary: `Element Harmony: ${pendingData.harmonyScore}% - ${pendingData.fusionInsights[0]?.description?.slice(0, 100) ?? ""}...`,
        content: pendingData as unknown as Record<string, unknown>,
      });

      if (error) {
        setSaveState('error');
        toast.error(m["fusion.page.saveError"]());
      } else {
        localStorage.removeItem(PENDING_SAVE_KEY);
        setSaveState('saved');
        toast.success(m["fusion.page.saveSuccess"]());
      }
    } catch (e) {
      console.error("[FusionReading] Failed to parse pending save:", e);
      localStorage.removeItem(PENDING_SAVE_KEY);
    }
  };

  autoSave();
}, [session]);
```

**Step 7: Update Save button with state handling**

Replace the save button (around line 402-408) with:

```typescript
<button
  onClick={handleSave}
  disabled={saveState === 'saving' || saveState === 'saved'}
  className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-colors ${
    saveState === 'saved'
      ? 'bg-green-500/20 border border-green-500/50 text-green-400 cursor-default'
      : saveState === 'saving'
        ? 'bg-surface border border-surface-border text-text-muted cursor-wait'
        : saveState === 'error'
          ? 'bg-red-500/10 border border-red-500/30 text-foreground hover:border-red-500/50'
          : 'bg-surface border border-surface-border text-foreground hover:border-primary/50'
  }`}
>
  {saveState === 'saving' ? (
    <>
      <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
      {m["fusion.page.saving"]()}
    </>
  ) : saveState === 'saved' ? (
    <>
      <span className="material-symbols-outlined text-[20px]">check_circle</span>
      {m["fusion.page.saved"]()}
    </>
  ) : (
    <>
      <span className="material-symbols-outlined text-[20px]">bookmark</span>
      {m["fusion.page.saveToArchives"]()}
    </>
  )}
</button>
```

**Step 8: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 9: Commit**

```bash
git add pages/FusionReading.tsx
git commit -m "feat(fusion): implement save to archives with auto-save after login"
```

---

## Task 4: Manual Testing & Verification

**Step 1: Test logged-in user save flow**

1. Start dev server: `npm run dev`
2. Sign in with test account
3. Navigate to /fusion
4. Enter birth data if needed
5. Click "Save to Archives"
6. Verify:
   - Button shows "Saving..." with spinner
   - Button transitions to "Saved ✓"
   - Toast shows success message
   - Button is disabled after save

**Step 2: Test guest user → login → auto-save flow**

1. Sign out
2. Navigate to /fusion
3. Enter birth data
4. Click "Save to Archives"
5. Verify toast prompts to sign in
6. Sign in
7. Verify:
   - Auto-save triggers
   - Toast shows success
   - localStorage is cleared

**Step 3: Test error handling**

1. Temporarily break supabase connection (disconnect network)
2. Try to save
3. Verify:
   - Button shows error state
   - Toast shows error message
   - Button is clickable for retry

**Step 4: Verify in database**

Run SQL in Supabase dashboard:
```sql
SELECT * FROM archives WHERE type = 'Astrology' AND title LIKE 'Fusion:%' ORDER BY created_at DESC LIMIT 5;
```

Verify record exists with correct structure.

**Step 5: Final commit with all changes**

```bash
git add -A
git commit -m "feat(fusion): complete save to archives implementation

- Add i18n messages for save states (en/zh)
- Add saveArchive() function to useArchives hook
- Implement save button state machine (idle/saving/saved/error)
- Auto-save pending data after guest login
- Use localStorage for pending save during login flow"
```

---

## Verification Checklist

- [ ] i18n messages added (en + zh)
- [ ] saveArchive function exported from hooks/useArchives.ts
- [ ] Save button shows correct states (idle, saving, saved, error)
- [ ] Guest click stores to localStorage and prompts login
- [ ] Login triggers auto-save of pending data
- [ ] Success toast appears after save
- [ ] Error toast appears on failure
- [ ] Database record created with correct structure
- [ ] Build passes: `npm run build`
- [ ] TypeCheck passes: `npm run typecheck`
- [ ] Lint passes: `npm run lint`
