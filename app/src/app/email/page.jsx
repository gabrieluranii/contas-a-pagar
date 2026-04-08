'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { fmt, fmtDate } from '@/lib/utils';
import { v4 as uuid } from 'uuid';

function Btn({ children, onClick, danger, outline, small, disabled, full }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        width: full ? '100%' : 'auto',
        padding: small ? '5px 12px' : '10px 22px',
        border: outline
          ? `1px solid ${danger ? 'var(--danger)' : 'var(--nav-orange)'}`
          : 'none',
        borderRadius: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'Poppins, sans-serif',
        fontSize: small ? 11 : 13,
        fontWeight: 600,
        background: disabled
          ? 'var(--surface)'
          : outline
            ? 'transparent'
            : danger
              ? 'var(--danger)'
              : 'var(--nav-orange)',
        color: outline ? (danger ? 'var(--danger)' : 'var(--nav-orange)') : '#fff',
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
      padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700,
      fontFamily: 'Poppins, sans-serif', letterSpacing: '0.5px', color, background: bg,
    }}>{label}</span>
  );
}

// ── Modal de visualização (tinder) ────────────────────────────────────────────
function ReviewModal({ item, onApprove, onReject, onClose }) {
  if (!item) return null;
  const isBoleto = item.tipo === 'boleto';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 16, padding: 32, width: '100%', maxWidth: 460,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      }}>
        {/* Tipo badge */}
        <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Chip
            label={isBoleto ? 'BOLETO' : item.tipo === 'nf' ? 'NOTA FISCAL' : item.tipo === 'merged' ? 'NF + BOLETO' : 'DOCUMENTO'}
            color={isBoleto ? 'var(--warning)' : 'var(--accent)'}
            bg={isBoleto ? 'var(--warning-light)' : 'var(--accent-light)'}
          />
          <button onClick={onClose} style={{
            background: 'none', border: 'none', color: 'var(--text3)',
            fontSize: 18, cursor: 'pointer', lineHeight: 1,
          }}>✕</button>
        </div>

        {/* Dados principais */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontFamily: 'Poppins, sans-serif', fontSize: 20, fontWeight: 700,
            color: 'var(--text)', marginBottom: 6, lineHeight: 1.2,
          }}>
            {item.supplier || '—'}
          </div>
          <div style={{
            fontFamily: 'Poppins, sans-serif', fontSize: 28, fontWeight: 700,
            color: 'var(--nav-orange)', marginBottom: 16,
          }}>
            {item.value > 0 ? fmt(item.value) : '—'}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {isBoleto ? (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4 }}>Vencimento</div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 15, color: 'var(--text)' }}>{item.due ? fmtDate(item.due) : '—'}</div>
              </div>
            ) : (
              <>
                <div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4 }}>Vencimento</div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: 'var(--text)' }}>{item.due ? fmtDate(item.due) : '—'}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4 }}>Emissão</div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: 'var(--text)' }}>{item.emission ? fmtDate(item.emission) : '—'}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4 }}>Nº NF</div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: 'var(--text)' }}>{item.nf || '—'}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4 }}>Série</div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, color: 'var(--text)' }}>{item.serie || '—'}</div>
                </div>
              </>
            )}
          </div>

          {item.obs && (
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'var(--bg)', borderRadius: 8, fontFamily: 'Poppins, sans-serif', fontSize: 12, color: 'var(--text3)' }}>
              {item.obs}
            </div>
          )}

          <div style={{ marginTop: 10, fontFamily: 'Poppins, sans-serif', fontSize: 11, color: 'var(--text3)' }}>
            📧 {item.emailFrom} · {item.emailSubject}
          </div>
        </div>

        {/* Botões tinder */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onReject} style={{
            flex: 1, padding: '14px', borderRadius: 10, border: '2px solid var(--danger)',
            background: 'transparent', color: 'var(--danger)', fontFamily: 'Poppins, sans-serif',
            fontSize: 22, cursor: 'pointer', transition: 'all 0.15s',
          }}>✕</button>
          <button onClick={onApprove} style={{
            flex: 1, padding: '14px', borderRadius: 10, border: '2px solid var(--accent)',
            background: 'transparent', color: 'var(--accent)', fontFamily: 'Poppins, sans-serif',
            fontSize: 22, cursor: 'pointer', transition: 'all 0.15s',
          }}>✓</button>
        </div>
      </div>
    </div>
  );
}

