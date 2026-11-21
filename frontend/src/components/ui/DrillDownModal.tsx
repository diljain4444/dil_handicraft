import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, TrendingUp, Package, ChevronDown, ChevronUp, Calendar, Loader2, ArrowRight, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '../../utils/format';
import { LoadingSpinner } from './LoadingSpinner';
import { dashboardApi } from '../../lib/api';
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
  udhar_pending: {
    title: 'Udhar Pending Breakdown',
    nameLabel: 'Customer',
    amountLabel: 'Pending Amount',
    showProfit: false,
    color: '#f97316',
  },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ---- Party row with expandable bills ----
interface PartyRowProps {
  idx: number;
  row: DrillDownResponse['rows'][number];
  cardType: DrillDownCardType;
  color: string;
  showProfit: boolean;
  barPct: number;
  pct: number;
  dashboardParams: { period?: string; start_date?: string | null; end_date?: string | null };
}

function PartyRow({ idx, row, cardType, color, showProfit, barPct, pct, dashboardParams }: PartyRowProps) {
  const [expanded, setExpanded] = useState(false);
  const isSingle = row.transaction_count === 1;

  // Fetch individual bills when expanded (or single — auto-fetch)
  const { data: billsData, isLoading: billsLoading } = useQuery({
    queryKey: ['party-bills', cardType, row.name, dashboardParams],
    queryFn: () => dashboardApi.getPartyBills(cardType, row.name, dashboardParams),
    enabled: expanded || isSingle,
    staleTime: 60_000,
  });

  const displayAmount =
    cardType === 'wholesale_profit' || cardType === 'retail_profit'
      ? row.total_profit
      : row.total_amount;

  return (
    <li className="border-b border-slate-50 last:border-0">
      {/* Party header row */}
      <button
        className="w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors"
        onClick={() => !isSingle && setExpanded((v) => !v)}
        style={{ cursor: isSingle ? 'default' : 'pointer' }}
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
              style={{ backgroundColor: color }}
            >
              {idx + 1}
            </span>
            <span className="text-sm font-semibold text-slate-900 truncate">{row.name}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <p className="text-sm font-bold text-slate-900">{formatCurrency(displayAmount)}</p>
            {!isSingle && (
              expanded
                ? <ChevronUp size={14} className="text-slate-400" />
                : <ChevronDown size={14} className="text-slate-400" />
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-1.5">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${barPct}%`, backgroundColor: color }}
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          {isSingle ? (
            /* Single bill: show date inline */
            billsLoading ? (
              <span className="flex items-center gap-1">
                <Loader2 size={10} className="animate-spin" /> loading…
              </span>
            ) : billsData?.bills[0] ? (
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {formatDate(billsData.bills[0].date)}
              </span>
            ) : (
              <span>{row.transaction_count} bill</span>
            )
          ) : (
            <span>{row.transaction_count} bills — tap to expand</span>
          )}
          {showProfit && cardType !== 'wholesale_profit' && cardType !== 'retail_profit' && (
            <span className="flex items-center gap-0.5" style={{ color }}>
              <TrendingUp size={10} />
              {formatCurrency(row.total_profit)} profit
            </span>
          )}
          {cardType !== 'wholesale_profit' && cardType !== 'retail_profit' && (
            <span className="ml-auto">{pct}% of total</span>
          )}
        </div>
      </button>

      {/* Expanded bills list (only for multi-transaction parties) */}
      {!isSingle && expanded && (
        <div className="bg-slate-50 border-t border-slate-100 px-4 py-2">
          {billsLoading ? (
            <div className="flex items-center gap-2 py-3 text-xs text-slate-500">
              <Loader2 size={12} className="animate-spin" /> Loading bills…
            </div>
          ) : !billsData || billsData.bills.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No bills found.</p>
          ) : (
            <ul className="space-y-2 py-1">
              {billsData.bills.map((bill, bi) => (
                <li key={bill.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                      style={{ backgroundColor: color + 'cc' }}
                    >
                      {bi + 1}
                    </span>
                    <Calendar size={10} className="text-slate-400" />
                    <span className="font-medium">{formatDate(bill.date)}</span>
                    {bill.notes && (
                      <span className="text-slate-400 italic truncate max-w-[100px]">
                        {bill.notes}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-800">{formatCurrency(bill.amount)}</p>
                    {showProfit && bill.profit > 0 && (
                      <p className="text-[10px]" style={{ color }}>
                        +{formatCurrency(bill.profit)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}

// ---- Main modal ----
interface DrillDownModalProps {
  cardType: DrillDownCardType | null;
  periodLabel: string;
  data: DrillDownResponse | undefined;
  isLoading: boolean;
  onClose: () => void;
  dashboardParams: { period?: string; start_date?: string | null; end_date?: string | null };
}

export function DrillDownModal({
  cardType,
  periodLabel,
  data,
  isLoading,
  onClose,
  dashboardParams,
}: DrillDownModalProps) {
  const navigate = useNavigate();
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
              {cardType === 'udhar_pending' && (
                <button
                  onClick={() => {
                    onClose();
                    navigate('/udhar');
                  }}
                  className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: meta.color }}
                >
                  <BookOpen size={14} /> Open Udhar Section
                </button>
              )}
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
                    <PartyRow
                      key={idx}
                      idx={idx}
                      row={row}
                      cardType={cardType}
                      color={meta.color}
                      showProfit={meta.showProfit}
                      barPct={barPct}
                      pct={pct}
                      dashboardParams={dashboardParams}
                    />
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {/* Footer action for Udhar */}
        {cardType === 'udhar_pending' && data && data.rows.length > 0 && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 rounded-b-2xl">
            <button
              onClick={() => {
                onClose();
                navigate('/udhar');
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-white text-xs font-semibold shadow-sm hover:opacity-90 transition-opacity"
              style={{ backgroundColor: meta.color }}
            >
              <BookOpen size={15} />
              Open Udhar / Khata Book (Add & Manage)
              <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
