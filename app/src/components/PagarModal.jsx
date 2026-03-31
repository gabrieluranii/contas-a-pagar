'use client';
import { useState, useEffect } from 'react';
import Modal from './Modal';
import { useApp } from '@/context/AppContext';
import { fmt, fmtDate } from '@/lib/utils';

export default function PagarModal({ open, onClose, billId }) {
  const { state, dispatch } = useApp();
  const [form, setForm] = useState({ gestor: '', fluig: '', nf: '', emission: '' });
  const [errors, setErrors] = useState({});

  const bill = state.bills.find(b => b.id === billId);

  useEffect(() => {
    if (!open || !bill) return;
    setForm({ gestor: '', fluig: bill.fluig || '', nf: bill.nfnum || '', emission: bill.emission || '' });
    setErrors({});
    // Auto-select gestor from CC
    if (bill.base) {
      const cc = state.bases.find(x => x.nome === bill.base);
      if (cc?.gestor) setForm(f => ({ ...f, gestor: cc.gestor }));
    }
  }, [open, billId]); // eslint-disable-line

  function setF(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: false }));
  }

  function handleConfirm() {
    const errs = {};
    if (!form.fluig.trim()) errs.fluig = true;
    if (!form.gestor)       errs.gestor = true;
    if (!form.nf.trim())    errs.nf = true;
    if (!form.emission)     errs.emission = true;
    if (Object.keys(errs).length) { setErrors(errs); return; }

    // Update bill
    const updBill = {
      ...bill,
      status: 'paid',
      fluig: form.fluig,
      nfnum: form.nf,
      emission: form.emission,
    };
    dispatch({ type: 'UPDATE_BILL', payload: updBill });

    // Create lancamento entry automatically
    const alreadyExists = state.lancamentos.some(l => l.originBillId === bill.id);
    if (!alreadyExists) {
      dispatch({
        type: 'ADD_LANC',
        payload: {
          id: Date.now(),
          originBillId: bill.id,
          gestor: form.gestor,
          solnum: form.fluig,
          soldate: new Date().toISOString().slice(0, 10),
          supplier: bill.supplier,
          nf: form.nf,
          emission: form.emission,
          due: bill.due,
          desc: '',
          cat: bill.cat || '',
          value: bill.value,
          tipopgto: '',
          ccpgto: bill.base || '',
          attachments: bill.attachments || [],
          origemPagamento: true,
        },
      });
    }

    onClose?.();
  }

  if (!bill) return null;

  return (
    <Modal open={open} onClose={onClose} title="Confirmar pagamento">
      <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        Preencha os campos obrigatórios para registrar o pagamento.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Fornecedor</label>
          <input value={bill.supplier} disabled style={{ background: 'var(--surface2)', color: 'var(--text3)' }}/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Gestor <span style={{ color: 'var(--danger)' }}>*</span></label>
          <select value={form.gestor} onChange={e => setF('gestor', e.target.value)} className={errors.gestor ? 'field-error' : ''}>
            <option value="">Selecione...</option>
            {state.gestores.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Nº Fluig <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input value={form.fluig} onChange={e => setF('fluig', e.target.value)} placeholder="Ex: FLG-0042" className={errors.fluig ? 'field-error' : ''}/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Nota Fiscal <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input value={form.nf} onChange={e => setF('nf', e.target.value)} placeholder="Ex: 5369" className={errors.nf ? 'field-error' : ''}/>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)' }}>Emissão <span style={{ color: 'var(--danger)' }}>*</span></label>
          <input type="date" value={form.emission} onChange={e => setF('emission', e.target.value)} className={errors.emission ? 'field-error' : ''}/>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: '1.25rem' }}>
        <button onClick={onClose} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' }}>
          Cancelar
        </button>
        <button onClick={handleConfirm} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>
          Confirmar pagamento
        </button>
      </div>
    </Modal>
  );
}
