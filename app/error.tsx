'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="auth-gate">
      <h1>A small interruption.</h1>
      <p>Something didn’t load as expected. Please try again.</p>
      <button className="button button-light" onClick={reset}>
        Try again
      </button>
      <a href="/">Back home</a>
    </main>
  );
}
