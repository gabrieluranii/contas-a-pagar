'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { fmt, fmtDate } from '@/lib/utils';
import EditPreImportModal from '@/components/email/EditPreImportModal';
import { v4 as uuid } from 'uuid';

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

function Btn({ children, onClick, danger, outline, small, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        padding: small ? '5px 12px' : '8px 18px',
        border: outline ? `1px solid ${danger ? C.danger : C.accent}` : 'none',
        borderRadius: 7, cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Poppins, sans-serif',
        fontSize: small ? 11 : 12, fontWeight: 600,
        background: disabled ? '#333' : outline ? 'transparent' : (danger ? C.danger : C.accent),
        color: outline ? (danger ? C.danger : C.accent) : '#fff',
        opacity: hov && !disabled ? 0.85 : 1,
        transition: 'all 0.15s',
      }}>
      {children}
    </button>
  );
}

function Chip({ label, color, bg }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
      fontFamily: 'Poppins, sans-serif', color, background: bg,
    }}>{label}</span>
  );
}

export default function EmailPage() {
  const { dispatch } = useApp();
  const [emails, setEmails]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [extracting, setExtracting] = useState({}); // attachmentId → bool
  const [extracted, setExtracted]   = useState({}); // attachmentId → dados
  const [editing, setEditing]       = useState(null);
  const [toast, setToast]           = useState(null);

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    fetch('/api/email/fetch')
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setEmails(d.emails || []);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleExtract = async (att) => {
    setExtracting(prev => ({ ...prev, [att.attachmentId]: true }));
    try {
      const res = await fetch('/api/email/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId:    att.messageId,
          attachmentId: att.attachmentId,
          filename:     att.filename,
        }),
      });
      const data = await res.json();
      if (data.error) showToast(data.error, 'err');
      else {
        setExtracted(prev => ({
          ...prev,
          [att.attachmentId]: { ...data.extracted, _attId: att.attachmentId, _id: uuid() },
        }));
        showToast('Dados extraídos — revise e importe.');
      }
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setExtracting(prev => ({ ...prev, [att.attachmentId]: false }));
    }
  };

  const handleImport = (item) => {
    dispatch({
      type: 'ADD_LANC',
      payload: {
        id:              uuid(),
        supplier:        item.supplier    || '',
        nf:              item.nf          || '',
        value:           item.value       || 0,
        due:             item.due         || '',
        emission:        item.emission    || '',
        cat:             '',
        base:            '',
        gestor:          '',
        obs:             'Importado via e-mail',
        tipopgto:        '',
        ccpgto:          '',
        solnum:          '',
        soldate:         null,
        rateio:          [],
        tvo:             false,
        conting:         false,
        attachments:     [],
        origemPagamento: false,
      },
    });
    setExtracted(prev => {
      const n = { ...prev };
      delete n[item._attId];
      return n;
    });
    showToast(`"${item.supplier || 'Item'}" importado com sucesso!`);
  };

  const handleSave = (updated) => {
    setExtracted(prev => ({ ...prev, [updated._attId]: updated }));
    setEditing(null);
    showToast('Item atualizado.');
  };

  const TH = {
    padding: '10px 12px', fontSize: 10, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '1px', color: C.sec,
    fontFamily: 'Poppins, sans-serif', background: C.surface,
    borderBottom: `1px solid ${C.border}`, textAlign: 'left',
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
        }}>{toast.msg}</div>
      )}

      {/* ── Cabeçalho ──────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 700,
          color: C.text, margin: 0, letterSpacing: '-0.5px' }}>
          Importação via E-mail
        </h1>
        <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: C.sec, marginTop: 6 }}>
          E-mails com PDF anexado detectados automaticamente via Gmail.
        </p>
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.sec,
          fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>
          Buscando e-mails...
        </div>
      )}

      {/* ── Erro ────────────────────────────────────────────────────────────── */}
      {error && (
        <div style={{
          background: 'rgba(239,68,68,0.1)', border: `1px solid ${C.danger}`,
          borderRadius: 8, padding: '14px 18px', color: C.danger,
          fontFamily: 'Poppins, sans-serif', fontSize: 13,
        }}>
          Erro ao buscar e-mails: {error}
        </div>
      )}

      {/* ── Vazio ───────────────────────────────────────────────────────────── */}
      {!loading && !error && emails.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: C.sec,
          fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>
          Nenhum e-mail com PDF encontrado na caixa de entrada.
        </div>
      )}

      {/* ── Lista de e-mails ─────────────────────────────────────────────────── */}
      {!loading && emails.map(email => (
        <div key={email.id} style={{
          background: C.card, border: `1px solid ${C.border}`,
          borderRadius: 10, marginBottom: 16, overflow: 'hidden',
        }}>
          {/* Cabeçalho do email */}
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 600, color: C.text }}>
              {email.subject || '(sem assunto)'}
            </div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: C.sec, marginTop: 3 }}>
              {email.from} · {email.date}
            </div>
          </div>

          {/* Anexos */}
          {email.attachments.map(att => {
            const ext = extracted[att.attachmentId];
            const isExtracting = extracting[att.attachmentId];

            return (
              <div key={att.attachmentId} style={{
                padding: '12px 18px', borderBottom: `1px solid ${C.border}`,
              }}>
                {/* Linha do anexo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: ext ? 12 : 0 }}>
                  <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: C.sec }}>
                    📎 {att.filename}
                  </span>
                  {!ext && (
                    <Btn small onClick={() => handleExtract(att)} disabled={isExtracting}>
                      {isExtracting ? 'Extraindo...' : 'Extrair dados'}
                    </Btn>
                  )}
                  {ext && (
                    <>
                      <Chip label="Extraído" color={C.ok} bg="rgba(76,175,130,0.12)" />
                      <Btn small outline onClick={() => setEditing(ext)}>Editar</Btn>
                      <Btn small onClick={() => handleImport(ext)}>Importar</Btn>
                    </>
                  )}
                </div>

                {/* Tabela de dados extraídos */}
                {ext && (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                    <thead>
                      <tr>
                        {['Fornecedor', 'NF', 'Valor', 'Vencimento', 'Emissão'].map(h => (
                          <th key={h} style={TH}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ padding: '8px 12px', fontFamily: 'Poppins, sans-serif', fontSize: 13, color: C.text }}>
                          {ext.supplier || <span style={{ color: C.sec }}>—</span>}
                        </td>
                        <td style={{ padding: '8px 12px', fontFamily: 'Poppins, sans-serif', fontSize: 12, color: C.sec }}>
                          {ext.nf || '—'}
                        </td>
                        <td style={{ padding: '8px 12px', fontFamily: 'Poppins, sans-serif', fontSize: 13, color: C.text, textAlign: 'right' }}>
                          {ext.value > 0 ? fmt(ext.value) : <span style={{ color: C.sec }}>—</span>}
                        </td>
                        <td style={{ padding: '8px 12px', fontFamily: 'Poppins, sans-serif', fontSize: 12, color: C.sec }}>
                          {ext.due ? fmtDate(ext.due) : '—'}
                        </td>
                        <td style={{ padding: '8px 12px', fontFamily: 'Poppins, sans-serif', fontSize: 12, color: C.sec }}>
                          {ext.emission ? fmtDate(ext.emission) : '—'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>
      ))}

      {/* ── Modal de edição ─────────────────────────────────────────────────── */}
      <EditPreImportModal
        open={!!editing}
        onClose={() => setEditing(null)}
        item={editing}
        onSave={handleSave}
      />
    </div>
  );
}
