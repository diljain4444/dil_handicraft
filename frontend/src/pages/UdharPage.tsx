import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, AlertCircle, CheckCircle2,
  IndianRupee, Users, Clock, ChevronDown, X, Calendar,
} from 'lucide-react';
import { udharApi } from '../lib/api';
import { formatCurrency } from '../utils/format';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import type { UdharEntry, UdharCreatePayload, UdharUpdatePayload } from '../types';

// ─── helpers ────────────────────────────────────────────────────────────────
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function daysLeft(due?: string | null): { label: string; color: string } | null {
  if (!due) return null;
  const diff = Math.ceil((new Date(due).getTime() - Date.now()) / 86_400_000);
  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, color: 'text-red-600' };
  if (diff === 0) return { label: 'Due today', color: 'text-orange-500' };
  if (diff <= 3) return { label: `${diff}d left`, color: 'text-orange-400' };
  return { label: `${diff}d left`, color: 'text-slate-400' };
}

// ─── Add / Edit Form Modal ───────────────────────────────────────────────────
interface FormModalProps {
  entry?: UdharEntry | null;
  onClose: () => void;
  onSaved: () => void;
}

function UdharFormModal({ entry, onClose, onSaved }: FormModalProps) {
  const isEdit = !!entry;
  const qc = useQueryClient();

  const [customerName, setCustomerName] = useState(entry?.customer_name ?? '');
  const [amount, setAmount] = useState(
    isEdit ? String(entry!.remaining_amount) : ''
  );
  const [udharDate, setUdharDate] = useState(
    isEdit ? entry!.udhar_date : todayStr()
  );
  const [dueDate, setDueDate] = useState(entry?.due_date ?? '');
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [error, setError] = useState('');

  const createMut = useMutation({
    mutationFn: (p: UdharCreatePayload) => udharApi.create(p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['udhar'] }); onSaved(); },
    onError: (e: any) => setError(e?.response?.data?.detail ?? 'Failed to save'),
  });

  const updateMut = useMutation({
    mutationFn: (p: UdharUpdatePayload) => udharApi.update(entry!.id, p),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['udhar'] }); onSaved(); },
    onError: (e: any) => setError(e?.response?.data?.detail ?? 'Failed to save'),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const amt = parseFloat(amount);
    if (!customerName.trim()) return setError('Customer name is required');
    if (!amt || amt <= 0) return setError('Amount must be > 0');

    if (isEdit) {
      updateMut.mutate({
        customer_name: customerName.trim(),
        remaining_amount: amt,
        due_date: dueDate || null,
        notes: notes.trim() || null,
      });
    } else {
      createMut.mutate({
        customer_name: customerName.trim(),
        original_amount: amt,
        udhar_date: udharDate,
        due_date: dueDate || null,
        notes: notes.trim() || null,
      });
    }
  }

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-xl">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 rounded-t-2xl"
          style={{ borderTop: '4px solid #f97316' }}>
          <h2 className="font-bold text-slate-900">
            {isEdit ? 'Edit Udhar Entry' : 'Add Udhar Entry'}
          </h2>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2 flex items-center gap-2">
              <AlertCircle size={14} /> {error}
            </div>
          )}

          {/* Customer Name */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">
              Customer Name *
            </label>
            <input
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="e.g. Ramesh Bhai"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              disabled={saving}
            />
          </div>

          {/* Amount row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">
                {isEdit ? 'Remaining Amount (₹) *' : 'Udhar Amount (₹) *'}
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                disabled={saving}
              />
            </div>
            {!isEdit && (
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Date *</label>
                <input
                  type="date"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={udharDate}
                  onChange={e => setUdharDate(e.target.value)}
                  disabled={saving}
                />
              </div>
            )}
            {isEdit && (
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Due Date</label>
                <input
                  type="date"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  disabled={saving}
                />
              </div>
            )}
          </div>

          {!isEdit && (
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">Due Date (optional)</label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                disabled={saving}
              />
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Notes</label>
            <textarea
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
              placeholder="e.g. Paid ₹500 on 20 Nov, remaining ₹1500..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              disabled={saving}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-colors disabled:opacity-50"
            style={{ backgroundColor: '#f97316' }}
          >
            {saving ? 'Saving…' : isEdit ? 'Update Udhar' : 'Add Udhar'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Single Udhar Card ───────────────────────────────────────────────────────
interface UdharCardProps {
  entry: UdharEntry;
  onEdit: (e: UdharEntry) => void;
  onDelete: (e: UdharEntry) => void;
  onMarkPaid: (e: UdharEntry) => void;
}

function UdharCard({ entry, onEdit, onDelete, onMarkPaid }: UdharCardProps) {
  const [expanded, setExpanded] = useState(false);
  const due = daysLeft(entry.due_date);
  const paidPct = entry.original_amount > 0
    ? Math.round(((entry.original_amount - entry.remaining_amount) / entry.original_amount) * 100)
    : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* top color stripe based on overdue status */}
      <div className="h-1 w-full" style={{
        backgroundColor: due && due.color === 'text-red-600' ? '#ef4444'
          : due && due.color === 'text-orange-500' ? '#f97316'
          : '#f97316'
      }} />

      <div className="p-4">
        {/* Row 1: name + amount */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold text-slate-900 text-sm truncate">{entry.customer_name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Added: {formatDate(entry.udhar_date)}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-orange-500 text-base">
              {formatCurrency(entry.remaining_amount)}
            </p>
            {entry.original_amount !== entry.remaining_amount && (
              <p className="text-[10px] text-slate-400 line-through">
                {formatCurrency(entry.original_amount)}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {paidPct > 0 && (
          <div className="mt-2.5">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
              <span>Paid: {paidPct}%</span>
              <span>Remaining: {100 - paidPct}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-400 rounded-full transition-all"
                style={{ width: `${paidPct}%` }} />
            </div>
          </div>
        )}

        {/* Due date badge */}
        {due && (
          <div className={`mt-2 flex items-center gap-1 text-xs font-medium ${due.color}`}>
            <Clock size={11} />
            {due.label}
            {entry.due_date && <span className="text-slate-400 font-normal ml-1">({formatDate(entry.due_date)})</span>}
          </div>
        )}

        {/* Expand for notes */}
        {entry.notes && (
          <button
            className="mt-2 flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
            onClick={() => setExpanded(v => !v)}
          >
            <ChevronDown size={12} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Hide notes' : 'Show notes'}
          </button>
        )}
        {expanded && entry.notes && (
          <p className="mt-1.5 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 leading-relaxed">
            {entry.notes}
          </p>
        )}

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onMarkPaid(entry)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors"
          >
            <CheckCircle2 size={14} /> Mark Paid
          </button>
          <button
            onClick={() => onEdit(entry)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
          >
            <Pencil size={13} /> Edit
          </button>
          <button
            onClick={() => onDelete(entry)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Dialog ───────────────────────────────────────────────────
function ConfirmDialog({ entry, onConfirm, onCancel }: { entry: UdharEntry; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-slate-900 mb-1">Delete Udhar?</h3>
        <p className="text-sm text-slate-500 mb-4">
          Delete udhar of <span className="font-semibold text-slate-700">{formatCurrency(entry.remaining_amount)}</span> for{' '}
          <span className="font-semibold text-slate-700">{entry.customer_name}</span>? This cannot be undone.
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={onConfirm} className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700">Delete</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export function UdharPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editEntry, setEditEntry] = useState<UdharEntry | null>(null);
  const [deleteEntry, setDeleteEntry] = useState<UdharEntry | null>(null);
  const [sort, setSort] = useState<'newest' | 'oldest' | 'due_soon' | 'highest'>('newest');
  const [showPaid, setShowPaid] = useState(false);
  const [page, setPage] = useState(1);

  const { data: summary } = useQuery({
    queryKey: ['udhar', 'summary'],
    queryFn: () => udharApi.getSummary(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['udhar', 'list', sort, showPaid, page],
    queryFn: () => udharApi.list({ sort, show_paid: showPaid, page, page_size: 20 }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => udharApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['udhar'] }); setDeleteEntry(null); },
  });

  const markPaidMut = useMutation({
    mutationFn: (id: number) => udharApi.update(id, { is_paid: true, remaining_amount: 0 }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['udhar'] }); },
  });

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-slate-900">Udhar / Khata</h2>
        <p className="text-sm text-slate-500">Track credit given to customers</p>
      </div>

      {/* KPI summary strip */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3 col-span-2">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee size={14} className="text-orange-500" />
              <span className="text-xs font-medium text-orange-600">Total Pending</span>
            </div>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(summary.total_pending)}</p>
            <p className="text-xs text-orange-400 mt-0.5">{summary.total_customers} customer{summary.total_customers !== 1 ? 's' : ''}</p>
          </div>
          <div className={`rounded-2xl p-3 border ${summary.overdue_count > 0 ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <AlertCircle size={14} className={summary.overdue_count > 0 ? 'text-red-500' : 'text-slate-400'} />
              <span className={`text-xs font-medium ${summary.overdue_count > 0 ? 'text-red-600' : 'text-slate-500'}`}>Overdue</span>
            </div>
            <p className={`text-lg font-bold ${summary.overdue_count > 0 ? 'text-red-600' : 'text-slate-400'}`}>
              {summary.overdue_count}
            </p>
            <p className={`text-xs mt-0.5 ${summary.overdue_count > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              {formatCurrency(summary.overdue_amount)}
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Users size={14} className="text-slate-400" />
              <span className="text-xs font-medium text-slate-500">Customers</span>
            </div>
            <p className="text-lg font-bold text-slate-700">{summary.total_customers}</p>
            <p className="text-xs text-slate-400 mt-0.5">with pending</p>
          </div>
        </div>
      )}

      {/* Controls row */}
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity"
          style={{ backgroundColor: '#f97316' }}
        >
          <Plus size={16} /> Add Udhar
        </button>

        <select
          value={sort}
          onChange={e => { setSort(e.target.value as any); setPage(1); }}
          className="border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="due_soon">Due Soon</option>
          <option value="highest">Highest Amount</option>
        </select>

        <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={showPaid}
            onChange={e => { setShowPaid(e.target.checked); setPage(1); }}
            className="rounded"
          />
          Show Paid
        </label>
      </div>

      {/* List */}
      {isLoading ? (
        <LoadingSpinner size={32} className="py-12" />
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Calendar size={40} className="mb-3 opacity-30" />
          <p className="font-medium text-sm">No udhar entries</p>
          <p className="text-xs mt-1">{showPaid ? 'No entries found' : 'All udhar cleared!'}</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: '#f97316' }}
          >
            Add First Entry
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map(entry => (
              <UdharCard
                key={entry.id}
                entry={entry}
                onEdit={e => { setEditEntry(e); setShowForm(true); }}
                onDelete={e => setDeleteEntry(e)}
                onMarkPaid={e => markPaidMut.mutate(e.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {data.total_pages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40"
              >Prev</button>
              <span className="px-4 py-2 text-sm text-slate-600">{page} / {data.total_pages}</span>
              <button
                disabled={page === data.total_pages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-sm disabled:opacity-40"
              >Next</button>
            </div>
          )}
        </>
      )}

      {/* Add / Edit modal */}
      {showForm && (
        <UdharFormModal
          entry={editEntry}
          onClose={() => { setShowForm(false); setEditEntry(null); }}
          onSaved={() => { setShowForm(false); setEditEntry(null); }}
        />
      )}

      {/* Delete confirm */}
      {deleteEntry && (
        <ConfirmDialog
          entry={deleteEntry}
          onConfirm={() => deleteMut.mutate(deleteEntry.id)}
          onCancel={() => setDeleteEntry(null)}
        />
      )}
    </div>
  );
}
