'use client';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import { fmt, fmtDate } from '@/lib/utils';
import { v4 as uuid } from 'uuid';

function dbToItem(row) {
  return {
    _id: row.id, emailId: row.email_id, emailFrom: row.email_from,
    emailSubject: row.email_subject, supplier: row.supplier,
    value: Number(row.value) || 0, due: row.due, emission: row.emission,
    nf: row.nf, serie: row.serie, obs: row.obs, tipo: row.tipo,
    filename: row.filename, status: row.status,
    fromEmail: true,
  };
}

function ApproveModal({ item, onConfirm, onCancel }) {
  const { state } = useApp();
  const [gestor, setGestor] = useState('');
  const [base, setBase] = useState('');
  const [cat, setCat] = useState('');
  const [errors, setErrors] = useState({});
  if (!item) return null;
  const activeBases = (state.bases || []).filter(b => !b.desmobilizado);
  const handleConfirm = () => {
    const errs = {};
    if (!gestor) errs.gestor = true;
    if (!base) errs.base = true;
    if (!cat) errs.cat = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onConfirm({ gestor, base, cat });
  };
  const inp = (err) => ({
    width: '100%', padding: '9px 12px', fontSize: 14,
    border: `1px solid ${err ? 'var(--danger)' : 'var(--border2)'}`,
    borderRadius: 'var(--radius)', background: 'var(--bg)',
    color: 'var(--text)', fontFamily: 'inherit', boxSizing: 'border-box',
  });
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 32, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Completar lançamento</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>{item.supplier} · {item.value > 0 ? fmt(item.value) : '—'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Gestor <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select value={gestor} onChange={e => { setGestor(e.target.value); setErrors(p => ({ ...p, gestor: false })); }} style={inp(errors.gestor)}>
              <option value="">Selecione...</option>
              {(state.gestores || []).map((g, i) => <option key={g || i} value={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Centro de Custo <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select value={base} onChange={e => { setBase(e.target.value); setErrors(p => ({ ...p, base: false })); }} style={inp(errors.base)}>
              <option value="">Selecione...</option>
              {activeBases.map(b => <option key={b.nome} value={b.nome}>{b.nome}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Categoria <span style={{ color: 'var(--danger)' }}>*</span></label>
            <select value={cat} onChange={e => { setCat(e.target.value); setErrors(p => ({ ...p, cat: false })); }} style={inp(errors.cat)}>
              <option value="">Selecione...</option>
              {(state.cats || []).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 20px', fontSize: 13, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' }}>Cancelar</button>
          <button onClick={handleConfirm} style={{ padding: '9px 20px', fontSize: 13, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--nav-orange)', color: '#fff', border: 'none' }}>Confirmar</button>
        </div>
      </div>
    </div>
  );
}

function TinderStack({ queue, onApprove, onReject, onUpdate }) {
  const [anim, setAnim] = useState(null);
  const current = queue[0];

  if (!current) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 500 }}>
      <div style={{ textAlign: 'center', color: 'var(--text3)', fontFamily: 'Poppins, sans-serif', fontSize: 14 }}>
        Nenhum item na fila.<br/>Clique em "Atualizar" para buscar e-mails.
      </div>
    </div>
  );

  const handleReject = () => { setAnim('left'); setTimeout(() => { onReject(current); setAnim(null); }, 380); };
  const handleApprove = () => { setAnim('right'); setTimeout(() => { onApprove(current); setAnim(null); }, 380); };

  const isB = current.tipo === 'boleto';

  const ghostCard = (item, widthPct) => {
    const isGB = item.tipo === 'boleto';
    const h = widthPct === 60 ? 336 : 240;
    return (
      <div style={{
        width: 320, height: h, flexShrink: 0,
        background: 'var(--surface)', border: '1px solid var(--border2)',
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.07)',
        clipPath: `inset(0 ${100 - widthPct}% 0 0)`,
        pointerEvents: 'none',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{ flex: 1, padding: '20px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ marginBottom: 10 }}>
              <span style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: 20,
                fontSize: 9, fontWeight: 700, letterSpacing: '1px', fontFamily: 'Poppins, sans-serif',
                background: isGB ? 'rgba(201,150,26,0.12)' : 'rgba(74,158,106,0.12)',
                color: isGB ? 'var(--warning)' : 'var(--accent)',
              }}>{isGB ? 'BOLETO' : 'NOTA FISCAL'}</span>
            </div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{item.supplier || '—'}</div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--nav-orange)' }}>{item.value > 0 ? fmt(item.value) : '—'}</div>
          </div>
          {item.due && (
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 10, color: 'var(--text3)' }}>
              Venc. {fmtDate(item.due)}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 11, color: 'var(--text3)', marginBottom: 20, alignSelf: 'center' }}>
        1 de {queue.length} na fila
      </div>

      {/* Stack horizontal — cards fantasma à esquerda, principal à direita */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginLeft: 80 }}>

        {/* Card 3 — mostra 35% */}
        {queue[2] && (
          <div style={{ opacity: 0.35, marginRight: -210 }}>
            {ghostCard(queue[2], 35)}
          </div>
        )}

        {/* Card 2 — mostra 60% */}
        {queue[1] && (
          <div style={{ opacity: 0.6, marginRight: -130, zIndex: 1, position: 'relative' }}>
            {ghostCard(queue[1], 60)}
          </div>
        )}

        {/* Card principal */}
        <div style={{
          width: 320, height: 450, flexShrink: 0,
          background: 'var(--surface)', border: '1px solid var(--border2)',
          borderRadius: 18, overflow: 'hidden',
          boxShadow: '0 16px 48px rgba(0,0,0,0.13)',
          display: 'flex', flexDirection: 'column',
          zIndex: 2, position: 'relative',
          transition: 'transform 0.38s cubic-bezier(.4,0,.2,1), opacity 0.38s ease',
          ...(anim === 'left' ? { transform: 'translateX(-500px) rotate(-15deg)', opacity: 0 } :
              anim === 'right' ? { transform: 'translateX(500px) rotate(15deg)', opacity: 0 } : {}),
        }}>
          <div style={{ padding: '24px 22px 18px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Tag Email */}
            {current.fromEmail && (
              <div style={{ marginBottom: 12 }}>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                  fontSize: 9, fontWeight: 700, letterSpacing: '1px', fontFamily: 'Poppins, sans-serif',
                  background: 'rgba(90,154,213,0.12)', color: 'var(--info)',
                }}>✉ EMAIL</span>
              </div>
            )}

            {/* Se não tem dados — mostrar botão extrair centralizado */}
            {!current.supplier && !current.value ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
                  {current.filename || 'Anexo PDF'}
                </div>
                <button
                  onClick={async () => {
                    try {
                      const attRes = await fetch('/api/email/fetch-attachment', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ messageId: current.emailId }),
                      });
                      const attData = await attRes.json();
                      if (attData.error) throw new Error(attData.error);
                      if (!window.pdfjsLib) {
                        await new Promise((resolve, reject) => {
                          const script = document.createElement('script');
                          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
                          script.onload = resolve; script.onerror = reject;
                          document.head.appendChild(script);
                        });
                        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                      }
                      const pdfBytes = Uint8Array.from(atob(attData.base64), c => c.charCodeAt(0));
                      const pdf = await window.pdfjsLib.getDocument({ data: pdfBytes }).promise;
                      const page = await pdf.getPage(1);
                      const viewport = page.getViewport({ scale: 2.0 });
                      const canvas = document.createElement('canvas');
                      canvas.width = viewport.width; canvas.height = viewport.height;
                      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
                      const imageBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
                      const res = await fetch('/api/ocr', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ mimeType: 'image/jpeg', base64Data: imageBase64 }),
                      });
                      const data = await res.json();
                      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
                      const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
                      let parsed = {};
                      try { const m = cleaned.match(/\{[\s\S]*\}/); if (m) parsed = JSON.parse(m[0]); } catch {}
                      const updated = {
                        ...current,
                        supplier: parsed.fornecedor || '',
                        value: parsed.valor || 0,
                        due: parsed.vencimento || '',
                        emission: parsed.emissao || '',
                        nf: parsed.nfnum ? String(parseInt(parsed.nfnum, 10)) : '',
                        serie: parsed.nfserie || '1',
                        obs: parsed.observacao || '',
                        tipo: parsed.tipo || 'outro',
                      };
                      onUpdate(updated);
                    } catch(e) { console.error(e); }
                  }}
                  style={{
                    padding: '10px 24px', borderRadius: 10,
                    border: '1.5px solid var(--nav-orange)',
                    background: 'transparent', color: 'var(--nav-orange)',
                    fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >⚡ Extrair dados</button>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{current.supplier || '—'}</div>
                <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 26, fontWeight: 700, color: 'var(--nav-orange)', marginBottom: 16 }}>{current.value > 0 ? fmt(current.value) : '—'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {!isB && <>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 3, fontFamily: 'Poppins, sans-serif' }}>Nº NF</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'Poppins, sans-serif' }}>{current.nf || '—'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 3, fontFamily: 'Poppins, sans-serif' }}>Série</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'Poppins, sans-serif' }}>{current.serie || '1'}</div>
                    </div>
                  </>}
                  <div style={isB ? { gridColumn: '1 / -1' } : {}}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 3, fontFamily: 'Poppins, sans-serif' }}>Vencimento</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'Poppins, sans-serif' }}>{current.due ? fmtDate(current.due) : '—'}</div>
                  </div>
                  {!isB && (
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 3, fontFamily: 'Poppins, sans-serif' }}>Emissão</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', fontFamily: 'Poppins, sans-serif' }}>{current.emission ? fmtDate(current.emission) : '—'}</div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <div style={{ height: 1, background: 'var(--border)' }}/>
          <div style={{ display: 'flex' }}>
            <button onClick={handleReject} style={{ flex: 1, padding: '16px', border: 'none', background: 'transparent', color: 'var(--danger)', fontSize: 20, cursor: 'pointer', borderRight: '1px solid var(--border)', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(207,85,85,0.06)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>✕</button>
            <button onClick={handleApprove} style={{ flex: 1, padding: '16px', border: 'none', background: 'transparent', color: 'var(--accent)', fontSize: 20, cursor: 'pointer', transition: 'background 0.15s' }} onMouseEnter={e => e.currentTarget.style.background='rgba(74,158,106,0.06)'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>✓</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ onExtracted }) {
  const [extracted, setExtracted] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [status, setStatus] = useState('');
  const [nfFile, setNfFile] = useState(null);
  const [boletoFile, setBoletoFile] = useState(null);

  const ensurePdfJs = async () => {
    if (window.pdfjsLib) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = resolve; script.onerror = reject;
      document.head.appendChild(script);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  };

  const pdfToImage = async (file) => {
    await ensurePdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
  };

  const extractFile = async (file, tipo) => {
    // Converte PDF para imagem — igual ao BillModal
    let b64, mime;
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      await ensurePdfJs();
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      b64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
      mime = 'image/jpeg';
    } else {
      b64 = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result.split(',')[1]);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      mime = file.type || 'image/jpeg';
    }

    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mimeType: mime, base64Data: b64 }),
    });

    if (!res.ok) throw new Error(`Erro HTTP ${res.status}`);

    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    let parsed = {};
    try {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) parsed = JSON.parse(match[0]);
    } catch { parsed = {}; }

    return {
      supplier: parsed.fornecedor || '',
      value:    parsed.valor != null ? Number(parsed.valor) : 0,
      due:      parsed.vencimento || '',
      emission: parsed.emissao    || '',
      nf:       parsed.nfnum ? String(parseInt(parsed.nfnum, 10)) : '',
      serie:    parsed.nfserie    || '1',
      obs:      parsed.observacao || '',
      tipo:     tipo || parsed.tipo || 'outro',
      filename: file.name,
      _id:      uuid(),
    };
  };

  const triggerFile = (tipo) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.pdf,image/*';
    input.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      if (tipo === 'nf') setNfFile(file);
      else if (tipo === 'boleto') setBoletoFile(file);
      else {
        setNfFile(file);
      }
    };
    input.click();
  };

  const handleExtract = async () => {
    const fileToProcess = nfFile || boletoFile;
    if (!fileToProcess) return;
    setExtracting(true);
    setStatus('Convertendo PDF...');
    try {
      let result = null;
      if (nfFile && boletoFile) {
        // Extrai ambos e mescla — pega valor maior
        setStatus('Extraindo NF...');
        const nfResult = await extractFile(nfFile, 'nf');
        setStatus('Extraindo Boleto...');
        const boletoResult = await extractFile(boletoFile, 'boleto');
        result = {
          ...nfResult,
          due: boletoResult.due || nfResult.due,
          tipo: 'merged',
        };
      } else {
        setStatus('Extraindo dados com IA...');
        result = await extractFile(fileToProcess, nfFile ? 'nf' : 'boleto');
      }
      setExtracted(result);
      setStatus('');
    } catch (e) {
      setStatus('Erro: ' + e.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleReset = () => {
    setExtracted(null);
    setNfFile(null);
    setBoletoFile(null);
    setStatus('');
  };

  const btnStyle = (color) => ({
    flex: 1, padding: '12px', borderRadius: 10, border: `1.5px solid ${color}`,
    background: 'transparent', color, fontFamily: 'Poppins, sans-serif',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
  });

  const fileChip = (file, onRemove) => (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--bg)', border: '1px solid var(--border2)',
      borderRadius: 8, padding: '10px 14px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>📄</span>
        <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{file.name}</span>
      </div>
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
    </div>
  );

  const hasFiles = nfFile || boletoFile;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520 }}>
      {/* Título */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Leitor de NF e Boletos</div>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: 'var(--text3)' }}>Leitura de e-mails e por chat</div>
      </div>

      {/* Área principal */}
      <div style={{
        flex: 1, background: 'var(--surface2)', borderRadius: 12,
        border: '1px solid var(--border)', padding: 16, marginBottom: 16,
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        {/* Estado: sem arquivos e sem leitura */}
        {!hasFiles && !extracted && !extracting && !status && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--text3)', fontFamily: 'Poppins, sans-serif', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
              Inicie uma leitura importando<br/>uma NF ou Boleto abaixo
            </div>
          </div>
        )}

        {/* Estado: arquivos selecionados, aguardando extração */}
        {hasFiles && !extracted && !extracting && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {nfFile && fileChip(nfFile, () => setNfFile(null))}
            {boletoFile && fileChip(boletoFile, () => setBoletoFile(null))}
            <div style={{
              marginTop: 8, padding: '10px 14px', borderRadius: 8,
              background: 'rgba(74,158,106,0.08)', border: '1px solid rgba(74,158,106,0.2)',
              fontFamily: 'Poppins, sans-serif', fontSize: 12, color: 'var(--accent)',
              textAlign: 'center', fontWeight: 500,
            }}>
              ✓ Tudo pronto! Clique em extrair dados.
            </div>
          </div>
        )}

        {/* Estado: extraindo */}
        {(extracting || (status && !extracted)) && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text2)', fontFamily: 'Poppins, sans-serif', fontSize: 13 }}>
            {extracting && <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--nav-orange)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }}/>}
            {status}
          </div>
        )}

        {/* Estado: dados extraídos */}
        {extracted && !extracting && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>Fornecedor</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'Poppins, sans-serif' }}>{extracted.supplier || '—'}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>Valor</div><div style={{ fontSize: 16, fontWeight: 700, color: 'var(--nav-orange)', fontFamily: 'Poppins, sans-serif' }}>{extracted.value > 0 ? fmt(extracted.value) : '—'}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>Vencimento</div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'Poppins, sans-serif' }}>{extracted.due ? fmtDate(extracted.due) : '—'}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>Nº NF</div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'Poppins, sans-serif' }}>{extracted.nf || '—'}</div></div>
              <div><div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>Série</div><div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', fontFamily: 'Poppins, sans-serif' }}>{extracted.serie || '1'}</div></div>
            </div>
            {extracted.obs && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>Observação</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'Poppins, sans-serif' }}>{extracted.obs}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botões — fixos no fundo */}
      {!extracted ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={btnStyle('var(--accent)')} onClick={() => triggerFile('nf')}>📄 Importar NF</button>
            <button style={btnStyle('var(--warning)')} onClick={() => triggerFile('boleto')}>🧾 Importar Boleto</button>
          </div>
          <button
            style={{ ...btnStyle(hasFiles ? 'var(--nav-orange)' : 'var(--border2)'), flex: 'unset', width: '100%', opacity: hasFiles ? 1 : 0.5, cursor: hasFiles ? 'pointer' : 'not-allowed' }}
            onClick={hasFiles ? handleExtract : undefined}
            disabled={!hasFiles}
          >⚡ Extrair Dados</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ ...btnStyle('var(--accent)'), flex: 1 }} onClick={() => { onExtracted(extracted); setExtracted(null); setNfFile(null); setBoletoFile(null); setStatus(''); }}>✓ Aprovar</button>
            <button style={{ ...btnStyle('var(--danger)'), flex: 1 }} onClick={handleReset}>✕ Recusar</button>
          </div>
          <button style={{ ...btnStyle('var(--text3)'), flex: 'unset', width: '100%' }} onClick={handleReset}>↺ Refazer</button>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function EmailPage() {
  const { dispatch } = useApp();
  const [queue, setQueue]       = useState([]);
  const [rejected, setRejected] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [approvingItem, setApprovingItem] = useState(null);
  const [toast, setToast]       = useState(null);
  const [tab, setTab]           = useState('queue');

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

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

  async function ensurePdfJs() {
    if (window.pdfjsLib) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = resolve; script.onerror = reject;
      document.head.appendChild(script);
    });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }

  async function extractAttachment(att) {
    const attRes = await fetch('/api/email/attachment', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: att.messageId, attachmentId: att.attachmentId }),
    });
    const attData = await attRes.json();
    if (attData.error) throw new Error(attData.error);
    await ensurePdfJs();
    const pdfBytes = Uint8Array.from(atob(attData.base64), c => c.charCodeAt(0));
    const pdf = await window.pdfjsLib.getDocument({ data: pdfBytes }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width; canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    const imageBase64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
    const res = await fetch('/api/email/extract', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64: imageBase64, mimeType: 'image/jpeg', filename: att.filename }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    return {
      supplier: data.extracted.fornecedor || '', value: data.extracted.valor || 0,
      due: data.extracted.vencimento || '', emission: data.extracted.emissao || '',
      nf: data.extracted.nfnum ? String(parseInt(data.extracted.nfnum, 10)) : '',
      serie: data.extracted.nfserie || '1', obs: data.extracted.observacao || '',
      tipo: data.extracted.tipo || 'outro', filename: att.filename,
    };
  }

  const handleRefresh = async () => {
    setLoading(true); setLoadingMsg('Conectando ao Gmail...');
    try {
      const res = await fetch('/api/email/fetch');
      const d = await res.json();
      if (d.error) { showToast(d.error, 'err'); return; }
      const emails = d.emails || [];
      setLoadingMsg(`${emails.length} e-mail(s) encontrado(s). Extraindo...`);
      const newItems = [];
      for (const email of emails) {
        const results = [];
        for (const att of email.attachments) {
          try { setLoadingMsg(`Extraindo: ${att.filename}`); results.push(await extractAttachment(att)); } catch { }
        }
        if (!results.length) continue;
        const best = results.reduce((a, b) => b.value > a.value ? b : a, results[0]);
        if (!best.due) { const w = results.find(r => r.due); if (w) best.due = w.due; }
        newItems.push({ _id: uuid(), emailId: email.id, emailFrom: email.from, emailSubject: email.subject, ...best });
      }
      const upserted = [];
      for (const item of newItems) {
        const r = await fetch('/api/email/queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'upsert', item }) });
        const data = await r.json();
        if (data.item) upserted.push(dbToItem(data.item));
      }
      setQueue(prev => {
        const ids = new Set(prev.map(i => i.emailId));
        return [...upserted.filter(i => !ids.has(i.emailId) && i.status === 'pending'), ...prev];
      });
      showToast(`${upserted.length} email(s) processado(s).`);
    } catch (e) { showToast(e.message, 'err'); }
    finally { setLoading(false); setLoadingMsg(''); }
  };

  const handleApprove = (item) => setApprovingItem(item);

  const handleConfirmApprove = (item, { gestor, base, cat }) => {
    dispatch({ type: 'ADD_BILL', payload: { id: uuid(), supplier: item.supplier || '', value: item.value || 0, due: item.due || '', emission: item.emission || '', nfnum: item.nf || '', nfserie: item.serie || '1', obs: item.obs || 'Importado via e-mail', status: 'pending', gestor, base, cat, rateio: [], tvo: null, conting: null, attachments: [] } });
    fetch('/api/email/queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve', id: item._id }) });
    setQueue(prev => prev.filter(i => i._id !== item._id));
    setApprovingItem(null);
    showToast(`"${item.supplier || 'Item'}" aprovado!`);
  };

  const handleReject = (item) => {
    fetch('/api/email/queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject', id: item._id }) });
    setRejected(prev => [item, ...prev]);
    setQueue(prev => prev.filter(i => i._id !== item._id));
    showToast('Item rejeitado.');
  };

  const handleChatExtracted = (item) => setApprovingItem(item);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px', position: 'relative', boxSizing: 'border-box' }}>

      {/* Loading overlay */}
      {loading && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 100, background: 'var(--surface2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid var(--border)', borderTopColor: 'var(--nav-orange)', animation: 'spin 0.8s linear infinite' }}/>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 14, fontWeight: 500, color: 'var(--text2)', textAlign: 'center', maxWidth: 320 }}>{loadingMsg}</div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 24, zIndex: 1001, background: toast.type === 'ok' ? 'var(--accent)' : toast.type === 'warn' ? 'var(--warning)' : 'var(--danger)', color: '#fff', padding: '10px 20px', borderRadius: 8, fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 500, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>{toast.msg}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Modo IA</h1>
          <p style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>Aprovação de pagamentos via e-mail e leitura inteligente</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {['queue', 'rejected'].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 600, cursor: 'pointer', background: tab === t ? 'var(--nav-orange)' : 'var(--surface)', color: tab === t ? '#fff' : 'var(--text3)' }}>
                {t === 'queue' ? `Fila${queue.length > 0 ? ` (${queue.length})` : ''}` : `Rejeitados${rejected.length > 0 ? ` (${rejected.length})` : ''}`}
              </button>
            ))}
          </div>
          <button onClick={handleRefresh} disabled={loading} style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: 'var(--nav-orange)', color: '#fff', fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>⟳ Atualizar</button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ background: 'var(--surface2)', borderRadius: 24, padding: 32, display: 'flex', gap: 24, alignItems: 'flex-start', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>

        {/* Esquerda — Fila ou Rejeitados */}
        <div style={{ borderRadius: 16, padding: 24, minHeight: 560, flex: 1, minWidth: 0 }}>
          {tab === 'queue' && <TinderStack queue={queue} onApprove={handleApprove} onReject={handleReject} onUpdate={(updated) => setQueue(prev => prev.map(i => i._id === updated._id ? updated : i))} />}
          {tab === 'rejected' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {rejected.length === 0 && <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)', fontFamily: 'Poppins, sans-serif', fontSize: 13 }}>Nenhum item rejeitado.</div>}
              {rejected.map(item => (
                <div key={item._id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{item.supplier || '—'}</div>
                    <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: 'var(--text3)' }}>{item.value > 0 ? fmt(item.value) : '—'} · {item.due ? fmtDate(item.due) : '—'}</div>
                  </div>
                  <button onClick={() => { fetch('/api/email/queue', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'restore', id: item._id }) }); setQueue(prev => [item, ...prev]); setRejected(prev => prev.filter(i => i._id !== item._id)); setTab('queue'); showToast('Item restaurado.'); }} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border2)', background: 'transparent', color: 'var(--text2)', fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Restaurar</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Direita — Chat Panel */}
        <div style={{ background: 'var(--bg)', borderRadius: 16, padding: 20, minHeight: 560, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', width: 340, flexShrink: 0 }}>
          <ChatPanel onExtracted={handleChatExtracted} />
        </div>
      </div>

      <ApproveModal
        item={approvingItem}
        onConfirm={(fields) => handleConfirmApprove(approvingItem, fields)}
        onCancel={() => setApprovingItem(null)}
      />
    </div>
  );
}
