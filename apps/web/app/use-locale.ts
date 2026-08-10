"use client";

import { useEffect, useState } from "react";
import { isLocale, type Locale } from "./locale";

const storageKey = "meterkit-locale-v1";
const legacyStorageKey = "meterkit-locale";

export function useLocale() {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const saved =
      localStorage.getItem(storageKey) ??
      localStorage.getItem(legacyStorageKey);
    if (isLocale(saved)) setLocale(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
    localStorage.setItem(storageKey, locale);
    localStorage.removeItem(legacyStorageKey);
  }, [locale]);

  return [locale, setLocale] as const;
}
