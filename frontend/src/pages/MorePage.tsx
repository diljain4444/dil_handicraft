import { LogOut, User, Info, ArrowRight } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function MorePage() {
  const { currentUser, logout } = useAuth();

  return (
    <div className="p-4 max-w-md mx-auto space-y-4">
      <h2 className="text-lg font-bold text-slate-900">More</h2>

      {/* User profile card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center">
          <User size={28} className="text-primary" />
        </div>
        <div>
          <div className="font-semibold text-slate-900 text-base">
            {currentUser?.username || 'User'}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Business Account</div>
        </div>
      </div>

      {/* Links */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm divide-y divide-slate-50">
        <NavLink
          to="/"
          className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm font-medium text-slate-700">Dashboard</span>
          <ArrowRight size={16} className="text-slate-400" />
        </NavLink>
        <NavLink
          to="/transactions"
          className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm font-medium text-slate-700">Transactions</span>
          <ArrowRight size={16} className="text-slate-400" />
        </NavLink>
        <NavLink
          to="/analytics"
          className="flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors"
        >
          <span className="text-sm font-medium text-slate-700">Analytics</span>
          <ArrowRight size={16} className="text-slate-400" />
        </NavLink>
      </div>

      {/* App info */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info size={16} className="text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">App Info</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">App Name</span>
            <span className="text-slate-900 font-medium">Dil Handicraft</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Version</span>
            <span className="text-slate-900 font-medium">1.0.0</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-red-50 text-danger text-sm font-semibold hover:bg-red-100 transition-colors min-h-[52px]"
      >
        <LogOut size={18} />
        Sign Out
      </button>
    </div>
  );
}
