import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchasesApi } from '../lib/api';
import type { PurchaseListParams, PurchaseCreatePayload } from '../lib/api';

export function usePurchaseList(params: PurchaseListParams) {
  return useQuery({
    queryKey: ['purchases', 'list', params],
    queryFn: () => purchasesApi.list(params),
  });
}

export function useCreatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PurchaseCreatePayload) => purchasesApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<PurchaseCreatePayload> }) =>
      purchasesApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeletePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => purchasesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['purchases'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useSupplierAutocomplete(q: string) {
  return useQuery({
    queryKey: ['purchases', 'autocomplete', q],
    queryFn: () => purchasesApi.autocompleteSuppliers(q),
    enabled: q.length > 0,
  });
}
