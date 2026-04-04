'use client';
import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { fmt, fmtDate, MONTH_NAMES, normalizeKey, parseExcelDate, parseMoneyValue, todayISO } from '@/lib/utils';
import { validateLancamento } from '@/lib/validation';

const LANC_COL_MAP = {
  'gestor': 'gestor',
  'no solic': 'solnum', 'nº solic': 'solnum', 'num solic': 'solnum', 'solicitacao': 'solnum', 'numero solicitacao': 'solnum',
  'data solic': 'soldate', 'data solicitacao': 'soldate', 'data solicitacao': 'soldate', 'data da solicitacao': 'soldate',
  'fornecedor': 'supplier', 'nota fiscal': 'nf', 'nf': 'nf',
  'emissao': 'emission', 'emissão': 'emission', 'vencimento': 'due', 'data vencimento': 'due',
  'descricao': 'desc', 'descrição': 'desc',
  'produto': 'produto', 'categoria': 'cat', 'categoria de despesa': 'cat',
  'valor': 'value', 'tipo pagamento': 'tipopgto', 'tipo de pagamento': 'tipopgto',
  'cc pagamento': 'ccpgto', 'cc pgto': 'ccpgto',
};

// ── Sub-componentes visuais ───────────────────────────────────────────────────
function ImportBtn({ importRef, importExcel }) {
  const [hov, setHov] = useState(false);
  return (
    <label
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '9px 20px', fontSize: 13, fontFamily: 'inherit',
        borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500,
        background: hov ? '#fff4ef' : 'transparent',
        color: '#d97757', border: '1px solid #d97757',
        transition: 'background 0.15s',
        display: 'inline-flex', alignItems: 'center', gap: 6,
      }}
    >
      ↑ Importar Excel
      <input ref={importRef} type="file" accept=".xlsx,.xls" onChange={importExcel} style={{ display: 'none' }}/>
    </label>
  );
}

function NewBtn({ onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        padding: '9px 20px', fontSize: 14, fontFamily: 'inherit',
        borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500,
        background: hov ? '#c4663f' : '#d97757',
        color: '#fff', border: 'none', whiteSpace: 'nowrap',
        transition: 'background 0.15s',
      }}
    >+ Novo lançamento</button>
  );
}

function LancRow({ l, idx, bulkMode, selected, toggleSelect, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  const bg = selected.has(l.id) ? 'rgba(217,119,87,0.1)'
           : hov                ? '#fff4ef'
           : idx % 2 === 0      ? '#ffffff' : '#f7f7f5';
  return (
    <tr
      onClick={() => bulkMode && toggleSelect(l.id)}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ cursor: bulkMode ? 'pointer' : 'default', background: bg, borderBottom: '1px solid #eeeeec', height: 52, transition: 'background 0.12s' }}
    >
      {bulkMode && (
        <td><input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleSelect(l.id)} onClick={e => e.stopPropagation()} style={{ width: 15, height: 15, accentColor: '#d97757' }}/></td>
      )}
      <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333' }}>{l.gestor || '—'}</td>
      <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333' }}>{l.solnum || '—'}</td>
      <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333' }}>{l.soldate ? fmtDate(l.soldate) : '—'}</td>
      <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333', maxWidth: 180, whiteSpace: 'normal' }}>{l.supplier || '—'}</td>
      <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333' }}>{l.nf || '—'}</td>
      <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333' }}>{l.emission ? fmtDate(l.emission) : '—'}</td>
      <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333' }}>{l.due ? fmtDate(l.due) : '—'}</td>
      <td>
        {l.cat
          ? <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#d97757', background: '#fff4ef', border: '1px solid #d97757', borderRadius: 4, padding: '2px 7px', whiteSpace: 'nowrap' }}>{l.cat}</span>
          : <span style={{ color: '#aaa' }}>—</span>
        }
      </td>
      <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333', fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmt(l.value)}</td>
      <td style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333333' }}>{l.ccpgto || '—'}</td>
      <td>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d97757', padding: 4 }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button onClick={onDelete} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#cc4444', fontSize: 14, padding: 4, lineHeight: 1 }}>✕</button>
        </div>
      </td>
    </tr>
  );
}

