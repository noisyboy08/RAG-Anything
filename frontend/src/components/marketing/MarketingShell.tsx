import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { href: '/platform',   label: 'Platform'   },
  { href: '/features',   label: 'Features'   },
  { href: '/technology', label: 'Technology' },
  { href: '/workflow',   label: 'Workflow'   },
  { href: '/docs',       label: 'Docs'       },
  { href: '/pricing',    label: 'Pricing'    },
  { href: '/about',      label: 'About'      },
];

interface Props {
  children: ReactNode;
  active?: string;
  title?: string;
  description?: string;
}

export function MarketingShell({ children, active, title, description }: Props) {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (title) document.title = `${title} — RAG-Anything`;
    const desc = document.querySelector('meta[name="description"]');
    if (desc && description) desc.setAttribute('content', description);
  }, [title, description]);

  return (
    <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', flexDirection: 'column' }}>
      {/* ── NAV ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? 'rgba(8,8,8,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#e8ff5a,#4af0ff)', display: 'grid', placeItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 20 20" fill="#080808">
                <circle cx="10" cy="10" r="2" />
                <line x1="10" y1="10" x2="4" y2="4" stroke="#080808" strokeWidth="1.5"/>
                <line x1="10" y1="10" x2="16" y2="4" stroke="#080808" strokeWidth="1.5"/>
                <line x1="10" y1="10" x2="4" y2="16" stroke="#080808" strokeWidth="1.5"/>
                <line x1="10" y1="10" x2="16" y2="16" stroke="#080808" strokeWidth="1.5"/>
              </svg>
            </div>
            <span style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 800, fontSize: '15px', color: 'white', letterSpacing: '-0.02em' }}>RAG-Anything</span>
          </Link>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0' }} className="desktop-nav">
            {navLinks.map(link => {
              const isActive = active ? active === link.label.toLowerCase() : location.pathname === link.href;
              return (
                <Link key={link.href} to={link.href}
                  style={{
                    padding: '6px 14px', borderRadius: '8px', fontSize: '13px', textDecoration: 'none', transition: 'all 0.2s',
                    color: isActive ? 'white' : 'rgba(255,255,255,0.4)',
                    fontWeight: isActive ? 600 : 400,
                    background: isActive ? 'rgba(255,255,255,0.08)' : 'transparent',
                  }}
                  onMouseEnter={e => { if(!isActive){e.currentTarget.style.color='rgba(255,255,255,0.75)';} }}
                  onMouseLeave={e => { if(!isActive){e.currentTarget.style.color='rgba(255,255,255,0.4)';} }}>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '4px', padding: '8px' }}
              className="menu-btn"
              aria-label="menu">
              <span style={{ width: '16px', height: '1.5px', background: 'rgba(255,255,255,0.7)', display: 'block', transition: 'all 0.3s', transform: menuOpen ? 'rotate(45deg) translateY(3px)' : '' }} />
              <span style={{ width: '16px', height: '1.5px', background: 'rgba(255,255,255,0.7)', display: 'block', transition: 'all 0.3s', opacity: menuOpen ? 0 : 1 }} />
              <span style={{ width: '16px', height: '1.5px', background: 'rgba(255,255,255,0.7)', display: 'block', transition: 'all 0.3s', transform: menuOpen ? 'rotate(-45deg) translateY(-3px)' : '' }} />
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <div style={{ background: '#0c0c0c', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '1rem 2rem 2rem' }}>
            {navLinks.map(link => (
              <Link key={link.href} to={link.href} style={{ display: 'block', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: '15px', fontWeight: 500, color: location.pathname === link.href ? 'white' : 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>
                {link.label}
              </Link>
            ))}
            </div>
        )}
      </header>

      {/* ── CONTENT ── */}
      <main style={{ flex: 1, paddingTop: '60px' }}>
        {children}
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ background: '#050505', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '4rem 2rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '3rem', marginBottom: '4rem' }} className="footer-grid">
            <div>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '1.25rem' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#e8ff5a,#4af0ff)', display: 'grid', placeItems: 'center' }}>
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="#080808">
                    <circle cx="10" cy="10" r="2" />
                    <line x1="10" y1="10" x2="4" y2="4" stroke="#080808" strokeWidth="1.5"/>
                    <line x1="10" y1="10" x2="16" y2="4" stroke="#080808" strokeWidth="1.5"/>
                    <line x1="10" y1="10" x2="4" y2="16" stroke="#080808" strokeWidth="1.5"/>
                    <line x1="10" y1="10" x2="16" y2="16" stroke="#080808" strokeWidth="1.5"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Space Grotesk', system-ui", fontWeight: 800, fontSize: '15px', color: 'white', letterSpacing: '-0.02em' }}>RAG-Anything</span>
              </Link>
              <p style={{ fontSize: '13px', lineHeight: 1.75, color: 'rgba(255,255,255,0.3)', maxWidth: '280px', margin: '0 0 1.5rem' }}>
                A production multimodal RAG framework that parses complex documents and retrieves with graph-grounded context via LightRAG.
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <a href="https://github.com/noisyboy08/RAG-Anything" target="_blank" rel="noopener noreferrer"
                  style={{ padding: '7px 14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', color: 'rgba(255,255,255,0.4)', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.25)'; e.currentTarget.style.color='white'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)'; e.currentTarget.style.color='rgba(255,255,255,0.4)'; }}>
                  GitHub
                </a>
              </div>
            </div>

            {[
              { heading: 'Product', links: [['Platform','/platform'],['Features','/features'],['Technology','/technology'],['Workflow','/workflow']] },
              { heading: 'Resources', links: [['Documentation','/docs'],['Pricing','/pricing'],['Graph App','/app'],['Contact','/contact']] },
              { heading: 'Company', links: [['About','/about'],['GitHub','https://github.com/noisyboy08/RAG-Anything'],['Issues','https://github.com/noisyboy08/RAG-Anything/issues'],['MIT License','https://github.com/noisyboy08/RAG-Anything/blob/main/LICENSE']] },
            ].map(col => (
              <div key={col.heading}>
                <p style={{ fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', margin: '0 0 1rem', fontWeight: 600 }}>{col.heading}</p>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      {href.startsWith('http')
                        ? <a href={href} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='white'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.35)'}>{label}</a>
                        : <Link to={href} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color='white'} onMouseLeave={e=>e.currentTarget.style.color='rgba(255,255,255,0.35)'}>{label}</Link>
                      }
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)', margin: 0 }}>© 2025 Uday Dolas (uduu). MIT Licensed.</p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.15)', margin: 0, fontFamily: "'JetBrains Mono',monospace" }}>pip install -e ".[all]"</p>
          </div>
        </div>
      </footer>

      <style>{`
        .desktop-nav { display: flex !important; }
        .menu-btn { display: none !important; }
        @media (max-width: 900px) {
          .desktop-nav { display: none !important; }
          .menu-btn { display: flex !important; }
        }
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 480px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
