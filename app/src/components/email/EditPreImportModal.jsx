'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function EditPreImportModal({ open, onClose, item, onSave }) {
  const { state } = useApp();
  const [form, setForm] = useState(item || {});

  if (!open || !item) return null;

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const inputStyle = {
    width: '100%', background: '#0d0d0d', border: '1px solid #333',
    borderRadius: 7, padding: '8px 12px', color: '#f0f0f0',
    fontFamily: 'Poppins, sans-serif', fontSize: 13, outline: 'none',
    boxSizing: 'border-box',
  };
  const labelStyle = {
    fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 700,
    textTransform: 'uppercase', letterSpacing: '1px', color: '#888',
    display: 'block', marginBottom: 6,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1a1a1a', border: '1px solid #222',
        borderRadius: 12, padding: 28, width: '100%', maxWidth: 520,
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        <h3 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 16,
          fontWeight: 700, color: '#f0f0f0', margin: '0 0 20px' }}>
          Editar Item
        </h3>

        <div style={{ display: 'grid', gap: 14 }}>
          {[
            { label: 'Fornecedor', key: 'supplier' },
            { label: 'NF', key: 'nf' },
            { label: 'Observação', key: 'obs' },
          ].map(({ label, key }) => (
            <div key={key}>
              <label style={labelStyle}>{label}</label>
              <input style={inputStyle} value={form[key] || ''}
                onChange={e => set(key, e.target.value)} />
            </div>
          ))}

          <div>
            <label style={labelStyle}>Valor</label>
            <input type="number" style={inputStyle} value={form.value || ''}
              onChange={e => set('value', parseFloat(e.target.value) || 0)} />
          </div>

          <div>
            <label style={labelStyle}>Vencimento</label>
            <input type="date" style={inputStyle} value={form.due || ''}
              onChange={e => set('due', e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Emissão</label>
            <input type="date" style={inputStyle} value={form.emission || ''}
              onChange={e => set('emission', e.target.value)} />
          </div>

          <div>
            <label style={labelStyle}>Centro de Custo</label>
            <select style={inputStyle} value={form.base || ''}
              onChange={e => set('base', e.target.value)}>
              <option value="">Selecione...</option>
              {(state.bases || []).map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', background: 'transparent',
            border: '1px solid #333', borderRadius: 7, color: '#888',
            fontFamily: 'Poppins, sans-serif', fontSize: 12, cursor: 'pointer',
          }}>
            Cancelar
          </button>
          <button onClick={() => onSave({ ...item, ...form })} style={{
            padding: '8px 18px', background: '#d97757',
            border: 'none', borderRadius: 7, color: '#fff',
            fontFamily: 'Poppins, sans-serif', fontSize: 12,
            fontWeight: 600, cursor: 'pointer',
          }}>
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
