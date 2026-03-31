'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { fmt, fmtDate, isOverdue, daysUntil } from '@/lib/utils';
import BillModal from '@/components/BillModal';
import PagarModal from '@/components/PagarModal';

// ── Design Tokens ─────────────────────────────────────────────────────────────
const T = {
  bg:       '#ffffff',
  card:     '#f7f7f5',
  border:   '#e8e8e5',
  accent:   '#d97757',
  accentHov:'#c4663f',
  textPri:  '#1a1a1a',
  textSec:  '#888888',
  textLbl:  '#555555',
  textSub:  '#888888',
  textEmp:  '#777777',
  rowHov:   'rgba(217,119,87,0.04)',
};

const FONT_URL = "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Inter:wght@400;500&display=swap";

// ── MetricCard ────────────────────────────────────────────────────────────────
function MetricCard({ label, value, sub }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: T.card,
        border: `1px solid ${hov ? T.accent : T.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'default',
        boxShadow: hov ? '0 4px 20px rgba(217,119,87,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      }}
    >
      {/* Accent top bar */}
      <div style={{ height: 3, background: T.accent, opacity: hov ? 1 : 0.35, transition: 'opacity 0.2s ease' }}/>
      <div style={{ padding: '18px 22px 20px' }}>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          color: T.textLbl,
          lineHeight: 1,
          marginBottom: 10,
        }}>
          {label}
        </div>
        <div style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 26,
          fontWeight: 600,
          color: T.textPri,
          lineHeight: 1.1,
          letterSpacing: '-0.3px',
          marginBottom: 6,
        }}>
          {value}
        </div>
        <div style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: 12,
          color: T.textSub,
          lineHeight: 1,
        }}>
          {sub}
        </div>
      </div>
    </div>
  );
}

// ── SectionCard ───────────────────────────────────────────────────────────────
function SectionCard({ title, children, minH = 220 }) {
  return (
    <div style={{
      background: T.card,
      border: `1px solid ${T.border}`,
      borderRadius: 12,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      minHeight: minH,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ height: 3, background: T.accent }}/>
      <div style={{
        padding: '14px 20px 12px',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <span style={{
          fontFamily: 'Poppins, sans-serif',
          fontSize: 12,
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: '1px',
          color: '#444444',
        }}>
          {title}
        </span>
      </div>
      <div style={{ flex: 1, padding: '0 20px 20px' }}>
        {children}
      </div>
    </div>
  );
}

// ── Empty ─────────────────────────────────────────────────────────────────────
function Empty({ text }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 120,
      fontFamily: 'Inter, sans-serif',
      fontSize: 13,
      color: T.textEmp,
    }}>
      {text}
    </div>
  );
}

// ── BillRow ───────────────────────────────────────────────────────────────────
function BillRow({ bill }) {
  const [hov, setHov] = useState(false);
  const over = isOverdue(bill.due, bill.status);
  const days = daysUntil(bill.due);
  let sub = `Venc. ${fmtDate(bill.due)}`;
  if (over)                                        sub = `Venceu há ${Math.abs(days)}d`;
  else if (bill.status === 'pending' && days === 0) sub = 'Vence hoje';
  else if (bill.status === 'pending' && days <= 3)  sub = `Vence em ${days}d`;

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '11px 0',
        borderBottom: `1px solid ${T.border}`,
        background: hov ? T.rowHov : 'transparent',
        transition: 'background 0.15s',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {bill.supplier}
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: T.textSub, marginTop: 3 }}>
          {sub}
        </div>
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: T.textPri, whiteSpace: 'nowrap', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {fmt(bill.value)}
      </div>
    </div>
  );
}

// ── LancRow ───────────────────────────────────────────────────────────────────
function LancRow({ lanc }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '11px 0',
        borderBottom: `1px solid ${T.border}`,
        background: hov ? T.rowHov : 'transparent',
        transition: 'background 0.15s',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {lanc.supplier || '—'}
        </div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: T.textSub, marginTop: 3 }}>
          {[lanc.gestor, lanc.soldate ? fmtDate(lanc.soldate) : null].filter(Boolean).join(' · ')}
        </div>
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: T.textPri, whiteSpace: 'nowrap', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {fmt(lanc.value)}
      </div>
    </div>
  );
}

// ── CCRow ─────────────────────────────────────────────────────────────────────
function CCRow({ name, count, total }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '11px 0',
        borderBottom: `1px solid ${T.border}`,
        background: hov ? T.rowHov : 'transparent',
        transition: 'background 0.15s',
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: T.textPri, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: T.textSub, marginTop: 3 }}>{count} lançamento{count !== 1 ? 's' : ''}</div>
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, fontWeight: 500, color: T.textPri, whiteSpace: 'nowrap', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
        {fmt(total)}
      </div>
    </div>
  );
}

// ── HomePage ──────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { state } = useApp();
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [editId, setEditId]              = useState(null);
  const [pagarModalOpen, setPagarModalOpen] = useState(false);
  const [pagarBillId, setPagarBillId]    = useState(null);
  const [btnHov, setBtnHov]              = useState(false);
  const [dateStr, setDateStr]            = useState('');

  useEffect(() => {
    setDateStr(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  const { bills, lancamentos, tvoRegistros, bases } = state;
  const pending  = bills.filter(b => b.status === 'pending');
  const overdue  = pending.filter(b => isOverdue(b.due, b.status)).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 8);
  const upcoming = pending.filter(b => !isOverdue(b.due, b.status)).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 8);

  const totalLanc    = lancamentos.reduce((s, l) => s + l.value, 0);
  const totalPend    = pending.reduce((s, b) => s + b.value, 0);
  const totalTvo     = tvoRegistros.reduce((s, r) => s + r.value, 0);
  const totalConting = bills.reduce((s, b) => s + (b.conting || 0), 0);
  const activeBases  = bases.filter(b => !b.desmobilizado);

  const ccMap = {};
  pending.forEach(b => {
    if (!b.base) return;
    if (!ccMap[b.base]) ccMap[b.base] = { val: 0, count: 0 };
    ccMap[b.base].val += b.value;
    ccMap[b.base].count++;
  });
  const ccEntries = Object.entries(ccMap).sort((a, b) => b[1].val - a[1].val).slice(0, 8);
  const recentLanc = [...lancamentos].reverse().slice(0, 8);

  const CARDS_LEFT = [
    { label: 'Total de Lançamentos',    value: fmt(totalLanc),    sub: `${lancamentos.length} registros` },
    { label: 'Total de Pendências',     value: fmt(totalPend),    sub: `${pending.length} contas` },
    { label: 'Valor Total TVO',         value: fmt(totalTvo),     sub: `${tvoRegistros.length} conta${tvoRegistros.length !== 1 ? 's' : ''}` },
  ];
  const CARDS_RIGHT = [
    { label: 'Valor Total Contingência', value: fmt(totalConting), sub: `${bills.filter(b => b.conting).length} conta${bills.filter(b => b.conting).length !== 1 ? 's' : ''}` },
    { label: 'Centros de Custo',         value: bases.length,      sub: `${activeBases.length} ativos` },
    { label: 'Lançamentos',              value: lancamentos.length, sub: `${lancamentos.length} lançamentos` },
  ];

  const G = 16;   // gap entre cards
  const S = 20;   // gap entre seções

  return (
    <>
      <style>{`@import url('${FONT_URL}'); body { background: ${T.bg} !important; }`}</style>

      <div style={{ fontFamily: 'Inter, sans-serif', paddingBottom: 60, background: T.bg }}>

        {/* ── TÍTULO ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={{
            fontFamily: 'Poppins, sans-serif',
            fontSize: 24,
            fontWeight: 600,
            color: T.textPri,
            margin: 0,
            letterSpacing: '-0.3px',
            lineHeight: 1.2,
          }}>
            Página Inicial
          </h1>
          {dateStr && (
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 13,
              color: T.textSec,
              margin: '6px 0 0',
              textTransform: 'capitalize',
            }}>
              {dateStr}
            </p>
          )}
        </div>

        {/* ── SEÇÃO 1: 6 CARDS ────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S, marginBottom: S }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: G }}>
            {CARDS_LEFT.map(c => <MetricCard key={c.label} label={c.label} value={c.value} sub={c.sub}/>)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: G }}>
            {CARDS_RIGHT.map(c => <MetricCard key={c.label} label={c.label} value={c.value} sub={c.sub}/>)}
          </div>
        </div>

        {/* ── SEÇÃO 2: PRÓXIMAS / VENCIDAS ────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S, marginBottom: S }}>
          <SectionCard title="Próximas a Vencer" minH={220}>
            {upcoming.length > 0
              ? upcoming.map(b => <BillRow key={b.id} bill={b}/>)
              : <Empty text="Sem contas próximas a vencer"/>
            }
          </SectionCard>
          <SectionCard title="Vencidas" minH={220}>
            {overdue.length > 0
              ? overdue.map(b => <BillRow key={b.id} bill={b}/>)
              : <Empty text="Nenhuma conta vencida"/>
            }
          </SectionCard>
        </div>

        {/* ── SEÇÃO 3: LANÇAMENTOS / CC ───────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: S, marginBottom: S }}>
          <SectionCard title="Últimos Lançamentos" minH={220}>
            {recentLanc.length > 0
              ? recentLanc.map(l => <LancRow key={l.id} lanc={l}/>)
              : <Empty text="Sem lançamentos"/>
            }
          </SectionCard>
          <SectionCard title="Resumo por Centro de Custo (Pendente)" minH={220}>
            {ccEntries.length > 0
              ? ccEntries.map(([name, { val, count }]) => <CCRow key={name} name={name} count={count} total={val}/>)
              : <Empty text="Sem dados de centros de custo"/>
            }
          </SectionCard>
        </div>

        {/* ── BOTÃO GERAR RELATÓRIO ────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 36 }}>
          <button
            onMouseEnter={() => setBtnHov(true)}
            onMouseLeave={() => setBtnHov(false)}
            style={{
              fontFamily: 'Poppins, sans-serif',
              fontSize: 13,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '2px',
              color: '#ffffff',
              background: btnHov ? T.accentHov : T.accent,
              border: 'none',
              borderRadius: 8,
              padding: '14px 56px',
              cursor: 'pointer',
              boxShadow: btnHov ? '0 4px 16px rgba(217,119,87,0.35)' : '0 2px 8px rgba(217,119,87,0.2)',
              transition: 'background 0.2s ease, box-shadow 0.2s ease',
              whiteSpace: 'nowrap',
            }}
          >
            Gerar Relatório
          </button>
        </div>

      </div>

      <BillModal open={billModalOpen} onClose={() => { setBillModalOpen(false); setEditId(null); }} editId={editId}/>
      <PagarModal open={pagarModalOpen} onClose={() => { setPagarModalOpen(false); setPagarBillId(null); }} billId={pagarBillId}/>
    </>
  );
}
