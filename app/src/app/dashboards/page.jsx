'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { MONTH_NAMES } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const T = {
  bg:      '#ffffff',
  card:    '#f7f7f5',
  border:  '#e8e8e5',
  accent:  '#d97757',
  text:    '#1a1a1a',
  text2:   '#555555',
  text3:   '#888888',
};

const YEARS = Array.from({ length: 5 }, (_, i) => String(new Date().getFullYear() - 2 + i));
const now   = new Date();

function pill(active, onClick, label) {
  return (
    <button key={label} onClick={onClick} style={{
      padding: '6px 16px', fontSize: 12, fontFamily: 'Poppins, sans-serif',
      fontWeight: 500, borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
      background: active ? T.accent : 'transparent',
      color: active ? '#fff' : T.text2,
      border: `1px solid ${active ? T.accent : T.border}`,
    }}>{label}</button>
  );
}

function Card({ children, style }) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderRadius: 12, overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)', ...style,
    }}>
      <div style={{ height: 3, background: T.accent }}/>
      {children}
    </div>
  );
}

function CardTitle({ children }) {
  return (
    <div style={{ padding: '14px 20px 10px', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 600,
        textTransform: 'uppercase', letterSpacing: '1px', color: '#444' }}>
        {children}
      </span>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', border: `1px solid ${T.border}`, borderRadius: 8,
      padding: '8px 14px', fontFamily: 'Inter, sans-serif', fontSize: 12,
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <div style={{ fontWeight: 600, color: T.text, marginBottom: 2 }}>{label}</div>
      <div style={{ color: T.accent, fontWeight: 500 }}>
        {payload[0].value} lançamento{payload[0].value !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default function DashboardsPage() {
  const { state } = useApp();
  const { lancamentos } = state;

  const [year,  setYear]  = useState(String(now.getFullYear()));
  const [month, setMonth] = useState(String(now.getMonth() + 1).padStart(2, '0'));

  const filtered = useMemo(() => lancamentos.filter(l => {
    if (!l.soldate) return false;
    return l.soldate.slice(0, 4) === year && l.soldate.slice(5, 7) === month;
  }), [lancamentos, year, month]);

  const byGestor = useMemo(() => {
    const map = {};
    filtered.forEach(l => { const g = l.gestor || 'Sem gestor'; map[g] = (map[g] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const byBase = useMemo(() => {
    const map = {};
    filtered.forEach(l => { const b = l.ccpgto || 'Sem base'; map[b] = (map[b] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const monthLabel = MONTH_NAMES[parseInt(month) - 1];

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', paddingBottom: 60, background: T.bg }}>

      {/* Título */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600,
          color: T.text, letterSpacing: '-0.3px', lineHeight: 1.2 }}>
          Dashboards
        </div>
        <div style={{ fontSize: 13, color: T.text3, marginTop: 4 }}>
          Visão analítica de lançamentos
        </div>
      </div>

      {/* Filtros */}
      <Card style={{ marginBottom: 24 }}>
        <CardTitle>Período</CardTitle>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: T.text2, fontFamily: 'Poppins, sans-serif', minWidth: 36 }}>Ano</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {YEARS.map(y => pill(year === y, () => setYear(y), y))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: T.text2, fontFamily: 'Poppins, sans-serif', minWidth: 36 }}>Mês</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {MONTH_NAMES.map((m, i) => {
                const val = String(i + 1).padStart(2, '0');
                return pill(month === val, () => setMonth(val), m);
              })}
            </div>
          </div>
        </div>
      </Card>

      {/* Total */}
      <div style={{ marginBottom: 24 }}>
        <Card>
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#fff4ef',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="22" height="22" fill="none" stroke={T.accent} strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, textTransform: 'uppercase',
                letterSpacing: '1.5px', color: T.text2, marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>
                Lançamentos em {monthLabel} / {year}
              </div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 36, fontWeight: 700,
                color: T.text, lineHeight: 1, letterSpacing: '-0.5px' }}>
                {filtered.length}
              </div>
              <div style={{ fontSize: 12, color: T.text3, marginTop: 4 }}>
                {filtered.length === 0
                  ? 'Nenhum lançamento no período'
                  : `registro${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Por Gestor */}
        <Card>
          <CardTitle>Por Gestor — {monthLabel} {year}</CardTitle>
          <div style={{ padding: '16px 8px 16px 0' }}>
            {byGestor.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 180, fontSize: 13, color: T.text3 }}>
                Sem dados no período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(180, byGestor.length * 44)}>
                <BarChart data={byGestor} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={T.border}/>
                  <XAxis type="number" allowDecimals={false}
                    tick={{ fontSize: 11, fill: T.text3, fontFamily: 'Inter, sans-serif' }}
                    axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={110}
                    tick={{ fontSize: 11, fill: T.text2, fontFamily: 'Inter, sans-serif' }}
                    axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>} cursor={{ fill: 'rgba(217,119,87,0.06)' }}/>
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {byGestor.map((_, i) => <Cell key={i} fill={T.accent}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Por Base */}
        <Card>
          <CardTitle>Por Base — {monthLabel} {year}</CardTitle>
          <div style={{ padding: '16px 8px 16px 0' }}>
            {byBase.length === 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 180, fontSize: 13, color: T.text3 }}>
                Sem dados no período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(180, byBase.length * 44)}>
                <BarChart data={byBase} layout="vertical" margin={{ left: 8, right: 32, top: 4, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={T.border}/>
                  <XAxis type="number" allowDecimals={false}
                    tick={{ fontSize: 11, fill: T.text3, fontFamily: 'Inter, sans-serif' }}
                    axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={160}
                    tick={{ fontSize: 10, fill: T.text2, fontFamily: 'Inter, sans-serif' }}
                    axisLine={false} tickLine={false}/>
                  <Tooltip content={<CustomTooltip/>} cursor={{ fill: 'rgba(217,119,87,0.06)' }}/>
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {byBase.map((_, i) => <Cell key={i} fill={T.accent}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
