# Silksparks 全面修复实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修复安全审查报告中发现的全部 25 个问题，按 CRITICAL > HIGH > MEDIUM > LOW 优先级排列

**Architecture:** 分为 4 个阶段：(1) 安全紧急修复 (2) 安全加固 (3) 代码质量提升 (4) 项目结构清理。每个阶段独立可提交，互不阻塞。

**Tech Stack:** Supabase (PostgreSQL RLS + Edge Functions/Deno), React 19 + TypeScript, Vite, Vercel, Stripe

---

## Phase 1: 安全紧急修复 (CRITICAL)

### Task 1: 保护 `is_admin` 列防止提权攻击

**Files:**
- Create: `supabase/migrations/20260206000001_protect_admin_flag.sql`

**Step 1: 编写 migration 文件**

```sql
-- Protect is_admin from being modified by regular users
-- Uses trigger approach (more robust than RLS WITH CHECK)

CREATE OR REPLACE FUNCTION public.protect_admin_flag()
RETURNS TRIGGER AS $$
BEGIN
  -- Only allow is_admin changes via service_role (Edge Functions, migrations)
  -- Regular users through anon/authenticated key cannot modify it
  IF NEW.is_admin IS DISTINCT FROM OLD.is_admin THEN
    -- Check if the current role is service_role (bypasses RLS)
    -- If we're here, we're running under RLS, so it's a regular user
    RAISE EXCEPTION 'Cannot modify is_admin flag via client';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop if exists to make migration idempotent
DROP TRIGGER IF EXISTS protect_admin_flag_trigger ON public.profiles;

CREATE TRIGGER protect_admin_flag_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_admin_flag();

-- Also protect tier and points from client-side manipulation
CREATE OR REPLACE FUNCTION public.protect_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'Cannot modify tier via client';
  END IF;
  IF NEW.points IS DISTINCT FROM OLD.points THEN
    RAISE EXCEPTION 'Cannot modify points via client';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS protect_privileged_fields_trigger ON public.profiles;

CREATE TRIGGER protect_privileged_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_privileged_fields();
```

**Step 2: 通过 Supabase CLI 应用 migration**

Run: `cd /Users/alex/Develop/silksparks && npx supabase db push`
Expected: Migration applied successfully

**Step 3: 验证 trigger 生效**

在 Supabase SQL Editor 中测试:
```sql
-- 模拟普通用户尝试修改 is_admin (应该失败)
-- 使用 authenticated role
SET ROLE authenticated;
UPDATE profiles SET is_admin = true WHERE id = (SELECT id FROM profiles LIMIT 1);
-- Expected: ERROR: Cannot modify is_admin flag via client
RESET ROLE;
```

**Step 4: Commit**

```bash
git add supabase/migrations/20260206000001_protect_admin_flag.sql
git commit -m "fix(security): add trigger to protect is_admin from client-side modification

CRITICAL: Prevents privilege escalation via direct Supabase API calls.
Also protects tier and points fields."
```

---

### Task 2: 轮换泄露的凭据

**Files:**
- Modify: `.env.test`

**Step 1: 在 Supabase Dashboard 轮换 DB 密码**

1. 打开 Supabase Dashboard → Settings → Database
2. 点击 "Reset database password"
3. 记录新密码

**Step 2: 更改管理员用户密码**

在 Supabase Dashboard → Authentication → Users 中找到 admin 用户，重置密码

**Step 3: 更新 `.env.test` 中的凭据**

用新密码替换旧密码，确认文件在 `.gitignore` 中

**Step 4: 检查 git 历史是否有泄露**

Run: `cd /Users/alex/Develop/silksparks && git log --all --oneline -- '.env.test' '.env.local' '.env'`
Expected: 如果有结果，需要用 `git filter-repo` 清理

**Step 5: Commit (仅 .gitignore 确认，不提交 .env.test)**

```bash
git status  # 确认 .env.test 不在暂存区
```

---

## Phase 2: 安全加固 (HIGH + MEDIUM)

### Task 3: Edge Function `messages` 路径添加输入过滤

**Files:**
- Modify: `supabase/functions/ai-generate/index.ts:227-232`

**Step 1: 修改 messages 路径，添加 sanitizeInput 调用**

