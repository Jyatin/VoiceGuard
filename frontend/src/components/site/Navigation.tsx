import { useEffect, useState } from 'react';
import { Mark } from './Mark';

const LINKS = [
  { label: 'Product', href: '#product' },
  { label: 'Detection', href: '#detector' },
  { label: 'Technology', href: '#signals' },
  { label: 'Performance', href: '#performance' },
  { label: 'Research', href: '#method' },
];

export function Navigation() {
  const [pinned, setPinned] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setPinned(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={pinned ? 'nav nav--pinned' : 'nav'}>
      <div className="shell nav__inner">
        <a className="nav__mark" href="#top">
          <Mark />
          VOXSHIELD
        </a>

        <nav className="nav__links" aria-label="Sections">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="nav__right">
          <a className="btn nav__cta" href="#detector">
            Open detector <span className="arw">→</span>
          </a>
          <button
            type="button"
            className="nav__toggle"
            aria-expanded={open}
            aria-controls="nav-sheet"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="sr">{open ? 'Close menu' : 'Open menu'}</span>
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              {open ? (
                <path
                  d="M5 5l10 10M15 5L5 15"
                  stroke="currentColor"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                />
              ) : (
                <path d="M3 6h14M3 13h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="nav__sheet" id="nav-sheet">
          <div className="shell">
            {LINKS.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
                {l.label}
              </a>
            ))}
            <a href="#detector" onClick={() => setOpen(false)}>
              Open detector
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
