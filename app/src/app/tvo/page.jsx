'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { fmt, fmtDate } from '@/lib/utils';
import { TvoRegModal } from './lista/page';

export default function TvoPage() {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState('tvo');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmCfg, setConfirmCfg] = useState({ isOpen: false, message: '', onConfirm: null });
  const [novoRegModalOpen, setNovoRegModalOpen] = useState(false);

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
    setConfirmCfg({
      isOpen: true,
      message: 'Excluir este lançamento?',
      onConfirm: () => dispatch({ type: 'DELETE_TVO_BILL', payload: id })
    });
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

  /* ── estilos reutilizáveis ── */
  const ACCENT = 'var(--nav-orange, #d97757)';
  const thStyle = {
    background: ACCENT, color: '#ffffff',
    fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '1px',
    padding: '12px 10px', whiteSpace: 'nowrap', textAlign: 'left',
  };

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>TVO e Contingência</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#777777', marginTop: 4 }}>Lançamentos aguardando aprovação orçamentária</div>
        </div>
        <button
          onClick={() => setNovoRegModalOpen(true)}
          style={{
            padding: '9px 20px', fontSize: 14, fontFamily: 'inherit',
            borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500,
            background: 'var(--accent)', color: '#fff', border: 'none',
          }}
        >
          + Novo registro
        </button>
      </div>

      {/* ── Abas pill ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[['tvo', 'TVO Pendente'], ['aguardando', 'Aguardando confirmação']].map(([k, label]) => {
          const active = tab === k;
          return (
            <button
              key={k}
              onClick={() => setTab(k)}
              style={{
                padding: '6px 16px', fontSize: 13,
                fontFamily: 'Poppins, sans-serif', fontWeight: 500,
                borderRadius: 20, cursor: 'pointer', transition: 'all 0.15s',
                border: `1.5px solid ${active ? ACCENT : '#e8e8e5'}`,
                background: active ? ACCENT : 'transparent',
                color: active ? '#ffffff' : '#555555',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── Tabela ── */}
      <div style={{ border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="orcamento-table" style={{ minWidth: 700, width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Fornecedor', 'Vencimento', 'Emissão', 'Base / CC', 'Categoria', 'Valor', 'Ações'].map(h => (
                  <th key={h} style={{ ...thStyle, width: h === 'Ações' ? 200 : undefined }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#777777', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                      <div style={{ fontSize: 32, marginBottom: '0.75rem', color: '#cccccc' }}>
                        {tab === 'tvo' ? '✓' : '📋'}
                      </div>
                      {tab === 'tvo' ? 'Nenhum TVO pendente' : 'Nenhum lançamento aguardando confirmação'}
                    </div>
                  </td>
                </tr>
              ) : list.map((b, idx) => {
                const isAguardando = tab === 'aguardando';
                const rowBg = idx % 2 === 0 ? 'var(--surface)' : 'var(--bg)';
                return (
                  <tr key={b.id} style={{ background: rowBg, borderBottom: '1px solid var(--border)', height: 52 }}>
                    <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333', padding: '0 10px', maxWidth: 200 }}>
                      <div style={{ fontWeight: 500 }}>{b.supplier}</div>
                      {isAguardando && <div style={{ fontSize: 11, color: 'var(--warning)', fontWeight: 500, marginTop: 2 }}>TVO aprovado</div>}
                    </td>
                    <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333', padding: '0 10px', whiteSpace: 'nowrap' }}>
                      {b.due ? fmtDate(b.due) : '—'}
                    </td>
                    <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333', padding: '0 10px', whiteSpace: 'nowrap' }}>
                      {b.emission ? fmtDate(b.emission) : '—'}
                    </td>
                    <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333', padding: '0 10px' }}>
                      {b.base
                        ? <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--info)', background: 'var(--info-light)', borderRadius: 4, padding: '2px 7px' }}>{b.base}</span>
                        : <span style={{ color: '#aaa' }}>—</span>}
                    </td>
                    <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333', padding: '0 10px' }}>
                      {b.cat
                        ? <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: ACCENT, background: '#fff4ef', border: `1px solid ${ACCENT}`, borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' }}>{b.cat}</span>
                        : <span style={{ color: '#aaa' }}>—</span>}
                    </td>
                    <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333', padding: '0 10px', fontWeight: 500, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
                      {fmt(b.value)}
                    </td>
                    <td style={{ padding: '0 10px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {!isAguardando && (
                          <button onClick={() => handleAction(b.id, 'concluido')} style={{ padding: '4px 10px', fontSize: 12, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 600, background: ACCENT, color: '#fff', border: 'none', whiteSpace: 'nowrap' }}>
                            TVO Concluído
                          </button>
                        )}
                        {isAguardando && (
                          <>
                            <button onClick={() => handleAction(b.id, 'edit')} style={{ padding: '4px 10px', fontSize: 12, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: '#555', border: '1px solid #ccc' }}>
                              Editar
                            </button>
                            <button onClick={() => handleAction(b.id, 'confirmar')} style={{ padding: '4px 10px', fontSize: 12, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 600, background: ACCENT, color: '#fff', border: 'none', whiteSpace: 'nowrap' }}>
                              Confirmar
                            </button>
                          </>
                        )}
                        <button onClick={() => handleDelete(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cc4444', fontSize: 14, padding: 4, lineHeight: 1 }}>✕</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal edição ── */}
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

      <ConfirmModal
        isOpen={confirmCfg.isOpen}
        message={confirmCfg.message}
        onConfirm={confirmCfg.onConfirm}
        onCancel={() => setConfirmCfg(prev => ({ ...prev, isOpen: false }))}
      />

      <TvoRegModal
        open={novoRegModalOpen}
        onClose={() => setNovoRegModalOpen(false)}
        editId={null}
      />
    </div>
  );
}
