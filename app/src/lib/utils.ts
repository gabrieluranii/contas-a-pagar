import type { Bill } from '@/types';

// ── FORMAT HELPERS ────────────────────────────────────────────────────────────
export const fmt = (v: number | string | null | undefined): string =>
  'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (d: string | null | undefined): string => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

// ── OVERDUE & DAYS ────────────────────────────────────────────────────────────
export const isOverdue = (due: string, status: string): boolean =>
  status === 'pending' && new Date(due + 'T00:00:00') < new Date(new Date().toDateString());

export const daysUntil = (due: string): number =>
  Math.ceil((new Date(due + 'T00:00:00').getTime() - new Date(new Date().toDateString()).getTime()) / 86400000);

// ── URGENCY ───────────────────────────────────────────────────────────────────
export const LAUNCH_DAYS = 7;

export type UrgencyStatus = 'paid' | 'overdue' | 'critical' | 'warning' | 'ok';

export function urgencyStatus(b: Pick<Bill, 'status' | 'due'>): UrgencyStatus {
  if (b.status === 'paid') return 'paid';
  const days = daysUntil(b.due);
  if (days < 0) return 'overdue';
  if (days < LAUNCH_DAYS) return 'critical';
  if (days <= LAUNCH_DAYS + 3) return 'warning';
  return 'ok';
}

export function urgencyClass(b: Pick<Bill, 'status' | 'due'>): string {
  const st = urgencyStatus(b);
  if (st === 'critical' || st === 'overdue') return 'urgency-critical';
  if (st === 'warning') return 'urgency-warning';
  return '';
}

export type UrgencyPill = { label: string; type: string } | null;

export function urgencyPillText(b: Pick<Bill, 'status' | 'due'>): UrgencyPill {
  if (!b.due || isNaN(new Date(b.due + 'T00:00:00').getTime())) return null;

  const st = urgencyStatus(b);
  const daysLeft = daysUntil(b.due);
  const launchDate = new Date(b.due + 'T00:00:00');
  launchDate.setDate(launchDate.getDate() - LAUNCH_DAYS);
  const launchStr = launchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  if (st === 'paid') return null;
  // Preservado do JS original: overdue retorna type: 'critical' (não 'overdue')
  if (st === 'overdue') return { label: 'Vencida', type: 'critical' };
  if (st === 'critical') {
    const d = daysLeft === 0 ? 'vence hoje' : daysLeft === 1 ? 'vence amanhã' : `${daysLeft}d p/ vencer`;
    return { label: `⚠ Lançar agora (${d})`, type: 'critical' };
  }
  if (st === 'warning') return { label: `Lançar até ${launchStr}`, type: 'warning' };
  return { label: `Lançar até ${launchStr}`, type: 'ok' };
}

export const billIcon = (b: Pick<Bill, 'status' | 'due'>): string =>
  b.status === 'paid' ? '✓' : isOverdue(b.due, b.status) ? '!' : '·';

// ── EXCEL HELPERS ─────────────────────────────────────────────────────────────
export function normalizeKey(str: string | null | undefined): string {
  return String(str || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

export function parseExcelDate(val: unknown): string {
  if (!val && val !== 0) return '';
  if (val instanceof Date) {
    const y = val.getFullYear();
    const mo = String(val.getMonth() + 1).padStart(2, '0');
    const dy = String(val.getDate()).padStart(2, '0');
    return `${y}-${mo}-${dy}`;
  }
  if (typeof val === 'string') {
    const iso = val.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const br = val.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})/);
    if (br) return `${br[3]}-${br[2]}-${br[1]}`;
    return val;
  }
  if (typeof val === 'number' && val > 1000) {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    const y = d.getUTCFullYear();
    const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dy = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${mo}-${dy}`;
  }
  return '';
}

export function parseMoneyValue(v: unknown): number {
  if (typeof v === 'number') return v;
  const s = String(v || '0');
  const clean = s.replace(/[R$\s]/g, '');
  if (/\d\.\d{3},/.test(clean) || /,\d{2}$/.test(clean))
    return parseFloat(clean.replace(/\./g, '').replace(',', '.')) || 0;
  return parseFloat(clean.replace(/,/g, '.')) || 0;
}

// ── MONTH NAMES ───────────────────────────────────────────────────────────────
export const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
] as const;

export const todayISO = (): string => new Date().toISOString().slice(0, 10);
export const thisMonthISO = (): string => new Date().toISOString().slice(0, 7);