// ── Card da fila ──────────────────────────────────────────────────────────────
function QueueCard({ item, onView, onApprove, onReject }) {
  const isBoleto = item.tipo === 'boleto';
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '16px 20px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: 16,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Chip
            label={isBoleto ? 'BOLETO' : 'NF'}
            color={isBoleto ? 'var(--warning)' : 'var(--accent)'}
            bg={isBoleto ? 'var(--warning-light)' : 'var(--accent-light)'}
          />
          <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.supplier || '—'}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
          <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--nav-orange)' }}>
            {item.value > 0 ? fmt(item.value) : '—'}
          </span>
          {item.due && (
            <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: 'var(--text3)' }}>
              Venc. {fmtDate(item.due)}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button onClick={onView} style={{
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '7px 12px', cursor: 'pointer',
          fontFamily: 'Poppins, sans-serif', fontSize: 16, color: 'var(--text3)',
          lineHeight: 1,
        }}>👁</button>
        <button onClick={onReject} style={{
          background: 'var(--danger-light)', border: '1px solid var(--danger)',
          borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
          fontFamily: 'Poppins, sans-serif', fontSize: 16, color: 'var(--danger)',
          lineHeight: 1,
        }}>✕</button>
        <button onClick={onApprove} style={{
          background: 'var(--accent-light)', border: '1px solid var(--accent)',
          borderRadius: 8, padding: '7px 14px', cursor: 'pointer',
          fontFamily: 'Poppins, sans-serif', fontSize: 16, color: 'var(--accent)',
          lineHeight: 1,
        }}>✓</button>
      </div>
    </div>
  );
}

