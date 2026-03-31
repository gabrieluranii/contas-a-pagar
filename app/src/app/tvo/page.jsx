'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/Modal';
import { fmt, fmtDate, isOverdue, daysUntil, LAUNCH_DAYS } from '@/lib/utils';

function TvoCard({ b, onAction, onDelete, mode }) {
  const isAguardando = mode === 'aguardando';
  return (
    <div style={{
      background: isAguardando ? 'var(--warning-light)' : 'var(--surface)',
      border: `1px solid ${isAguardando ? '#4a3810' : 'var(--border)'}`,
      borderRadius: 'var(--radius-lg)', padding: '1.25rem 1.5rem', marginBottom: '1rem',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: '0.75rem' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{b.supplier}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span>Venc. {fmtDate(b.due)}</span>
            {b.emission && <span>Emissão: {fmtDate(b.emission)}</span>}
            {b.base && <span style={{ background: 'var(--info-light)', color: 'var(--info)', fontSize: 11, padding: '2px 7px', borderRadius: 20 }}>{b.base}</span>}
            {b.cat  && <span style={{ background: 'var(--surface2)', color: 'var(--text2)', fontSize: 11, padding: '2px 7px', borderRadius: 20, border: '1px solid var(--border)' }}>{b.cat}</span>}
            {isAguardando && <span style={{ color: 'var(--warning)', fontWeight: 500 }}>TVO aprovado</span>}
          </div>
        </div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 18, color: 'var(--text)', whiteSpace: 'nowrap' }}>{fmt(b.value)}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {!isAguardando && (
          <button onClick={() => onAction(b.id, 'concluido')} style={{ padding: '5px 14px', fontSize: 13, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>
            TVO Concluído
          </button>
        )}
        {isAguardando && (
          <>
            <button onClick={() => onAction(b.id, 'edit')} style={{ padding: '5px 14px', fontSize: 13, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' }}>
              Editar
            </button>
            <button onClick={() => onAction(b.id, 'confirmar')} style={{ padding: '5px 14px', fontSize: 13, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>
              Confirmar lançamento
            </button>
          </>
        )}
        <button onClick={() => onDelete(b.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 13, padding: '5px 8px', borderRadius: 'var(--radius)', fontFamily: 'inherit' }}>
          🗑 Excluir
        </button>
      </div>
    </div>
  );
}

export default function TvoPage() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState('tvo');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { tvoBills, bases, cats } = state;
  const list = tvoBills.filter(b => tab === 'tvo' ? b.tvoStage === 'pending' : b.tvoStage === 'aguardando');

  function handleAction(id, action) {
    if (action === 'concluido') {
      const b = tvoBills.find(x => x.id === id);
      if (b) dispatch({ type: 'UPDATE_TVO_BILL', payload: { ...b, tvoStage: 'aguardando' } });
    } else if (action === 'edit') {
      const b = tvoBills.find(x => x.id === id);
      if (b) { setEditId(id); setEditForm({ supplier: b.supplier, value: b.value, emission: b.emission || '', due: b.due, status: b.status || 'pending', base: b.base || '', cat: b.cat || '' }); setEditModalOpen(true); }
    } else if (action === 'confirmar') {
      const b = tvoBills.find(x => x.id === id);
      if (b) { setEditId(id); setEditForm({ supplier: b.supplier, value: b.value, emission: b.emission || '', due: b.due, status: b.status || 'pending', base: b.base || '', cat: b.cat || '' }); setEditModalOpen(true); }
    }
  }

  function handleDelete(id) {
    if (!confirm('Excluir este lançamento?')) return;
    dispatch({ type: 'DELETE_TVO_BILL', payload: id });
  }

  function saveEdit() {
    const b = tvoBills.find(x => x.id === editId);
    if (!b) return;
    const updated = { ...b, supplier: editForm.supplier, value: parseFloat(editForm.value), emission: editForm.emission, due: editForm.due, status: editForm.status, base: editForm.base, cat: editForm.cat };
    dispatch({ type: 'UPDATE_TVO_BILL', payload: updated });
    setEditModalOpen(false);
  }

  function confirmLancamento() {
    const b = tvoBills.find(x => x.id === editId);
    if (!b) return;
    const { tvoStage, ...billData } = { ...b, supplier: editForm.supplier, value: parseFloat(editForm.value), emission: editForm.emission, due: editForm.due, status: editForm.status, base: editForm.base, cat: editForm.cat };
    dispatch({ type: 'ADD_BILL', payload: { ...billData, id: Date.now() } });
    dispatch({ type: 'DELETE_TVO_BILL', payload: editId });
    setEditModalOpen(false);
  }

  const activeBases = bases.filter(b => !b.desmobilizado);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>TVO e Contingência</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#777777', marginTop: 4 }}>Lançamentos aguardando aprovação orçamentária</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem' }}>
        {[['tvo','TVO Pendente'],['aguardando','Aguardando confirmação']].map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '6px 14px', fontSize: 13, fontFamily: 'inherit', borderRadius: 20, border: '1px solid var(--border2)', background: tab === k ? '#e8e4df' : 'transparent', cursor: 'pointer', color: tab === k ? '#111' : 'var(--text2)', transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>
      <div id="tvo-list">
        {list.length === 0
          ? <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#777777', fontFamily: 'Inter, sans-serif', fontSize: 13 }}><div style={{ fontSize: 32, marginBottom: '0.75rem', color: '#cccccc' }}>{tab === 'tvo' ? '✓' : '📋'}</div>{tab === 'tvo' ? 'Nenhum TVO pendente' : 'Nenhum lançamento aguardando confirmação'}</div>
          : list.map(b => <TvoCard key={b.id} b={b} onAction={handleAction} onDelete={handleDelete} mode={tab}/>)
        }
      </div>

      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Editar TVO">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[['supplier','Fornecedor','text'],['value','Valor','number'],['emission','Emissão','date'],['due','Vencimento','date']].map(([k, label, t]) => (
            <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>
              <input type={t} value={editForm[k] || ''} onChange={e => setEditForm(f => ({...f, [k]: e.target.value}))}/>
            </div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Status</label>
            <select value={editForm.status || 'pending'} onChange={e => setEditForm(f => ({...f, status: e.target.value}))}>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>CC</label>
            <select value={editForm.base || ''} onChange={e => setEditForm(f => ({...f, base: e.target.value}))}>
              <option value="">Sem base</option>
              {activeBases.map(b => <option key={b.nome} value={b.nome}>{b.nome}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Categoria</label>
            <select value={editForm.cat || ''} onChange={e => setEditForm(f => ({...f, cat: e.target.value}))}>
              <option value="">Sem categoria</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <button onClick={() => setEditModalOpen(false)} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' }}>Cancelar</button>
          <button onClick={saveEdit} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' }}>Salvar</button>
          <button onClick={confirmLancamento} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>Confirmar lançamento</button>
        </div>
      </Modal>
    </div>
  );
}
