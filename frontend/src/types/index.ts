export interface WholesaleTransaction {
  id: number;
  shop_name: string;
  transaction_date: string;
  selling_amount: number;
  estimated_profit: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RetailTransaction {
  id: number;
  customer_label?: string;
  transaction_date: string;
  selling_amount: number;
  estimated_profit: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseTransaction {
  id: number;
  supplier_name: string;
  product_category?: string;
  purchase_date: string;
  purchase_amount: number;
  packing_cost: number;
  parcel_cost: number;
  other_expenses: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_sales: number;
  wholesale_sales: number;
  retail_sales: number;
  wholesale_profit: number;
  retail_profit: number;
  total_purchase_expenditure: number;
  total_purchase_amount: number;
  total_additional_expenses: number;
  total_estimated_profit: number;
  wholesale_count: number;
  retail_count: number;
  purchase_count: number;
  period_label: string;
  start_date?: string;
  end_date?: string;
}

export interface TrendDataPoint {
  date: string;
  wholesale?: number;
  retail?: number;
  total?: number;
  estimated_profit?: number;
  total_expenditure?: number;
}

export type Period =
  | 'today'
  | 'yesterday'
  | 'week'
  | 'month'
  | 'financial_year'
  | 'calendar_year'
  | 'overall'
  | 'custom';

export interface User {
  id: number;
  username: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface TopShop {
  shop_name: string;
  total_sales: number;
  transaction_count: number;
  total_profit: number;
}

export interface TopSupplier {
  supplier_name: string;
  total_expenditure: number;
  total_purchase?: number;
  total_purchase_amount?: number;
  packing_cost?: number;
  parcel_cost?: number;
  other_expenses?: number;
  transaction_count: number;
}

export interface MonthlyBreakdown {
  month: string;
  wholesale_sales: number;
  retail_sales: number;
  total_sales: number;
  total_purchase_expenditure: number;
  estimated_profit: number;
}

export interface AnalyticsSummary {
  summary: DashboardSummary;
  top_shops: TopShop[];
  top_suppliers: TopSupplier[];
  monthly_breakdown: MonthlyBreakdown[];
}
