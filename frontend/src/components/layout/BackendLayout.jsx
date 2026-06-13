import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/client';
import toast from 'react-hot-toast';
import {
  LayoutDashboard, UtensilsCrossed, Tag, CreditCard,
  LayoutGrid, Ticket, Users, BarChart3, LogOut,
  Coffee, Monitor, ChevronRight,
} from 'lucide-react';

const navItems = [
  { to: '/backend', label: 'Dashboard', icon: LayoutDashboard, end: true, accent: '#8B5CF6' },
  { to: '/backend/products', label: 'Products', icon: UtensilsCrossed, end: false, accent: '#F472B6' },
  { to: '/backend/categories', label: 'Categories', icon: Tag, end: false, accent: '#FBBF24' },
  { to: '/backend/payment-methods', label: 'Payment Methods', icon: CreditCard, end: false, accent: '#34D399' },
  { to: '/backend/tables', label: 'Floor & Tables', icon: LayoutGrid, end: false, accent: '#8B5CF6' },
  { to: '/backend/coupons', label: 'Coupons & Promos', icon: Ticket, end: false, accent: '#F472B6' },
  { to: '/backend/users', label: 'Users', icon: Users, end: false, accent: '#FBBF24' },
  { to: '/backend/reports', label: 'Reports', icon: BarChart3, end: false, accent: '#34D399' },
];

export default function BackendLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch { /* ignore network errors on logout */ }
    logout();
    toast.success('Logged out');
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen" style={{ background: '#F8F7F0' }}>

      {/* ── Sidebar ── */}
      <aside
        className="w-64 flex flex-col shrink-0 border-r-2"
        style={{
          background: '#FFFFFF',
          borderColor: '#E2E8F0',
          boxShadow: '4px 0px 0px 0px #E2E8F0',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {/* Brand header */}
        <div className="px-5 py-5 border-b-2" style={{ borderColor: '#E2E8F0' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border-2 border-[#1E293B]"
              style={{ background: 'var(--brand-accent)', boxShadow: '3px 3px 0px 0px #1E293B' }}
            >
              <Coffee size={18} strokeWidth={2.5} color="#fff" />
            </div>
            <div>
              <div
                className="text-lg font-bold leading-none"
                style={{ fontFamily: "'Outfit', system-ui, sans-serif", color: 'var(--brand-fg)' }}
              >
                Cafe POS
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-wider mt-0.5"
                style={{ color: 'var(--brand-muted-fg)' }}>
                Admin Console
              </div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? 'text-white' : 'hover:bg-[#F1F5F9]'
                  }`
                }
                style={({ isActive }) =>
                  isActive
                    ? {
                      background: item.accent,
                      boxShadow: '3px 3px 0px 0px #1E293B',
                      border: '2px solid #1E293B',
                      color: '#fff',
                    }
                    : { color: 'var(--brand-muted-fg)', border: '2px solid transparent' }
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={16} strokeWidth={2.5} color={isActive ? '#fff' : 'var(--brand-muted-fg)'} />
                    <span>{item.label}</span>
                    {isActive && (
                      <ChevronRight size={14} strokeWidth={2.5} color="#fff" className="ml-auto" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t-2 space-y-2" style={{ borderColor: '#E2E8F0' }}>
          {/* User badge */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl"
            style={{ background: 'var(--brand-muted)' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-[#1E293B] text-white text-xs font-bold shrink-0"
              style={{ background: 'var(--brand-accent)' }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold truncate" style={{ color: 'var(--brand-fg)', fontFamily: "'Outfit', system-ui, sans-serif" }}>
                {user?.name}
              </div>
              <div className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--brand-muted-fg)' }}>
                {user?.role}
              </div>
            </div>
          </div>

          {/* POS button */}
          <button
            onClick={() => navigate('/pos')}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all duration-200 hover:shadow-pop-sm"
            style={{
              background: 'var(--brand-tertiary)',
              borderColor: '#1E293B',
              color: 'var(--brand-fg)',
              fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
              boxShadow: '2px 2px 0px 0px #1E293B',
            }}
          >
            <Monitor size={14} strokeWidth={2.5} />
            Open POS Terminal
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border-2 border-transparent transition-all duration-200"
            style={{ color: '#EF4444', fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FEF2F2'; e.currentTarget.style.borderColor = '#FECACA'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <LogOut size={14} strokeWidth={2.5} />
            Logout
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main
        className="flex-1 overflow-y-auto"
        style={{
          background: 'var(--brand-bg)',
          fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        }}
      >
        {/* Dot grid header strip */}
        <div className="dot-grid h-1 opacity-40" />
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
