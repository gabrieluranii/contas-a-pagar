'use client';
import { useState, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { fmt, fmtDate } from '@/lib/utils';
import EditPreImportModal from '@/components/email/EditPreImportModal';
import { v4 as uuid } from 'uuid';

// ── Cores & tokens ───────────────────────────────────────────────────────────
const C = {
  bg:      '#0d0d0d',
  surface: '#141414',
  card:    '#1a1a1a',
  border:  '#222',
  accent:  '#d97757',
  text:    '#f0f0f0',
  sec:     '#888',
  danger:  '#ef4444',
  ok:      '#4caf82',
};

// ── Estado inicial de um item pré-importado ───────────────────────────────────
function blankItem() {
  return {
    _id:      uuid(),
    supplier: '',
    nf:       '',
    value:    0,
    due:      '',
    emission: '',
    cat:      '',
    base:     '',
    gestor:   '',
    obs:      '',
    raw:      '',
  };
}

// ── Parser simples de texto de e-mail ─────────────────────────────────────────
function parseEmailText(text) {
  const item = blankItem();

  // Fornecedor — localiza padrão "Fornecedor: XYZ" ou "Vendor/Supplier: XYZ"
  const supplierMatch = text.match(/fornecedor[:\s]+([^\n\r,]+)/i)
    || text.match(/vendor[:\s]+([^\n\r,]+)/i)
    || text.match(/supplier[:\s]+([^\n\r,]+)/i);
  if (supplierMatch) item.supplier = supplierMatch[1].trim();

  // NF
  const nfMatch = text.match(/n[ºo°]?\s*(?:nf|nota fiscal)[:\s#]*([0-9]+)/i)
    || text.match(/nf[:\s#-]*([0-9]+)/i);
  if (nfMatch) item.nf = nfMatch[1].trim();

  // Valor — primeiro número com formato monetário
  const moneyMatch = text.match(/R\$\s*([\d.,]+)/i)
    || text.match(/valor[:\s]+R?\$?\s*([\d.,]+)/i);
  if (moneyMatch) {
    const raw = moneyMatch[1].replace(/\./g, '').replace(',', '.');
    item.value = parseFloat(raw) || 0;
  }

  // Datas YYYY-MM-DD ou DD/MM/YYYY
  const dateRegex = /\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b|\b(\d{4})-(\d{2})-(\d{2})\b/g;
  const dates = [];
  let m;
  while ((m = dateRegex.exec(text)) !== null) {
    if (m[4]) dates.push(`${m[4]}-${m[5]}-${m[6]}`);
    else       dates.push(`${m[3]}-${m[2]}-${m[1]}`);
  }
  if (dates[0]) item.due      = dates[0];
  if (dates[1]) item.emission = dates[1];

  item.raw = text.slice(0, 200);
  return item;
}

// ── Botão de ação ─────────────────────────────────────────────────────────────
function Btn({ children, onClick, danger, outline, small }) {
  const [hov, setHov] = useState(false);
  const base = {
    padding: small ? '5px 12px' : '8px 18px',
    border: outline ? `1px solid ${danger ? C.danger : C.accent}` : 'none',
    borderRadius: 7,
    cursor: 'pointer',
    fontFamily: 'Poppins, sans-serif',
    fontSize: small ? 11 : 12,
    fontWeight: 600,
    transition: 'all 0.15s',
    background: outline ? 'transparent' : (danger ? C.danger : C.accent),
    color: outline ? (danger ? C.danger : C.accent) : '#fff',
    opacity: hov ? 0.85 : 1,
  };
  return (
    <button style={base}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}>
      {children}
    </button>
  );
}

// ── Chip de status ────────────────────────────────────────────────────────────
function Chip({ label, color, bg }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
      fontFamily: 'Poppins, sans-serif', color, background: bg,
    }}>
      {label}
    </span>
  );
}

// ── Linha da tabela de pré-import ─────────────────────────────────────────────
function ItemRow({ item, onEdit, onRemove, onImport }) {
  const hasRequiredFields = item.supplier && item.value > 0 && item.due;
  return (
    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
      <td style={{ padding: '10px 12px', fontSize: 13, color: C.text, fontFamily: 'Poppins, sans-serif' }}>
        {item.supplier || <span style={{ color: C.sec, fontStyle: 'italic' }}>—</span>}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 12, color: C.sec, fontFamily: 'Poppins, sans-serif' }}>
        {item.nf || '—'}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 13, color: C.text, fontFamily: 'Poppins, sans-serif', textAlign: 'right' }}>
        {item.value > 0 ? fmt(item.value) : <span style={{ color: C.sec }}>—</span>}
      </td>
      <td style={{ padding: '10px 12px', fontSize: 12, color: C.sec, fontFamily: 'Poppins, sans-serif' }}>
        {item.due ? fmtDate(item.due) : '—'}
      </td>
      <td style={{ padding: '10px 12px' }}>
        {hasRequiredFields
          ? <Chip label="Pronto" color={C.ok} bg="rgba(76,175,130,0.12)"/>
          : <Chip label="Incompleto" color="#e6a040" bg="rgba(230,160,64,0.12)"/>
        }
      </td>
      <td style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn outline small onClick={() => onEdit(item)}>Editar</Btn>
          {hasRequiredFields && <Btn small onClick={() => onImport(item)}>Importar</Btn>}
          <Btn outline danger small onClick={() => onRemove(item._id)}>✕</Btn>
        </div>
      </td>
    </tr>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function EmailPage() {
  const { dispatch } = useApp();

  const [items, setItems]       = useState([]);
  const [text, setText]         = useState('');
  const [editing, setEditing]   = useState(null);
  const [toast, setToast]       = useState(null);
  const fileRef                 = useRef(null);

  // ── Feedback rápido ─────────────────────────────────────────────────────────
  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Parse do texto colado ───────────────────────────────────────────────────
  const handleParse = () => {
    if (!text.trim()) return;
    const parsed = parseEmailText(text);
    setItems(prev => [parsed, ...prev]);
    setText('');
    showToast('Item extraído — revise os campos antes de importar.');
  };

  // ── Importar um item como lançamento ────────────────────────────────────────
  const handleImport = (item) => {
    const lanc = {
      id:          uuid(),
      supplier:    item.supplier,
      nf:          item.nf,
      value:       item.value,
      due:         item.due,
      emission:    item.emission,
      cat:         item.cat,
      base:        item.base,
      gestor:      item.gestor,
      obs:         item.obs || `Importado via e-mail`,
      tipopgto:    '',
      ccpgto:      '',
      solnum:      '',
      soldate:     null,
      rateio:      [],
      tvo:         false,
      conting:     false,
      attachments: [],
      origemPagamento: false,
    };
    dispatch({ type: 'ADD_LANC', payload: lanc });
    setItems(prev => prev.filter(i => i._id !== item._id));
    showToast(`Lançamento "${item.supplier}" importado com sucesso!`);
  };

  // ── Importar todos prontos ──────────────────────────────────────────────────
  const handleImportAll = () => {
    const ready = items.filter(i => i.supplier && i.value > 0 && i.due);
    if (!ready.length) return;
    ready.forEach(item => {
      const lanc = {
        id:            uuid(),
        supplier:      item.supplier,
        nf:            item.nf,
        value:         item.value,
        due:           item.due,
        emission:      item.emission,
        cat:           item.cat,
        base:          item.base,
        gestor:        item.gestor,
        obs:           item.obs || 'Importado via e-mail',
        tipopgto:      '',
        ccpgto:        '',
        solnum:        '',
        soldate:       null,
        rateio:        [],
        tvo:           false,
        conting:       false,
        attachments:   [],
        origemPagamento: false,
      };
      dispatch({ type: 'ADD_LANC', payload: lanc });
    });
    setItems(prev => prev.filter(i => !ready.some(r => r._id === i._id)));
    showToast(`${ready.length} lançamento(s) importado(s)!`);
  };

  // ── Salvar edição ───────────────────────────────────────────────────────────
  const handleSave = (updated) => {
    setItems(prev => prev.map(i => i._id === updated._id ? updated : i));
    setEditing(null);
    showToast('Item atualizado.');
  };

  const readyCount = items.filter(i => i.supplier && i.value > 0 && i.due).length;

  // ── Estilos inline ──────────────────────────────────────────────────────────
  const TH = {
    padding: '10px 12px', fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '1px', color: C.sec,
    fontFamily: 'Poppins, sans-serif', background: C.surface,
    borderBottom: `1px solid ${C.border}`,
  };

  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, padding: '32px 40px' }}>

      {/* ── Toast ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 999,
          background: toast.type === 'ok' ? C.ok : C.danger,
          color: '#fff', padding: '10px 20px', borderRadius: 8,
          fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.msg}
        </div>
      )}

      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 700,
          letterSpacing: '-0.5px', color: C.text, margin: 0 }}>
          Importação via E-mail
        </h1>
        <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: C.sec, marginTop: 6 }}>
          Cole o conteúdo de um e-mail abaixo para extrair e importar lançamentos automaticamente.
        </p>
      </div>

      {/* ── Área de cola ───────────────────────────────────────────────────── */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: 20, marginBottom: 28 }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '1px', color: C.sec, marginBottom: 10 }}>
          Colar conteúdo do e-mail
        </div>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Cole aqui o texto do e-mail (corpo, assunto, dados da NF, etc.)..."
          style={{
            width: '100%', minHeight: 120, background: '#0d0d0d',
            border: `1px solid ${C.border}`, borderRadius: 7,
            padding: '10px 12px', color: C.text, resize: 'vertical',
            fontFamily: 'Poppins, sans-serif', fontSize: 13, outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
          <Btn onClick={handleParse}>Extrair Dados</Btn>
          {readyCount > 0 && (
            <Btn onClick={handleImportAll}>
              Importar {readyCount} pronto{readyCount > 1 ? 's' : ''}
            </Btn>
          )}
          <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, color: C.sec, marginLeft: 'auto' }}>
            {items.length} item(s) na fila
          </span>
        </div>
      </div>

      {/* ── Lista de itens ─────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.sec,
          fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>
          Nenhum item na fila. Cole um e-mail acima para começar.
        </div>
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...TH, textAlign: 'left' }}>Fornecedor</th>
                <th style={{ ...TH, textAlign: 'left' }}>NF</th>
                <th style={{ ...TH, textAlign: 'right' }}>Valor</th>
                <th style={{ ...TH, textAlign: 'left' }}>Vencimento</th>
                <th style={{ ...TH, textAlign: 'left' }}>Status</th>
                <th style={{ ...TH, textAlign: 'left' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <ItemRow
                  key={item._id}
                  item={item}
                  onEdit={setEditing}
                  onImport={handleImport}
                  onRemove={id => setItems(prev => prev.filter(i => i._id !== id))}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Modal de edição ─────────────────────────────────────────────────── */}
      <EditPreImportModal
        open={!!editing}
        onClose={() => setEditing(null)}
        item={editing}
        onSave={handleSave}
      />

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: none; } }
      `}</style>
    </div>
  );
}
