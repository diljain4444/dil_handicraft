import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getTodayIST, formatCurrency } from '../../utils/format';
import { Combobox } from '../ui/Combobox';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useCreatePurchase } from '../../hooks/usePurchases';
import { purchasesApi } from '../../lib/api';
import type { Control } from 'react-hook-form';

const schema = z.object({
  supplier_name: z.string().min(1, 'Supplier name is required'),
  product_category: z.string().optional(),
  purchase_date: z.string().min(1, 'Date is required'),
  purchase_amount: z.coerce.number().positive('Must be greater than 0'),
  packing_cost: z.coerce.number().min(0).optional().default(0),
  parcel_cost: z.coerce.number().min(0).optional().default(0),
  other_expenses: z.coerce.number().min(0).optional().default(0),
  notes: z.string().optional(),
});

type FormData = z.output<typeof schema>;

interface PurchaseFormProps {
  initialData?: Partial<FormData> & { id?: number };
  onSuccess: () => void;
  onCancel: () => void;
  onUpdate?: (id: number, data: FormData) => Promise<void>;
}

function TotalDisplay({ control }: { control: Control<FormData, unknown, FormData> }) {
  const values = useWatch({ control });
  const total =
    (Number(values.purchase_amount) || 0) +
    (Number(values.packing_cost) || 0) +
    (Number(values.parcel_cost) || 0) +
    (Number(values.other_expenses) || 0);

  return (
    <div className="bg-purple-50 rounded-xl p-3 flex items-center justify-between">
      <span className="text-sm font-medium text-purchase">Total Expenditure</span>
      <span className="text-base font-bold text-purchase">{formatCurrency(total)}</span>
    </div>
  );
}

export function PurchaseForm({ initialData, onSuccess, onCancel, onUpdate }: PurchaseFormProps) {
  const createMutation = useCreatePurchase();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormData, unknown, FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      supplier_name: initialData?.supplier_name || '',
      product_category: initialData?.product_category || '',
      purchase_date: initialData?.purchase_date || getTodayIST(),
      purchase_amount: initialData?.purchase_amount,
      packing_cost: initialData?.packing_cost ?? 0,
      parcel_cost: initialData?.parcel_cost ?? 0,
      other_expenses: initialData?.other_expenses ?? 0,
      notes: initialData?.notes || '',
    },
  });

  const isSubmitting = createMutation.isPending;

  const onSubmit = async (data: FormData) => {
    if (initialData?.id && onUpdate) {
      await onUpdate(initialData.id, data);
      onSuccess();
    } else {
      createMutation.mutate(data, { onSuccess });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Supplier Name <span className="text-danger">*</span>
        </label>
        <Controller
          control={control}
          name="supplier_name"
          render={({ field }) => (
            <Combobox
              value={field.value}
              onChange={field.onChange}
              onSearch={(q) => purchasesApi.autocompleteSuppliers(q)}
              placeholder="Enter supplier name"
              error={errors.supplier_name?.message}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Product Category</label>
        <input
          type="text"
          {...register('product_category')}
          placeholder="e.g. Handicraft, Textiles"
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Date <span className="text-danger">*</span>
        </label>
        <input
          type="date"
          {...register('purchase_date')}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
            errors.purchase_date ? 'border-danger' : 'border-slate-200'
          }`}
        />
        {errors.purchase_date && (
          <p className="text-xs text-danger mt-1">{errors.purchase_date.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Purchase Amount (₹) <span className="text-danger">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          {...register('purchase_amount')}
          placeholder="0"
          className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
            errors.purchase_amount ? 'border-danger' : 'border-slate-200'
          }`}
        />
        {errors.purchase_amount && (
          <p className="text-xs text-danger mt-1">{errors.purchase_amount.message}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Packing (₹)</label>
          <input
            type="number"
            step="0.01"
            {...register('packing_cost')}
            placeholder="0"
            className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Parcel (₹)</label>
          <input
            type="number"
            step="0.01"
            {...register('parcel_cost')}
            placeholder="0"
            className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">Other (₹)</label>
          <input
            type="number"
            step="0.01"
            {...register('other_expenses')}
            placeholder="0"
            className="w-full border border-slate-200 rounded-xl px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </div>

      <TotalDisplay control={control} />

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          {...register('notes')}
          rows={2}
          placeholder="Optional notes..."
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
      </div>

      {createMutation.isError && (
        <p className="text-xs text-danger">Failed to save. Please try again.</p>
      )}

      <div className="flex gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 py-3 rounded-xl bg-purchase text-white text-sm font-medium hover:bg-violet-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <LoadingSpinner size={16} className="p-0" /> : null}
          {initialData?.id ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
}
