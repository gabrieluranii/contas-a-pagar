'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import BillModal from '@/components/BillModal';

// ── Tokens (light, consistente com o sistema) ─────────────────────────────────
const T = {
  bg:      '#ffffff',
  card:    '#f7f7f5',
  border:  '#e8e8e5',
  accent:  '#d97757',
  textPri: '#1a1a1a',
  textSec: '#888888',
  textMut: '#aaaaaa',
  textOff: '#cccccc',
  bgOff:   '#fafaf9',
  chipBg:  '#fff4ef',
  chipBdr: '#f0c4b0',
};

const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAYS_PT   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toKey(date) {
  // YYYY-MM-DD
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildGrid(year, month) {
  const first  = new Date(year, month, 1);
  const last   = new Date(year, month + 1, 0);
  const startDow = first.getDay(); // 0 = Sun

  const cells = [];

  // days from previous month
  for (let i = startDow - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month, -i), current: false });
  }
  // days of current month
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push({ date: new Date(year, month, d), current: true });
  }
  // fill to complete last week
  let trailing = 1;
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, month + 1, trailing++), current: false });
  }

  // group into weeks
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

const todayKey = toKey(new Date());

// ── Chip ──────────────────────────────────────────────────────────────────────
function Chip({ bill, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={() => onClick(bill.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={`${bill.supplier} — R$ ${Number(bill.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
      style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: 10,
        color: T.accent,
        background: hov ? '#fde8dc' : T.chipBg,
        border: `1px solid ${hov ? T.accent : T.chipBdr}`,
        borderRadius: 4,
        padding: '2px 6px',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
        lineHeight: '16px',
        maxWidth: '100%',
      }}
    >
      {bill.supplier}
    </div>
  );
}

// ── DayCell ───────────────────────────────────────────────────────────────────
function DayCell({ cell, bills, numWeeks, onChipClick }) {
  const { date, current } = cell;
  const key     = toKey(date);
  const isToday = key === todayKey;
  const MAX_CHIPS = numWeeks >= 6 ? 2 : 3;

  const visible  = bills.slice(0, MAX_CHIPS);
  const overflow = bills.length - MAX_CHIPS;

  return (
    <div style={{
      flex: 1,
      borderRight: `1px solid ${T.border}`,
      borderBottom: `1px solid ${T.border}`,
      background: current ? T.bg : T.bgOff,
      padding: '5px 7px 4px',
      display: 'flex',
      flexDirection: 'column',
      gap: 3,
      overflow: 'hidden',
      minHeight: 0,
    }}>
      {/* Day number */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <span style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 12,
          fontWeight: isToday ? 600 : 500,
          color: isToday ? '#ffffff' : current ? T.textPri : T.textOff,
          width: 22,
          height: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          background: isToday ? T.accent : 'transparent',
          lineHeight: 1,
          flexShrink: 0,
        }}>
          {date.getDate()}
        </span>
      </div>

      {/* Chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden', flex: 1, minHeight: 0 }}>
        {visible.map(b => (
          <Chip key={b.id} bill={b} onClick={onChipClick}/>
        ))}
        {overflow > 0 && (
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 10,
            color: T.accent,
            background: T.chipBg,
            border: `1px solid ${T.chipBdr}`,
            borderRadius: 4,
            padding: '2px 6px',
            lineHeight: '16px',
            cursor: 'default',
            flexShrink: 0,
          }}>
            +{overflow} mais
          </div>
        )}
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function CalendarioPage() {
  const { state }  = useApp();
  const [view, setView]     = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [editId, setEditId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { year, month } = view;

  function prevMonth() {
    setView(v => {
      const d = new Date(v.year, v.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }
  function nextMonth() {
    setView(v => {
      const d = new Date(v.year, v.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  // agrupado por data
  const billsByDate = useMemo(() => {
    const pending = state.bills.filter(b => b.status === 'pending' && b.due);
    const map = {};
    pending.forEach(b => {
      if (!map[b.due]) map[b.due] = [];
      map[b.due].push(b);
    });
    return map;
  }, [state.bills]);

  const weeks    = buildGrid(year, month);
  const numWeeks = weeks.length;

  function handleChipClick(id) {
    setEditId(id);
    setModalOpen(true);
  }

  // NavBtn micro-component
  function NavBtn({ onClick, children }) {
    const [hov, setHov] = useState(false);
    return (
      <button
        onClick={onClick}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: 30, height: 30,
          border: `1px solid ${hov ? T.accent : T.border}`,
          borderRadius: 6,
          background: hov ? T.chipBg : 'transparent',
          color: hov ? T.accent : T.textSec,
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <>
      {/* Página: 100% do espaço disponível sem scroll */}
      <div style={{
        height: 'calc(100vh - 80px)',  /* 40px padding top + bottom do layout */
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
        fontFamily: 'Inter, sans-serif',
        background: T.bg,
        overflow: 'hidden',
      }}>

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 16,
          flexShrink: 0,
        }}>
          <div>
            <h1 style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 20,
              fontWeight: 600,
              color: T.textPri,
              margin: 0,
              lineHeight: 1.2,
            }}>
              Calendário
            </h1>
            <p style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 13,
              color: T.textSec,
              margin: '4px 0 0',
              fontWeight: 500,
            }}>
              {MONTHS_PT[month]} {year}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <NavBtn onClick={prevMonth}>‹</NavBtn>
            <NavBtn onClick={nextMonth}>›</NavBtn>
          </div>
        </div>

        {/* ── CABEÇALHO DIAS DA SEMANA ────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          borderTop: `1px solid ${T.border}`,
          borderLeft: `1px solid ${T.border}`,
          borderRight: `1px solid ${T.border}`,
          borderRadius: '8px 8px 0 0',
          background: T.card,
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          {DAYS_PT.map((d, i) => (
            <div key={d} style={{
              padding: '8px 0',
              textAlign: 'center',
              fontFamily: 'Inter, sans-serif',
              fontSize: 10,
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
              color: i === 0 || i === 6 ? T.accent : T.textMut,
              borderRight: i < 6 ? `1px solid ${T.border}` : 'none',
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* ── GRADE DO CALENDÁRIO ─────────────────────────────────────── */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          border: `1px solid ${T.border}`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          overflow: 'hidden',
          minHeight: 0,
        }}>
          {weeks.map((week, wi) => (
            <div key={wi} style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              borderTop: `1px solid ${T.border}`,
              minHeight: 0,
            }}>
              {week.map((cell, di) => (
                <DayCell
                  key={di}
                  cell={cell}
                  bills={billsByDate[toKey(cell.date)] || []}
                  numWeeks={numWeeks}
                  onChipClick={handleChipClick}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <BillModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditId(null); }}
        editId={editId}
        readOnly={true}
      />
    </>
  );
}
