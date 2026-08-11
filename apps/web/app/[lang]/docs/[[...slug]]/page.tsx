import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMDXComponents } from "../../../../components/mdx";
import { isDocumentationLocale } from "../../../../lib/i18n";
import { source } from "../../../../lib/source";

type Properties = {
  params: Promise<{ lang: string; slug?: string[] }>;
};

export default async function DocumentationPage({ params }: Properties) {
  const { lang, slug } = await params;
  if (!isDocumentationLocale(lang)) notFound();
  const page = source.getPage(slug, lang);
  if (!page) notFound();
  const Body = page.data.body;
  return (
    <article className="docsArticle">
      <h1>{page.data.title}</h1>
      <p className="docsDescription">{page.data.description}</p>
      <dl className="docsRecord">
        <div>
          <dt>{lang === "es" ? "Sección" : "Section"}</dt>
          <dd>{page.data.section}</dd>
        </div>
        <div>
          <dt>{lang === "es" ? "Madurez" : "Maturity"}</dt>
          <dd>{page.data.maturity}</dd>
        </div>
        <div>
          <dt>{lang === "es" ? "Aplica a" : "Applies to"}</dt>
          <dd>{page.data.productVersionRange}</dd>
        </div>
        <div>
          <dt>{lang === "es" ? "Última revisión" : "Last reviewed"}</dt>
          <dd>{page.data.lastReviewedAt}</dd>
        </div>
      </dl>
      <div className="docsBody">
        <Body components={getMDXComponents()} />
      </div>
    </article>
  );
}

export function generateStaticParams() {
  return source.generateParams("slug", "lang");
}

export async function generateMetadata({
  params,
}: Properties): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isDocumentationLocale(lang)) return {};
  const page = source.getPage(slug, lang);
  if (!page) return {};
  return {
    title: page.data.title,
    description: page.data.description,
    alternates: {
      canonical: page.url,
      languages: {
        en: page.url.replace(/^\/es\//, "/en/"),
        es: page.url.replace(/^\/en\//, "/es/"),
      },
    },
  };
}
