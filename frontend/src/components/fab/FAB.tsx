import { useState } from 'react';
import { Plus, X, ShoppingBag, ShoppingCart, Package } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { WholesaleForm } from '../forms/WholesaleForm';
import { RetailForm } from '../forms/RetailForm';
import { PurchaseForm } from '../forms/PurchaseForm';

type FormType = 'wholesale' | 'retail' | 'purchase' | null;

export function FAB() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openForm, setOpenForm] = useState<FormType>(null);

  const handleOpen = (type: FormType) => {
    setIsExpanded(false);
    setOpenForm(type);
  };

  const actions = [
    { type: 'wholesale' as const, icon: ShoppingBag, label: 'Add Wholesale Sale', color: '#3b82f6' },
    { type: 'retail' as const, icon: ShoppingCart, label: 'Add Retail Sale', color: '#22c55e' },
    { type: 'purchase' as const, icon: Package, label: 'Add Purchase', color: '#8b5cf6' },
  ];

  return (
    <>
      {/* FAB and speed dial */}
      <div className="fixed bottom-20 right-4 z-30 flex flex-col items-end gap-2 md:bottom-6">
        {/* Speed dial options */}
        {isExpanded && (
          <div className="flex flex-col items-end gap-2 mb-1">
            {actions.map(({ type, icon: Icon, label, color }) => (
              <button
                key={type}
                onClick={() => handleOpen(type)}
                className="flex items-center gap-2 bg-white rounded-full shadow-lg px-3 py-2 min-h-[44px] border border-slate-100 hover:shadow-xl transition-all"
              >
                <span className="text-sm font-medium text-slate-700 whitespace-nowrap">{label}</span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${color}1a` }}
                >
                  <Icon size={16} style={{ color }} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Main FAB */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center hover:bg-indigo-600 transition-all active:scale-95"
          aria-label={isExpanded ? 'Close' : 'Add transaction'}
        >
          {isExpanded ? <X size={22} /> : <Plus size={26} />}
        </button>
      </div>

      {/* Backdrop when expanded */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Form modals */}
      <Modal
        isOpen={openForm === 'wholesale'}
        onClose={() => setOpenForm(null)}
        title="Add Wholesale Sale"
      >
        <WholesaleForm onSuccess={() => setOpenForm(null)} onCancel={() => setOpenForm(null)} />
      </Modal>

      <Modal
        isOpen={openForm === 'retail'}
        onClose={() => setOpenForm(null)}
        title="Add Retail Sale"
      >
        <RetailForm onSuccess={() => setOpenForm(null)} onCancel={() => setOpenForm(null)} />
      </Modal>

      <Modal
        isOpen={openForm === 'purchase'}
        onClose={() => setOpenForm(null)}
        title="Add Purchase"
      >
        <PurchaseForm onSuccess={() => setOpenForm(null)} onCancel={() => setOpenForm(null)} />
      </Modal>
    </>
  );
}
