import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/jobs', label: 'Find work' },
  { to: '/internships', label: 'Internships' },
  { to: '/companies', label: 'Companies' },
  { to: '/how-it-works', label: 'How it works' },
];

export default function PublicLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // The header only gains a border once the page moves, so the hero starts clean.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <a href="#main-content" className="skip-link">Skip to content</a>

      <header
        className={`sticky top-0 z-40 transition-colors duration-240 ${
          scrolled ? 'border-b border-line glass' : 'border-b border-transparent bg-surface'
        }`}
      >
        <div className="container-app flex h-16 items-center justify-between gap-4">
          <Link to="/" aria-label="PathAura home" className="rounded-md"><Logo /></Link>

          <nav aria-label="Primary" className="hidden items-center gap-0.5 md:flex">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `top-link ${isActive ? 'top-link-active' : ''}`}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {isAuthenticated ? (
              <Link to="/app" className="btn-primary">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-ghost hidden sm:inline-flex">Log in</Link>
                <Link to="/register" className="btn-primary">Get started</Link>
              </>
            )}
            <button
              className="btn-ghost btn-icon md:hidden"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-4 w-4" aria-hidden /> : <Menu className="h-4 w-4" aria-hidden />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-line bg-panel md:hidden">
            <nav aria-label="Mobile" className="container-app flex flex-col py-2">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-md px-2 py-2.5 text-sm font-medium ${isActive ? 'text-accent' : 'text-ink-soft'}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              {!isAuthenticated && (
                <Link to="/login" className="rounded-md px-2 py-2.5 text-sm font-medium text-ink-soft">
                  Log in
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <main id="main-content" className="flex-1"><Outlet /></main>

      <footer className="mt-20 border-t border-line bg-panel">
        <div className="container-app py-12">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Logo />
              <p className="mt-3 max-w-xs text-sm text-muted text-pretty">
                From learning a skill to getting work. Built so employers can see what
                candidates can actually do.
              </p>
            </div>
            <div>
              <div className="section-label mb-3">Explore</div>
              <ul className="space-y-2 text-sm">
                <li><Link to="/jobs" className="text-muted transition-colors hover:text-ink">Find work</Link></li>
                <li><Link to="/internships" className="text-muted transition-colors hover:text-ink">Internships</Link></li>
                <li><Link to="/companies" className="text-muted transition-colors hover:text-ink">Companies</Link></li>
              </ul>
            </div>
            <div>
              <div className="section-label mb-3">Get started</div>
              <ul className="space-y-2 text-sm">
                <li><Link to="/register" className="text-muted transition-colors hover:text-ink">Create a profile</Link></li>
                <li><Link to="/login" className="text-muted transition-colors hover:text-ink">Log in</Link></li>
                <li><Link to="/how-it-works" className="text-muted transition-colors hover:text-ink">How it works</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col gap-2 border-t border-line pt-6 text-xs text-faint sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} PathAura · Demonstration project</span>
            <span>Kigali, Rwanda</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
