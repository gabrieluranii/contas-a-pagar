'use client';
import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { fmt, fmtDate, normalizeKey, parseExcelDate, parseMoneyValue, MONTH_NAMES, todayISO } from '@/lib/utils';

export function TvoRegModal({ open, onClose, editId }) {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState({
    gestor: '', fluig: '', soldate: todayISO(), value: '',
    tipo: 'TVO', produto: '', cc: '', origem: 'Manual',
    base: '', cat: '', obs: '',
  });

  useState(() => {
    if (!open) return;
    if (editId) {
      const r = state.tvoRegistros.find(x => x.id === editId);
      if (r) setForm({
        gestor: r.gestor || '', fluig: r.fluig || '',
        soldate: r.soldate || todayISO(), value: r.value || '',
        tipo: r.tipo || 'TVO', produto: r.produto || '',
        cc: r.cc || '', origem: r.origem || 'Manual',
        base: r.base || '', cat: r.cat || '', obs: r.obs || '',
      });
    } else {
      setForm({
        gestor: '', fluig: '', soldate: todayISO(), value: '',
        tipo: 'TVO', produto: '', cc: '', origem: 'Manual',
        base: '', cat: '', obs: '',
      });
    }
  });

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function handleSave() {
    const obj = {
      id: editId || Date.now(),
      gestor: form.gestor,
      fluig: form.fluig,
      soldate: form.soldate,
      value: parseFloat(form.value) || 0,
      tipo: form.tipo,
      produto: form.produto,
      cc: form.cc,
      origem: form.origem,
      base: form.base,
      cat: form.cat,
      obs: form.obs,
    };
    if (editId) dispatch({ type: 'UPDATE_TVO_REG', payload: obj });
    else dispatch({ type: 'ADD_TVO_REG', payload: obj });
    onClose?.();
  }

  const activeBases = state.bases.filter(b => !b.desmobilizado);

  return (
    <Modal open={open} onClose={onClose} title={editId ? 'Editar lançamento' : 'Novo lançamento TVO/Contingência'}>
      {/* Toggle TVO | Contingência */}
      <div style={{ display: 'flex', gap: 0, marginBottom: '1.25rem', borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border2)', width: 'fit-content' }}>
        {['TVO', 'Contingência'].map(opt => {
          const active = form.tipo === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => setF('tipo', opt)}
              style={{
                padding: '8px 20px',
                fontSize: 14,
                fontFamily: 'inherit',
                fontWeight: 600,
                cursor: 'pointer',
                background: active ? 'var(--accent)' : 'transparent',
                color: active ? '#fff' : 'var(--text2)',
                border: 'none',
                transition: 'background 0.15s',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { k:'fluig',    label:'Nº Fluig' },
          { k:'value',    label:'Valor (R$)',     type:'number' },
          { k:'base',     label:'Base',            type:'select', opts: activeBases.map(b => b.nome) },
          { k:'cat',      label:'Categoria',       type:'select', opts: state.cats },
          { k:'gestor',   label:'Gestor',          type:'select', opts: state.gestores },
          { k:'soldate',  label:'Data Solic.',     type:'date' },
        ].map(({ k, label, type, opts }) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{label}</label>
            {opts ? (
              <select value={form[k]} onChange={e => setF(k, e.target.value)}>
                <option value="">Selecione...</option>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={type || 'text'} value={form[k]} onChange={e => setF(k, e.target.value)}/>
            )}
          </div>
        ))}

        {/* Observação ocupa as 2 colunas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: '1 / -1' }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Observação</label>
          <textarea
            value={form.obs}
            onChange={e => setF('obs', e.target.value)}
            rows={3}
            style={{ resize: 'vertical', fontFamily: 'inherit', fontSize: 14 }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
        <button onClick={onClose} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' }}>Cancelar</button>
        <button onClick={handleSave} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>Salvar</button>
      </div>
    </Modal>
  );
}

const TVO_COL_MAP = {
  'gestor': 'gestor', 'nº fluig': 'fluig', 'fluig': 'fluig',
  'data solic': 'soldate', 'data solicitacao': 'soldate',
  'valor': 'value', 'tipo': 'tipo', 'tvo/contingencia': 'tipo',
  'produto': 'produto', 'centro de custo': 'cc', 'cc': 'cc',
  'base': 'base',
  'categoria': 'cat', 'cat': 'cat',
  'observacao': 'obs', 'observação': 'obs', 'obs': 'obs',
};

export default function TvoListaPage() {
  const { state, dispatch } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [importMsg, setImportMsg] = useState('');
  const importRef = useRef(null);
  const [confirmCfg, setConfirmCfg] = useState({ isOpen: false, message: '', onConfirm: null });

  const { tvoRegistros, gestores, bases } = state;

  function toggleSelect(id) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function deleteSelected() {
    if (!selected.size) return;
    setConfirmCfg({
      isOpen: true,
      message: `Excluir ${selected.size} registro(s)?`,
      onConfirm: () => {
        dispatch({ type: 'DELETE_TVO_REGS', payload: selected });
        setBulkMode(false);
        setSelected(new Set());
      }
    });
  }

  async function importExcel(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setImportMsg('Lendo arquivo...');
    try {
      await loadSheetJS();
      const ab = await file.arrayBuffer();
      const wb = window.XLSX.read(ab, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (rows.length < 2) throw new Error('Arquivo vazio.');
      const headers = rows[0].map(h => normalizeKey(h));
      const fieldMap = {};
      headers.forEach((h, i) => { if (TVO_COL_MAP[h]) fieldMap[TVO_COL_MAP[h]] = i; });
      let added = 0;
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (row.every(v => v === '' || v == null)) continue;
        const get = f => fieldMap[f] !== undefined ? row[fieldMap[f]] : '';
        dispatch({ type: 'ADD_TVO_REG', payload: {
          id: Date.now() + r,
          gestor: String(get('gestor') || ''),
          fluig: String(get('fluig') || ''),
          soldate: parseExcelDate(get('soldate')),
          value: parseMoneyValue(get('value')),
          tipo: String(get('tipo') || 'TVO'),
          produto: String(get('produto') || ''),
          cc: String(get('cc') || ''),
          origem: 'Excel',
          base: String(get('base') || ''),
          cat: String(get('cat') || ''),
          obs: String(get('obs') || ''),
        }});
        added++;
      }
      setImportMsg(`✓ ${added} registro(s) importado(s)!`);
      setTimeout(() => setImportMsg(''), 4000);
    } catch(err) { setImportMsg('Erro: ' + err.message); }
    e.target.value = '';
  }

  function loadSheetJS() {
    return new Promise((res, rej) => {
      if (window.XLSX) { res(); return; }
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
      s.onload = res; s.onerror = () => rej(new Error('Erro ao carregar SheetJS'));
      document.head.appendChild(s);
    });
  }

  const thStyle = { background: 'var(--nav-orange)', color: 'white', fontSize: 10, borderBottom: '3px solid #c73509', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, padding: '12px 10px' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>TVO e Contingência</div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Registro de transferências orçamentárias e contingências</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <label style={{ padding: '9px 20px', fontSize: 13, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' }}>
            ↑ Importar Excel
            <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={importExcel} style={{ display: 'none' }}/>
          </label>
          <button onClick={() => { setEditId(null); setModalOpen(true); }} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>+ Novo registro</button>
        </div>
        {importMsg && <div style={{ width: '100%', fontSize: 12, color: importMsg.startsWith('✓') ? 'var(--accent)' : 'var(--danger)' }}>{importMsg}</div>}
      </div>

      {/* Bulk */}
      <div style={{ marginBottom: '0.5rem' }}>
        {!bulkMode ? (
          <button onClick={() => setBulkMode(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            Selecionar para excluir
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
              <input type="checkbox" onChange={e => setSelected(e.target.checked ? new Set(tvoRegistros.map(r => r.id)) : new Set())} style={{ width: 15, height: 15, accentColor: 'var(--accent)', padding: 0, border: 'none' }}/> Selecionar tudo
            </label>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--warning)' }}>{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
            <button onClick={deleteSelected} style={{ padding: '5px 11px', fontSize: 12, background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Excluir</button>
            <button onClick={() => { setBulkMode(false); setSelected(new Set()); }} style={{ padding: '5px 11px', fontSize: 12, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          </div>
        )}
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '1.5rem' }}>
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 240px)' }}>
          <table className="orcamento-table" style={{ minWidth: 800 }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 2, borderTop: '3px solid var(--nav-orange)' }}>
              <tr>
                {bulkMode && <th style={thStyle}></th>}
                <th style={thStyle}>Gestor</th>
                <th style={thStyle}>Nº Fluig</th>
                <th style={thStyle}>Data Solic.</th>
                <th style={thStyle}>Valor</th>
                <th style={thStyle}>Tipo</th>
                <th style={thStyle}>Produto</th>
                <th style={thStyle}>Centro de Custo</th>
                <th style={thStyle}>Base</th>
                <th style={thStyle}>Origem</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {tvoRegistros.length === 0 && (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)', fontSize: 13 }}>Nenhum registro</td></tr>
              )}
              {tvoRegistros.map(r => (
                <tr key={r.id} onClick={() => bulkMode && toggleSelect(r.id)} style={{ cursor: bulkMode ? 'pointer' : 'default', background: selected.has(r.id) ? 'rgba(74,158,106,0.08)' : 'var(--surface)' }}>
                  {bulkMode && <td><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id)} onClick={e => e.stopPropagation()} style={{ width: 15, height: 15, accentColor: 'var(--accent)', padding: 0, border: 'none' }}/></td>}
                  <td>{r.gestor || '—'}</td>
                  <td>{r.fluig || '—'}</td>
                  <td>{r.soldate ? fmtDate(r.soldate) : '—'}</td>
                  <td style={{ fontFamily: "'DM Serif Display', serif", fontWeight: 500 }}>{fmt(r.value)}</td>
                  <td><span className={r.tipo === 'Contingência' ? 'pill-conting-tipo' : 'pill-tvo-tipo'} style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20 }}>{r.tipo}</span></td>
                  <td>{r.produto || '—'}</td>
                  <td>{r.cc || '—'}</td>
                  <td>{r.base || '—'}</td>
                  <td><span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 20, background: 'var(--surface2)', color: 'var(--text2)' }}>{r.origem || '—'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => { setEditId(r.id); setModalOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--nav-orange)', padding: 4 }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button onClick={() => setConfirmCfg({ 
                        isOpen: true, 
                        message: 'Excluir este registro?', 
                        onConfirm: () => dispatch({ type: 'DELETE_TVO_REG', payload: r.id }) 
                      })} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 12, padding: 4 }}>✕</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <TvoRegModal open={modalOpen} onClose={() => { setModalOpen(false); setEditId(null); }} editId={editId}/>
      
      <ConfirmModal 
        isOpen={confirmCfg.isOpen}
        message={confirmCfg.message}
        onConfirm={confirmCfg.onConfirm}
        onCancel={() => setConfirmCfg(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
