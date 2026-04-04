'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import BillRow from '@/components/BillRow';
import BillModal from '@/components/BillModal';
import PagarModal from '@/components/PagarModal';
import ConfirmModal from '@/components/ConfirmModal';
import { isOverdue, MONTH_NAMES } from '@/lib/utils';

const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'pending', label: 'Pendentes' },
  { key: 'paid', label: 'Pagos' },
  { key: 'overdue', label: 'Vencidos' },
];

export default function ContasListaPage() {
  const { state, dispatch } = useApp();
  const [filter, setFilter] = useState('all');
  const [yearF, setYearF] = useState('');
  const [monthF, setMonthF] = useState('');
  const [baseF, setBaseF] = useState('');
  const [catF, setCatF] = useState('');

  const [billModalOpen, setBillModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [pagarModalOpen, setPagarModalOpen] = useState(false);
  const [pagarBillId, setPagarBillId] = useState(null);
  const [confirmCfg, setConfirmCfg] = useState({ isOpen: false, message: '', onConfirm: null });

  const { bills, bases, cats } = state;

  // Build filter options
  const years = [...new Set(bills.map(b => b.due?.slice(0, 4)).filter(Boolean))].sort();
  const months = [...new Set(bills.filter(b => !yearF || b.due?.slice(0, 4) === yearF).map(b => b.due?.slice(5, 7)).filter(Boolean))].sort();

  let list = [...bills];
  if (filter === 'pending') list = list.filter(b => b.status === 'pending' && !isOverdue(b.due, b.status));
  if (filter === 'paid')    list = list.filter(b => b.status === 'paid');
  if (filter === 'overdue') list = list.filter(b => isOverdue(b.due, b.status));
  if (yearF)  list = list.filter(b => b.due?.slice(0, 4) === yearF);
  if (monthF) list = list.filter(b => b.due?.slice(5, 7) === monthF);
  if (baseF)  list = list.filter(b => b.base === baseF);
  if (catF)   list = list.filter(b => b.cat === catF);
  list.sort((a, b) => a.due?.localeCompare(b.due));

  function handleToggle(id) {
    const b = bills.find(x => x.id === id);
    if (!b) return;
    if (b.status === 'paid') dispatch({ type: 'UPDATE_BILL', payload: { ...b, status: 'pending' } });
    else { setPagarBillId(id); setPagarModalOpen(true); }
  }
  function handleEdit(id) { setEditId(id); setIsReadOnly(false); setBillModalOpen(true); }
  function handleView(id) { setEditId(id); setIsReadOnly(true); setBillModalOpen(true); }
  function handleDelete(id) {
    setConfirmCfg({
      isOpen: true,
      message: 'Excluir este lançamento?',
      onConfirm: () => dispatch({ type: 'DELETE_BILL', payload: id })
    });
  }

  const selStyle = { padding: '5px 10px', fontSize: 13, borderRadius: 20, border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--text2)', fontFamily: 'inherit', cursor: 'pointer', width: 'auto' };
  const labelStyle = { fontSize: 12, color: 'var(--text3)' };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Lançamentos</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Todos os seus registros</div>
        </div>
        <button onClick={() => { setEditId(null); setIsReadOnly(false); setBillModalOpen(true); }} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>
          + Novo lançamento
        </button>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            padding: '6px 14px', fontSize: 13, fontFamily: 'inherit', borderRadius: 20,
            border: '1px solid var(--border2)', background: filter === t.key ? '#e8e4df' : 'transparent',
            cursor: 'pointer', color: filter === t.key ? '#111' : 'var(--text2)', transition: 'all 0.15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Date + base + cat filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={labelStyle}>Ano:</span>
        <select value={yearF} onChange={e => setYearF(e.target.value)} style={selStyle}>
          <option value="">Todos</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span style={labelStyle}>Mês:</span>
        <select value={monthF} onChange={e => setMonthF(e.target.value)} style={selStyle}>
          <option value="">Todos</option>
          {months.map(m => <option key={m} value={m}>{MONTH_NAMES[parseInt(m) - 1]}</option>)}
        </select>
        <span style={labelStyle}>Base:</span>
        <select value={baseF} onChange={e => setBaseF(e.target.value)} style={selStyle}>
          <option value="">Todas</option>
          {bases.map(b => <option key={b.nome} value={b.nome}>{b.nome}</option>)}
        </select>
        <span style={labelStyle}>Categoria:</span>
        <select value={catF} onChange={e => setCatF(e.target.value)} style={selStyle}>
          <option value="">Todas</option>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* List */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '0 1.5rem' }}>
        {list.length > 0
          ? list.map(b => <BillRow key={b.id} bill={b} onToggle={handleToggle} onEdit={handleEdit} onDelete={handleDelete} onView={handleView}/>)
          : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text3)', fontSize: 14 }}>
              <div style={{ fontSize: 32, marginBottom: '0.75rem', color: '#cccccc' }}>📋</div>
              Nenhum lançamento encontrado
            </div>
          )
        }
      </div>

      <BillModal open={billModalOpen} onClose={() => { setBillModalOpen(false); setEditId(null); }} editId={editId} readOnly={isReadOnly}/>
      <PagarModal open={pagarModalOpen} onClose={() => { setPagarModalOpen(false); setPagarBillId(null); }} billId={pagarBillId}/>
      
      <ConfirmModal 
        isOpen={confirmCfg.isOpen}
        message={confirmCfg.message}
        onConfirm={confirmCfg.onConfirm}
        onCancel={() => setConfirmCfg(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
