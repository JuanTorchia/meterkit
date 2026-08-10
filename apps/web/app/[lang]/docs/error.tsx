"use client";

export default function DocumentationError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="docsState" role="alert">
      <h1>Documentation is temporarily unavailable</h1>
      <p>
        No payment or wallet action was attempted. Retry this page or return to
        the index.
      </p>
      <button type="button" onClick={reset}>
        Retry
      </button>
    </section>
  );
}
