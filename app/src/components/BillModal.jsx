'use client';
import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { useApp } from '@/context/AppContext';
import { fmt, fmtDate, todayISO, isOverdue, daysUntil, LAUNCH_DAYS } from '@/lib/utils';
import { validateBill } from '@/lib/validation';

import ExtrasSection from './bill-modal/ExtrasSection';
import AttachmentTab from './bill-modal/AttachmentTab';

function FormRow({ children, full = false }) {
  return (
    <div style={{ gridColumn: full ? '1 / -1' : 'auto', display: 'flex', flexDirection: 'column', gap: 5 }}>
      {children}
    </div>
  );
}

function Label({ children, required }) {
  return (
    <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>
      {children}{required && <span style={{ color: 'var(--danger)' }}> *</span>}
    </label>
  );
}

function Inp({ id, type = 'text', placeholder, value, onChange, error, disabled }) {
  return (
    <input
      id={id} type={type} placeholder={placeholder || ''} value={value || ''}
      onChange={onChange} disabled={disabled}
      className={error ? 'field-error' : ''}
      style={{ background: disabled ? 'var(--surface2)' : 'var(--surface)', color: disabled ? 'var(--text3)' : 'var(--text)' }}
    />
  );
}

function Sel({ id, value, onChange, children, error }) {
  return (
    <select id={id} value={value || ''} onChange={onChange} className={error ? 'field-error' : ''}>
      {children}
    </select>
  );
}

