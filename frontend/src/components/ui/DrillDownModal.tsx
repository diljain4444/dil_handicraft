import { X, TrendingUp, Package } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { LoadingSpinner } from './LoadingSpinner';
import type { DrillDownCardType, DrillDownResponse } from '../../types';

const CARD_META: Record<
  DrillDownCardType,
  { title: string; nameLabel: string; amountLabel: string; showProfit: boolean; color: string }
> = {
  wholesale_sales: {
    title: 'Wholesale Sales Breakdown',
    nameLabel: 'Shop / Party',
    amountLabel: 'Total Sales',
    showProfit: true,
    color: '#3b82f6',
  },
  retail_sales: {
    title: 'Retail Sales Breakdown',
    nameLabel: 'Customer',
    amountLabel: 'Total Sales',
    showProfit: true,
    color: '#22c55e',
  },
  purchase_expenditure: {
    title: 'Purchase Expenditure Breakdown',
    nameLabel: 'Supplier',
    amountLabel: 'Total Spent',
    showProfit: false,
    color: '#8b5cf6',
  },
  wholesale_profit: {
    title: 'Wholesale Profit Breakdown',
    nameLabel: 'Shop / Party',
    amountLabel: 'Total Sales',
    showProfit: true,
    color: '#0ea5e9',
  },
  retail_profit: {
    title: 'Retail Profit Breakdown',
    nameLabel: 'Customer',
    amountLabel: 'Total Sales',
    showProfit: true,
    color: '#10b981',
  },
};

interface DrillDownModalProps {
  cardType: DrillDownCardType | null;
  periodLabel: string;
  data: DrillDownResponse | undefined;
  isLoading: boolean;
  onClose: () => void;
}

export function DrillDownModal({
  cardType,
  periodLabel,
  data,
  isLoading,
  onClose,
}: DrillDownModalProps) {
  if (!cardType) return null;

  const meta = CARD_META[cardType];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative bg-white w-full md:max-w-lg md:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col shadow-xl">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b border-slate-100 rounded-t-2xl"
          style={{ borderTop: `4px solid ${meta.color}` }}
        >
          <div>
            <h2 className="font-bold text-slate-900 text-base">{meta.title}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{periodLabel}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={18} className="text-slate-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <LoadingSpinner size={32} className="py-12" />
          ) : !data || data.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Package size={40} className="mb-3 opacity-40" />
              <p className="text-sm font-medium">No transactions found</p>
              <p className="text-xs mt-1">for the selected period</p>
            </div>
          ) : (
            <>
              {/* Grand total summary */}
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex gap-4">
                <div>
                  <p className="text-xs text-slate-500">{meta.amountLabel}</p>
                  <p className="text-base font-bold text-slate-900">
                    {formatCurrency(data.total_amount)}
                  </p>
                </div>
                {meta.showProfit && (
                  <div>
                    <p className="text-xs text-slate-500">Total Profit</p>
                    <p className="text-base font-bold" style={{ color: meta.color }}>
                      {formatCurrency(data.total_profit)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500">Parties</p>
                  <p className="text-base font-bold text-slate-900">{data.rows.length}</p>
                </div>
              </div>

              {/* Rows */}
              <ul className="divide-y divide-slate-50">
                {data.rows.map((row, idx) => {
                  const pct =
                    data.total_amount > 0
                      ? Math.round((row.total_amount / data.total_amount) * 100)
                      : 0;
                  const sortValue =
                    cardType === 'wholesale_profit' || cardType === 'retail_profit'
                      ? row.total_profit
                      : row.total_amount;
                  const maxSortValue =
                    cardType === 'wholesale_profit' || cardType === 'retail_profit'
                      ? (data.rows[0]?.total_profit ?? 1)
                      : (data.rows[0]?.total_amount ?? 1);
                  const barPct = maxSortValue > 0 ? (sortValue / maxSortValue) * 100 : 0;

                  return (
                    <li key={idx} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                            style={{ backgroundColor: meta.color }}
                          >
                            {idx + 1}
                          </span>
                          <span className="text-sm font-semibold text-slate-900 truncate">
                            {row.name}
                          </span>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-slate-900">
                            {formatCurrency(
                              cardType === 'wholesale_profit' || cardType === 'retail_profit'
                                ? row.total_profit
                                : row.total_amount
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${barPct}%`, backgroundColor: meta.color }}
                        />
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{row.transaction_count} bill{row.transaction_count !== 1 ? 's' : ''}</span>
                        {meta.showProfit && cardType !== 'wholesale_profit' && cardType !== 'retail_profit' && (
                          <span className="flex items-center gap-0.5" style={{ color: meta.color }}>
                            <TrendingUp size={10} />
                            {formatCurrency(row.total_profit)} profit
                          </span>
                        )}
                        {cardType !== 'wholesale_profit' && cardType !== 'retail_profit' && (
                          <span className="ml-auto">{pct}% of total</span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
