import { formatDateLong, getTodayIST } from '../../utils/format';
import { useAuth } from '../../hooks/useAuth';
import { User } from 'lucide-react';

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { currentUser } = useAuth();
  const today = formatDateLong(getTodayIST());

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
      {/* Mobile: App name + date */}
      <div className="md:hidden">
        <div className="font-bold text-slate-900 text-base">Dil Handicraft</div>
        <div className="text-xs text-slate-500">{today}</div>
      </div>

      {/* Desktop: Page title + date */}
      <div className="hidden md:block">
        <h1 className="font-semibold text-slate-900 text-lg">{title}</h1>
        <div className="text-xs text-slate-500">{today}</div>
      </div>

      {/* User avatar */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
          <User size={16} className="text-primary" />
        </div>
        {currentUser && (
          <span className="hidden md:block text-sm font-medium text-slate-700">
            {currentUser.username}
          </span>
        )}
      </div>
    </header>
  );
}
