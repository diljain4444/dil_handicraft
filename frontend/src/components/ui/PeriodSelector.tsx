import type { Period } from '../../types';

const periodOptions: { value: Period; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'financial_year', label: 'This Financial Year' },
  { value: 'calendar_year', label: 'This Calendar Year' },
  { value: 'overall', label: 'Overall' },
  { value: 'custom', label: 'Custom Range' },
];

interface PeriodSelectorProps {
  value: Period;
  onChange: (period: Period) => void;
  startDate?: string;
  endDate?: string;
  onDateChange?: (startDate: string, endDate: string) => void;
}

export function PeriodSelector({
  value,
  onChange,
  startDate = '',
  endDate = '',
  onDateChange,
}: PeriodSelectorProps) {
  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin no-scrollbar">
        {periodOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px] ${
              value === opt.value
                ? 'bg-primary text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-primary hover:text-primary'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {value === 'custom' && onDateChange && (
        <div className="flex gap-2 mt-2">
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">From</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onDateChange(e.target.value, endDate)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-500 mb-1">To</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onDateChange(startDate, e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>
      )}
    </div>
  );
}
