# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev          # Start Vite dev server (port 3000)
npm run build        # Production build to dist/
npm run lint         # ESLint check
npm run preview      # Preview production build

# Testing
npm test             # Run all tests (db, api, security, e2e)
npm run test:db      # Database connectivity tests
npm run test:api     # API endpoint tests
npm run test:security # RLS policy tests
npm run test:e2e     # Playwright E2E tests
npm run test:e2e:headed  # E2E with visible browser
```

## Architecture Overview

### Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4 with custom dark theme
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Admin Console**: Refine.dev at `/admin/*`
- **3D/Animation**: Three.js (React Three Fiber) + Framer Motion

### Application Structure

```
App.tsx              # Main router - splits /admin/* vs user app
├── /admin/*         # Refine admin dashboard (admin/App.tsx)
└── /*               # User-facing SPA with screen-based navigation
```

### Screen-Based Navigation

Routes are controlled by `Screen` enum in `types.ts`. The `App.tsx` renders different page components based on `currentScreen` state rather than URL paths.

Key screen groups:

- **Public**: HOME, BIRTH_CHART, REPORT, TAROT_DAILY, TAROT_SPREAD
- **Commerce**: SHOP_LIST, PRODUCT_DETAIL
- **Consultation**: EXPERTS, EXPERT_PROFILE, BOOKING, INTAKE, DELIVERY
- **User Dashboard**: USER_DASHBOARD, ARCHIVES, ORDERS, CONSULTATIONS, SETTINGS
- **Admin**: ADMIN_PAYMENTS, ADMIN_CURRENCY, ADMIN_SHIPPING, ADMIN_SETTINGS

### State Management

Context API (no Redux):

- `context/UserContext.tsx` - Auth session, user profile, orders, archives, favorites
- `context/CartContext.tsx` - Shopping cart with localStorage persistence

### Authentication

Supabase Auth with RLS (Row Level Security):

- Session managed via `UserContext`
- Admin routes require `isAdmin` flag from profile
- Protected screens check session before rendering

## Key Files

| Path                          | Purpose                                           |
| ----------------------------- | ------------------------------------------------- |
| `types.ts`                    | Screen enum & NavProps interface                  |
| `services/supabase.ts`        | Supabase client initialization                    |
| `services/ai/`                | AI provider abstraction (Gemini vs Edge Function) |
| `services/AstrologyEngine.ts` | Planetary calculations (astronomy-engine)         |
| `components/Layouts.tsx`      | Header/Footer, notifications, layout wrapper      |
| `pages/`                      | One file per major screen/feature                 |
| `admin/`                      | Separate Refine-based admin app                   |
| `supabase/functions/`         | Edge Functions (ai-generate)                      |
| `supabase/migrations/`        | Database schema migrations                        |

## Database Schema

Core tables (all have RLS policies):

- `profiles` - User accounts with birth data, tier, points
- `archives` - AI-generated reports (astrology, tarot)
- `products` + `product_tags` - Shop catalog
- `orders` + `order_items` - Purchase history
- `experts` - Consultant profiles
- `appointments` - Booking records
- `system_settings` - Admin configuration (admin-only access)

## AI Provider Configuration

Set via `VITE_AI_PROVIDER` in `.env.local`:

- `gemini` - Direct Gemini API (dev only, key exposed in frontend)
- `supabase` - Edge Function proxy (production, key server-side)

For production: deploy Edge Function and set `GEMINI_API_KEY` via `supabase secrets set`.

## Environment Setup

Copy `.env.example` to `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_AI_PROVIDER=gemini  # or supabase
VITE_GEMINI_API_KEY=your-key  # only for dev with gemini provider
```

## Testing

Tests in `tests/` directory:

- `db.test.cjs` - Supabase connection, table existence
- `api.test.cjs` - API endpoint responses
- `security.test.cjs` - RLS policy enforcement
- `e2e/` + `visual.spec.ts` - Playwright browser tests (port 3009)

Run single test file: `node tests/db.test.cjs`
