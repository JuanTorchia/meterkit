import Link from "next/link";

export default function DocumentationNotFound() {
  return (
    <section className="docsState">
      <h1>Documentation page not found</h1>
      <p>
        The server answered 404. The page may have moved; the maintained index
        lists everything currently published.
      </p>
      <Link className="secondary" href="/en/docs">
        Open documentation
      </Link>
    </section>
  );
}
