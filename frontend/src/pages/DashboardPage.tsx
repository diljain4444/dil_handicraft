import { useState } from 'react';
import {
  TrendingUp,
  ShoppingBag,
  ShoppingCart,
  Package,
  DollarSign,
  ArrowUpRight,
} from 'lucide-react';
import { PeriodSelector } from '../components/ui/PeriodSelector';
import { KPICard } from '../components/ui/KPICard';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { SalesDistributionChart } from '../components/charts/SalesDistributionChart';
import { SalesTrendChart } from '../components/charts/SalesTrendChart';
import { PurchaseTrendChart } from '../components/charts/PurchaseTrendChart';
import { ProfitTrendChart } from '../components/charts/ProfitTrendChart';
import {
  useDashboardSummary,
  useSalesTrend,
  usePurchaseTrend,
  useProfitTrend,
} from '../hooks/useDashboard';
import type { Period } from '../types';

export function DashboardPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const opts = { period, startDate, endDate };

  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(opts);
  const { data: salesTrend, isLoading: salesTrendLoading } = useSalesTrend(opts);
  const { data: purchaseTrend, isLoading: purchaseTrendLoading } = usePurchaseTrend(opts);
  const { data: profitTrend, isLoading: profitTrendLoading } = useProfitTrend(opts);

  const handleDateChange = (s: string, e: string) => {
    setStartDate(s);
    setEndDate(e);
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-5">
      {/* Greeting */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Business Overview</h2>
        <p className="text-sm text-slate-500">{summary?.period_label || 'Loading...'}</p>
      </div>

      {/* Period selector */}
      <PeriodSelector
        value={period}
        onChange={setPeriod}
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
      />

      {/* KPI Cards */}
      {summaryLoading ? (
        <LoadingSpinner size={32} className="py-8" />
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard
            title="Total Sales"
            value={summary.total_sales}
            icon={TrendingUp}
            color="#6366f1"
            subtitle={`${summary.wholesale_count + summary.retail_count} transactions`}
          />
          <KPICard
            title="Wholesale Sales"
            value={summary.wholesale_sales}
            icon={ShoppingBag}
            color="#3b82f6"
            subtitle={`${summary.wholesale_count} transactions`}
          />
          <KPICard
            title="Retail Sales"
            value={summary.retail_sales}
            icon={ShoppingCart}
            color="#22c55e"
            subtitle={`${summary.retail_count} transactions`}
          />
          <KPICard
            title="Purchase Expenditure"
            value={summary.total_purchase_expenditure}
            icon={Package}
            color="#8b5cf6"
            subtitle={`${summary.purchase_count} purchases`}
          />
          <KPICard
            title="Total Est. Profit"
            value={summary.total_estimated_profit}
            icon={DollarSign}
            color="#f59e0b"
          />
          <KPICard
            title="Wholesale Profit"
            value={summary.wholesale_profit || 0}
            icon={TrendingUp}
            color="#0ea5e9"
            subtitle="Profit from wholesale"
          />
          <KPICard
            title="Retail Profit"
            value={summary.retail_profit || 0}
            icon={TrendingUp}
            color="#10b981"
            subtitle="Profit from retail"
          />
          <KPICard
            title="Additional Expenses"
            value={summary.total_additional_expenses}
            icon={ArrowUpRight}
            color="#ef4444"
            subtitle="Packing + Parcel + Other"
          />
        </div>
      ) : null}

      {/* Charts */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Sales Distribution</h3>
        {summaryLoading ? (
          <LoadingSpinner size={24} className="py-6" />
        ) : (
          <SalesDistributionChart
            wholesaleSales={summary?.wholesale_sales || 0}
            retailSales={summary?.retail_sales || 0}
          />
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Sales Trend</h3>
        {salesTrendLoading ? (
          <LoadingSpinner size={24} className="py-6" />
        ) : (
          <SalesTrendChart data={salesTrend || []} />
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Purchase Trend</h3>
        {purchaseTrendLoading ? (
          <LoadingSpinner size={24} className="py-6" />
        ) : (
          <PurchaseTrendChart data={purchaseTrend || []} />
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Profit Trend</h3>
        {profitTrendLoading ? (
          <LoadingSpinner size={24} className="py-6" />
        ) : (
          <ProfitTrendChart data={profitTrend || []} />
        )}
      </div>
    </div>
  );
}
