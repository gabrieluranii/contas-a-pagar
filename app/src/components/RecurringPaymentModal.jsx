'use client';
import { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

export default function RecurringPaymentModal({ isOpen, onClose, onSave, editingPayment }) {
  const { state } = useApp();
  const [formData, setFormData] = useState({
    supplier_id: '',
    day_of_month: '1',
    value: '',
    base_id: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingPayment) {
      setFormData({
        supplier_id: editingPayment.supplier_id || '',
        day_of_month: String(editingPayment.day_of_month || '1'),
        value: String(editingPayment.value || ''),
        base_id: editingPayment.base_id || '',
      });
      setErrors({});
    } else {
      setFormData({
        supplier_id: '',
        day_of_month: '1',
        value: '',
        base_id: '',
      });
      setErrors({});
    }
  }, [editingPayment, isOpen]);

  function validate() {
    const errs = {};
    if (!formData.supplier_id) errs.supplier_id = 'Selecione um fornecedor';
    if (!formData.base_id) errs.base_id = 'Selecione um centro de custo';
    const day = parseInt(formData.day_of_month, 10);
    if (isNaN(day) || day < 1 || day > 31) errs.day_of_month = 'Dia deve estar entre 1 e 31';
    const val = parseFloat(formData.value);
    if (isNaN(val) || val <= 0) errs.value = 'Valor deve ser maior que 0';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setSaving(true);
    try {
      const data = {
        supplier_id: parseInt(formData.supplier_id, 10),
        day_of_month: parseInt(formData.day_of_month, 10),
        value: parseFloat(formData.value),
        base_id: parseInt(formData.base_id, 10),
      };
      await onSave(data);
      onClose();
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  }

  if (!isOpen) return null;

  const suppliers = state.fornecedores || [];
  const bases = state.bases || [];

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)', zIndex: 9998,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '2rem',
          maxWidth: 500, width: '90%', maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{
          fontFamily: 'Poppins, sans-serif', fontSize: 20, fontWeight: 600,
          marginBottom: '1.5rem', color: '#1a1a1a',
        }}>
          {editingPayment ? 'Editar Pagamento Recorrente' : 'Novo Pagamento Recorrente'}
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{
              display: 'block', marginBottom: 6, fontSize: 13,
              fontWeight: 500, color: '#1a1a1a',
            }}>
              Fornecedor *
            </label>
            <select
              value={formData.supplier_id}
              onChange={(e) => setFormData({ ...formData, supplier_id: e.target.value })}
              style={{
                width: '100%', padding: '10px 12px', fontSize: 13,
                border: `1px solid ${errors.supplier_id ? '#cc4444' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', background: '#fff', color: '#1a1a1a',
                fontFamily: 'inherit', cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
            >
              <option value="">Selecione um fornecedor...</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {errors.supplier_id && (
              <div style={{ fontSize: 12, color: '#cc4444', marginTop: 4 }}>{errors.supplier_id}</div>
            )}
          </div>

          <div>
            <label style={{
              display: 'block', marginBottom: 6, fontSize: 13,
              fontWeight: 500, color: '#1a1a1a',
            }}>
              Dia do Mês *
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={formData.day_of_month}
              onChange={(e) => setFormData({ ...formData, day_of_month: e.target.value })}
              style={{
                width: '100%', padding: '10px 12px', fontSize: 13,
                border: `1px solid ${errors.day_of_month ? '#cc4444' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', background: '#fff', color: '#1a1a1a',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
            />
            {errors.day_of_month && (
              <div style={{ fontSize: 12, color: '#cc4444', marginTop: 4 }}>{errors.day_of_month}</div>
            )}
          </div>

          <div>
            <label style={{
              display: 'block', marginBottom: 6, fontSize: 13,
              fontWeight: 500, color: '#1a1a1a',
            }}>
              Valor (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="0,00"
              style={{
                width: '100%', padding: '10px 12px', fontSize: 13,
                border: `1px solid ${errors.value ? '#cc4444' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', background: '#fff', color: '#1a1a1a',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s',
              }}
            />
            {errors.value && (
              <div style={{ fontSize: 12, color: '#cc4444', marginTop: 4 }}>{errors.value}</div>
            )}
          </div>

          <div>
            <label style={{
              display: 'block', marginBottom: 6, fontSize: 13,
              fontWeight: 500, color: '#1a1a1a',
            }}>
              Centro de Custo *
            </label>
            <select
              value={formData.base_id}
              onChange={(e) => setFormData({ ...formData, base_id: e.target.value })}
              style={{
                width: '100%', padding: '10px 12px', fontSize: 13,
                border: `1px solid ${errors.base_id ? '#cc4444' : 'var(--border)'}`,
                borderRadius: 'var(--radius)', background: '#fff', color: '#1a1a1a',
                fontFamily: 'inherit', cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
            >
              <option value="">Selecione um centro de custo...</option>
              {bases.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nome}
                </option>
              ))}
            </select>
            {errors.base_id && (
              <div style={{ fontSize: 12, color: '#cc4444', marginTop: 4 }}>{errors.base_id}</div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              style={{
                flex: 1, padding: '10px 16px', fontSize: 13, fontWeight: 500,
                border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                background: '#fff', color: '#1a1a1a', cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s',
                opacity: saving ? 0.6 : 1,
              }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                flex: 1, padding: '10px 16px', fontSize: 13, fontWeight: 500,
                border: 'none', borderRadius: 'var(--radius)',
                background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all 0.2s',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Salvando...' : editingPayment ? 'Atualizar' : 'Criar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
