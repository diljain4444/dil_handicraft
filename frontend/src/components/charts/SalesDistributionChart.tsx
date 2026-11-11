import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency } from '../../utils/format';

interface SalesDistributionChartProps {
  wholesaleSales: number;
  retailSales: number;
}

const COLORS = ['#3b82f6', '#22c55e'];

export function SalesDistributionChart({ wholesaleSales, retailSales }: SalesDistributionChartProps) {
  const total = wholesaleSales + retailSales;
  const data = [
    { name: 'Wholesale', value: wholesaleSales },
    { name: 'Retail', value: retailSales },
  ];

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
        No sales data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: unknown) => [formatCurrency(Number(value)), '']}
          contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
        />
        <Legend
          formatter={(value) => <span style={{ fontSize: '12px' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
