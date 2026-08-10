import Link from "next/link";

export default function DocumentationNotFound() {
  return (
    <section className="docsState">
      <p className="docsEyebrow">404</p>
      <h1>Documentation page not found</h1>
      <p>
        The page may have moved. Return to the maintained documentation index.
      </p>
      <Link href="/en/docs">Open documentation</Link>
    </section>
  );
}
