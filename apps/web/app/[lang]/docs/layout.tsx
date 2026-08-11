import Link from "next/link";
import { notFound } from "next/navigation";
import { source } from "../../../lib/source";
import { isDocumentationLocale } from "../../../lib/i18n";
import { DocumentLanguage } from "./document-language";
import { DocumentationSearch } from "./search";

export default async function DocumentationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isDocumentationLocale(lang)) notFound();
  const pages = source
    .getPages(lang)
    .sort((left, right) => left.data.order - right.data.order);
  const opposite = lang === "en" ? "es" : "en";
  return (
    <div className="docsShell">
      <DocumentLanguage locale={lang} />
      <div className="instrumentBar">
        <span>Solana devnet</span>
        <span>Non-custodial</span>
        <span className="warn pushRight">
          {lang === "es"
            ? "Solo devnet — no envíes activos de mainnet"
            : "Devnet only — do not send mainnet assets"}
        </span>
      </div>
      <header className="docsHeader">
        <Link href="/" className="brand">
          <span className="mark">MK</span> MeterKit
        </Link>
        <span className="docsVersion">v0.1 · devnet</span>
        <Link
          href={`/${opposite}/docs`}
          hrefLang={opposite}
          className="docsLocale"
        >
          {opposite === "es" ? "Español" : "English"}
        </Link>
      </header>
      <aside
        className="docsSidebar"
        aria-label={lang === "es" ? "Documentación" : "Documentation"}
      >
        <DocumentationSearch locale={lang} />
        <nav aria-label={lang === "es" ? "Secciones" : "Sections"} tabIndex={0}>
          {pages.map((page) => (
            <Link key={page.url} href={page.url}>
              {page.data.title}
            </Link>
          ))}
        </nav>
        <p className="docsTrust">
          {lang === "es"
            ? "Sin custodia · sin token · devnet"
            : "Non-custodial · no token · devnet"}
        </p>
      </aside>
      <main id="main-content" className="docsMain">
        {children}
      </main>
    </div>
  );
}
