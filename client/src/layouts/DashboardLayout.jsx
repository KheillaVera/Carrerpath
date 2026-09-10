import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, Award, FolderKanban, GraduationCap, Briefcase, Search,
  FileText, Compass, BookOpen, Bell, LogOut, Menu, X, BadgeCheck,
  Building2, Users, ClipboardList, ShieldCheck, BarChart3, ChevronDown, ExternalLink,
} from 'lucide-react';
import Logo from '../components/Logo';
import Avatar from '../components/Avatar';
import ThemeToggle from '../components/ThemeToggle';
import DropdownMenu from '../components/DropdownMenu';
import { useAuth } from '../context/AuthContext';

// Navigation is grouped by intent rather than listed flat, so a long sidebar
// still reads as a small number of decisions.
const seekerNav = [
  {
    label: null,
    items: [{ to: '/app', label: 'Overview', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'My profile',
    items: [
      { to: '/app/profile', label: 'Profile', icon: User },
      { to: '/app/skills', label: 'Skills', icon: Award },
      { to: '/app/projects', label: 'Projects', icon: FolderKanban },
      { to: '/app/education', label: 'Education', icon: GraduationCap },
      { to: '/app/experience', label: 'Experience', icon: Briefcase },
      { to: '/app/certifications', label: 'Certifications', icon: BadgeCheck },
    ],
  },
  {
    label: 'Opportunities',
    items: [
      { to: '/app/jobs', label: 'Find work', icon: Search },
      { to: '/app/applications', label: 'Applications', icon: FileText },
      { to: '/app/interviews', label: 'Interviews', icon: ClipboardList },
    ],
  },
  {
    label: 'Growth',
    items: [
      { to: '/app/roadmap', label: 'Career roadmap', icon: Compass },
      { to: '/app/learning', label: 'Learning', icon: BookOpen },
      { to: '/app/notifications', label: 'Notifications', icon: Bell },
    ],
  },
];

const employerNav = [
  {
    label: null,
    items: [{ to: '/app', label: 'Overview', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Company',
    items: [
      { to: '/app/company', label: 'Company profile', icon: Building2 },
      { to: '/app/jobs-manage', label: 'Job postings', icon: Briefcase },
    ],
  },
  {
    label: 'Hiring',
    items: [
      { to: '/app/applicants', label: 'Applicants', icon: Users },
      { to: '/app/interviews', label: 'Interviews', icon: ClipboardList },
    ],
  },
];

const adminNav = [
  {
    label: null,
    items: [{ to: '/app', label: 'Overview', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'Moderation',
    items: [
      { to: '/app/admin/employers', label: 'Employers', icon: Building2 },
      { to: '/app/admin/verifications', label: 'Verifications', icon: ShieldCheck },
      { to: '/app/admin/users', label: 'Users', icon: Users },
    ],
  },
  {
    label: 'Insight',
    items: [{ to: '/app/admin/analytics', label: 'Analytics', icon: BarChart3 }],
  },
];

function pickNav(user) {
  if (!user) return seekerNav;
  if (user.roles?.includes('admin')) return adminNav;
  if (user.roles?.includes('employer')) return employerNav;
  return seekerNav;
}

function roleLabel(user) {
  const role = user?.roles?.[0] || 'job_seeker';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function SidebarNav({ groups, onNavigate }) {
  return (
    <nav aria-label="Sidebar" className="flex-1 overflow-y-auto px-3 py-4">
      {groups.map((group, index) => (
        <div key={group.label || index} className="nav-group">
          {group.label && <div className="nav-group-label">{group.label}</div>}
          <div className="space-y-0.5">
            {group.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={`h-4 w-4 shrink-0 ${isActive ? 'text-accent' : 'text-faint'}`}
                      aria-hidden
                    />
                    <span className="truncate">{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );
}

export default function DashboardLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = pickNav(user);

  // Close the drawer on navigation and lock scrolling while it is open.
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && setMobileOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener('keydown', onKey);
    };
  }, [mobileOpen]);

  const handleSignOut = () => {
    signOut();
    navigate('/', { replace: true });
  };

  const accountMenu = (
    <DropdownMenu
      align="right"
      trigger={
        <span className="flex items-center gap-2 rounded-md py-1 pl-1 pr-1.5 transition-colors duration-120 hover:bg-elevated">
          <Avatar name={user?.fullName} size="sm" />
          <span className="hidden text-left leading-tight sm:block">
            <span className="block max-w-[10rem] truncate text-xs font-medium text-ink">{user?.fullName}</span>
            <span className="block text-2xs text-muted">{roleLabel(user)}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-faint" aria-hidden />
        </span>
      }
    >
      <div className="menu-label border-b border-line pb-2">
        <div className="truncate font-medium text-ink">{user?.fullName}</div>
        <div className="truncate">{user?.email}</div>
      </div>
      <div className="pt-1">
        <Link to="/app/profile" className="menu-item" role="menuitem">
          <User className="h-3.5 w-3.5 text-faint" aria-hidden /> Profile
        </Link>
        <Link to="/" className="menu-item" role="menuitem">
          <ExternalLink className="h-3.5 w-3.5 text-faint" aria-hidden /> Public site
        </Link>
        <button onClick={handleSignOut} className="menu-item w-full text-danger" role="menuitem">
          <LogOut className="h-3.5 w-3.5" aria-hidden /> Sign out
        </button>
      </div>
    </DropdownMenu>
  );

  return (
    <div className="min-h-screen bg-surface">
      <a href="#main-content" className="skip-link">Skip to content</a>

      {/* Fixed sidebar on desktop. */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-panel lg:flex">
        <div className="flex h-14 shrink-0 items-center border-b border-line px-4">
          <Link to="/app" className="rounded-md" aria-label="PathAura dashboard"><Logo /></Link>
        </div>
        <SidebarNav groups={groups} />
        <div className="shrink-0 border-t border-line p-3">
          <Link to="/jobs" className="nav-item">
            <ExternalLink className="h-4 w-4 shrink-0 text-faint" aria-hidden />
            <span>Public marketplace</span>
          </Link>
        </div>
      </aside>

      {/* Mobile drawer. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-scrim/50 animate-fade-in" onClick={() => setMobileOpen(false)} aria-hidden />
          <div className="absolute inset-y-0 left-0 flex w-72 animate-slide-in-left flex-col border-r border-line bg-panel shadow-overlay">
            <div className="flex h-14 shrink-0 items-center justify-between border-b border-line px-4">
              <Logo />
              <button className="btn-ghost btn-icon btn-sm" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <SidebarNav groups={groups} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-line glass">
          <div className="flex h-14 items-center justify-between gap-3 px-5 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <button
                className="btn-ghost btn-icon lg:hidden"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
                aria-expanded={mobileOpen}
              >
                <Menu className="h-4 w-4" aria-hidden />
              </button>
              <Link to="/app" className="lg:hidden" aria-label="PathAura dashboard"><Logo compact /></Link>
            </div>
            <div className="flex items-center gap-1.5">
              <ThemeToggle />
              {accountMenu}
            </div>
          </div>
        </header>

        <main id="main-content" className="px-5 py-7 sm:px-6 lg:px-8 lg:py-9">
          <div className="mx-auto w-full max-w-6xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
