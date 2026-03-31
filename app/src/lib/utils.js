// ── FORMAT HELPERS ────────────────────────────────────────────────────────────
export const fmt = (v) =>
  'R$ ' + Number(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDate = (d) => {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
};

// ── OVERDUE & DAYS ────────────────────────────────────────────────────────────
export const isOverdue = (due, status) =>
  status === 'pending' && new Date(due + 'T00:00:00') < new Date(new Date().toDateString());

export const daysUntil = (due) =>
  Math.ceil((new Date(due + 'T00:00:00') - new Date(new Date().toDateString())) / 86400000);

// ── URGENCY ───────────────────────────────────────────────────────────────────
export const LAUNCH_DAYS = 7;

export function urgencyStatus(b) {
  if (b.status === 'paid') return 'paid';
  const days = daysUntil(b.due);
  if (days < 0) return 'overdue';
  if (days < LAUNCH_DAYS) return 'critical';
  if (days <= LAUNCH_DAYS + 3) return 'warning';
  return 'ok';
}

export function urgencyClass(b) {
  const st = urgencyStatus(b);
  if (st === 'critical' || st === 'overdue') return 'urgency-critical';
  if (st === 'warning') return 'urgency-warning';
  return '';
}

export function urgencyPillText(b) {
  const st = urgencyStatus(b);
  const daysLeft = daysUntil(b.due);
  const launchDate = new Date(b.due + 'T00:00:00');
  launchDate.setDate(launchDate.getDate() - LAUNCH_DAYS);
  const launchStr = launchDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

  if (st === 'paid') return null;
  if (st === 'overdue') return { label: 'Vencida', type: 'critical' };
  if (st === 'critical') {
    const d = daysLeft === 0 ? 'vence hoje' : daysLeft === 1 ? 'vence amanhã' : `${daysLeft}d p/ vencer`;
    return { label: `⚠ Lançar agora (${d})`, type: 'critical' };
  }
  if (st === 'warning') return { label: `Lançar até ${launchStr}`, type: 'warning' };
  return { label: `Lançar até ${launchStr}`, type: 'ok' };
}

export const billIcon = (b) =>
  b.status === 'paid' ? '✓' : isOverdue(b.due, b.status) ? '!' : '·';

// ── EXCEL HELPERS ─────────────────────────────────────────────────────────────
export function normalizeKey(str) {
  return String(str || '')
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, '')
    .trim();
}

export function parseExcelDate(val) {
  if (!val && val !== 0) return '';
  if (val instanceof Date) {
    const y = val.getFullYear(), mo = String(val.getMonth() + 1).padStart(2, '0'), dy = String(val.getDate()).padStart(2, '0');
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
    const y = d.getUTCFullYear(), mo = String(d.getUTCMonth() + 1).padStart(2, '0'), dy = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${mo}-${dy}`;
  }
  return '';
}

export function parseMoneyValue(v) {
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
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const todayISO = () => new Date().toISOString().slice(0, 10);
export const thisMonthISO = () => new Date().toISOString().slice(0, 7);
