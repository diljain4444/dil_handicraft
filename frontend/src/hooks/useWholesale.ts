import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wholesaleApi } from '../lib/api';
import type { WholesaleListParams, WholesaleCreatePayload } from '../lib/api';

export function useWholesaleList(params: WholesaleListParams) {
  return useQuery({
    queryKey: ['wholesale', 'list', params],
    queryFn: () => wholesaleApi.list(params),
  });
}

export function useCreateWholesale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: WholesaleCreatePayload) => wholesaleApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wholesale'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateWholesale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<WholesaleCreatePayload> }) =>
      wholesaleApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wholesale'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteWholesale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => wholesaleApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wholesale'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useShopAutocomplete(q: string) {
  return useQuery({
    queryKey: ['wholesale', 'autocomplete', q],
    queryFn: () => wholesaleApi.autocompleteShops(q),
    enabled: q.length > 0,
  });
}
