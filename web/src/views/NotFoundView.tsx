import { Link } from '@tanstack/react-router';
import { FilmSlate, House, SquaresFour } from '@phosphor-icons/react';

export function NotFoundView() {
  return (
    <section className="not-found-view" aria-labelledby="not-found-title">
      <div className="not-found-mark" aria-hidden="true"><FilmSlate weight="duotone" /></div>
      <p className="not-found-code">404</p>
      <h1 id="not-found-title">Page not found</h1>
      <p>The page you’re looking for may have moved or no longer exists.</p>
      <div className="not-found-actions">
        <Link to="/" className="not-found-link primary"><House weight="fill" /> Virelo home</Link>
        <Link to="/app/library" className="not-found-link"><SquaresFour weight="fill" /> Open library</Link>
      </div>
    </section>
  );
}
