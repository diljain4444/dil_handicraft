import axios from 'axios';
import type {
  WholesaleTransaction,
  RetailTransaction,
  PurchaseTransaction,
  DashboardSummary,
  TrendDataPoint,
  AuthToken,
  User,
  PaginatedResponse,
  TopShop,
  TopSupplier,
  MonthlyBreakdown,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// --- Auth ---
export const authApi = {
  login: async (username: string, password: string): Promise<AuthToken> => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const { data } = await api.post<AuthToken>('/api/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return data;
  },
  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/api/auth/me');
    return data;
  },
  register: async (username: string, password: string): Promise<User> => {
    const { data } = await api.post<User>('/api/auth/register', { username, password });
    return data;
  },
};

// --- Dashboard ---
export interface DashboardParams {
  period?: string;
  start_date?: string | null;
  end_date?: string | null;
}

export const dashboardApi = {
  getSummary: async (params: DashboardParams): Promise<DashboardSummary> => {
    const { data } = await api.get<DashboardSummary>('/api/dashboard/summary', { params });
    return data;
  },
  getSalesTrend: async (params: DashboardParams): Promise<TrendDataPoint[]> => {
    const { data } = await api.get<TrendDataPoint[]>('/api/dashboard/sales-trend', { params });
    return data;
  },
  getPurchaseTrend: async (params: DashboardParams): Promise<TrendDataPoint[]> => {
    const { data } = await api.get<TrendDataPoint[]>('/api/dashboard/purchase-trend', { params });
    return data;
  },
  getProfitTrend: async (params: DashboardParams): Promise<TrendDataPoint[]> => {
    const { data } = await api.get<TrendDataPoint[]>('/api/dashboard/profit-trend', { params });
    return data;
  },
};

// --- Wholesale ---
export interface WholesaleListParams {
  start_date?: string;
  end_date?: string;
  shop_name?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  page_size?: number;
}

export interface WholesaleCreatePayload {
  shop_name: string;
  transaction_date: string;
  selling_amount: number;
  estimated_profit: number;
  notes?: string;
}

export const wholesaleApi = {
  list: async (params: WholesaleListParams): Promise<PaginatedResponse<WholesaleTransaction>> => {
    const { data } = await api.get<PaginatedResponse<WholesaleTransaction>>('/api/wholesale', { params });
    return data;
  },
  get: async (id: number): Promise<WholesaleTransaction> => {
    const { data } = await api.get<WholesaleTransaction>(`/api/wholesale/${id}`);
    return data;
  },
  create: async (payload: WholesaleCreatePayload): Promise<WholesaleTransaction> => {
    const { data } = await api.post<WholesaleTransaction>('/api/wholesale', payload);
    return data;
  },
  update: async (id: number, payload: Partial<WholesaleCreatePayload>): Promise<WholesaleTransaction> => {
    const { data } = await api.put<WholesaleTransaction>(`/api/wholesale/${id}`, payload);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/wholesale/${id}`);
  },
  autocompleteShops: async (q: string): Promise<string[]> => {
    const { data } = await api.get<string[]>('/api/wholesale/autocomplete/shops', { params: { q } });
    return data;
  },
};

// --- Retail ---
export interface RetailListParams {
  start_date?: string;
  end_date?: string;
  customer_label?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  page_size?: number;
}

export interface RetailCreatePayload {
  customer_label?: string;
  transaction_date: string;
  selling_amount: number;
  estimated_profit: number;
  notes?: string;
}

export const retailApi = {
  list: async (params: RetailListParams): Promise<PaginatedResponse<RetailTransaction>> => {
    const { data } = await api.get<PaginatedResponse<RetailTransaction>>('/api/retail', { params });
    return data;
  },
  get: async (id: number): Promise<RetailTransaction> => {
    const { data } = await api.get<RetailTransaction>(`/api/retail/${id}`);
    return data;
  },
  create: async (payload: RetailCreatePayload): Promise<RetailTransaction> => {
    const { data } = await api.post<RetailTransaction>('/api/retail', payload);
    return data;
  },
  update: async (id: number, payload: Partial<RetailCreatePayload>): Promise<RetailTransaction> => {
    const { data } = await api.put<RetailTransaction>(`/api/retail/${id}`, payload);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/retail/${id}`);
  },
  autocompleteCustomers: async (q: string): Promise<string[]> => {
    const { data } = await api.get<string[]>('/api/retail/autocomplete/customers', { params: { q } });
    return data;
  },
};

// --- Purchases ---
export interface PurchaseListParams {
  start_date?: string;
  end_date?: string;
  supplier_name?: string;
  sort?: 'newest' | 'oldest';
  page?: number;
  page_size?: number;
}

export interface PurchaseCreatePayload {
  supplier_name: string;
  product_category?: string;
  purchase_date: string;
  purchase_amount: number;
  packing_cost?: number;
  parcel_cost?: number;
  other_expenses?: number;
  notes?: string;
}

export const purchasesApi = {
  list: async (params: PurchaseListParams): Promise<PaginatedResponse<PurchaseTransaction>> => {
    const { data } = await api.get<PaginatedResponse<PurchaseTransaction>>('/api/purchases', { params });
    return data;
  },
  get: async (id: number): Promise<PurchaseTransaction> => {
    const { data } = await api.get<PurchaseTransaction>(`/api/purchases/${id}`);
    return data;
  },
  create: async (payload: PurchaseCreatePayload): Promise<PurchaseTransaction> => {
    const { data } = await api.post<PurchaseTransaction>('/api/purchases', payload);
    return data;
  },
  update: async (id: number, payload: Partial<PurchaseCreatePayload>): Promise<PurchaseTransaction> => {
    const { data } = await api.put<PurchaseTransaction>(`/api/purchases/${id}`, payload);
    return data;
  },
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/purchases/${id}`);
  },
  autocompleteSuppliers: async (q: string): Promise<string[]> => {
    const { data } = await api.get<string[]>('/api/purchases/autocomplete/suppliers', { params: { q } });
    return data;
  },
};

// --- Analytics ---
export interface AnalyticsParams {
  period?: string;
  start_date?: string | null;
  end_date?: string | null;
}

export const analyticsApi = {
  getTopShops: async (params: AnalyticsParams): Promise<TopShop[]> => {
    const { data } = await api.get<TopShop[]>('/api/analytics/top-shops', { params });
    return data;
  },
  getTopSuppliers: async (params: AnalyticsParams): Promise<TopSupplier[]> => {
    const { data } = await api.get<TopSupplier[]>('/api/analytics/top-suppliers', { params });
    return data;
  },
  getMonthlyBreakdown: async (params: AnalyticsParams): Promise<MonthlyBreakdown[]> => {
    const { data } = await api.get<MonthlyBreakdown[]>('/api/analytics/monthly-breakdown', { params });
    return data;
  },
  exportCsv: async (params: AnalyticsParams): Promise<Blob> => {
    const { data } = await api.get('/api/analytics/export-csv', {
      params,
      responseType: 'blob',
    });
    return data;
  },
};

export default api;
