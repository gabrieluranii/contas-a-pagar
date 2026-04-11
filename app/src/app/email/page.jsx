'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { fmt, fmtDate } from '@/lib/utils';
import { v4 as uuid } from 'uuid';

function dbToItem(row) {
  return {
    _id:          row.id,
    emailId:      row.email_id,
    emailFrom:    row.email_from,
    emailSubject: row.email_subject,
    supplier:     row.supplier,
    value:        Number(row.value) || 0,
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

// ── Modal de aprovação ────────────────────────────────────────────────────────
function ApproveModal({ item, onConfirm, onCancel }) {
  const { state } = useApp();
  const [gestor, setGestor] = useState('');
  const [base, setBase]     = useState('');
  const [cat, setCat]       = useState('');
  const [errors, setErrors] = useState({});

  if (!item) return null;

  const activeBases = (state.bases || []).filter(b => !b.desmobilizado);

  const handleConfirm = () => {
    const errs = {};
    if (!gestor) errs.gestor = true;
    if (!base)   errs.base   = true;
    if (!cat)    errs.cat    = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onConfirm({ gestor, base, cat });
  };

  const inp = (err) => ({
    width: '100%', padding: '9px 12px', fontSize: 14,
    border: `1px solid ${err ? 'var(--danger)' : 'var(--border2)'}`,
    borderRadius: 'var(--radius)', background: 'var(--surface)',
    color: 'var(--text)', fontFamily: 'inherit',
    boxSizing: 'border-box',
  });

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: 32, width: '100%', maxWidth: 420,
        boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
      }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>
          Completar lançamento
        </div>
        <div style={{ fontFamily: 'inherit', fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>
          {item.supplier} · {item.value > 0 ? fmt(item.value) : '—'}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>
              Gestor <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select value={gestor} onChange={e => { setGestor(e.target.value); setErrors(p => ({ ...p, gestor: false })); }} style={inp(errors.gestor)}>
              <option value="">Selecione...</option>
              {(state.gestores || []).map((g, i) => <option key={g || i} value={g}>{g}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>
              Centro de Custo <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select value={base} onChange={e => { setBase(e.target.value); setErrors(p => ({ ...p, base: false })); }} style={inp(errors.base)}>
              <option value="">Selecione...</option>
              {activeBases.map(b => <option key={b.nome} value={b.nome}>{b.nome}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>
              Categoria <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select value={cat} onChange={e => { setCat(e.target.value); setErrors(p => ({ ...p, cat: false })); }} style={inp(errors.cat)}>
              <option value="">Selecione...</option>
              {(state.cats || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{
            padding: '9px 20px', fontSize: 13, fontFamily: 'inherit',
            borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500,
            background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)',
          }}>Cancelar</button>
          <button onClick={handleConfirm} style={{
            padding: '9px 20px', fontSize: 13, fontFamily: 'inherit',
            borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500,
            background: 'var(--nav-orange)', color: '#fff', border: 'none',
          }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

// ── Card Tinder ───────────────────────────────────────────────────────────────
function TinderCard({ item, onApprove, onReject, total, index, stack }) {
  const [anim, setAnim] = useState(null);
  const isBoleto = item.tipo === 'boleto';

  const handleReject = () => {
    setAnim('left');
    setTimeout(() => onReject(), 380);
  };

  const handleApprove = () => {
    setAnim('right');
    setTimeout(() => onApprove(), 380);
  };

  const cardStyle = (offset, scale, opacity, zIndex) => ({
    position: 'absolute',
    top: 0,
    left: `calc(50% + ${offset}px)`,
    transform: `translateX(-50%) scale(${scale})`,
    transformOrigin: 'center top',
    width: 340,
    background: 'var(--surface)',
    border: '1px solid var(--border2)',
    borderRadius: 20,
    padding: '28px 24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
    opacity,
    zIndex,
    transition: 'all 0.38s cubic-bezier(.4,0,.2,1)',
    overflow: 'hidden',
  });

  const mainAnimStyle = anim === 'left'
    ? { transform: 'translateX(calc(-50% - 500px)) rotate(-18deg)', opacity: 0 }
    : anim === 'right'
    ? { transform: 'translateX(calc(-50% + 500px)) rotate(18deg)', opacity: 0 }
    : {};

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* Contador */}
      <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: 'var(--text3)', marginBottom: 24 }}>
        {index + 1} de {total} na fila
      </div>

      {/* Stack carrossel */}
      <div style={{ position: 'relative', width: '100%', height: 320, overflow: 'hidden' }}>

        {/* Card spoiler esquerda (próximo) */}
        {stack[1] && (
          <div style={{ ...cardStyle(-240, 0.88, 0.5, 1), pointerEvents: 'none' }}>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 8 }}>
              {stack[1].tipo === 'boleto' ? 'BOLETO' : 'NOTA FISCAL'}
            </div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              {stack[1].supplier || '—'}
            </div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--nav-orange)' }}>
              {stack[1].value > 0 ? fmt(stack[1].value) : '—'}
            </div>
          </div>
        )}

        {/* Card principal */}
        <div style={{
          ...cardStyle(0, 1, 1, 3),
          transition: 'transform 0.38s cubic-bezier(.4,0,.2,1), opacity 0.38s ease',
          ...mainAnimStyle,
        }}>
          {/* Tipo badge */}
          <div style={{ marginBottom: 16 }}>
            <span style={{
              display: 'inline-block', padding: '3px 10px', borderRadius: 20,
              fontSize: 10, fontWeight: 700, letterSpacing: '1px',
              fontFamily: 'Poppins, sans-serif',
              background: isBoleto ? 'rgba(201,150,26,0.12)' : 'rgba(74,158,106,0.12)',
              color: isBoleto ? 'var(--warning)' : 'var(--accent)',
            }}>
              {isBoleto ? 'BOLETO' : item.tipo === 'nf' ? 'NOTA FISCAL' : item.tipo === 'merged' ? 'NF + BOLETO' : 'DOCUMENTO'}
            </span>
          </div>

          {/* Fornecedor */}
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4, lineHeight: 1.2 }}>
            {item.supplier || '—'}
          </div>

          {/* Valor */}
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 30, fontWeight: 700, color: 'var(--nav-orange)', marginBottom: 20 }}>
            {item.value > 0 ? fmt(item.value) : '—'}
          </div>

          {/* Grid de dados */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {!isBoleto && (
              <>
                <div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4 }}>Nº NF</div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{item.nf || '—'}</div>
                </div>
                <div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4 }}>Série</div>
                  <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{item.serie || '1'}</div>
                </div>
              </>
            )}
            <div style={isBoleto ? { gridColumn: '1 / -1' } : {}}>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4 }}>Vencimento</div>
              <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{item.due ? fmtDate(item.due) : '—'}</div>
            </div>
            {!isBoleto && (
              <div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4 }}>Emissão</div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{item.emission ? fmtDate(item.emission) : '—'}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Botões */}
      <div style={{ display: 'flex', gap: 32, marginTop: 28 }}>
        <button onClick={handleReject} style={{
          width: 64, height: 64, borderRadius: '50%',
          border: '2px solid var(--danger)', background: 'transparent',
          color: 'var(--danger)', fontSize: 24, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s', boxShadow: '0 4px 16px rgba(207,85,85,0.10)',
        }}>✕</button>
        <button onClick={handleApprove} style={{
          width: 64, height: 64, borderRadius: '50%',
          border: '2px solid var(--accent)', background: 'transparent',
          color: 'var(--accent)', fontSize: 24, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.15s', boxShadow: '0 4px 16px rgba(74,158,106,0.10)',
        }}>✓</button>
      </div>
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function EmailPage() {
  const { dispatch } = useApp();
  const [queue, setQueue]         = useState([]);
  const [rejected, setRejected]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [tab, setTab]             = useState('queue');
  const [approvingItem, setApprovingItem] = useState(null);
  const [toast, setToast]         = useState(null);

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Carrega do Supabase ao montar
  useEffect(() => {
    fetch('/api/email/queue')
      .then(r => r.json())
      .then(d => {
        const items = d.items || [];
        setQueue(items.filter(i => i.status === 'pending').map(dbToItem));
        setRejected(items.filter(i => i.status === 'rejected').map(dbToItem));
      })
      .catch(() => {});

    // Realtime — escuta novos itens na email_queue
    const { createClient } = require('@supabase/supabase-js');
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const channel = sb
      .channel('email_queue_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'email_queue',
        filter: 'status=eq.pending',
      }, (payload) => {
        const newItem = dbToItem(payload.new);
        setQueue(prev => {
          if (prev.some(i => i.emailId === newItem.emailId)) return prev;
          return [newItem, ...prev];
        });
        showToast('Novo pagamento recebido via e-mail!');
      })
      .subscribe();

    return () => sb.removeChannel(channel);
  }, []);

  // pdf.js helpers
  async function ensurePdfJs() {
    if (window.pdfjsLib) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = resolve; script.onerror = reject;
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
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
  }

  async function extractAttachment(att) {
    const attRes = await fetch('/api/email/attachment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: att.messageId, attachmentId: att.attachmentId }),
    });
    const attData = await attRes.json();
    if (attData.error) throw new Error(attData.error);
    const imageBase64 = await pdfBase64ToImageBase64(attData.base64);
    const res = await fetch('/api/email/extract', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
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
      serie:    data.extracted.nfserie    || '1',
      obs:      data.extracted.observacao || '',
      tipo:     data.extracted.tipo       || 'outro',
      filename: att.filename,
    };
  }

  const handleRefresh = async () => {
    setLoading(true);
    setLoadingMsg('Conectando ao Gmail...');
    try {
      const res = await fetch('/api/email/fetch');
      const d = await res.json();
      if (d.error) { showToast(d.error, 'err'); return; }
      const emails = d.emails || [];
      setLoadingMsg(`${emails.length} e-mail(s) encontrado(s). Extraindo anexos...`);
      const newItems = [];
      for (const email of emails) {
        const results = [];
        for (const att of email.attachments) {
          try {
            setLoadingMsg(`Extraindo: ${att.filename}`);
            const extracted = await extractAttachment(att);
            results.push(extracted);
          } catch { /* ignora */ }
        }
        if (!results.length) continue;
        const best = results.reduce((a, b) => b.value > a.value ? b : a, results[0]);
        if (!best.due) {
          const withDue = results.find(r => r.due);
          if (withDue) best.due = withDue.due;
        }
        newItems.push({ _id: uuid(), emailId: email.id, emailFrom: email.from, emailSubject: email.subject, ...best });
      }
      const upserted = [];
      for (const item of newItems) {
        const r = await fetch('/api/email/queue', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'upsert', item }),
        });
        const data = await r.json();
        if (data.item) upserted.push(dbToItem(data.item));
      }
      setQueue(prev => {
        const existingIds = new Set(prev.map(i => i.emailId));
        const fresh = upserted.filter(i => !existingIds.has(i.emailId) && i.status === 'pending');
        return [...fresh, ...prev];
      });
      showToast(`${upserted.length} email(s) processado(s).`);
    } catch (e) {
      showToast(e.message, 'err');
    } finally {
      setLoading(false);
      setLoadingMsg('');
    }
  };

  const handleApprove = (item) => setApprovingItem(item);

  const handleConfirmApprove = (item, { gestor, base, cat }) => {
    dispatch({
      type: 'ADD_BILL',
      payload: {
        id: uuid(), supplier: item.supplier || '', value: item.value || 0,
        due: item.due || '', emission: item.emission || '',
        nfnum: item.nf || '', nfserie: item.serie || '1',
        obs: item.obs || 'Importado via e-mail',
        status: 'pending', gestor, base, cat,
        rateio: [], tvo: null, conting: null, attachments: [],
      },
    });
    fetch('/api/email/queue', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', id: item._id }),
    });
    setQueue(prev => prev.filter(i => i._id !== item._id));
    setApprovingItem(null);
    showToast(`"${item.supplier || 'Item'}" aprovado!`);
  };

  const handleReject = (item) => {
    fetch('/api/email/queue', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reject', id: item._id }),
    });
    setRejected(prev => [item, ...prev]);
    setQueue(prev => prev.filter(i => i._id !== item._id));
    showToast('Item rejeitado.');
  };

  const current = queue[0] || null;

  const tabStyle = (t) => ({
    padding: '9px 20px', fontSize: 13, fontFamily: 'Poppins, sans-serif', fontWeight: 600,
    background: 'none', border: 'none', cursor: 'pointer',
    borderBottom: tab === t ? '2px solid var(--nav-orange)' : '2px solid transparent',
    color: tab === t ? 'var(--nav-orange)' : 'var(--text3)',
    marginBottom: -2, transition: 'all 0.15s',
  });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', padding: '32px 40px', position: 'relative', marginLeft: 0 }}>

      {/* Loading overlay — só na área de conteúdo */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
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
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 500, color: 'var(--text2)', textAlign: 'center', maxWidth: 320 }}>
            {loadingMsg}
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 24, zIndex: 1001,
          background: toast.type === 'ok' ? 'var(--accent)' : toast.type === 'warn' ? 'var(--warning)' : 'var(--danger)',
          color: '#fff', padding: '10px 20px', borderRadius: 8,
          fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        }}>{toast.msg}</div>
      )}

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Importação via E-mail
          </h1>
          <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: 'var(--text3)', marginTop: 6 }}>
            Revise e aprove os pagamentos recebidos por e-mail.
          </p>
        </div>
        <button onClick={handleRefresh} disabled={loading} style={{
          padding: '10px 20px', borderRadius: 8, border: 'none',
          background: 'var(--nav-orange)', color: '#fff',
          fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        }}>⟳ Atualizar</button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: 40 }}>
        <button style={tabStyle('queue')} onClick={() => setTab('queue')}>
          Fila {queue.length > 0 && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--nav-orange)', color: '#fff', borderRadius: 10, padding: '1px 6px' }}>{queue.length}</span>}
        </button>
        <button style={tabStyle('rejected')} onClick={() => setTab('rejected')}>
          Rejeitados {rejected.length > 0 && <span style={{ marginLeft: 6, fontSize: 10, background: 'var(--surface2)', color: 'var(--text3)', borderRadius: 10, padding: '1px 6px' }}>{rejected.length}</span>}
        </button>
      </div>

      {/* Fila — card único centralizado */}
      {tab === 'queue' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', minHeight: 500, paddingTop: 20 }}>
          {queue.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 80, color: 'var(--text3)', fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>
              Nenhum item na fila. Clique em "Atualizar" para buscar e-mails.
            </div>
          ) : (
            <TinderCard
              key={current._id}
              item={current}
              total={queue.length}
              index={0}
              stack={queue}
              onApprove={() => handleApprove(current)}
              onReject={() => handleReject(current)}
            />
          )}
        </div>
      )}

      {/* Rejeitados */}
      {tab === 'rejected' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600, margin: '0 auto' }}>
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
            }}>
              <div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                  {item.supplier || '—'}
                </div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: 'var(--text3)' }}>
                  {item.value > 0 ? fmt(item.value) : '—'} · Venc. {item.due ? fmtDate(item.due) : '—'}
                </div>
              </div>
              <button onClick={() => {
                fetch('/api/email/queue', {
                  method: 'POST', headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'restore', id: item._id }),
                });
                setQueue(prev => [item, ...prev]);
                setRejected(prev => prev.filter(i => i._id !== item._id));
                setTab('queue');
                showToast('Item restaurado para a fila.');
              }} style={{
                padding: '7px 16px', borderRadius: 8,
                border: '1px solid var(--border2)', background: 'transparent',
                color: 'var(--text2)', fontFamily: 'Poppins, sans-serif',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Restaurar</button>
            </div>
          ))}
        </div>
      )}

      {/* Modal de aprovação */}
      <ApproveModal
        item={approvingItem}
        onConfirm={(fields) => handleConfirmApprove(approvingItem, fields)}
        onCancel={() => setApprovingItem(null)}
      />
    </div>
  );
}
