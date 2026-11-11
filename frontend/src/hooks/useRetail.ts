import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { retailApi } from '../lib/api';
import type { RetailListParams, RetailCreatePayload } from '../lib/api';

export function useRetailList(params: RetailListParams) {
  return useQuery({
    queryKey: ['retail', 'list', params],
    queryFn: () => retailApi.list(params),
  });
}

export function useCreateRetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: RetailCreatePayload) => retailApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retail'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateRetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<RetailCreatePayload> }) =>
      retailApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retail'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteRetail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => retailApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['retail'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCustomerAutocomplete(q: string) {
  return useQuery({
    queryKey: ['retail', 'autocomplete', q],
    queryFn: () => retailApi.autocompleteCustomers(q),
    enabled: q.length > 0,
  });
}
