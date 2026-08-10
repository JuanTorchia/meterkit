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
      <div className="docsEyebrow">
        {page.data.section} · {page.data.maturity}
      </div>
      <h1>{page.data.title}</h1>
      <p className="docsDescription">{page.data.description}</p>
      <div className="docsMeta">
        <span>{page.data.productVersionRange}</span>
        <span>{page.data.lastReviewedAt}</span>
      </div>
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
