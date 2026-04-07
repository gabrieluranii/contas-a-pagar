'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/Modal';

export default function EditPreImportModal({ open, onClose, item, onSave }) {
  const { state } = useApp();

  const [form, setForm] = useState({
    supplier: '',
    nf: '',
    value: '',
    due: '',
    emission: '',
    cat: '',
    base: '',
    gestor: '',
    obs: '',
  });

  useEffect(() => {
    if (item) {
      setForm({
        supplier:  item.supplier  || '',
        nf:        item.nf        || '',
        value:     item.value     != null ? String(item.value) : '',
        due:       item.due       || '',
        emission:  item.emission  || '',
        cat:       item.cat       || '',
        base:      item.base      || '',
        gestor:    item.gestor    || '',
        obs:       item.obs       || '',
      });
    }
  }, [item, open]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = () => {
    const parsed = parseFloat(
      String(form.value).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')
    ) || 0;

    onSave({
      ...item,
      supplier: form.supplier.trim(),
      nf:       form.nf.trim(),
      value:    parsed,
      due:      form.due,
      emission: form.emission,
      cat:      form.cat,
      base:     form.base,
      gestor:   form.gestor,
      obs:      form.obs.trim(),
    });
  };

  const bases  = (state.bases  || []).map(b => b.nome);
  const cats   = state.catDespesas || [];
  const gestores = state.gestores || [];

  const F = {
    label: { fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.8px', color: '#555', marginBottom: 4 },
    input: {
      width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6,
      fontFamily: 'Poppins, sans-serif', fontSize: 13, color: '#111',
      background: '#fafafa', boxSizing: 'border-box', outline: 'none',
    },
    group: { display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 14 },
    row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
    btn: (primary) => ({
      padding: '9px 20px', border: 'none', borderRadius: 7, cursor: 'pointer',
      fontFamily: 'Poppins, sans-serif', fontSize: 12, fontWeight: 600,
      background: primary ? '#d97757' : '#eee', color: primary ? '#fff' : '#444',
    }),
  };

  return (
    <Modal open={open} onClose={onClose} title="Revisar antes de importar" wide>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Fornecedor */}
        <div style={F.group}>
          <div style={F.label}>Fornecedor</div>
          <input style={F.input} value={form.supplier} onChange={e => set('supplier', e.target.value)} placeholder="Nome do fornecedor"/>
        </div>

        <div style={F.row}>
          {/* NF */}
          <div style={F.group}>
            <div style={F.label}>Nº NF</div>
            <input style={F.input} value={form.nf} onChange={e => set('nf', e.target.value)} placeholder="Número"/>
          </div>
          {/* Valor */}
          <div style={F.group}>
            <div style={F.label}>Valor (R$)</div>
            <input style={F.input} value={form.value} onChange={e => set('value', e.target.value)} placeholder="0,00"/>
          </div>
        </div>

        <div style={F.row}>
          {/* Vencimento */}
          <div style={F.group}>
            <div style={F.label}>Vencimento</div>
            <input type="date" style={F.input} value={form.due} onChange={e => set('due', e.target.value)}/>
          </div>
          {/* Emissão */}
          <div style={F.group}>
            <div style={F.label}>Emissão</div>
            <input type="date" style={F.input} value={form.emission} onChange={e => set('emission', e.target.value)}/>
          </div>
        </div>

        <div style={F.row}>
          {/* Base */}
          <div style={F.group}>
            <div style={F.label}>Base</div>
            <select style={F.input} value={form.base} onChange={e => set('base', e.target.value)}>
              <option value="">— selecione —</option>
              {bases.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          {/* Categoria */}
          <div style={F.group}>
            <div style={F.label}>Categoria</div>
            <select style={F.input} value={form.cat} onChange={e => set('cat', e.target.value)}>
              <option value="">— selecione —</option>
              {cats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Gestor */}
        <div style={F.group}>
          <div style={F.label}>Gestor</div>
          <select style={F.input} value={form.gestor} onChange={e => set('gestor', e.target.value)}>
            <option value="">— selecione —</option>
            {gestores.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>

        {/* Obs */}
        <div style={F.group}>
          <div style={F.label}>Observação</div>
          <textarea style={{ ...F.input, resize: 'vertical', minHeight: 60 }}
            value={form.obs} onChange={e => set('obs', e.target.value)} placeholder="Opcional"/>
        </div>

        {/* Ações */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
          <button style={F.btn(false)} onClick={onClose}>Cancelar</button>
          <button style={F.btn(true)}  onClick={handleSave}>Importar Lançamento</button>
        </div>
      </div>
    </Modal>
  );
}
