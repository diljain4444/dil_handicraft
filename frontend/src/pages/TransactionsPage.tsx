import { useState } from 'react';
import { Search, List } from 'lucide-react';
import { TransactionCard } from '../components/ui/TransactionCard';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { WholesaleForm } from '../components/forms/WholesaleForm';
import { RetailForm } from '../components/forms/RetailForm';
import { PurchaseForm } from '../components/forms/PurchaseForm';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useWholesaleList, useDeleteWholesale, useUpdateWholesale } from '../hooks/useWholesale';
import { useRetailList, useDeleteRetail, useUpdateRetail } from '../hooks/useRetail';
import { usePurchaseList, useDeletePurchase, useUpdatePurchase } from '../hooks/usePurchases';
import type { WholesaleTransaction, RetailTransaction, PurchaseTransaction } from '../types';

type FilterType = 'all' | 'wholesale' | 'retail' | 'purchase';

export function TransactionsPage() {
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; type: 'wholesale' | 'retail' | 'purchase' } | null>(null);

  // Edit state
  const [editTarget, setEditTarget] = useState<{
    tx: WholesaleTransaction | RetailTransaction | PurchaseTransaction;
    type: 'wholesale' | 'retail' | 'purchase';
  } | null>(null);

  const wholesaleParams = {
    shop_name: filterType === 'wholesale' || filterType === 'all' ? search : undefined,
    sort: 'newest' as const,
    page,
    page_size: pageSize,
  };

  const retailParams = {
    customer_label: filterType === 'retail' || filterType === 'all' ? search : undefined,
    sort: 'newest' as const,
    page,
    page_size: pageSize,
  };

  const purchaseParams = {
    supplier_name: filterType === 'purchase' || filterType === 'all' ? search : undefined,
    sort: 'newest' as const,
    page,
    page_size: pageSize,
  };

  const { data: wholesaleData, isLoading: wholesaleLoading } = useWholesaleList(
    filterType !== 'retail' && filterType !== 'purchase' ? wholesaleParams : { page, page_size: 0 }
  );
  const { data: retailData, isLoading: retailLoading } = useRetailList(
    filterType !== 'wholesale' && filterType !== 'purchase' ? retailParams : { page, page_size: 0 }
  );
  const { data: purchaseData, isLoading: purchaseLoading } = usePurchaseList(
    filterType !== 'wholesale' && filterType !== 'retail' ? purchaseParams : { page, page_size: 0 }
  );

  const deleteWholesale = useDeleteWholesale();
  const deleteRetail = useDeleteRetail();
  const deletePurchase = useDeletePurchase();
  const updateWholesale = useUpdateWholesale();
  const updateRetail = useUpdateRetail();
  const updatePurchase = useUpdatePurchase();

  const isLoading = wholesaleLoading || retailLoading || purchaseLoading;
  const isDeleting = deleteWholesale.isPending || deleteRetail.isPending || deletePurchase.isPending;

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'wholesale') {
      deleteWholesale.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
    } else if (deleteTarget.type === 'retail') {
      deleteRetail.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
    } else {
      deletePurchase.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(null) });
    }
  };

  const filterButtons: { type: FilterType; label: string }[] = [
    { type: 'all', label: 'All' },
    { type: 'wholesale', label: 'Wholesale' },
    { type: 'retail', label: 'Retail' },
    { type: 'purchase', label: 'Purchase' },
  ];

  const hasData =
    (wholesaleData?.items?.length || 0) +
      (retailData?.items?.length || 0) +
      (purchaseData?.items?.length || 0) >
    0;

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      <h2 className="text-lg font-bold text-slate-900">Transactions</h2>

      {/* Filter bar */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {filterButtons.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => { setFilterType(type); setPage(1); }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[40px] ${
              filterType === type
                ? 'bg-primary text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-primary hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name..."
          className="w-full border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Transaction list */}
      {isLoading ? (
        <LoadingSpinner size={32} className="py-8" />
      ) : !hasData ? (
        <EmptyState
          icon={List}
          title="No transactions"
          message="Add transactions using the + button below."
        />
      ) : (
        <div className="space-y-3">
          {/* Wholesale */}
          {(filterType === 'all' || filterType === 'wholesale') &&
            wholesaleData?.items?.map((tx) => (
              <TransactionCard
                key={`w-${tx.id}`}
                transaction={tx}
                type="wholesale"
                onEdit={() => setEditTarget({ tx, type: 'wholesale' })}
                onDelete={() => setDeleteTarget({ id: tx.id, type: 'wholesale' })}
              />
            ))}

          {/* Retail */}
          {(filterType === 'all' || filterType === 'retail') &&
            retailData?.items?.map((tx) => (
              <TransactionCard
                key={`r-${tx.id}`}
                transaction={tx}
                type="retail"
                onEdit={() => setEditTarget({ tx, type: 'retail' })}
                onDelete={() => setDeleteTarget({ id: tx.id, type: 'retail' })}
              />
            ))}

          {/* Purchases */}
          {(filterType === 'all' || filterType === 'purchase') &&
            purchaseData?.items?.map((tx) => (
              <TransactionCard
                key={`p-${tx.id}`}
                transaction={tx}
                type="purchase"
                onEdit={() => setEditTarget({ tx, type: 'purchase' })}
                onDelete={() => setDeleteTarget({ id: tx.id, type: 'purchase' })}
              />
            ))}

          {/* Load more */}
          <button
            onClick={() => setPage((p) => p + 1)}
            className="w-full py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Load More
          </button>
        </div>
      )}

      {/* Delete confirm dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Transaction"
        message="This action cannot be undone. Are you sure you want to delete this transaction?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />

      {/* Edit modals */}
      {editTarget?.type === 'wholesale' && (
        <Modal
          isOpen
          onClose={() => setEditTarget(null)}
          title="Edit Wholesale Sale"
        >
          <WholesaleForm
            initialData={editTarget.tx as WholesaleTransaction}
            onSuccess={() => setEditTarget(null)}
            onCancel={() => setEditTarget(null)}
            onUpdate={async (id, data) => { await updateWholesale.mutateAsync({ id, payload: data }); }}
          />
        </Modal>
      )}

      {editTarget?.type === 'retail' && (
        <Modal
          isOpen
          onClose={() => setEditTarget(null)}
          title="Edit Retail Sale"
        >
          <RetailForm
            initialData={editTarget.tx as RetailTransaction}
            onSuccess={() => setEditTarget(null)}
            onCancel={() => setEditTarget(null)}
            onUpdate={async (id, data) => { await updateRetail.mutateAsync({ id, payload: data }); }}
          />
        </Modal>
      )}

      {editTarget?.type === 'purchase' && (
        <Modal
          isOpen
          onClose={() => setEditTarget(null)}
          title="Edit Purchase"
        >
          <PurchaseForm
            initialData={editTarget.tx as PurchaseTransaction}
            onSuccess={() => setEditTarget(null)}
            onCancel={() => setEditTarget(null)}
            onUpdate={async (id, data) => { await updatePurchase.mutateAsync({ id, payload: data }); }}
          />
        </Modal>
      )}
    </div>
  );
}
