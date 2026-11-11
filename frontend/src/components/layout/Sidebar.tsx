import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, BarChart3, MoreHorizontal, Scissors } from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/more', icon: MoreHorizontal, label: 'More' },
];

export function Sidebar() {
  return (
    <div className="w-60 h-full bg-white border-r border-slate-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-100">
        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
          <Scissors size={18} className="text-white" />
        </div>
        <div>
          <div className="font-bold text-slate-900 leading-tight">Dil Handicraft</div>
          <div className="text-xs text-slate-500">Business Manager</div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-colors font-medium text-sm ${
                isActive
                  ? 'bg-indigo-50 text-primary'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.75} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-slate-100 text-xs text-slate-400">
        v1.0.0
      </div>
    </div>
  );
}
