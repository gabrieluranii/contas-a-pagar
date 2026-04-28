'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { fmt, fmtDate } from '@/lib/utils';
import { v4 as uuid } from 'uuid';
import { sb } from '@/lib/supabase';

/* ─────────────────────────────────────────────
   ApproveModal — não alterado
───────────────────────────────────────────── */
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

/* ─────────────────────────────────────────────
   ChatPanel — lógica intacta
───────────────────────────────────────────── */
function ChatPanel({ onExtracted }) {
  const [extracted, setExtracted] = useState(null);
  const [editing, setEditing] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, color) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };
  const [extracting, setExtracting] = useState(false);
  const [status, setStatus] = useState('');
  const [nfFile, setNfFile] = useState(null);
  const [boletoFile, setBoletoFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);

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

  const extractFile = async (file, tipo) => {
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

    // Obter token de sessão (cliente Supabase guarda em localStorage)
    if (!sb) throw new Error('Supabase não configurado.');
    const { data: { session } } = await sb.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const res = await fetch('/api/ocr', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'authorization': `Bearer ${session.access_token}`,
      },
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
      else setNfFile(file);
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
        setStatus('Extraindo NF...');
        const nfResult = await extractFile(nfFile, 'nf');
        setStatus('Extraindo Boleto...');
        const boletoResult = await extractFile(boletoFile, 'boleto');
        result = { ...nfResult, due: boletoResult.due || nfResult.due, tipo: 'merged' };
      } else {
        setStatus('Extraindo dados com IA...');
        result = await extractFile(fileToProcess, nfFile ? 'nf' : 'boleto');
      }
      const attList = [];
      if (nfFile) {
        const b64nf = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.readAsDataURL(nfFile);
        });
        attList.push({ name: nfFile.name, type: nfFile.type, data: b64nf });
      }
      if (boletoFile) {
        const b64bol = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.readAsDataURL(boletoFile);
        });
        attList.push({ name: boletoFile.name, type: boletoFile.type, data: b64bol });
      }
      setExtracted({ ...result, attachments: attList });
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
        <span
          onClick={() => setPreviewFile(file)}
          style={{ cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}
        >
          {file.name}
        </span>
      </div>
      <button onClick={onRemove} style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer', fontSize: 14, padding: 0 }}>✕</button>
    </div>
  );

  const hasFiles = nfFile || boletoFile;

  return (
    <>
      {toast && (
        <div style={{
          position: 'fixed', top: 24, left: '50%', transform: 'translateX(-50%)',
          background: toast.color, color: '#fff',
          padding: '12px 28px', borderRadius: 10,
          fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          zIndex: 9999, whiteSpace: 'nowrap',
          animation: 'fadeInDown 0.25s ease',
        }}>
          {toast.msg}
        </div>
      )}
      <style>{`@keyframes fadeInDown { from { opacity: 0; transform: translateX(-50%) translateY(-12px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }`}</style>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 520 }}>
      {/* Título */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Leitor de NF e Boletos</div>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 12, color: 'var(--text3)' }}>Leitura inteligente por IA</div>
      </div>

      {/* Área principal */}
      <div style={{
        flex: 1, background: 'var(--surface2)', borderRadius: 12,
        border: '1px solid var(--border)', padding: 16, marginBottom: 16,
        overflowY: 'auto', display: 'flex', flexDirection: 'column',
      }}>
        {/* Sem arquivos */}
        {!hasFiles && !extracted && !extracting && !status && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ color: 'var(--text3)', fontFamily: 'Poppins, sans-serif', fontSize: 13, textAlign: 'center', lineHeight: 1.6 }}>
              Inicie uma leitura importando<br/>uma NF ou Boleto abaixo
            </div>
          </div>
        )}

        {/* Arquivos selecionados */}
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

        {/* Extraindo */}
        {(extracting || (status && !extracted)) && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--text2)', fontFamily: 'Poppins, sans-serif', fontSize: 13 }}>
            {extracting && <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--border)', borderTopColor: 'var(--nav-orange)', animation: 'spin 0.8s linear infinite', flexShrink: 0 }}/>}
            {status}
          </div>
        )}

        {/* Dados extraídos */}
        {extracted && !extracting && (
          editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>Fornecedor</div>
                <input value={extracted.supplier} onChange={e => setExtracted(prev => ({ ...prev, supplier: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border2)', fontFamily: 'Poppins, sans-serif', fontSize: 13, color: 'var(--text)', background: 'var(--bg)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>Valor</div>
                  <input type="number" value={extracted.value} onChange={e => setExtracted(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border2)', fontFamily: 'Poppins, sans-serif', fontSize: 13, color: 'var(--text)', background: 'var(--bg)', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>Vencimento</div>
                  <input type="date" value={extracted.due} onChange={e => setExtracted(prev => ({ ...prev, due: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border2)', fontFamily: 'Poppins, sans-serif', fontSize: 13, color: 'var(--text)', background: 'var(--bg)', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>Nº NF</div>
                  <input value={extracted.nf} onChange={e => setExtracted(prev => ({ ...prev, nf: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border2)', fontFamily: 'Poppins, sans-serif', fontSize: 13, color: 'var(--text)', background: 'var(--bg)', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>Série</div>
                  <input value={extracted.serie} onChange={e => setExtracted(prev => ({ ...prev, serie: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border2)', fontFamily: 'Poppins, sans-serif', fontSize: 13, color: 'var(--text)', background: 'var(--bg)', boxSizing: 'border-box' }} />
                </div>
              </div>
              {extracted.obs !== undefined && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text3)', marginBottom: 4, fontFamily: 'Poppins, sans-serif' }}>Observação</div>
                  <input value={extracted.obs} onChange={e => setExtracted(prev => ({ ...prev, obs: e.target.value }))} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border2)', fontFamily: 'Poppins, sans-serif', fontSize: 13, color: 'var(--text)', background: 'var(--bg)', boxSizing: 'border-box' }} />
                </div>
              )}
            </div>
          ) : (
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
          )
        )}
      </div>

      {/* Botões */}
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
            <button style={{ ...btnStyle('var(--accent)'), flex: 1 }} onClick={() => { onExtracted(extracted, () => showToast('Documento aprovado com sucesso!', '#1D9E75')); setExtracted(null); setNfFile(null); setBoletoFile(null); setStatus(''); setEditing(false); }}>✓ Aprovar</button>
            <button style={{ ...btnStyle('var(--danger)'), flex: 1 }} onClick={() => { handleReset(); showToast('Documento recusado.', '#E24B4A'); }}>✕ Recusar</button>
          </div>
          <button style={{ ...btnStyle('var(--text3)'), flex: 'unset', width: '100%' }} onClick={handleReset}>↺ Refazer</button>
          <button style={{ ...btnStyle('var(--info, #3b82f6)'), flex: 'unset', width: '100%', marginTop: 4 }} onClick={() => setEditing(e => !e)}>
            {editing ? '✓ Salvar edição' : '✎ Editar dados'}
          </button>
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Modal preview PDF */}
      {previewFile && (
        <div
          onClick={() => setPreviewFile(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--bg)', borderRadius: 16, padding: 20, width: '90vw', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', gap: 12 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{previewFile.name}</span>
              <button onClick={() => setPreviewFile(null)} style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text3)' }}>✕</button>
            </div>
            <iframe
              src={URL.createObjectURL(previewFile)}
              style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }}
              title="preview"
            />
          </div>
        </div>
      )}
    </div>
    </>
  );
}

/* ─────────────────────────────────────────────
   EmailPage — layout simplificado
───────────────────────────────────────────── */
export default function EmailPage() {
  const { dispatch } = useApp();
  const [approvingItem, setApprovingItem] = useState(null);

  const handleChatExtracted = (item, onSuccess) => setApprovingItem({ ...item, _onSuccess: onSuccess });

  const handleConfirmApprove = (item, { gestor, base, cat }) => {
    dispatch({
      type: 'ADD_BILL',
      payload: {
        id: uuid(),
        supplier: item.supplier || '',
        value: item.value || 0,
        due: item.due || '',
        emission: item.emission || '',
        nfnum: item.nf || '',
        nfserie: item.serie || '1',
        obs: item.obs || 'Importado via IA',
        status: 'pending',
        gestor, base, cat,
        rateio: [], tvo: null, conting: null,
        attachments: item.attachments || [],
      },
    });
    if (item._onSuccess) item._onSuccess();
    setApprovingItem(null);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 'calc(100vh - 60px)',
      background: 'var(--bg)',
      padding: '24px 16px',
      boxSizing: 'border-box',
    }}>
      {/* Título */}
      <div style={{ width: '100%', maxWidth: 480, marginBottom: 20 }}>
        <h1 style={{
          fontFamily: 'Poppins, sans-serif', fontSize: 20, fontWeight: 700,
          color: 'var(--text)', margin: 0,
        }}>Modo IA</h1>
        <p style={{
          fontFamily: 'Poppins, sans-serif', fontSize: 12,
          color: 'var(--text3)', marginTop: 4, marginBottom: 0,
        }}>Leitura inteligente de NF e Boletos</p>
      </div>

      {/* ChatPanel */}
      <div style={{
        width: '100%', maxWidth: 480,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        boxSizing: 'border-box',
      }}>
        <ChatPanel onExtracted={handleChatExtracted} />
      </div>

      <ApproveModal
        item={approvingItem}
        onConfirm={(fields) => handleConfirmApprove(approvingItem, fields)}
        onCancel={() => setApprovingItem(null)}
      />
    </div>
  );
}