// ── DB row → local item ──────────────────────────────────────────────────────
function dbToItem(row) {
  return {
    _id:          row.id,
    emailId:      row.email_id,
    emailFrom:    row.email_from,
    emailSubject: row.email_subject,
    supplier:     row.supplier,
    value:        row.value,
    due:          row.due,
    emission:     row.emission,
    nf:           row.nf,
    serie:        row.serie,
    obs:          row.obs,
    tipo:         row.tipo,
    filename:     row.filename,
    status:       row.status,
  };
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function EmailPage() {
  const { dispatch } = useApp();
  const [queue, setQueue]         = useState([]);
  const [rejected, setRejected]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [reviewing, setReviewing] = useState(null);
  const [toast, setToast]         = useState(null);
  const [tab, setTab]             = useState('queue');

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Carrega fila persistida ────────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/email/queue')
      .then(r => r.json())
      .then(d => {
        const items = d.items || [];
        setQueue(items.filter(i => i.status === 'pending').map(dbToItem));
        setRejected(items.filter(i => i.status === 'rejected').map(dbToItem));
      })
      .catch(() => {});
  }, []);

  // ── pdf.js loader ──────────────────────────────────────────────────────────
  async function ensurePdfJs() {
    if (window.pdfjsLib) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc =
      'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  async function pdfBase64ToImageBase64(base64) {
    await ensurePdfJs();
    const pdfBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const pdf = await window.pdfjsLib.getDocument({ data: pdfBytes }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
  }

  // ── Extrai um anexo ────────────────────────────────────────────────────────
  async function extractAttachment(att) {
    const attRes = await fetch('/api/email/attachment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: att.messageId, attachmentId: att.attachmentId }),
    });
    const attData = await attRes.json();
    if (attData.error) throw new Error(attData.error);

    const imageBase64 = await pdfBase64ToImageBase64(attData.base64);

    const res = await fetch('/api/email/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64: imageBase64, mimeType: 'image/jpeg', filename: att.filename }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    return {
      supplier: data.extracted.fornecedor || '',
      value:    data.extracted.valor      || 0,
      due:      data.extracted.vencimento || '',
      emission: data.extracted.emissao    || '',
      nf:       data.extracted.nfnum ? String(parseInt(data.extracted.nfnum, 10)) : '',
      serie:    data.extracted.nfserie || '1',
      obs:      data.extracted.observacao || '',
      tipo:     data.extracted.tipo       || 'outro',
      filename: att.filename,
    };
  }

  // ── Atualizar: busca emails + extrai tudo ─────────────────────────────────
  const handleRefresh = async () => {
    setLoading(true);
    setLoadingMsg('Conectando ao Gmail...');
    try {
      const res = await fetch('/api/email/fetch');
      const d = await res.json();
      if (d.error) { showToast(d.error, 'err'); return; }

      const emails = d.emails || [];
      const newItems = [];
      setLoadingMsg(`${emails.length} e-mail(s) encontrado(s). Extraindo anexos...`);

      for (const email of emails) {
        const results = [];
        for (const att of email.attachments) {
          try {
            setLoadingMsg(`Extraindo: ${att.filename}`);
            const extracted = await extractAttachment(att);
            results.push(extracted);
          } catch { /* ignora anexo com erro */ }
        }
        if (results.length === 0) continue;

        // Pega o item com maior valor
        const best = results.reduce((a, b) => b.value > a.value ? b : a, results[0]);
        // Se o melhor item não tem vencimento, tenta pegar de outro item do mesmo email
        if (!best.due) {
          const withDue = results.find(r => r.due && r !== best);
          if (withDue) best.due = withDue.due;
        }

        newItems.push({
          _id:          uuid(),
          emailId:      email.id,
          emailSubject: email.subject,
          emailFrom:    email.from,
          ...best,
        });
      }

      // Upsert no Supabase e evita duplicar emails já na fila
      const upserted = [];
      for (const item of newItems) {
        const res = await fetch('/api/email/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upsert', item }),
        });
        const data = await res.json();
        if (data.item) upserted.push(dbToItem(data.item));
      }
      setQueue(prev => {
        const existingIds = new Set(prev.map(i => i.emailId));
        const fresh = upserted.filter(i => !existingIds.has(i.emailId));
        return [...fresh, ...prev];
      });

      showToast(`${newItems.length} email(s) processado(s).`);
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setLoading(false);
    }
  };

  // ── Aprovar → dispatch ────────────────────────────────────────────────────
  const handleApprove = (item) => {
    dispatch({
      type: 'ADD_BILL',
      payload: {
        id:          uuid(),
        supplier:    item.supplier || '',
        value:       item.value    || 0,
        due:         item.due      || '',
        emission:    item.emission || '',
        nfnum:       item.nf       || '',
        nfserie:     item.serie    || '',
        obs:         item.obs      || 'Importado via e-mail',
        status:      'pending',
        base:        '',
        cat:         '',
        rateio:      [],
        tvo:         null,
        conting:     null,
        attachments: [],
      },
    });
    fetch('/api/email/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', id: item._id }),
    });
    setQueue(prev => prev.filter(i => i._id !== item._id));
    setReviewing(null);
    showToast(`"${item.supplier || 'Item'}" aprovado e adicionado aos pagamentos pendentes!`);
  };

  // ── Rejeitar ──────────────────────────────────────────────────────────────
  const handleReject = (item) => {
    fetch('/api/email/queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', id: item._id }),
    });
    setRejected(prev => [{ ...item, rejectedAt: new Date().toISOString() }, ...prev]);
    setQueue(prev => prev.filter(i => i._id !== item._id));
    setReviewing(null);
    showToast('Item rejeitado.', 'warn');
  };

  const tabStyle = (t) => ({
    padding: '9px 20px', fontSize: 13, fontFamily: 'Poppins, sans-serif', fontWeight: 600,
    background: 'none', border: 'none', cursor: 'pointer',
    borderBottom: tab === t ? '2px solid var(--nav-orange)' : '2px solid transparent',
    color: tab === t ? 'var(--nav-orange)' : 'var(--text3)',
    marginBottom: -2, transition: 'all 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '32px 40px' }}>

      {loading && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 900,
          background: 'var(--bg)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 20,
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            border: '4px solid var(--border)',
            borderTopColor: 'var(--nav-orange)',
            animation: 'spin 0.8s linear infinite',
          }}/>
          <div style={{
            fontFamily: 'Poppins, sans-serif', fontSize: 14,
            fontWeight: 500, color: 'var(--text2)', textAlign: 'center',
            maxWidth: 320,
          }}>
            {loadingMsg}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 1001,
          background: toast.type === 'ok' ? 'var(--accent)' : toast.type === 'warn' ? 'var(--warning)' : 'var(--danger)',
          color: '#fff', padding: '10px 20px', borderRadius: 8,
          fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        }}>{toast.msg}</div>
      )}

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Importação via E-mail
          </h1>
          <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>
            E-mails com PDF detectados e extraídos automaticamente via Gmail.
          </p>
        </div>
        <Btn onClick={handleRefresh} disabled={loading}>
          {loading ? 'Extraindo...' : '⟳ Atualizar'}
        </Btn>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 24 }}>
        <button style={tabStyle('queue')} onClick={() => setTab('queue')}>
          Fila {queue.length > 0 && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--nav-orange)', color: '#fff', borderRadius: 10, padding: '1px 6px' }}>{queue.length}</span>}
        </button>
        <button style={tabStyle('rejected')} onClick={() => setTab('rejected')}>
          Rejeitados {rejected.length > 0 && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--surface)', color: 'var(--text3)', borderRadius: 10, padding: '1px 6px' }}>{rejected.length}</span>}
        </button>
      </div>

      {/* Fila */}
      {tab === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {queue.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)', fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>
              Nenhum item na fila. Clique em "Atualizar" para buscar e-mails.
            </div>
          )}
          {queue.map(item => (
            <QueueCard
              key={item._id}
              item={item}
              onView={() => setReviewing(item)}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
            />
          ))}
        </div>
      )}

      {/* Rejeitados */}
      {tab === 'rejected' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rejected.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)', fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>
              Nenhum item rejeitado ainda.
            </div>
          )}
          {rejected.map(item => (
            <div key={item._id} style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
              opacity: 0.6,
            }}>
              <div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  {item.supplier || '—'}
                </div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: 'var(--text3)' }}>
                  {item.value > 0 ? fmt(item.value) : '—'} · Venc. {item.due ? fmtDate(item.due) : '—'}
                </div>
              </div>
              <Btn small outline onClick={() => {
                fetch('/api/email/queue', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'restore', id: item._id }),
                });
                setQueue(prev => [{ ...item, rejectedAt: undefined }, ...prev]);
                setRejected(prev => prev.filter(i => i._id !== item._id));
                setTab('queue');
                showToast('Item restaurado para a fila.');
              }}>Restaurar</Btn>
            </div>
          ))}
        </div>
      )}

      {/* Modal de revisão */}
      <ReviewModal
        item={reviewing}
        onApprove={() => handleApprove(reviewing)}
        onReject={() => handleReject(reviewing)}
        onClose={() => setReviewing(null)}
      />
    </div>
  );
}
