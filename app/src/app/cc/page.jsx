'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { fmtDate, todayISO, thisMonthISO, MONTH_NAMES } from '@/lib/utils';

function CcModal({ open, onClose, editIdx }) {
  const { state, dispatch } = useApp();
  const isEdit = editIdx !== null && editIdx !== undefined;
  const base = isEdit ? state.bases[editIdx] : null;

  const [form, setForm] = useState({ nome: base?.nome || '', gestor: base?.gestor || '', data: base?.data || todayISO(), mes: base?.mes || thisMonthISO() });

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleSave() {
    if (!form.nome.trim()) { alert('Informe o nome do centro de custo.'); return; }
    const obj = {
      id: isEdit ? base.id : Date.now(),
      nome: form.nome, gestor: form.gestor, data: form.data,
      mes: form.mes, desmobilizado: isEdit ? base.desmobilizado : false,
    };
    if (isEdit) dispatch({ type: 'UPDATE_BASE', idx: editIdx, payload: obj });
    else {
      if (state.bases.find(b => b.nome === form.nome)) { alert('Já existe um centro de custo com esse nome.'); return; }
      dispatch({ type: 'ADD_BASE', payload: obj });
    }
    onClose?.();
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar centro de custo' : 'Novo centro de custo'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Nome *</label>
          <input value={form.nome} onChange={e => setF('nome', e.target.value)} placeholder="Ex: BA - CAMPO DE MARTE"/>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Gestor</label>
          <select value={form.gestor} onChange={e => setF('gestor', e.target.value)}>
            <option value="">Selecione...</option>
            {state.gestores.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Data de cadastro</label>
            <input type="date" value={form.data} onChange={e => setF('data', e.target.value)}/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Mês de referência</label>
            <input type="month" value={form.mes} onChange={e => setF('mes', e.target.value)}/>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
        <button onClick={onClose} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' }}>Cancelar</button>
        <button onClick={handleSave} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>
          {isEdit ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </Modal>
  );
}

export default function CcPage() {
  const { state, dispatch } = useApp();
  const [statusF, setStatusF] = useState('todos');
  const [mesF, setMesF] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [confirmCfg, setConfirmCfg] = useState({ isOpen: false, message: '', onConfirm: null });

  const { bases } = state;

  // Month options
  const meses = [...new Set(bases.map(b => b.mes).filter(Boolean))].sort();

  let list = [...bases];
  if (statusF === 'ativo') list = list.filter(b => !b.desmobilizado);
  if (statusF === 'desmobilizado') list = list.filter(b => b.desmobilizado);
  if (mesF) list = list.filter(b => b.mes === mesF);

  function toggleSelect(nome) {
    setSelected(s => { const n = new Set(s); n.has(nome) ? n.delete(nome) : n.add(nome); return n; });
  }
  function deleteSelected() {
    if (!selected.size) return;
    setConfirmCfg({
      isOpen: true,
      message: `Remover ${selected.size} centro(s) de custo?`,
      onConfirm: () => {
        dispatch({ type: 'DELETE_BASES', payload: selected });
        setBulkMode(false);
        setSelected(new Set());
      }
    });
  }

  function deleteBase(idx) {
    setConfirmCfg({
      isOpen: true,
      message: `Remover "${bases[idx].nome}"?`,
      onConfirm: () => dispatch({ type: 'DELETE_BASE', idx })
    });
  }

  function toggleDesmob(idx) {
    const b = bases[idx];
    dispatch({ type: 'UPDATE_BASE', idx, payload: { ...b, desmobilizado: !b.desmobilizado } });
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Centro de Custo</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#777777', marginTop: 4 }}>Acompanhamento mensal dos centros de custo</div>
        </div>
        <button onClick={() => { setEditIdx(null); setModalOpen(true); }} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>
          + Novo centro de custo
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {[['todos','Todos'],['ativo','Ativos'],['desmobilizado','Desmobilizados']].map(([k, label]) => (
          <button key={k} onClick={() => setStatusF(k)} style={{ padding: '6px 14px', fontSize: 13, fontFamily: 'inherit', borderRadius: 20, border: '1px solid var(--border2)', background: statusF === k ? '#e8e4df' : 'transparent', cursor: 'pointer', color: statusF === k ? '#111' : 'var(--text2)', transition: 'all 0.15s' }}>
            {label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto' }}></span>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Mês/Ano:</span>
        <select value={mesF} onChange={e => setMesF(e.target.value)} style={{ padding: '5px 10px', fontSize: 13, borderRadius: 20, border: '1px solid var(--border2)', background: 'var(--surface)', color: 'var(--text2)', fontFamily: 'inherit', width: 'auto' }}>
          <option value="">Todos</option>
          {meses.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Bulk */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.5rem' }}>
        {!bulkMode ? (
          <button onClick={() => setBulkMode(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            Selecionar para excluir
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--warning)' }}>{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
            <button onClick={deleteSelected} style={{ padding: '5px 11px', fontSize: 12, background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Excluir</button>
            <button onClick={() => { setBulkMode(false); setSelected(new Set()); }} style={{ padding: '5px 11px', fontSize: 12, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--surface)', marginBottom: '1.5rem' }}>
        <table className="orcamento-table" style={{ minWidth: 600 }}>
          <thead>
            <tr>
              {bulkMode && <th style={{ width: 32 }}></th>}
              <th>Centro de custo</th>
              <th>Gestor</th>
              <th>Data de cadastro</th>
              <th>Mês de referência</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#777777', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                <div style={{ fontSize: 28, marginBottom: 8, color: '#cccccc' }}>🏢</div>Nenhum centro de custo
              </td></tr>
            )}
            {list.map((b) => {
              const idx = bases.findIndex(x => x.id === b.id);
              return (
                <tr key={b.id} onClick={() => bulkMode && toggleSelect(b.nome)} style={{ cursor: bulkMode ? 'pointer' : 'default' }}>
                  {bulkMode && <td><input type="checkbox" checked={selected.has(b.nome)} onChange={() => toggleSelect(b.nome)} onClick={e => e.stopPropagation()} style={{ width: 15, height: 15, accentColor: 'var(--accent)', padding: 0, border: 'none' }}/></td>}
                  <td style={{ fontWeight: 500 }}>{b.nome}</td>
                  <td>{b.gestor || '—'}</td>
                  <td>{b.data ? fmtDate(b.data) : '—'}</td>
                  <td>{b.mes || '—'}</td>
                  <td>
                    <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, fontWeight: 500, background: b.desmobilizado ? 'var(--danger-light)' : 'var(--accent-light)', color: b.desmobilizado ? 'var(--danger)' : 'var(--accent-text)' }}>
                      {b.desmobilizado ? 'Desmobilizado' : 'Ativo'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => toggleDesmob(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 11, padding: '3px 6px', borderRadius: 'var(--radius)', fontFamily: 'inherit' }} title={b.desmobilizado ? 'Reativar' : 'Desmobilizar'}>
                        {b.desmobilizado ? '↩' : '✕ Desm.'}
                      </button>
                      <button onClick={() => { setEditIdx(idx); setModalOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nav-orange)', padding: 4 }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => deleteBase(idx)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 12, padding: 4 }}>✕</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <CcModal open={modalOpen} onClose={() => { setModalOpen(false); setEditIdx(null); }} editIdx={editIdx}/>
      
      <ConfirmModal 
        isOpen={confirmCfg.isOpen}
        message={confirmCfg.message}
        onConfirm={confirmCfg.onConfirm}
        onCancel={() => setConfirmCfg(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
