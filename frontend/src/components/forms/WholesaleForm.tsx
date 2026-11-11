import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getTodayIST } from '../../utils/format';
import { Combobox } from '../ui/Combobox';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useCreateWholesale } from '../../hooks/useWholesale';
import { wholesaleApi } from '../../lib/api';

const schema = z.object({
  shop_name: z.string().min(1, 'Shop name is required'),
  transaction_date: z.string().min(1, 'Date is required'),
  selling_amount: z.coerce.number().positive('Must be greater than 0'),
  estimated_profit: z.coerce.number().min(0, 'Must be 0 or greater'),
  notes: z.string().optional(),
});

type FormData = z.output<typeof schema>;

interface WholesaleFormProps {
  initialData?: Partial<FormData> & { id?: number };
  onSuccess: () => void;
  onCancel: () => void;
  onUpdate?: (id: number, data: FormData) => Promise<void>;
}

export function WholesaleForm({ initialData, onSuccess, onCancel, onUpdate }: WholesaleFormProps) {
  const createMutation = useCreateWholesale();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData, any, FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      shop_name: initialData?.shop_name || '',
      transaction_date: initialData?.transaction_date || getTodayIST(),
      selling_amount: initialData?.selling_amount,
      estimated_profit: initialData?.estimated_profit,
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
          Shop Name <span className="text-danger">*</span>
        </label>
        <Controller
          control={control}
          name="shop_name"
          render={({ field }) => (
            <Combobox
              value={field.value}
              onChange={field.onChange}
              onSearch={(q) => wholesaleApi.autocompleteShops(q)}
              placeholder="Enter shop name"
              error={errors.shop_name?.message}
            />
          )}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Date <span className="text-danger">*</span>
        </label>
        <input
          type="date"
          {...register('transaction_date')}
          className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
            errors.transaction_date ? 'border-danger' : 'border-slate-200'
          }`}
        />
        {errors.transaction_date && (
          <p className="text-xs text-danger mt-1">{errors.transaction_date.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Selling Amount (₹) <span className="text-danger">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          {...register('selling_amount')}
          placeholder="0"
          className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
            errors.selling_amount ? 'border-danger' : 'border-slate-200'
          }`}
        />
        {errors.selling_amount && (
          <p className="text-xs text-danger mt-1">{errors.selling_amount.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Estimated Profit (₹) <span className="text-danger">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          {...register('estimated_profit')}
          placeholder="0"
          className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${
            errors.estimated_profit ? 'border-danger' : 'border-slate-200'
          }`}
        />
        {errors.estimated_profit && (
          <p className="text-xs text-danger mt-1">{errors.estimated_profit.message}</p>
        )}
      </div>

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
          className="flex-1 py-3 rounded-xl bg-primary text-white text-sm font-medium hover:bg-indigo-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <LoadingSpinner size={16} className="p-0" /> : null}
          {initialData?.id ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
}
