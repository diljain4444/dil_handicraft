import { useState } from 'react';
import { Download, Store, Truck, BarChart3 } from 'lucide-react';
import { PeriodSelector } from '../components/ui/PeriodSelector';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { EmptyState } from '../components/ui/EmptyState';
import { useDashboardSummary } from '../hooks/useDashboard';
import { useTopShops, useTopSuppliers, useMonthlyBreakdown } from '../hooks/useAnalytics';
import { analyticsApi } from '../lib/api';
import { formatCurrency } from '../utils/format';
import { KPICard } from '../components/ui/KPICard';
import { TrendingUp, ShoppingBag, ShoppingCart, Package, DollarSign } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { Period } from '../types';

export function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const params = { period, start_date: startDate || null, end_date: endDate || null };
  const dashParams = { period, startDate, endDate };

  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(dashParams);
  const { data: topShops, isLoading: shopsLoading } = useTopShops(params);
  const { data: topSuppliers, isLoading: suppliersLoading } = useTopSuppliers(params);
  const { data: monthlyData, isLoading: monthlyLoading } = useMonthlyBreakdown(params);

  const handleDateChange = (s: string, e: string) => {
    setStartDate(s);
    setEndDate(e);
  };

  const handleExport = async () => {
    try {
      const blob = await analyticsApi.exportCsv(params);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dil-handicraft-${period}-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to export CSV. Please try again.');
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Analytics</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-indigo-600 transition-colors"
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      <PeriodSelector
        value={period}
        onChange={setPeriod}
        startDate={startDate}
        endDate={endDate}
        onDateChange={handleDateChange}
      />

      {/* Summary KPIs */}
      {summaryLoading ? (
        <LoadingSpinner size={32} className="py-6" />
      ) : summary ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <KPICard title="Total Sales" value={summary.total_sales} icon={TrendingUp} color="#6366f1" />
          <KPICard title="Wholesale Sales" value={summary.wholesale_sales} icon={ShoppingBag} color="#3b82f6" />
          <KPICard title="Retail Sales" value={summary.retail_sales} icon={ShoppingCart} color="#22c55e" />
          <KPICard title="Purchases" value={summary.total_purchase_expenditure} icon={Package} color="#8b5cf6" />
          <KPICard title="Total Est. Profit" value={summary.total_estimated_profit} icon={DollarSign} color="#f59e0b" />
          <KPICard title="Wholesale Profit" value={summary.wholesale_profit || 0} icon={TrendingUp} color="#0ea5e9" subtitle="From wholesale" />
          <KPICard title="Retail Profit" value={summary.retail_profit || 0} icon={TrendingUp} color="#10b981" subtitle="From retail" />
          <KPICard title="Addl. Expenses" value={summary.total_additional_expenses} icon={TrendingUp} color="#ef4444" subtitle="Packing/Parcel/Other" />
        </div>
      ) : null}

      {/* Sales vs Purchase Bar Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-3">Sales vs Purchase (Monthly Trend)</h3>
        {monthlyLoading ? (
          <LoadingSpinner size={24} className="py-8" />
        ) : !monthlyData || monthlyData.length === 0 ? (
          <EmptyState message="No sales or purchase data recorded yet." />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
              <YAxis
                tickFormatter={(v: number) => `₹${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                width={50}
              />
              <Tooltip
                formatter={(value: any, name: any) => [
                  formatCurrency(Number(value) || 0),
                  name === 'total_sales' ? 'Total Sales' : name === 'total_purchase_expenditure' ? 'Total Purchases' : name,
                ]}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend
                formatter={(v) => (
                  <span style={{ fontSize: '12px', fontWeight: 500 }}>
                    {v === 'total_sales' ? 'Total Sales' : v === 'total_purchase_expenditure' ? 'Total Purchases' : v}
                  </span>
                )}
              />
              <Bar dataKey="total_sales" name="Total Sales" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="total_purchase_expenditure" name="Total Purchases" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Shops */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
          <Store size={16} className="text-secondary" />
          Top Shops
        </h3>
        {shopsLoading ? (
          <LoadingSpinner size={24} className="py-4" />
        ) : !topShops?.length ? (
          <EmptyState message="No shop data for this period" />
        ) : (
          <div className="space-y-2">
            {topShops.map((shop, i) => (
              <div key={shop.shop_name} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{shop.shop_name}</div>
                  <div className="text-xs text-slate-500">{shop.transaction_count} transactions</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-slate-900">{formatCurrency(shop.total_sales)}</div>
                  <div className="text-xs text-success">{formatCurrency(shop.total_profit)} profit</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Suppliers */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
          <Truck size={16} className="text-purchase" />
          Top Suppliers
        </h3>
        {suppliersLoading ? (
          <LoadingSpinner size={24} className="py-4" />
        ) : !topSuppliers?.length ? (
          <EmptyState message="No supplier data for this period" />
        ) : (
          <div className="space-y-2">
            {topSuppliers.map((supplier, i) => (
              <div key={supplier.supplier_name} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
                <div className="w-6 h-6 rounded-full bg-violet-50 flex items-center justify-center text-xs font-bold text-purchase flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-slate-900 truncate">{supplier.supplier_name}</div>
                  <div className="text-xs text-slate-500">{supplier.transaction_count} purchases</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-sm font-bold text-slate-900">
                    {formatCurrency(supplier.total_expenditure ?? supplier.total_purchase ?? 0)}
                  </div>
                  {Boolean(
                    (supplier.packing_cost || 0) +
                    (supplier.parcel_cost || 0) +
                    (supplier.other_expenses || 0)
                  ) && (
                    <div className="text-[10px] text-slate-500">
                      Base: {formatCurrency(supplier.total_purchase_amount || 0)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h3 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-primary" />
          Monthly Breakdown Table
        </h3>
        {monthlyLoading ? (
          <LoadingSpinner size={24} className="py-4" />
        ) : !monthlyData || monthlyData.length === 0 ? (
          <EmptyState message="No monthly data recorded yet." />
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-xs min-w-[500px]">
              <thead>
                <tr className="border-b border-slate-100 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="text-left py-2.5 px-3 font-semibold">Month</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Wholesale</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Retail</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Total Sales</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Purchases</th>
                  <th className="text-right py-2.5 px-3 font-semibold">Est. Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {monthlyData.map((row) => (
                  <tr key={row.month} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-slate-800">{row.month}</td>
                    <td className="py-2.5 px-3 text-right text-blue-600 font-medium">{formatCurrency(row.wholesale_sales)}</td>
                    <td className="py-2.5 px-3 text-right text-green-600 font-medium">{formatCurrency(row.retail_sales)}</td>
                    <td className="py-2.5 px-3 text-right text-indigo-600 font-semibold">{formatCurrency(row.total_sales)}</td>
                    <td className="py-2.5 px-3 text-right text-purple-600 font-medium">{formatCurrency(row.total_purchase_expenditure)}</td>
                    <td className="py-2.5 px-3 text-right text-amber-600 font-semibold">{formatCurrency(row.estimated_profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