export default function BillModal({ open, onClose, editId = null }) {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState('form');

  // Form state
  const [form, setForm] = useState({
    supplier: '', value: '', emission: '', nfnum: '', nfserie: '',
    fluig: '', fluigVal: '', due: '', status: 'pending', base: '', cat: '',
    newBase: '', newCat: '', obs: '',
  });
  const [errors, setErrors] = useState({});

  // Extras
  const [rateioEnabled, setRateioEnabled] = useState(false);
  const [rateioLines, setRateioLines] = useState([]);
  const [tvoEnabled, setTvoEnabled] = useState(false);
  const [tvoValue, setTvoValue] = useState('');
  const [contEnabled, setContEnabled] = useState(false);
  const [contValue, setContValue] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState([]);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrCls, setOcrCls] = useState('');
  const [ocrPreview, setOcrPreview] = useState('');

  // Msg
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('var(--accent)');

  // Saldo check
  const [saldoMsg, setSaldoMsg] = useState(null);

  const fileRef = useRef(null);

  // ── Load existing bill ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setTab('form');
    setErrors({});
    setOcrStatus(''); setOcrCls(''); setOcrPreview('');
    setMsg('');
    if (editId) {
      const b = state.bills.find(x => x.id === editId);
      if (b) {
        setForm({
          supplier: b.supplier || '', value: b.value || '', emission: b.emission || '',
          nfnum: b.nfnum || '', nfserie: b.nfserie || '', fluig: b.fluig || '',
          fluigVal: b.fluigVal || '', due: b.due || '', status: b.status || 'pending',
          base: b.base || '', cat: b.cat || '', newBase: '', newCat: '', obs: b.obs || '',
        });
        setRateioEnabled(b.rateio?.length > 0);
        setRateioLines(b.rateio || []);
        setTvoEnabled(b.tvo != null);
        setTvoValue(b.tvo || '');
        setContEnabled(b.conting != null);
        setContValue(b.conting || '');
        setAttachments(b.attachments || []);
      }
    } else {
      setForm({ supplier: '', value: '', emission: '', nfnum: '', nfserie: '', fluig: '', fluigVal: '', due: '', status: 'pending', base: '', cat: '', newBase: '', newCat: '', obs: '' });
      setRateioEnabled(false); setRateioLines([]);
      setTvoEnabled(false); setTvoValue('');
      setContEnabled(false); setContValue('');
      setAttachments([]);
    }
  }, [open, editId]); // eslint-disable-line

  function setF(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (key === 'value' || key === 'due' || key === 'base' || key === 'cat') checkSaldo();
    if (errors[key]) setErrors(e => ({ ...e, [key]: false }));
  }

  // ── Saldo ─────────────────────────────────────────────────────────────────
  function checkSaldo() {
    const base  = form.base;
    const cat   = form.cat;
    const value = parseFloat(form.value) || 0;
    const due   = form.due;
    if (!base || !cat || !due || !value) { setSaldoMsg(null); return; }
    const month = due.slice(0, 7);
    const orc = state.orcamentos.find(o => o.base === base && o.cat === cat && o.month === month);
    if (!orc) { setSaldoMsg(null); return; }
    const usado = state.bills
      .filter(b => b.base === base && b.cat === cat && b.due?.slice(0, 7) === month && b.id !== editId)
      .reduce((s, b) => s + b.value, 0);
    const livre = orc.value - usado;
    if (value <= livre) setSaldoMsg({ type: 'ok', text: `✓ Saldo disponível: ${fmt(livre)} de ${fmt(orc.value)}` });
    else if (livre > 0) setSaldoMsg({ type: 'warn', text: `⚠ Saldo insuficiente: disponível ${fmt(livre)}, necessário ${fmt(value)}` });
    else setSaldoMsg({ type: 'empty', text: `✕ Sem saldo neste mês. Será enviado para TVO Pendente.` });
  }

  // ── Modal State & Flow ────────────────────────────────────────────────────
  // ── Resolve base/cat ──────────────────────────────────────────────────────
  function resolveBase() {
    if (form.base === '__new__') {
      const nv = form.newBase.trim();
      if (nv && !state.bases.find(b => b.nome === nv)) {
        dispatch({ type: 'ADD_BASE', payload: { id: Date.now(), nome: nv, gestor: '', data: '', mes: '', desmobilizado: false } });
      }
      return nv;
    }
    return form.base;
  }
  function resolveCat() {
    if (form.cat === '__new__') {
      const nv = form.newCat.trim();
      if (nv && !state.cats.includes(nv)) dispatch({ type: 'ADD_CAT', payload: nv });
      return nv;
    }
    return form.cat;
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  function handleSave() {
    const errs = validateBill(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const base = resolveBase();
    const cat  = resolveCat();
    const billObj = {
      id: editId || Date.now(),
      supplier: form.supplier.trim(),
      value: parseFloat(form.value),
      emission: form.emission || null,
      nfnum: form.nfnum, nfserie: form.nfserie,
      fluig: form.fluig, fluigVal: parseFloat(form.fluigVal) || null,
      due: form.due, status: form.status, base, cat,
      rateio: rateioEnabled ? rateioLines : [],
      tvo: tvoEnabled ? (parseFloat(tvoValue) || 0) : null,
      conting: contEnabled ? (parseFloat(contValue) || 0) : null,
      obs: form.obs, attachments,
    };

    // Check saldo → TVO Pendente
    if (!editId && tvoEnabled) {
      dispatch({ type: 'ADD_TVO_BILL', payload: { ...billObj, tvoStage: 'pending' } });
      showMsg('Lançamento enviado para TVO Pendente.', 'var(--warning)');
      return;
    }
    if (!editId) {
      const month = form.due.slice(0, 7);
      const orc = state.orcamentos.find(o => o.base === base && o.cat === cat && o.month === month);
      if (orc) {
        const usado = state.bills.filter(b => b.base === base && b.cat === cat && b.due?.slice(0, 7) === month).reduce((s, b) => s + b.value, 0);
        const livre = orc.value - usado;
        if (parseFloat(form.value) > livre) {
          dispatch({ type: 'ADD_TVO_BILL', payload: { ...billObj, tvoStage: 'pending' } });
          showMsg(`Saldo insuficiente (disponível: ${fmt(livre)}). Enviado para TVO Pendente.`, 'var(--warning)');
          return;
        }
      }
    }

    if (editId) dispatch({ type: 'UPDATE_BILL', payload: billObj });
    else dispatch({ type: 'ADD_BILL', payload: billObj });
    showMsg('Lançamento salvo!', 'var(--accent)');
  }

  function showMsg(text, color) {
    setMsg(text); setMsgColor(color);
    setTimeout(() => { setMsg(''); onClose?.(); }, 1800);
  }

  // ── OCR via Gemini ────────────────────────────────────────────────────────
  async function processOCR(files) {
    const key = localStorage.getItem('gemini_key') || '';
    if (!key) { setOcrStatus('Configure a chave Gemini em Configurações → Chave API'); setOcrCls('error'); return; }

    // Adiciona todos os arquivos aos anexos primeiro
    for (const file of files) {
      const b64full = await fileToBase64Full(file);
      setAttachments(a => [...a.filter(x => x.name !== file.name), { name: file.name, type: file.type, data: b64full }]);
    }

    setOcrStatus(`Processando ${files.length} arquivo(s)...`); setOcrCls('loading');
    try {
      for (const file of files) {
        const b64 = await fileToBase64(file);

        // Determina o mime type correto
        let mime;
        if (file.type === 'application/pdf') {
          mime = 'application/pdf';
        } else if (file.type.startsWith('image/')) {
          mime = file.type;
        } else {
          // fallback: tenta como pdf se extensão for .pdf, senão image/jpeg
          mime = file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg';
        }

        // Gemini 2.0 Flash suporta PDFs e imagens nativamente
        const model = mime === 'application/pdf' ? 'gemini-2.0-flash' : 'gemini-2.0-flash';
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { inline_data: { mime_type: mime, data: b64 } },
                { text: EXTRACTION_PROMPT },
              ],
            }],
          }),
        });

        if (!res.ok) {
          const err = await res.json();
          const msg = err.error?.message || `Erro HTTP ${res.status}`;
          if (res.status === 429 || msg.toLowerCase().includes('quota')) {
            throw new Error('Cota da API do Gemini excedida. Por favor, aguarde 1 minuto ou verifique sua chave nas configurações.');
          }
          throw new Error(msg);
        }

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Remove markdown code fences
        const cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

        let parsed = {};
        try {
          // Tenta extrair JSON mesmo que haja texto ao redor
          const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
          else throw new Error('Sem JSON na resposta');
        } catch {
          throw new Error('Não foi possível extrair dados do documento. Verifique se é um boleto ou nota fiscal legível.');
        }

        setForm(f => ({
          ...f,
          supplier: parsed.fornecedor  || f.supplier,
          value:    parsed.valor        != null ? String(parsed.valor) : f.value,
          emission: parsed.emissao      || f.emission,
          nfnum:    parsed.nfnum        || f.nfnum,
          nfserie:  parsed.nfserie      || f.nfserie,
          due:      parsed.vencimento   || f.due,
          obs:      parsed.observacao   || f.obs,
        }));

        const tipoLabel = parsed.tipo === 'boleto' ? 'Boleto' : parsed.tipo === 'nf' ? 'Nota Fiscal' : parsed.tipo === 'merged' ? 'NF + Boleto' : 'Documento';
        const valorFmt  = parsed.valor != null ? fmt(Number(parsed.valor)) : '—';
        setOcrPreview(`${tipoLabel}: ${parsed.fornecedor || '—'} · Valor: ${valorFmt} · Venc.: ${parsed.vencimento || '—'}`);
        setOcrStatus('✓ Dados extraídos! Revise o formulário e salve.'); setOcrCls('success');
        setTab('form');
      }
    } catch (e) {
      setOcrStatus('Erro: ' + (e.message || 'Falha ao processar o arquivo.')); setOcrCls('error');
    }
  }

  async function fileToBase64(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  async function fileToBase64Full(file) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }


  // ── Formatters / Memo ─────────────────────────────────────────────────────

  const activeBases = state.bases.filter(b => !b.desmobilizado);

  return (
    <Modal open={open} onClose={onClose} title={editId ? 'Editar lançamento' : 'Novo lançamento'} wide>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: '1.25rem', marginTop: '-0.5rem' }}>
        {[['form','Formulário'],['attach','Anexos / OCR']].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '10px 18px', fontSize: 14, fontFamily: 'inherit', fontWeight: 500,
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: tab === t ? '2px solid var(--nav-orange)' : '2px solid transparent',
            color: tab === t ? 'var(--nav-orange)' : 'var(--text3)',
            marginBottom: -2, transition: 'all 0.15s',
          }}>
            {label}
            {t === 'attach' && attachments.length > 0 && (
              <span style={{ marginLeft: 6, fontSize: 11, background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '1px 5px' }}>{attachments.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── FORM TAB ── */}
      {tab === 'form' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {/* OCR preview */}
          {ocrPreview && (
            <div style={{ gridColumn: '1 / -1', background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '0.75rem 1rem', fontSize: 13, color: 'var(--text2)', borderLeft: '3px solid var(--accent)', marginBottom: 4 }}>
              <strong style={{ color: 'var(--text)', display: 'block', marginBottom: 4 }}>Dados extraídos via OCR</strong>
              {ocrPreview}
            </div>
          )}

          <FormRow full>
            <Label required>Fornecedor</Label>
            <Inp id="f-supplier" value={form.supplier} onChange={e => setF('supplier', e.target.value)} error={errors.supplier} placeholder="Nome do fornecedor"/>
          </FormRow>

          <FormRow>
            <Label required>Valor (R$)</Label>
            <Inp id="f-value" type="number" value={form.value} onChange={e => setF('value', e.target.value)} error={errors.value} placeholder="0,00"/>
          </FormRow>

          <FormRow>
            <Label required>Vencimento</Label>
            <Inp id="f-due" type="date" value={form.due} onChange={e => setF('due', e.target.value)} error={errors.due}/>
          </FormRow>

          <FormRow>
            <Label>Emissão</Label>
            <Inp id="f-emission" type="date" value={form.emission} onChange={e => setF('emission', e.target.value)}/>
          </FormRow>

          <FormRow>
            <Label>Nº Nota Fiscal</Label>
            <Inp id="f-nfnum" value={form.nfnum} onChange={e => setF('nfnum', e.target.value)} placeholder="Ex: 5369"/>
          </FormRow>

          <FormRow>
            <Label>Série NF</Label>
            <Inp id="f-nfserie" value={form.nfserie} onChange={e => setF('nfserie', e.target.value)} placeholder="Ex: 1"/>
          </FormRow>

          <FormRow>
            <Label required>Centro de Custo</Label>
            <Sel id="f-base" value={form.base} onChange={e => { setF('base', e.target.value); checkSaldo(); }} error={errors.base}>
              <option value="">Sem base</option>
              {activeBases.map(b => <option key={b.nome} value={b.nome}>{b.nome}</option>)}
              <option value="__new__">+ Nova base...</option>
            </Sel>
            {form.base === '__new__' && (
              <Inp value={form.newBase} onChange={e => setF('newBase', e.target.value)} placeholder="Nome da nova base"/>
            )}
          </FormRow>

          <FormRow>
            <Label required>Categoria</Label>
            <Sel id="f-cat" value={form.cat} onChange={e => { setF('cat', e.target.value); checkSaldo(); }} error={errors.cat}>
              <option value="">Sem categoria</option>
              {state.cats.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__new__">+ Nova categoria...</option>
            </Sel>
            {form.cat === '__new__' && (
              <Inp value={form.newCat} onChange={e => setF('newCat', e.target.value)} placeholder="Nome da nova categoria"/>
            )}
          </FormRow>

          <FormRow>
            <Label>Status</Label>
            <Sel id="f-status" value={form.status} onChange={e => setF('status', e.target.value)}>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
            </Sel>
          </FormRow>



          <FormRow full>
            <Label>Observações</Label>
            <textarea id="f-obs" value={form.obs} onChange={e => setF('obs', e.target.value)} placeholder="Observações..." rows={2} style={{ resize: 'vertical' }}/>
          </FormRow>

          {/* Saldo check */}
          {saldoMsg && (
            <div style={{ gridColumn: '1 / -1', fontSize: 12, padding: '6px 10px', borderRadius: 'var(--radius)', background: saldoMsg.type === 'ok' ? 'var(--accent-light)' : saldoMsg.type === 'warn' ? 'var(--warning-light)' : 'var(--danger-light)', color: saldoMsg.type === 'ok' ? 'var(--accent-text)' : saldoMsg.type === 'warn' ? 'var(--warning)' : 'var(--danger)' }}>
              {saldoMsg.text}
            </div>
          )}

          {/* ── EXTRAS ── */}
          <ExtrasSection
            rateioEnabled={rateioEnabled} setRateioEnabled={setRateioEnabled}
            rateioLines={rateioLines}     setRateioLines={setRateioLines}
            tvoEnabled={tvoEnabled}       setTvoEnabled={setTvoEnabled}    tvoValue={tvoValue}       setTvoValue={setTvoValue}
            contEnabled={contEnabled}     setContEnabled={setContEnabled}  contValue={contValue}     setContValue={setContValue}
            billValue={parseFloat(form.value) || 0}
            activeBases={activeBases}
          />

          {/* Message */}
          {msg && (
            <div style={{ gridColumn: '1 / -1', fontSize: 13, color: msgColor, fontWeight: 500 }}>{msg}</div>
          )}
        </div>
      )}

      {/* ── ATTACH TAB ── */}
      {tab === 'attach' && (
        <AttachmentTab
          attachments={attachments}
          setAttachments={setAttachments}
          processOCR={processOCR}
          ocrStatus={ocrStatus}
          ocrCls={ocrCls}
          fileRef={fileRef}
        />
      )}

      {/* Footer */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
        <button onClick={onClose} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' }}>
          Cancelar
        </button>
        <button onClick={handleSave} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>
          {editId ? 'Salvar alterações' : 'Salvar lançamento'}
        </button>
      </div>
    </Modal>
  );
}
