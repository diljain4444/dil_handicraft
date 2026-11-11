import type { LucideIcon } from 'lucide-react';
import { formatCurrency } from '../../utils/format';

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: string;
  subtitle?: string;
}

export function KPICard({ title, value, icon: Icon, color, subtitle }: KPICardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col gap-3 border border-slate-100">
      <div className="flex items-start justify-between">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${color}1a` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
      <div>
        <div className="text-xl font-bold text-slate-900 leading-tight">
          {formatCurrency(value)}
        </div>
        <div className="text-xs font-medium text-slate-500 mt-0.5">{title}</div>
        {subtitle && <div className="text-xs text-slate-400 mt-0.5">{subtitle}</div>}
      </div>
    </div>
  );
}
