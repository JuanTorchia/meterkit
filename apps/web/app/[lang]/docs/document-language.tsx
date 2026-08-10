"use client";

import { useEffect } from "react";

export function DocumentLanguage({ locale }: { locale: "en" | "es" }) {
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = locale;
    return () => {
      document.documentElement.lang = previous;
    };
  }, [locale]);

  return null;
}
