/**
 * Language Context - i18n Management with Paraglide JS
 * Provides locale state and language switching functionality
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import * as runtime from "../src/paraglide/runtime.js";

export type Locale = "en" | "zh";
export const LOCALES: readonly Locale[] = ["en", "zh"] as const;
export const BASE_LOCALE: Locale = "en";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  locales: readonly Locale[];
  isReady: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "silk-spark-locale";

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return BASE_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "zh") {
    return stored;
  }
  // Try to detect from browser
  const browserLang = navigator.language.toLowerCase();
  if (browserLang.startsWith("zh")) {
    return "zh";
  }
  return BASE_LOCALE;
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(() => getStoredLocale());
  const [isReady, setIsReady] = useState(false);

  // Initialize from Paraglide or localStorage
  useEffect(() => {
    const initialLocale = getStoredLocale();
    setLocaleState(initialLocale);

    // Set Paraglide locale without reload (we manage state via React)
    runtime.setLocale(initialLocale, { reload: false });

    setIsReady(true);
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    // Update React state first (triggers re-render)
    setLocaleState(newLocale);

    // Persist to localStorage
    localStorage.setItem(STORAGE_KEY, newLocale);

    // Update Paraglide locale without page reload
    // React re-render will cause message functions to call getLocale() again
    runtime.setLocale(newLocale, { reload: false });

    // Update HTML lang attribute
    document.documentElement.lang = newLocale;
  }, []);

  // Update HTML lang on mount and locale change
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return (
    <LanguageContext.Provider
      value={{
        locale,
        setLocale,
        locales: LOCALES,
        isReady,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

// Locale display names
export const LOCALE_NAMES: Record<Locale, { native: string; english: string }> = {
  en: { native: "English", english: "English" },
  zh: { native: "中文", english: "Chinese" },
};
