'use client';
import { useState, useEffect, useRef } from 'react';
import Modal from './Modal';
import { useApp } from '@/context/AppContext';
import { fmt, fmtDate, todayISO, isOverdue, daysUntil, LAUNCH_DAYS } from '@/lib/utils';
import { validateBill } from '@/lib/validation';

import ExtrasSection from './bill-modal/ExtrasSection';
import AttachmentTab from './bill-modal/AttachmentTab';
import ConfirmModal from './ConfirmModal';

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
      style={{
        background: disabled ? 'var(--surface2)' : 'var(--surface)',
        color: disabled ? 'var(--text3)' : 'var(--text)',
        cursor: disabled ? 'not-allowed' : 'auto',
        opacity: disabled ? 0.7 : 1
      }}
    />
  );
}

function Sel({ id, value, onChange, children, error, disabled }) {
  return (
    <select 
      id={id} value={value || ''} onChange={onChange} 
      className={error ? 'field-error' : ''} disabled={disabled}
      style={{
        background: disabled ? 'var(--surface2)' : 'var(--surface)',
        color: disabled ? 'var(--text3)' : 'var(--text)',
        cursor: disabled ? 'not-allowed' : 'auto',
        opacity: disabled ? 0.7 : 1
      }}
    >
      {children}
    </select>
  );
}