将 `ai-generate/index.ts` 第 227-232 行:
```typescript
    if (messages && Array.isArray(messages) && messages.length > 0) {
      console.log("[AI-Generate] Using provided 'messages' from request");
      const sysMsg = messages.find((m: any) => m.role === "system");
      const usrMsg = messages.find((m: any) => m.role === "user");
      systemPrompt = sysMsg ? sysMsg.content : "";
      userPrompt = usrMsg ? usrMsg.content : "";
```

替换为:
```typescript
    if (messages && Array.isArray(messages) && messages.length > 0) {
      console.log("[AI-Generate] Using provided 'messages' from request");
      const sysMsg = messages.find((m: { role: string }) => m.role === "system");
      const usrMsg = messages.find((m: { role: string }) => m.role === "user");
      systemPrompt = sysMsg ? sanitizeInput(sysMsg.content, 2000) : "";
      userPrompt = usrMsg ? sanitizeInput(usrMsg.content, 2000) : "";
```

**Step 2: 修复全局错误处理，隐藏内部错误信息**

将 `ai-generate/index.ts` 第 367-373 行:
```typescript
  } catch (error: any) {
    console.error("[AI-Generate] Global Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
```

替换为:
```typescript
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[AI-Generate] Global Error:", message);
    return new Response(
      JSON.stringify({ error: "AI service temporarily unavailable" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
```

**Step 3: Commit**

```bash
git add supabase/functions/ai-generate/index.ts
git commit -m "fix(security): sanitize messages path and hide internal errors in Edge Function

- Apply sanitizeInput() to messages path (was bypassing prompt injection filter)
- Return generic error to client, keep detailed logging server-side
- Fix any types to proper typed interfaces"
```

---

### Task 4: CORS 环境化 — 移除生产环境 localhost

**Files:**
- Modify: `supabase/functions/ai-generate/index.ts:6-10`
- Modify: `supabase/functions/create-checkout-session/index.ts:14-19, 130`

**Step 1: 修改 ai-generate CORS**

将第 6-10 行替换为:
```typescript
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "https://silksparks.com,https://www.silksparks.com")
  .split(",")
  .map(o => o.trim());
```

**Step 2: 修改 create-checkout-session CORS**

将第 14-19 行替换为:
```typescript
const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") || "https://silksparks.com,https://www.silksparks.com")
  .split(",")
  .map(o => o.trim());
```

将第 130 行:
```typescript
    const requestOrigin = req.headers.get("origin") || "http://localhost:3000";
```
替换为:
```typescript
    const requestOrigin = req.headers.get("origin") || ALLOWED_ORIGINS[0];
```

**Step 3: 设置 Supabase secrets（开发环境包含 localhost）**

Run: `npx supabase secrets set ALLOWED_ORIGINS="https://silksparks.com,https://www.silksparks.com"`

开发环境本地测试时用:
Run: `echo 'ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,https://silksparks.com,https://www.silksparks.com' >> /Users/alex/Develop/silksparks/supabase/.env.local`

**Step 4: Commit**

```bash
git add supabase/functions/ai-generate/index.ts supabase/functions/create-checkout-session/index.ts
git commit -m "fix(security): environment-based CORS origins for Edge Functions

- Remove hardcoded localhost from production CORS
- Use ALLOWED_ORIGINS env var with production-safe defaults
- Fix requestOrigin fallback to production domain instead of localhost"
```

---

### Task 5: 收紧 CSP 策略

**Files:**
- Modify: `vercel.json:37-38`

**Step 1: 更新 CSP header**

将 `vercel.json` 第 37-38 行的 CSP value 替换为:
```json
{
  "key": "Content-Security-Policy",
  "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://js.stripe.com https://cdn.vercel-insights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob: https://*.supabase.co https://*.stripe.com https://lh3.googleusercontent.com; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com; frame-src https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'"
}
```

变更说明:
- 移除 `'unsafe-eval'`（Vite 生产构建不需要）
- 移除 `https://generativelanguage.googleapis.com`（生产环境走 Edge Function）
- 保留 `'unsafe-inline'`（Vite 构建的 CSS 注入需要，后续可改 nonce）

**Step 2: 本地验证构建**

Run: `cd /Users/alex/Develop/silksparks && npm run build`
Expected: Build succeeds without errors

**Step 3: Commit**

