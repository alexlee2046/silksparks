# Silk & Spark Shell Features Audit

**Date:** 2025-12-30
**Version:** 2.0
**Status:** Comprehensive Audit & Implementation Plan

---

## Table of Contents

1. [Document Analysis](#1-document-analysis)
   - [1.1 Purpose](#11-purpose)
   - [1.2 Scope](#12-scope)
   - [1.3 Definitions](#13-definitions)
2. [Implementation Plan Overview](#2-implementation-plan-overview)
3. [Global / Common Shell Patterns](#3-global--common-shell-patterns)
4. [Global UI (Header/Footer)](#4-global-ui-headerfooter)
5. [Home Page](#5-home-page)
6. [Commerce](#6-commerce)
7. [Cart & Checkout](#7-cart--checkout)
8. [Recommendation System](#8-recommendation-system)
9. [Consultation & Booking](#9-consultation--booking)
10. [User Dashboard](#10-user-dashboard)
11. [User Profile & Privacy](#11-user-profile--privacy)
12. [Admin System (Custom & Refine)](#12-admin-system-custom--refine)
13. [Database Gap Analysis](#13-database-gap-analysis)
14. [Risk Assessment](#14-risk-assessment)
15. [Deliverables & Changelog](#15-deliverables--changelog)

---

## 1. Document Analysis

### 1.1 Purpose

The purpose of this document is to systematically identify, document, and plan the remediation of "Shell Features" within the Silk & Spark application. A "Shell Feature" represents technical debt where user interface components exist but lack the necessary backend logic, database persistence, or business logic integration.

### 1.2 Scope

This audit covers the entire frontend codebase (`/pages`, `/components`, `/context`) and its integration with the Supabase backend. It specifically focuses on:

- User-facing interactions (clicks, form submissions).
- Data persistence (CRUD operations).
- Navigation flows (broken links, dead ends).
- Mock data usage.

### 1.3 Definitions

- **Shell Feature**: A UI component that looks functional but performs no meaningful action (e.g., `onClick={() => {}}`, `href="#"`).
- **Mock Logic**: Hardcoded data or logic that simulates a feature without real backend integration.
- **MVP Placeholder**: Features intentionally left simplified for the Minimum Viable Product but needing replacement for production.

---

## 2. Implementation Plan Overview

The remediation of these features is broken down into prioritized phases.

| Phase | Focus Area               | Estimated Effort | Goals                                                                  |
| ----- | ------------------------ | ---------------- | ---------------------------------------------------------------------- |
| **1** | **Core Commerce & Cart** | 3 Days           | Enable real product browsing, cart management, and mock checkout flow. |
| **2** | **User Profile & Auth**  | 2 Days           | Persist user preferences, birth data, and settings.                    |
| **3** | **Consultation Flow**    | 4 Days           | Implement real booking slots, appointment creation, and order linkage. |
| **4** | **Admin & Content**      | 3 Days           | Unify Admin tools, enable real configuration updates.                  |
| **5** | **Cleanup & Polish**     | 2 Days           | Remove dead links, fix global UI shells (notifications).               |

---

## 3. Global / Common Shell Patterns

### 3.1 Empty Event Handlers

**Finding:** Multiple components use empty arrow functions for interactions.

- **Location:** [UserDashboard.tsx:L60-L83](file:///Users/alex/Develop/silksparks/pages/UserDashboard.tsx#L60-L83)
- **Impact:** Users click buttons expecting action, but nothing happens.
- **Remediation:** Implement toast notifications for "Coming Soon" or wire up actual logic.

### 3.2 Form Submission Prevention

**Finding:** Forms that only call `e.preventDefault()` without processing data.

- **Location:** [Layouts.tsx:L300-L330](file:///Users/alex/Develop/silksparks/components/Layouts.tsx#L300-L330), [Consultation.tsx:L523-L529](file:///Users/alex/Develop/silksparks/pages/Consultation.tsx#L523-L529)
- **Impact:** Data loss; user input is discarded.
- **Remediation:** Connect to Supabase API or Edge Functions.

### 3.3 Placeholder Links

**Finding:** `href="#"` used extensively in navigation and footers.

- **Location:** [Layouts.tsx:L334-L349](file:///Users/alex/Develop/silksparks/components/Layouts.tsx#L334-L349)
- **Impact:** Poor user experience; navigation dead ends.

### 3.4 Hardcoded Mocks

**Finding:** Mock data used for critical business logic (slots, catalogs).

- **Impact:** System behavior is static and not data-driven.

---

## 4. Global UI (Header/Footer)

### 4.1 Notifications Entry Point

- **Current Status:** Shell. Bell icon exists but lacks interaction.
- **Location:** [Layouts.tsx:L155-L163](file:///Users/alex/Develop/silksparks/components/Layouts.tsx#L155-L163)
- **Feature Specification:**
  - **Behavior:** Clicking the bell should open a notification dropdown or drawer.
  - **Data Source:** Supabase table `notifications` (to be created).
  - **Real-time:** Subscribe to `notifications` changes via Supabase Realtime.
- **Implementation Details:**
  - Create `notifications` table: `id`, `user_id`, `title`, `message`, `read`, `created_at`.
  - Implement `useNotifications` hook.

### 4.2 Newsletter Subscription

- **Current Status:** Shell. Form submits but does nothing.
- **Location:** [Layouts.tsx:L300-L330](file:///Users/alex/Develop/silksparks/components/Layouts.tsx#L300-L330)
- **Feature Specification:**
  - **Behavior:** Submit email -> Save to DB -> Send confirmation email.
  - **Security:** Validate email format. Rate limit submissions.
- **Implementation Details:**
  - Create `newsletter_subscribers` table.
  - Use Edge Function to trigger email (e.g., Resend/SendGrid).

### 4.3 Footer Legal & Social Links

- **Current Status:** Shell. Links are `#`.
- **Location:** [Layouts.tsx:L334-L349](file:///Users/alex/Develop/silksparks/components/Layouts.tsx#L334-L349)
- **Action:** Create static pages for Privacy, Terms, Cookies or link to external legal docs.

---

## 5. Home Page

### 5.1 Product Carousel Navigation

- **Current Status:** Broken Link / Shell.
- **Finding:** Clicking a product card sets screen to `PRODUCT_DETAIL` but fails to pass `productId`.
- **Location:** [Home.tsx:L242-L275](file:///Users/alex/Develop/silksparks/pages/Home.tsx#L242-L275)
- **Impact:** Detail page shows "Artifact not found".
- **Implementation Plan:**
  - **Fix:** Update `AppContent` to accept a `selectedProduct` state or use URL routing (React Router) instead of state-based screen switching for deep linking.
  - **Code Change:**
    ```typescript
    // Recommended: Use React Router
    navigate(`/product/${product.id}`);
    // Or fix State:
    setProductId(product.id);
    setScreen(Screen.PRODUCT_DETAIL);
    ```

### 5.2 Interactive Card Buttons

- **Current Status:** Shell.
- **Finding:** "Favorite" and "Add to Cart" buttons on Home cards have no handlers.
- **Location:** [Home.tsx:L315-L355](file:///Users/alex/Develop/silksparks/pages/Home.tsx#L315-L355)
- **Feature Specification:**
  - **Favorite:** Toggle record in `user_favorites` table.
  - **Add to Cart:** Call `addToCart(product)` from `CartContext`.

---

## 6. Commerce

### 6.1 Filters & Sorting

- **Current Status:** Shell. UI exists but no logic.
- **Location:** [Commerce.tsx:L90-L216](file:///Users/alex/Develop/silksparks/pages/Commerce.tsx#L90-L216)
- **Feature Specification:**
  - **Behavior:** Checking filters (Category, Price) or changing sort order should update the product list.
  - **Data Source:** Supabase `products` table query with `.eq()`, `.order()`.
- **Implementation Details:**
  - Lift state `filters` and `sortOrder` to parent or Context.
  - Trigger Supabase fetch on change.

### 6.2 Quick Add

- **Current Status:** Shell. Button appears on hover but does nothing.
- **Location:** [Commerce.tsx:L252-L256](file:///Users/alex/Develop/silksparks/pages/Commerce.tsx#L252-L256)
- **Action:** Wire to `CartContext.addItem(product)`.

### 6.3 Product Detail Page

- **Current Status:** Partial Mock.
- **Findings:**
  - Gallery images are repeated mocks ([Commerce.tsx:L345-L351](file:///Users/alex/Develop/silksparks/pages/Commerce.tsx#L345-L351)).
  - Reviews are hardcoded text ([Commerce.tsx:L431-L439](file:///Users/alex/Develop/silksparks/pages/Commerce.tsx#L431-L439)).
  - Favorite button is dead ([Commerce.tsx:L473-L475](file:///Users/alex/Develop/silksparks/pages/Commerce.tsx#L473-L475)).
- **Implementation Plan:**
  - **Gallery:** Fetch `product_images` from Supabase Storage buckets or `products.images` array.
  - **Reviews:** Create `reviews` table and fetch by `product_id`.

---

## 7. Cart & Checkout

### 7.1 Checkout Process

- **Current Status:** Shell. "Proceed to Checkout" triggers `alert()`.
- **Location:** [CartDrawer.tsx:L145-L149](file:///Users/alex/Develop/silksparks/components/CartDrawer.tsx#L145-L149)
- **Feature Specification:**
  - **Behavior:** Clicking checkout should create a pending order and redirect to payment.
  - **Integration:** Stripe or similar payment provider.
- **Implementation Details:**
  - **Step 1:** Create `orders` record with status `pending`.
  - **Step 2:** Create `order_items`.
  - **Step 3:** Integrate Stripe Checkout session.

---

## 8. Recommendation System

### 8.1 Data Source

- **Current Status:** Mock.
- **Finding:** `RecommendationEngine.ts` uses hardcoded `PRODUCTS` constant.
- **Location:** [RecommendationEngine.ts:L1-L57](file:///Users/alex/Develop/silksparks/services/RecommendationEngine.ts#L1-L57)
- **Action:** Refactor to fetch from Supabase `products` table using embedding vectors (pgvector) or simple tag matching.

### 8.2 Broken Navigation

- **Current Status:** Broken Link.
- **Finding:** Clicking a recommended item fails to open details correctly (missing `productId`).
- **Location:** [AppFeatures.tsx:L755-L769](file:///Users/alex/Develop/silksparks/pages/AppFeatures.tsx#L755-L769)
- **Fix:** Apply same fix as Home Page (pass `productId` or use routing).

---

## 9. Consultation & Booking

### 9.1 Booking Slots

- **Current Status:** Mock.
- **Finding:** Slots are generated by random logic based on date parity.
- **Location:** [Consultation.tsx:L285-L296](file:///Users/alex/Develop/silksparks/pages/Consultation.tsx#L285-L296)
- **Implementation Plan:**
  - Create `availability` table for Experts.
  - Query available slots: `ExpertAvailability - ExistingAppointments`.

### 9.2 Booking Persistence

- **Current Status:** Shell. "Confirm Time" only switches screen, data is lost.
- **Location:** [Consultation.tsx:L466-L478](file:///Users/alex/Develop/silksparks/pages/Consultation.tsx#L466-L478)
- **Action:** Store `selectedDate` and `selectedSlot` in `ConsultationContext` or Redux/Zustand store until checkout.

### 9.3 Intake Form

- **Current Status:** Shell. Submits to void.
- **Location:** [Consultation.tsx:L523-L529](file:///Users/alex/Develop/silksparks/pages/Consultation.tsx#L523-L529)
- **Action:** Store form data (focus areas, questions) in temporary state, then save to `consultations` table upon payment/completion.

### 9.4 Delivery Flow

- **Current Status:** Partial Mock. Creates orders but mock time/duration.
- **Location:** [Consultation.tsx:L625-L645](file:///Users/alex/Develop/silksparks/pages/Consultation.tsx#L625-L645)
- **Action:** Create actual `appointments` record linked to the `order`.

---

## 10. User Dashboard

### 10.1 Navigation Shells

- **Current Status:** Shell.
- **Finding:** "Consultations" and "Settings" buttons are empty.
- **Location:** [UserDashboard.tsx:L60-L83](file:///Users/alex/Develop/silksparks/pages/UserDashboard.tsx#L60-L83)
- **Action:** Create `ConsultationHistory` and `UserSettings` components/screens.

### 10.2 Hardcoded Rewards

- **Current Status:** Static. Points and Tier are hardcoded.
- **Location:** [UserDashboard.tsx:L129-L153](file:///Users/alex/Develop/silksparks/pages/UserDashboard.tsx#L129-L153)
- **Action:** Bind to `profiles.points` and calculate tier dynamically.

### 10.3 Sign Out

- **Current Status:** Shell. Only switches screen.
- **Location:** [UserDashboard.tsx:L86-L90](file:///Users/alex/Develop/silksparks/pages/UserDashboard.tsx#L86-L90)
- **Fix:** Call `supabase.auth.signOut()`.

---

## 11. User Profile & Privacy

### 11.1 Marketing Consent

- **Current Status:** Shell. Not persisted.
- **Location:** [UserContext.tsx:L219-L231](file:///Users/alex/Develop/silksparks/context/UserContext.tsx#L219-L231)
- **Action:** Add `preferences` JSONB column to `profiles` table and save consent there.

### 11.2 Birth Data

- **Current Status:** Partial. Birth time is ignored.
- **Location:** [UserContext.tsx:L233-L254](file:///Users/alex/Develop/silksparks/context/UserContext.tsx#L233-L254)
- **Action:** Add `birth_time` column to `profiles` and include in update query.

---

## 12. Admin System (Custom & Refine)

### 12.1 Dual System Redundancy

- **Issue:** Two admin systems exist (`/pages/Admin.tsx` and `/admin` Refine app).
- **Risk:** Inconsistent state. Refine writes to DB, Custom Admin often doesn't.
- **Recommendation:** Deprecate Custom Admin (`pages/Admin.tsx`) and migrate all features to Refine (`admin/`).

### 12.2 Missing Write Logic (Custom Admin)

- **Finding:** "Save Changes", Payment Settings, and Shipping Manage are shells.
- **Location:** [Admin.tsx:L46-L57](file:///Users/alex/Develop/silksparks/pages/Admin.tsx#L46-L57)
- **Action:** If retaining Custom Admin, implement `updateSettings` API calls.

---

## 13. Database Gap Analysis

### 13.1 Unused Tables

- `appointments`: Created by SQL script but not written to by the Consultation flow.
- **Action:** Update `Consultation.tsx` to write to this table.

### 13.2 Missing Tables/Columns

- `notifications`: Missing entirely.
- `newsletter_subscribers`: Missing entirely.
- `reviews`: Missing entirely.
- `profiles.preferences`: Missing column.

---

## 14. Risk Assessment

- **Data Integrity:** High. Users believe they are booking appointments or saving settings, but data is discarded.
- **User Trust:** High. "Shell" buttons frustrate users.
- **Security:** Medium. Client-side validation only; missing RLS for new features.

---

## 15. Deliverables & Changelog

### Changelog (v2.0)

- **Added:** Detailed technical specifications for all identified shell features.
- **Added:** Implementation plans with specific Supabase integration points.
- **Added:** Prioritized roadmap.
- **Updated:** Structured document with TOC and cross-references.
