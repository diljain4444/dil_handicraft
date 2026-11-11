import { format, parseISO } from 'date-fns';
import type { Period } from '../types';

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatDateLong(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'EEEE, d MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function getTodayIST(): string {
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + istOffset);
  return ist.toISOString().split('T')[0];
}

export function getPeriodDates(period: Period): {
  startDate: string | null;
  endDate: string | null;
} {
  const today = getTodayIST();

  switch (period) {
    case 'today':
      return { startDate: today, endDate: today };
    case 'yesterday': {
      const d = new Date(today);
      d.setDate(d.getDate() - 1);
      const yesterday = d.toISOString().split('T')[0];
      return { startDate: yesterday, endDate: yesterday };
    }
    case 'week': {
      const d = new Date(today);
      d.setDate(d.getDate() - 6);
      return { startDate: d.toISOString().split('T')[0], endDate: today };
    }
    case 'month': {
      const d = new Date(today);
      d.setDate(d.getDate() - 29);
      return { startDate: d.toISOString().split('T')[0], endDate: today };
    }
    case 'financial_year': {
      const year = new Date(today).getFullYear();
      const month = new Date(today).getMonth() + 1;
      const fyStart = month >= 4 ? `${year}-04-01` : `${year - 1}-04-01`;
      return { startDate: fyStart, endDate: today };
    }
    case 'calendar_year': {
      const year = new Date(today).getFullYear();
      return { startDate: `${year}-01-01`, endDate: today };
    }
    case 'overall':
      return { startDate: null, endDate: null };
    case 'custom':
      return { startDate: null, endDate: null };
    default:
      return { startDate: null, endDate: null };
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    return format(parseISO(dateStr), 'd MMM');
  } catch {
    return dateStr;
  }
}