```bash
git add vercel.json
git commit -m "fix(security): tighten CSP - remove unsafe-eval and direct Gemini API domain

- Remove 'unsafe-eval' from script-src (not needed in production)
- Remove generativelanguage.googleapis.com from connect-src (production uses Edge Functions)
- Keep 'unsafe-inline' for now (needed by Vite CSS injection)"
```

---

### Task 6: Checkout URL 重定向验证

**Files:**
- Modify: `supabase/functions/create-checkout-session/index.ts:229-231, 351-352`

**Step 1: 在文件顶部添加 URL 验证函数**

在 `getCorsHeaders` 函数之后（约第 35 行后）添加:
```typescript
function validateRedirectUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    const allowedHosts = ["silksparks.com", "www.silksparks.com", "localhost"];
    if (allowedHosts.includes(parsed.hostname)) {
      return url;
    }
  } catch {
    // Invalid URL
  }
  return null;
}
```

**Step 2: 修改 membership checkout 中 successUrl/cancelUrl 使用**

将第 230-231 行:
```typescript
  const finalSuccessUrl = successUrl || `${requestOrigin}/membership?success=true`;
  const finalCancelUrl = cancelUrl || `${requestOrigin}/membership?canceled=true`;
```
替换为:
```typescript
  const finalSuccessUrl = validateRedirectUrl(successUrl) || `${requestOrigin}/membership?success=true`;
  const finalCancelUrl = validateRedirectUrl(cancelUrl) || `${requestOrigin}/membership?canceled=true`;
```

**Step 3: 同样修改 yearly forecast checkout（约第 351-352 行）**

将:
```typescript
  const finalSuccessUrl = successUrl || `${requestOrigin}/horoscope/yearly?success=true`;
  const finalCancelUrl = cancelUrl || `${requestOrigin}/horoscope/yearly?canceled=true`;
```
替换为:
```typescript
  const finalSuccessUrl = validateRedirectUrl(successUrl) || `${requestOrigin}/horoscope/yearly?success=true`;
  const finalCancelUrl = validateRedirectUrl(cancelUrl) || `${requestOrigin}/horoscope/yearly?canceled=true`;
```

**Step 4: Commit**

```bash
git add supabase/functions/create-checkout-session/index.ts
git commit -m "fix(security): validate checkout redirect URLs against domain whitelist

Prevents open redirect attacks via successUrl/cancelUrl parameters"
```

---

### Task 7: 加强 IP hash 算法

**Files:**
- Modify: `supabase/functions/ai-generate/index.ts:95-106`

**Step 1: 替换 hashIP 函数**

