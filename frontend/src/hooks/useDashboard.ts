import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../lib/api';
import type { Period } from '../types';
import { getPeriodDates } from '../utils/format';

interface UseDashboardOptions {
  period: Period;
  startDate?: string;
  endDate?: string;
}

function buildParams(opts: UseDashboardOptions) {
  if (opts.period === 'custom') {
    return {
      period: 'custom',
      start_date: opts.startDate || null,
      end_date: opts.endDate || null,
    };
  }
  const { startDate, endDate } = getPeriodDates(opts.period);
  return { period: opts.period, start_date: startDate, end_date: endDate };
}

export function useDashboardSummary(opts: UseDashboardOptions) {
  const params = buildParams(opts);
  return useQuery({
    queryKey: ['dashboard', 'summary', params],
    queryFn: () => dashboardApi.getSummary(params),
  });
}

export function useSalesTrend(opts: UseDashboardOptions) {
  const params = buildParams(opts);
  return useQuery({
    queryKey: ['dashboard', 'sales-trend', params],
    queryFn: () => dashboardApi.getSalesTrend(params),
  });
}

export function usePurchaseTrend(opts: UseDashboardOptions) {
  const params = buildParams(opts);
  return useQuery({
    queryKey: ['dashboard', 'purchase-trend', params],
    queryFn: () => dashboardApi.getPurchaseTrend(params),
  });
}

export function useProfitTrend(opts: UseDashboardOptions) {
  const params = buildParams(opts);
  return useQuery({
    queryKey: ['dashboard', 'profit-trend', params],
    queryFn: () => dashboardApi.getProfitTrend(params),
  });
}