export default function BillModal({ open, onClose, editId = null, readOnly = false }) {
  const { state, dispatch } = useApp();
  const [tab, setTab] = useState('form');
  const [previewAtt, setPreviewAtt] = useState(null);

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

  // Msg
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('var(--accent)');

  // Saldo check
  const [saldoMsg, setSaldoMsg] = useState(null);

  // Duplicata check
  const [showDupConfirm, setShowDupConfirm] = useState(false);
  const [pendingBill, setPendingBill] = useState(null);

  const fileRef = useRef(null);

  // ── Load existing bill ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setTab('form');
    setErrors({});
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
    else {
      // Check for duplicate only on new records
      const isDuplicate = state.bills.some(b => 
        b.supplier === billObj.supplier &&
        Number(b.value) === Number(billObj.value) &&
        b.nfnum === billObj.nfnum &&
        b.nfserie === billObj.nfserie &&
        b.base === billObj.base
      );

      if (isDuplicate) {
        setPendingBill(billObj);
        setShowDupConfirm(true);
        return;
      }
      dispatch({ type: 'ADD_BILL', payload: billObj });
    }
    showMsg('Lançamento salvo!', 'var(--accent)');
  }

  function confirmSaveDuplicate() {
    if (!pendingBill) return;
    dispatch({ type: 'ADD_BILL', payload: pendingBill });
    setPendingBill(null);
    setShowDupConfirm(false);
    showMsg('Lançamento salvo!', 'var(--accent)');
  }

  function showMsg(text, color) {
    setMsg(text); setMsgColor(color);
    setTimeout(() => { setMsg(''); onClose?.(); }, 1800);
  }

  async function addAttachments(files) {
    for (const file of files) {
      const data = await new Promise((res, rej) => {
        const r = new FileReader();
        r.onload = () => res(r.result);
        r.onerror = rej;
        r.readAsDataURL(file);
      });
      setAttachments(a => [...a.filter(x => x.name !== file.name), { name: file.name, type: file.type, data }]);
    }
  }

  const activeBases = state.bases.filter(b => !b.desmobilizado);

  return (
    <Modal open={open} onClose={onClose} title={readOnly ? 'Visualizar lançamento' : editId ? 'Editar lançamento' : 'Novo lançamento'} wide>
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


          <FormRow full>
            <Label required>Fornecedor</Label>
            <Inp id="f-supplier" value={form.supplier} onChange={e => setF('supplier', e.target.value)} error={errors.supplier} placeholder="Nome do fornecedor" disabled={readOnly}/>
          </FormRow>

          <FormRow>
            <Label required>Valor (R$)</Label>
            <Inp id="f-value" type="number" value={form.value} onChange={e => setF('value', e.target.value)} error={errors.value} placeholder="0,00" disabled={readOnly}/>
          </FormRow>

          <FormRow>
            <Label required>Vencimento</Label>
            <Inp id="f-due" type="date" value={form.due} onChange={e => setF('due', e.target.value)} error={errors.due} disabled={readOnly}/>
          </FormRow>

          <FormRow>
            <Label>Emissão</Label>
            <Inp id="f-emission" type="date" value={form.emission} onChange={e => setF('emission', e.target.value)} disabled={readOnly}/>
          </FormRow>

          <FormRow>
            <Label>Nº Nota Fiscal</Label>
            <Inp id="f-nfnum" value={form.nfnum} onChange={e => setF('nfnum', e.target.value)} placeholder="Ex: 5369" disabled={readOnly}/>
          </FormRow>

          <FormRow>
            <Label>Série NF</Label>
            <Inp id="f-nfserie" value={form.nfserie} onChange={e => setF('nfserie', e.target.value)} placeholder="Ex: 1" disabled={readOnly}/>
          </FormRow>

          <FormRow>
            <Label required>Centro de Custo</Label>
            <Sel id="f-base" value={form.base} onChange={e => { setF('base', e.target.value); checkSaldo(); }} error={errors.base} disabled={readOnly}>
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
            <Sel id="f-cat" value={form.cat} onChange={e => { setF('cat', e.target.value); checkSaldo(); }} error={errors.cat} disabled={readOnly}>
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
            <Sel id="f-status" value={form.status} onChange={e => setF('status', e.target.value)} disabled={readOnly}>
              <option value="pending">Pendente</option>
              <option value="paid">Pago</option>
            </Sel>
          </FormRow>

          <FormRow full>
            <Label>Observações</Label>
          <textarea 
            id="f-obs" value={form.obs} onChange={e => setF('obs', e.target.value)} 
            placeholder="Observações..." rows={2} disabled={readOnly}
            style={{ 
              resize: 'vertical', 
              background: readOnly ? 'var(--surface2)' : 'var(--surface)', 
              color: readOnly ? 'var(--text3)' : 'var(--text)', 
              opacity: readOnly ? 0.7 : 1,
              cursor: readOnly ? 'not-allowed' : 'auto'
            }}
          />
          </FormRow>

          {saldoMsg && (
            <div style={{ gridColumn: '1 / -1', fontSize: 12, padding: '6px 10px', borderRadius: 'var(--radius)', background: saldoMsg.type === 'ok' ? 'var(--accent-light)' : saldoMsg.type === 'warn' ? 'var(--warning-light)' : 'var(--danger-light)', color: saldoMsg.type === 'ok' ? 'var(--accent-text)' : saldoMsg.type === 'warn' ? 'var(--warning)' : 'var(--danger)' }}>
              {saldoMsg.text}
            </div>
          )}

          <ExtrasSection
            rateioEnabled={rateioEnabled} setRateioEnabled={setRateioEnabled}
            rateioLines={rateioLines}     setRateioLines={setRateioLines}
            tvoEnabled={tvoEnabled}       setTvoEnabled={setTvoEnabled}    tvoValue={tvoValue}       setTvoValue={setTvoValue}
            contEnabled={contEnabled}     setContEnabled={setContEnabled}  contValue={contValue}     setContValue={setContValue}
            billValue={parseFloat(form.value) || 0}
            activeBases={activeBases}
          />

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
          onAddFiles={addAttachments}
          onPreview={setPreviewAtt}
          fileRef={fileRef}
        />
      )}

      {/* Footer */}
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
        <button onClick={onClose} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' }}>
          Cancelar
        </button>
        {!readOnly && (
          <button onClick={handleSave} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>
            {editId ? 'Salvar alterações' : 'Salvar lançamento'}
          </button>
        )}
      </div>

      <ConfirmModal
        isOpen={showDupConfirm}
        message="Já existe um lançamento com os mesmos dados (NF, série, fornecedor, valor e base). Deseja salvar mesmo assim?"
        onConfirm={confirmSaveDuplicate}
        onCancel={() => setShowDupConfirm(false)}
      />

      {previewAtt && (
        <div
          onClick={() => setPreviewAtt(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
            zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg)', borderRadius: 16, padding: 20,
              width: '90vw', maxWidth: 700, maxHeight: '90vh',
              display: 'flex', flexDirection: 'column', gap: 12
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'Poppins, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {previewAtt.name}
              </span>
              <button
                onClick={() => setPreviewAtt(null)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text3)' }}
              >✕</button>
            </div>
            {previewAtt.data?.startsWith('data:application/pdf') || previewAtt.data?.startsWith('data:image') ? (
              previewAtt.data.startsWith('data:image') ? (
                <img src={previewAtt.data} alt={previewAtt.name} style={{ width: '100%', borderRadius: 8, objectFit: 'contain', maxHeight: '70vh' }} />
              ) : (
                <iframe
                  src={previewAtt.data}
                  style={{ width: '100%', height: '70vh', border: 'none', borderRadius: 8 }}
                  title="preview"
                />
              )
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text3)', fontFamily: 'Poppins, sans-serif', fontSize: 13, padding: 40 }}>
                Prévia não disponível para este tipo de arquivo.
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