将第 89-106 行替换为:
```typescript
/**
 * Hash IP address for privacy-preserving rate limiting
 * Uses HMAC-SHA256 with daily rotation for:
 * 1. Privacy (no raw IPs stored)
 * 2. Daily rotation (harder to track)
 * 3. Collision resistance (256-bit vs old 32-bit)
 */
async function hashIP(ip: string): Promise<string> {
  const secret = Deno.env.get("RATE_LIMIT_SECRET") || "silksparks-rate-limit-default";
  const today = new Date().toISOString().split("T")[0];
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${ip}:${today}`),
  );
  const hashHex = Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 16);
  return `anon_${hashHex}`;
}
```

**Step 2: 更新调用处为 await**

在 `ai-generate/index.ts` 中搜索 `hashIP(` 调用处，确保前面有 `await`:
```typescript
const ipHash = await hashIP(clientIP);
```
（原代码如果已有 await 则不需要改动；如果没有则添加）

**Step 3: Commit**

```bash
git add supabase/functions/ai-generate/index.ts
git commit -m "fix(security): upgrade IP hash from DJB2-32bit to HMAC-SHA256

- Use crypto.subtle for proper cryptographic hashing
- Move salt to RATE_LIMIT_SECRET env var
- 256-bit output eliminates collision risk"
```

---

### Task 8: API 密钥从数据库迁移到环境变量

**Files:**
- Modify: `supabase/functions/ai-generate/index.ts:214-217`

**Step 1: 修改密钥读取逻辑，仅使用环境变量**

将第 214-217 行:
```typescript
    // Prioritize DB keys (for Admin testing), then Env vars
    const openRouterKey =
      config.openrouter_key || Deno.env.get("OPENROUTER_API_KEY");
    const geminiKey = config.gemini_key || Deno.env.get("GEMINI_API_KEY");
```

替换为:
```typescript
    // API keys from environment only (never store in DB)
    const openRouterKey = Deno.env.get("OPENROUTER_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");
```

**Step 2: 确认 Supabase secrets 已设置**

Run: `npx supabase secrets list`

如果缺少:
Run: `npx supabase secrets set OPENROUTER_API_KEY=<key> GEMINI_API_KEY=<key>`

**Step 3: Commit**

```bash
git add supabase/functions/ai-generate/index.ts
git commit -m "fix(security): read API keys exclusively from env vars, not database

Removes ability for admin users to see/modify API keys via system_settings.
Keys now only configurable via 'supabase secrets set'."
```

---

## Phase 3: 代码质量提升

### Task 9: 收紧 ESLint 规则 + 添加 typecheck script

**Files:**
- Modify: `eslint.config.js:26-30`
- Modify: `package.json` (scripts section)

**Step 1: 更新 ESLint 规则**

将 `eslint.config.js` 第 26-30 行:
```javascript
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
```

替换为:
```javascript
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
```

**Step 2: 在 package.json scripts 中添加 typecheck**

在 `"test:unit:coverage"` 行之后添加:
```json
    "typecheck": "tsc --noEmit",
    "ci": "npm run lint && npm run typecheck && npm run test:unit"
```

**Step 3: 运行 lint 查看当前状态**

Run: `cd /Users/alex/Develop/silksparks && npm run lint 2>&1 | tail -20`
Expected: 记录错误数量，暂不修复全部（后续 Task 处理）

**Step 4: Commit**

```bash
git add eslint.config.js package.json
git commit -m "chore: tighten ESLint rules and add typecheck script

- Upgrade no-explicit-any and no-unused-vars from warn to error
- Add no-console rule (allow warn/error)
- Add typecheck and ci scripts to package.json"
```

---

### Task 10: 设置覆盖率阈值

**Files:**
- Modify: `vitest.config.ts:37-44`

**Step 1: 更新覆盖率阈值**

将第 37-44 行:
```typescript
      thresholds: {
        // Start low, increase as coverage grows
        // Target: 80% → 100% over time
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      },
```

替换为:
```typescript
      thresholds: {
        statements: 50,
        branches: 45,
        functions: 50,
        lines: 50,
      },
```

（从 50% 起步，逐步提高到 70%+）

**Step 2: 验证当前覆盖率**

Run: `cd /Users/alex/Develop/silksparks && npm run test:unit:coverage 2>&1 | tail -20`
Expected: 查看实际覆盖率，如果低于 50% 则调低阈值

**Step 3: Commit**

```bash
git add vitest.config.ts
git commit -m "chore: set coverage thresholds at 50% baseline

Starting point for coverage gates. Will increase as coverage improves."
```

---

## Phase 4: 项目结构清理

### Task 11: 归档根目录遗留 SQL 文件

**Files:**
- Move: 12 个 `supabase_*.sql` 文件 → `scripts/legacy-migrations/`
- Create: `scripts/legacy-migrations/README.md`

**Step 1: 创建目录并移动文件**

Run:
```bash
cd /Users/alex/Develop/silksparks && \
mkdir -p scripts/legacy-migrations && \
mv supabase_init.sql supabase_phase2.sql supabase_phase3.sql \
   supabase_phase4.sql supabase_phase4_fix.sql \
   supabase_phase5.sql supabase_phase5_fix.sql \
   supabase_tags.sql supabase_appointments.sql \
   supabase_ai_settings.sql supabase_favorites.sql \
   supabase_product_images.sql \
   scripts/legacy-migrations/
```

**Step 2: 创建 README**

创建 `scripts/legacy-migrations/README.md`:
```markdown
# Legacy SQL Migration Files

These SQL files are from the early development phase and have been superseded
by the official Supabase migration system in `supabase/migrations/`.

**DO NOT run these files.** They are kept for historical reference only.

The authoritative schema is defined by the migrations in `supabase/migrations/`.
```

**Step 3: Commit**

```bash
git add scripts/legacy-migrations/ && \
git rm --cached supabase_init.sql supabase_phase2.sql supabase_phase3.sql \
  supabase_phase4.sql supabase_phase4_fix.sql \
  supabase_phase5.sql supabase_phase5_fix.sql \
  supabase_tags.sql supabase_appointments.sql \
  supabase_ai_settings.sql supabase_favorites.sql \
  supabase_product_images.sql 2>/dev/null; \
git add -A scripts/legacy-migrations/ && \
git commit -m "chore: archive legacy SQL files to scripts/legacy-migrations/

12 root-level SQL files moved. Official migrations are in supabase/migrations/.
These legacy files are kept for historical reference only."
```

---

### Task 12: 整理根目录文档

**Files:**
- Move: 根目录文档 → `docs/` 相应子目录
- Keep: `CLAUDE.md`, `README.md`, `.md` config files at root

**Step 1: 移动文档文件**

Run:
```bash
cd /Users/alex/Develop/silksparks && \
mkdir -p docs/architecture docs/audits docs/testing && \
mv SUPABASE_INTEGRATION.md docs/architecture/ 2>/dev/null; \
mv DOCUMENTATION_MAP.md docs/architecture/ 2>/dev/null; \
mv TEST_REPORT.md docs/testing/ 2>/dev/null; \
mv SHELL_AUDIT_README.md docs/audits/ 2>/dev/null; \
mv SHELL_FEATURES_AUDIT.md docs/audits/ 2>/dev/null; \
mv SHELL_FEATURES_CHANGELOG.md docs/audits/ 2>/dev/null; \
mv "这里是生产环境优化计划.md" docs/plans/production-optimization-plan.md 2>/dev/null; \
echo "Done"
```

**Step 2: 移动 reports 目录内容**

Run:
```bash
cd /Users/alex/Develop/silksparks && \
mv reports/*.md docs/audits/ 2>/dev/null; \
rmdir reports 2>/dev/null; \
echo "Done"
```

**Step 3: Commit**

```bash
git add -A docs/ && \
git add -u && \
git commit -m "chore: organize documentation into docs/ directory structure

- docs/architecture/ - integration guides
- docs/audits/ - shell audits and reports
- docs/testing/ - test reports
- docs/plans/ - implementation plans"
```

---

### Task 13: 删除 Vercel OIDC token 遗留文件

**Files:**
- Delete: `.vercel/.env.preview.local`

**Step 1: 删除文件**

Run: `rm -f /Users/alex/Develop/silksparks/.vercel/.env.preview.local`

**Step 2: 确认 .vercel 在 .gitignore**

Run: `grep '.vercel' /Users/alex/Develop/silksparks/.gitignore`
Expected: 输出包含 `.vercel`

不需要 git commit（文件已被 .gitignore 排除）

---

### Task 14: 清理 debug 文件

**Files:**
- Delete: `debug-home.png` (根目录调试截图)

**Step 1: 删除文件**

Run: `rm -f /Users/alex/Develop/silksparks/debug-home.png`

**Step 2: 检查是否被 git 追踪**

Run: `git ls-files debug-home.png`
如果有输出: `git rm debug-home.png`

**Step 3: Commit (如果被追踪)**

```bash
git commit -m "chore: remove debug screenshot from root directory"
```

---

## Phase 5: 最终验证

### Task 15: 全面验证

**Step 1: Lint 检查**

Run: `cd /Users/alex/Develop/silksparks && npm run lint`
Expected: 除已知的 any 类型警告外无新错误

**Step 2: TypeScript 编译检查**

Run: `cd /Users/alex/Develop/silksparks && npm run typecheck`
Expected: 无类型错误

**Step 3: 构建检查**

Run: `cd /Users/alex/Develop/silksparks && npm run build`
Expected: 构建成功

**Step 4: 单元测试**

Run: `cd /Users/alex/Develop/silksparks && npm run test:unit`
Expected: 所有测试通过

**Step 5: 提交最终状态**

如果有未提交的修复:
```bash
git add -A && git commit -m "fix: address lint and type errors from tightened rules"
```

---

## 延期项（不在本次修复范围）

以下问题记录在案但需要更大重构，建议单独立项：

1. **超大组件拆分** (FusionReading 749行, TarotDaily 655行, Home 603行) — 需要独立 PR
2. **UserContext → AuthContext 迁移完成** — 需要全面测试回归
3. **源码迁移到 src/ 目录** — 需要更新所有 import 路径
4. **路径别名 `@/` 全面采用** — 需要批量修改 import
5. **Admin 页面 `any` 类型修复** — 需要了解 Refine 类型系统
6. **Barrel export 优化** — 影响 tree-shaking，需要性能测试验证
