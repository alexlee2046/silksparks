/**
 * 本地化格式工具 Hook
 * 提供日期、时间、货币的本地化格式化
 */

import { useMemo } from "react";
import { useLanguage } from "../context/LanguageContext";

interface LocaleFormatters {
  /**
   * 格式化日期
   * @param date Date 对象或日期字符串
   * @param style 样式: "short" | "medium" | "long" | "full"
   */
  formatDate: (date: Date | string, style?: "short" | "medium" | "long" | "full") => string;

  /**
   * 格式化时间
   * @param date Date 对象或日期字符串
   * @param style 样式: "short" | "medium"
   */
  formatTime: (date: Date | string, style?: "short" | "medium") => string;

  /**
   * 格式化货币
   * @param amount 金额
   * @param currency 货币代码 (默认根据 locale: zh -> CNY, en -> USD)
   */
  formatCurrency: (amount: number, currency?: string) => string;

  /**
   * 格式化相对时间 (如 "3 days ago")
   * @param date Date 对象或日期字符串
   */
  formatRelativeTime: (date: Date | string) => string;

  /**
   * 当前 locale 对应的货币符号
   */
  currencySymbol: string;

  /**
   * 当前 locale 对应的 BCP 47 语言标签
   */
  localeTag: string;
}

const LOCALE_MAP: Record<string, string> = {
  en: "en-US",
  zh: "zh-CN",
};

const CURRENCY_MAP: Record<string, string> = {
  en: "USD",
  zh: "CNY",
};

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  USD: "$",
  CNY: "¥",
};

export function useLocaleFormat(): LocaleFormatters {
  const { locale } = useLanguage();

  return useMemo(() => {
    const localeTag = LOCALE_MAP[locale] || "en-US";
    const defaultCurrency = CURRENCY_MAP[locale] || "USD";
    const currencySymbol = CURRENCY_SYMBOL_MAP[defaultCurrency] || "$";

    const formatDate = (date: Date | string, style: "short" | "medium" | "long" | "full" = "medium"): string => {
      const d = typeof date === "string" ? new Date(date) : date;
      if (isNaN(d.getTime())) return "";

      const options: Intl.DateTimeFormatOptions = {};
      switch (style) {
        case "short":
          options.month = "numeric";
          options.day = "numeric";
          break;
        case "medium":
          options.month = "short";
          options.day = "numeric";
          options.year = "numeric";
          break;
        case "long":
          options.weekday = "short";
          options.month = "short";
          options.day = "numeric";
          break;
        case "full":
          options.weekday = "long";
          options.month = "long";
          options.day = "numeric";
          options.year = "numeric";
          break;
      }

      return d.toLocaleDateString(localeTag, options);
    };

    const formatTime = (date: Date | string, style: "short" | "medium" = "short"): string => {
      const d = typeof date === "string" ? new Date(date) : date;
      if (isNaN(d.getTime())) return "";

      const options: Intl.DateTimeFormatOptions = {
        hour: "numeric",
        minute: "2-digit",
        hour12: locale === "en", // 英文用12小时制，中文用24小时制
      };

      if (style === "medium") {
        options.second = "2-digit";
      }

      return d.toLocaleTimeString(localeTag, options);
    };

    const formatCurrency = (amount: number, currency?: string): string => {
      const currencyCode = currency || defaultCurrency;
      return new Intl.NumberFormat(localeTag, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const formatRelativeTime = (date: Date | string): string => {
      const d = typeof date === "string" ? new Date(date) : date;
      if (isNaN(d.getTime())) return "";

      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      const rtf = new Intl.RelativeTimeFormat(localeTag, { numeric: "auto" });

      if (diffDays === 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMins = Math.floor(diffMs / (1000 * 60));
          return rtf.format(-diffMins, "minute");
        }
        return rtf.format(-diffHours, "hour");
      } else if (diffDays < 7) {
        return rtf.format(-diffDays, "day");
      } else if (diffDays < 30) {
        return rtf.format(-Math.floor(diffDays / 7), "week");
      } else {
        return rtf.format(-Math.floor(diffDays / 30), "month");
      }
    };

    return {
      formatDate,
      formatTime,
      formatCurrency,
      formatRelativeTime,
      currencySymbol,
      localeTag,
    };
  }, [locale]);
}
