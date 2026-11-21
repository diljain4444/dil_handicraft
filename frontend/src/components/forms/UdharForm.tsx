import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { getTodayIST } from '../../utils/format';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { udharApi } from '../../lib/api';
import type { UdharCreatePayload } from '../../types';

const schema = z.object({
  customer_name: z.string().min(1, 'Customer name is required'),
  udhar_date: z.string().min(1, 'Date is required'),
  original_amount: z.coerce.number().positive('Must be greater than 0'),
  due_date: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.output<typeof schema>;

interface UdharFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function UdharForm({ onSuccess, onCancel }: UdharFormProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      customer_name: '',
      udhar_date: getTodayIST(),
      original_amount: undefined,
      due_date: '',
      notes: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (payload: UdharCreatePayload) => udharApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['udhar'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      onSuccess();
    },
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      customer_name: data.customer_name.trim(),
      original_amount: data.original_amount,
      udhar_date: data.udhar_date,
      due_date: data.due_date || null,
      notes: data.notes?.trim() || null,
    });
  };

  const isSubmitting = createMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="p-4 flex flex-col gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Customer Name <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          {...register('customer_name')}
          placeholder="e.g. Ramesh Bhai"
          className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-500 ${
            errors.customer_name ? 'border-danger' : 'border-slate-200'
          }`}
        />
        {errors.customer_name && (
          <p className="text-xs text-danger mt-1">{errors.customer_name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Amount (₹) <span className="text-danger">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            {...register('original_amount')}
            placeholder="0.00"
            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-500 ${
              errors.original_amount ? 'border-danger' : 'border-slate-200'
            }`}
          />
          {errors.original_amount && (
            <p className="text-xs text-danger mt-1">{errors.original_amount.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date <span className="text-danger">*</span>
          </label>
          <input
            type="date"
            {...register('udhar_date')}
            className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-500 ${
              errors.udhar_date ? 'border-danger' : 'border-slate-200'
            }`}
          />
          {errors.udhar_date && (
            <p className="text-xs text-danger mt-1">{errors.udhar_date.message}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Due Date (Optional)
        </label>
        <input
          type="date"
          {...register('due_date')}
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
        <textarea
          {...register('notes')}
          rows={2}
          placeholder="e.g. Items taken, partial payment details..."
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-500 resize-none"
        />
      </div>

      {createMutation.isError && (
        <p className="text-xs text-danger">Failed to save udhar entry. Please try again.</p>
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
          className="flex-1 py-3 rounded-xl text-white text-sm font-medium transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          style={{ backgroundColor: '#f97316' }}
        >
          {isSubmitting ? <LoadingSpinner size={16} className="p-0" /> : null}
          Save Udhar
        </button>
      </div>
    </form>
  );
}
