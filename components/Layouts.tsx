/**
 * Layouts.tsx - Re-exports from modular layout components
 *
 * The layout components have been split into:
 * - components/layout/Layout.tsx - Main layout wrapper
 * - components/layout/Header.tsx - Navigation header
 * - components/layout/Footer.tsx - Site footer
 * - components/layout/NotificationsDropdown.tsx - Notification panel
 *
 * Import directly from './layout' for new code.
 */

export { Layout, Header, Footer, NotificationsDropdown } from "./layout";
export type { LayoutProps } from "./layout";
