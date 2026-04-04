'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { fmt, MONTH_NAMES, thisMonthISO } from '@/lib/utils';

export default function OrcamentoPage() {
  const { state, dispatch } = useApp();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ base: '', cat: '', value: '' });
  const [confirmCfg, setConfirmCfg] = useState({ isOpen: false, message: '', onConfirm: null });

  const selMonth = `${year}-${month}`;
  const rows = state.orcamentos.filter(o => o.month === selMonth);
  const yearOpts = [new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1, new Date().getFullYear() + 2];

  function getUsado(base, cat) {
    return state.bills.filter(b => b.base === base && b.cat === cat && b.due?.slice(0, 7) === selMonth).reduce((s, b) => s + b.value, 0);
  }

  function saveOrc() {
    if (!form.base || !form.cat || !parseFloat(form.value) || parseFloat(form.value) <= 0) { alert('Preencha todos os campos.'); return; }
    dispatch({ type: 'UPSERT_ORCAMENTO', payload: { base: form.base, cat: form.cat, month: selMonth, value: parseFloat(form.value) } });
    setModalOpen(false); setForm({ base: '', cat: '', value: '' });
  }

  function deleteOrc(base, cat, month) {
    setConfirmCfg({
      isOpen: true,
      message: 'Remover este orçamento?',
      onConfirm: () => dispatch({ type: 'DELETE_ORCAMENTO', base, cat, month })
    });
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Orçamento</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Saldo mensal por base e categoria</div>
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <select value={year} onChange={e => setYear(e.target.value)} style={{ padding: '7px 12px', fontSize: 13, borderRadius: 'var(--radius)', border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', width: 'auto' }}>
          {yearOpts.map(y => <option key={y} value={String(y)}>{y}</option>)}
        </select>
        <select value={month} onChange={e => setMonth(e.target.value)} style={{ padding: '7px 12px', fontSize: 13, borderRadius: 'var(--radius)', border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--text)', fontFamily: 'inherit', width: 'auto' }}>
          {MONTH_NAMES.map((m, i) => <option key={i} value={String(i + 1).padStart(2, '0')}>{m}</option>)}
        </select>
        <button onClick={() => setModalOpen(true)} style={{ padding: '7px 16px', fontSize: 13, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>
          + Definir orçamento
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', marginBottom: '1.5rem' }}>
        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text3)', fontSize: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 8, color: '#cccccc' }}>📊</div>
            Nenhum orçamento definido para este mês.<br/>
            <span style={{ fontSize: 12, marginTop: 4, display: 'block' }}>Clique em "Definir orçamento" para começar.</span>
          </div>
        ) : (
          <table className="orcamento-table">
            <thead>
              <tr>
                <th>Base</th><th>Categoria</th><th>Orçamento</th><th>Usado</th><th>Disponível</th><th>Período</th><th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(o => {
                const usado = getUsado(o.base, o.cat);
                const livre = o.value - usado;
                const pct = Math.min(100, Math.round(usado / o.value * 100));
                const barCls = pct >= 100 ? 'over' : pct >= 80 ? 'warn' : '';
                const infoCls = livre < 0 ? 'over' : livre < o.value * 0.2 ? 'warn' : '';
                return (
                  <tr key={`${o.base}||${o.cat}`}>
                    <td>{o.base || '—'}</td>
                    <td>{o.cat || '—'}</td>
                    <td>{fmt(o.value)}</td>
                    <td>{fmt(usado)}</td>
                    <td>
                      <div className="saldo-bar-wrap"><div className={`saldo-bar ${barCls}`} style={{ width: `${pct}%` }}></div></div>
                      <div style={{ fontSize: 12, marginTop: 3, color: infoCls === 'over' ? 'var(--danger)' : infoCls === 'warn' ? 'var(--warning)' : 'var(--text3)' }}>{fmt(livre)} livre ({pct}% usado)</div>
                    </td>
                    <td><span style={{ fontSize: 11, color: 'var(--text3)' }}>{o.month}</span></td>
                    <td><button onClick={() => deleteOrc(o.base, o.cat, o.month)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 12, padding: '3px 6px', borderRadius: 'var(--radius)', fontFamily: 'inherit' }}>✕</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Definir orçamento">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Base</label>
            <select value={form.base} onChange={e => setForm(f => ({...f, base: e.target.value}))}>
              <option value="">Selecione...</option>
              {state.bases.filter(b => !b.desmobilizado).map(b => <option key={b.nome} value={b.nome}>{b.nome}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Categoria</label>
            <select value={form.cat} onChange={e => setForm(f => ({...f, cat: e.target.value}))}>
              <option value="">Selecione...</option>
              {state.cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Valor (R$)</label>
            <input type="number" value={form.value} onChange={e => setForm(f => ({...f, value: e.target.value}))} placeholder="0,00"/>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
          <button onClick={() => setModalOpen(false)} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' }}>Cancelar</button>
          <button onClick={saveOrc} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>Salvar orçamento</button>
        </div>
      </Modal>

      <ConfirmModal 
        isOpen={confirmCfg.isOpen}
        message={confirmCfg.message}
        onConfirm={confirmCfg.onConfirm}
        onCancel={() => setConfirmCfg(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
