"use client";

import { useEffect, useRef } from "react";
import { useDocsSearch } from "fumadocs-core/search/client";
import { fetchClient } from "fumadocs-core/search/client/fetch";

export function DocumentationSearch({ locale }: { locale: "en" | "es" }) {
  const input = useRef<HTMLInputElement>(null);
  const { search, setSearch, query } = useDocsSearch({
    client: fetchClient({ locale }),
  });
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "/" && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        input.current?.focus();
      }
    };
    globalThis.addEventListener("keydown", onKeyDown);
    return () => globalThis.removeEventListener("keydown", onKeyDown);
  }, []);
  const results = query.data === "empty" ? [] : (query.data ?? []);
  return (
    <div className="docsSearch">
      <label htmlFor="docs-search">
        {locale === "es" ? "Buscar documentación" : "Search documentation"}
      </label>
      <div className="docsSearchInput">
        <input
          id="docs-search"
          ref={input}
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={
            locale === "es" ? "Pagos, replay, Hono…" : "Payments, replay, Hono…"
          }
        />
        <kbd>/</kbd>
      </div>
      <div aria-live="polite" className="docsSearchResults">
        {query.isLoading ? (
          <p>{locale === "es" ? "Buscando…" : "Searching…"}</p>
        ) : null}
        {search && !query.isLoading && results.length === 0 ? (
          <p>
            {locale === "es"
              ? "Sin resultados. Prueba “pago” o “replay”."
              : "No results. Try “payment” or “replay”."}
          </p>
        ) : null}
        {results.slice(0, 6).map((result) => (
          <a
            href={result.url}
            key={`${result.url}-${result.type}-${result.content}`}
          >
            {result.content}
          </a>
        ))}
      </div>
    </div>
  );
}
