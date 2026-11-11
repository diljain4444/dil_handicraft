import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../lib/api';
import type { AnalyticsParams } from '../lib/api';

export function useTopShops(params: AnalyticsParams) {
  return useQuery({
    queryKey: ['analytics', 'top-shops', params],
    queryFn: () => analyticsApi.getTopShops(params),
  });
}

export function useTopSuppliers(params: AnalyticsParams) {
  return useQuery({
    queryKey: ['analytics', 'top-suppliers', params],
    queryFn: () => analyticsApi.getTopSuppliers(params),
  });
}

export function useMonthlyBreakdown(params: AnalyticsParams) {
  return useQuery({
    queryKey: ['analytics', 'monthly-breakdown', params],
    queryFn: () => analyticsApi.getMonthlyBreakdown(params),
  });
}