function LancModal({ open, onClose, editId }) {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState({
    gestor: '', solnum: '', soldate: '', supplier: '', nf: '', emission: '',
    due: '', desc: '', cat: '', value: '', tipopgto: '', ccpgto: '',
  });
  const [attachments, setAttachments] = useState([]);
  const [errors, setErrors] = useState({});
  const fileRef = useRef(null);

  useState(() => {
    if (!open) return;
    setErrors({});
    if (editId) {
      const l = state.lancamentos.find(x => x.id === editId);
      if (l) {
        setForm({ gestor: l.gestor || '', solnum: l.solnum || '', soldate: l.soldate || '', supplier: l.supplier || '', nf: l.nf || '', emission: l.emission || '', due: l.due || '', desc: l.desc || '', cat: l.cat || '', value: l.value || '', tipopgto: l.tipopgto || '', ccpgto: l.ccpgto || '' });
        setAttachments(l.attachments || []);
      }
    } else {
      setForm({ gestor: '', solnum: '', soldate: todayISO(), supplier: '', nf: '', emission: '', due: '', desc: '', cat: '', value: '', tipopgto: '', ccpgto: '' });
      setAttachments([]);
    }
  });

  function setF(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function handleSave() {
    const errs = validateLancamento(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const obj = {
      id: editId || Date.now(),
      gestor: form.gestor, solnum: form.solnum, soldate: form.soldate,
      supplier: form.supplier, nf: form.nf, emission: form.emission,
      due: form.due, desc: form.desc, cat: form.cat,
      value: parseFloat(form.value), tipopgto: form.tipopgto, ccpgto: form.ccpgto,
      rateio: [], tvo: null, conting: null, attachments,
    };
    if (editId) dispatch({ type: 'UPDATE_LANC', payload: obj });
    else dispatch({ type: 'ADD_LANC', payload: obj });
    onClose?.();
  }

  const activeBases = state.bases.filter(b => !b.desmobilizado);

  return (
    <Modal open={open} onClose={onClose} title={editId ? 'Editar lançamento' : 'Novo lançamento'} wide>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { k: 'gestor', label: 'Gestor', type: 'select', opts: state.gestores },
          { k: 'solnum', label: 'Nº Solic.' },
          { k: 'soldate', label: 'Data Solic.', type: 'date' },
          { k: 'supplier', label: 'Fornecedor', req: true },
          { k: 'nf', label: 'Nota Fiscal' },
          { k: 'emission', label: 'Emissão', type: 'date' },
          { k: 'due', label: 'Vencimento', type: 'date' },
          { k: 'cat', label: 'Cat. Despesa', type: 'select', opts: state.catDespesas.length ? state.catDespesas : state.cats },
          { k: 'value', label: 'Valor (R$)', type: 'number', req: true },
          { k: 'tipopgto', label: 'Tipo Pagamento', type: 'select', opts: ['Boleto', 'Transferência', 'Cartão', 'Dinheiro', 'PIX', 'Cheque'] },
          { k: 'ccpgto', label: 'CC Pgto', type: 'select', opts: activeBases.map(b => b.nome) },
        ].map(({ k, label, type, req, opts }) => (
          <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>{label}{req && <span style={{ color: 'var(--danger)' }}> *</span>}</label>
            {opts ? (
              <select value={form[k]} onChange={e => setF(k, e.target.value)} className={errors[k] ? 'field-error' : ''}>
                <option value="">Selecione...</option>
                {opts.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input type={type || 'text'} value={form[k]} onChange={e => setF(k, e.target.value)} className={errors[k] ? 'field-error' : ''}/>
            )}
          </div>
        ))}
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Descrição</label>
          <textarea value={form.desc} onChange={e => setF('desc', e.target.value)} rows={2} style={{ resize: 'vertical' }}/>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
        <button onClick={onClose} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' }}>Cancelar</button>
        <button onClick={handleSave} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>
          {editId ? 'Salvar' : 'Criar lançamento'}
        </button>
      </div>
    </Modal>
  );
}

export default function LancamentosPage() {
  const { state, dispatch } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [yearF, setYearF] = useState('');
  const [monthF, setMonthF] = useState('');
  const [gestorF, setGestorF] = useState('');
  const [supplierF, setSupplierF] = useState('');
  const [ccF, setCcF] = useState('');
  const [search, setSearch] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [importMsg, setImportMsg] = useState('');
  const importRef = useRef(null);
  const [confirmCfg, setConfirmCfg] = useState({ isOpen: false, message: '', onConfirm: null });

  const { lancamentos, gestores, bases } = state;

  const years    = [...new Set(lancamentos.map(l => l.soldate?.slice(0, 4)).filter(Boolean))].sort();
  const months   = [...new Set(lancamentos.filter(l => !yearF || l.soldate?.slice(0, 4) === yearF).map(l => l.soldate?.slice(5, 7)).filter(Boolean))].sort();
  const suppliers = [...new Set(lancamentos.map(l => l.supplier).filter(Boolean))].sort();

  let list = [...lancamentos];
  if (yearF)     list = list.filter(l => l.soldate?.slice(0, 4) === yearF);
  if (monthF)    list = list.filter(l => l.soldate?.slice(5, 7) === monthF);
  if (gestorF)   list = list.filter(l => l.gestor === gestorF);
  if (supplierF) list = list.filter(l => l.supplier === supplierF);
  if (ccF)       list = list.filter(l => l.ccpgto === ccF);
  if (search)    list = list.filter(l => JSON.stringify(l).toLowerCase().includes(search.toLowerCase()));

  function toggleSelect(id) {
    setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }
  function toggleAll(checked) {
    setSelected(checked ? new Set(list.map(l => l.id)) : new Set());
  }

  function deleteSelected() {
    if (!selected.size) return;
    setConfirmCfg({
      isOpen: true,
      message: `Excluir ${selected.size} lançamento(s)?`,
      onConfirm: () => {
        dispatch({ type: 'DELETE_LANCS', payload: selected });
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
      headers.forEach((h, i) => { if (LANC_COL_MAP[h]) fieldMap[LANC_COL_MAP[h]] = i; });
      let added = 0;
      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (row.every(v => v === '' || v == null)) continue;
        const get = f => fieldMap[f] !== undefined ? row[fieldMap[f]] : '';
        const supplier = String(get('supplier') || '');
        const value = parseMoneyValue(get('value'));
        if (!supplier && !value) continue;
        dispatch({ type: 'ADD_LANC', payload: {
          id: Date.now() + r, gestor: String(get('gestor') || ''), solnum: String(get('solnum') || ''),
          soldate: parseExcelDate(get('soldate')), supplier, nf: String(get('nf') || ''),
          emission: parseExcelDate(get('emission')), due: parseExcelDate(get('due')),
          desc: String(get('desc') || ''), produto: String(get('produto') || ''),
          cat: String(get('cat') || ''), value, tipopgto: String(get('tipopgto') || ''),
          ccpgto: String(get('ccpgto') || ''), rateio: [], tvo: null, conting: null, attachments: [],
        }});
        added++;
      }
      setImportMsg(`✓ ${added} lançamento(s) importado(s)!`);
      setTimeout(() => setImportMsg(''), 4000);
    } catch(err) {
      setImportMsg('Erro: ' + err.message);
    }
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

  const selStyle = { padding: '5px 10px', fontSize: 13, borderRadius: 20, border: '1px solid #e8e8e5', background: '#ffffff', color: '#333333', fontFamily: 'inherit', cursor: 'pointer', width: 'auto', outline: 'none' };

  return (
    <div>
      {/* Header */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10, marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Lançamentos</div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#777777', marginTop: 4 }}>Registro de solicitações</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
          <ImportBtn importRef={importRef} importExcel={importExcel}/>
          <NewBtn onClick={() => { setEditId(null); setModalOpen(true); }}/>
        </div>
        {importMsg && <div style={{ width: '100%', fontSize: 12, color: importMsg.startsWith('✓') ? 'var(--accent)' : 'var(--danger)' }}>{importMsg}</div>}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Ano:</span>
        <select value={yearF} onChange={e => setYearF(e.target.value)} style={selStyle}>
          <option value="">Todos</option>{years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Mês:</span>
        <select value={monthF} onChange={e => setMonthF(e.target.value)} style={selStyle}>
          <option value="">Todos</option>{months.map(m => <option key={m} value={m}>{MONTH_NAMES[parseInt(m)-1]}</option>)}
        </select>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Gestor:</span>
        <select value={gestorF} onChange={e => setGestorF(e.target.value)} style={selStyle}>
          <option value="">Todos</option>{gestores.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>CC:</span>
        <select value={ccF} onChange={e => setCcF(e.target.value)} style={selStyle}>
          <option value="">Todos</option>{bases.map(b => <option key={b.nome} value={b.nome}>{b.nome}</option>)}
        </select>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: '0.5rem', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text3)' }}>Busca:</span>
        <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Fornecedor, NF, Fluig, descrição..." style={{ padding: '5px 10px', fontSize: 13, borderRadius: 20, border: '1px solid var(--border2)', width: 280, fontFamily: 'inherit' }}/>
        <button onClick={() => { setYearF(''); setMonthF(''); setGestorF(''); setSupplierF(''); setCcF(''); setSearch(''); }} style={{ padding: '5px 11px', fontSize: 12, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit' }}>Limpar filtros</button>
      </div>

      {/* Bulk header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        {!bulkMode ? (
          <button onClick={() => { setBulkMode(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
            Selecionar para excluir
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>
              <input type="checkbox" onChange={e => toggleAll(e.target.checked)} style={{ width: 15, height: 15, accentColor: 'var(--accent)', padding: 0, border: 'none' }}/>
              Selecionar tudo
            </label>
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--warning)' }}>{selected.size} selecionado{selected.size !== 1 ? 's' : ''}</span>
            <button onClick={deleteSelected} style={{ padding: '5px 11px', fontSize: 12, background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit' }}>🗑 Excluir selecionados</button>
            <button onClick={() => { setBulkMode(false); setSelected(new Set()); }} style={{ padding: '5px 11px', fontSize: 12, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)', marginBottom: '1.5rem' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="orcamento-table" style={{ minWidth: 1100 }}>
            <thead>
              <tr>
                {bulkMode && <th style={{ width: 32, background: '#d97757' }}></th>}
                {['Gestor','Nº Solic.','Data Solic.','Fornecedor','NF','Emissão','Vencimento','Cat. Despesa','Valor','CC Pgto'].map(h => (
                  <th key={h} style={{ background: '#d97757', color: '#ffffff', fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', padding: '12px 10px', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
                <th style={{ background: '#d97757', width: 64 }}></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr><td colSpan={12} style={{ textAlign: 'center', padding: '2rem', color: '#777777', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>Nenhum lançamento encontrado</td></tr>
              )}
              {list.map((l, idx) => (
                <LancRow
                  key={l.id}
                  l={l}
                  idx={idx}
                  bulkMode={bulkMode}
                  selected={selected}
                  toggleSelect={toggleSelect}
                  onEdit={() => { setEditId(l.id); setModalOpen(true); }}
                  onDelete={() => setConfirmCfg({ 
                    isOpen: true, 
                    message: 'Excluir este lançamento?', 
                    onConfirm: () => dispatch({ type: 'DELETE_LANC', payload: l.id }) 
                  })}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <LancModal open={modalOpen} onClose={() => { setModalOpen(false); setEditId(null); }} editId={editId}/>
      
      <ConfirmModal 
        isOpen={confirmCfg.isOpen}
        message={confirmCfg.message}
        onConfirm={confirmCfg.onConfirm}
        onCancel={() => setConfirmCfg(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
