import { Pencil, Trash2 } from 'lucide-react';
import type { WholesaleTransaction, RetailTransaction, PurchaseTransaction } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Badge } from './Badge';

type TransactionType = 'wholesale' | 'retail' | 'purchase';

interface TransactionCardProps {
  transaction: WholesaleTransaction | RetailTransaction | PurchaseTransaction;
  type: TransactionType;
  onEdit: () => void;
  onDelete: () => void;
}

function getTransactionLabel(
  tx: WholesaleTransaction | RetailTransaction | PurchaseTransaction,
  type: TransactionType
): string {
  if (type === 'wholesale') return (tx as WholesaleTransaction).shop_name;
  if (type === 'retail') return (tx as RetailTransaction).customer_label || 'Walk-in Customer';
  return (tx as PurchaseTransaction).supplier_name;
}

function getTransactionAmount(
  tx: WholesaleTransaction | RetailTransaction | PurchaseTransaction,
  type: TransactionType
): number {
  if (type === 'purchase') {
    const p = tx as PurchaseTransaction;
    return p.purchase_amount + p.packing_cost + p.parcel_cost + p.other_expenses;
  }
  return (tx as WholesaleTransaction | RetailTransaction).selling_amount;
}

function getTransactionDate(
  tx: WholesaleTransaction | RetailTransaction | PurchaseTransaction,
  type: TransactionType
): string {
  if (type === 'purchase') return (tx as PurchaseTransaction).purchase_date;
  return (tx as WholesaleTransaction | RetailTransaction).transaction_date;
}

const typeBadgeVariant = {
  wholesale: 'wholesale' as const,
  retail: 'retail' as const,
  purchase: 'purchase' as const,
};

const typeLabels = {
  wholesale: 'Wholesale',
  retail: 'Retail',
  purchase: 'Purchase',
};

export function TransactionCard({ transaction, type, onEdit, onDelete }: TransactionCardProps) {
  const label = getTransactionLabel(transaction, type);
  const amount = getTransactionAmount(transaction, type);
  const date = getTransactionDate(transaction, type);

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Badge variant={typeBadgeVariant[type]}>{typeLabels[type]}</Badge>
        </div>
        <div className="font-semibold text-slate-900 text-sm truncate">{label}</div>
        <div className="text-xs text-slate-500 mt-0.5">{formatDate(date)}</div>
      </div>

      <div className="text-right flex-shrink-0">
        <div
          className={`font-bold text-sm ${type === 'purchase' ? 'text-purchase' : 'text-success'}`}
        >
          {type === 'purchase' ? '-' : '+'}{formatCurrency(amount)}
        </div>
        {type !== 'purchase' && (
          <div className="text-xs text-slate-400">
            Profit: {formatCurrency((transaction as WholesaleTransaction).estimated_profit)}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Edit"
        >
          <Pencil size={14} className="text-slate-500" />
        </button>
        <button
          onClick={onDelete}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
          aria-label="Delete"
        >
          <Trash2 size={14} className="text-danger" />
        </button>
      </div>
    </div>
  );
}
