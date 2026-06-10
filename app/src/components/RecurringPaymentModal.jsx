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
  const [searchSupplier, setSearchSupplier] = useState('');
  const [searchBase, setSearchBase] = useState('');
  const [openSupplierDropdown, setOpenSupplierDropdown] = useState(false);
  const [openBaseDropdown, setOpenBaseDropdown] = useState(false);

  // Popular form ao editar
  useEffect(() => {
    if (editingPayment) {
      setFormData({
        supplier_id: editingPayment.supplier_id || '',
        day_of_month: String(editingPayment.day_of_month || '1'),
        value: String(editingPayment.value || ''),
        base_id: editingPayment.base_id || '',
      });
      setErrors({});
      setSearchSupplier('');
      setSearchBase('');
    } else {
      setFormData({
        supplier_id: '',
        day_of_month: '1',
        value: '',
        base_id: '',
      });
      setErrors({});
      setSearchSupplier('');
      setSearchBase('');
    }
    setOpenSupplierDropdown(false);
    setOpenBaseDropdown(false);
  }, [editingPayment, isOpen]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (!e.target.closest('[data-dropdown="supplier"]')) {
        setOpenSupplierDropdown(false);
      }
      if (!e.target.closest('[data-dropdown="base"]')) {
        setOpenBaseDropdown(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

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
          {/* Fornecedor com Search */}
          <div data-dropdown="supplier">
            <label style={{
              display: 'block', marginBottom: 6, fontSize: 13,
              fontWeight: 500, color: '#1a1a1a',
            }}>
              Fornecedor *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Pesquisar fornecedor..."
                value={searchSupplier}
                onChange={(e) => setSearchSupplier(e.target.value)}
                onFocus={() => setOpenSupplierDropdown(true)}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: 13,
                  border: `1px solid ${errors.supplier_id ? '#cc4444' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', background: '#fff', color: '#1a1a1a',
                  fontFamily: 'inherit', cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              />
              {openSupplierDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                  background: '#fff', border: `1px solid var(--border)`,
                  borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)',
                  maxHeight: 200, overflowY: 'auto',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}>
                  {(state.fornecedores || [])
                    .filter(s => s.name.toLowerCase().includes(searchSupplier.toLowerCase()))
                    .map(s => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setFormData({ ...formData, supplier_id: s.id });
                          setSearchSupplier(s.name);
                          setOpenSupplierDropdown(false);
                        }}
                        style={{
                          padding: '10px 12px', fontSize: 13, cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          background: formData.supplier_id === s.id ? '#f0f0f0' : '#fff',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = formData.supplier_id === s.id ? '#f0f0f0' : '#fff'}
                      >
                        {s.name}
                      </div>
                    ))}
                  {(state.fornecedores || []).filter(s => s.name.toLowerCase().includes(searchSupplier.toLowerCase())).length === 0 && (
                    <div style={{ padding: '10px 12px', fontSize: 13, color: '#999', textAlign: 'center' }}>
                      Nenhum fornecedor encontrado
                    </div>
                  )}
                </div>
              )}
            </div>
            {errors.supplier_id && (
              <div style={{ fontSize: 12, color: '#cc4444', marginTop: 4 }}>{errors.supplier_id}</div>
            )}
          </div>

          {/* Dia do Mês */}
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

          {/* Valor */}
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

          {/* Centro de Custo com Search */}
          <div data-dropdown="base">
            <label style={{
              display: 'block', marginBottom: 6, fontSize: 13,
              fontWeight: 500, color: '#1a1a1a',
            }}>
              Centro de Custo *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Pesquisar centro de custo..."
                value={searchBase}
                onChange={(e) => setSearchBase(e.target.value)}
                onFocus={() => setOpenBaseDropdown(true)}
                style={{
                  width: '100%', padding: '10px 12px', fontSize: 13,
                  border: `1px solid ${errors.base_id ? '#cc4444' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', background: '#fff', color: '#1a1a1a',
                  fontFamily: 'inherit', cursor: 'pointer',
                  transition: 'border-color 0.2s',
                }}
              />
              {openBaseDropdown && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
                  background: '#fff', border: `1px solid var(--border)`,
                  borderTop: 'none', borderRadius: '0 0 var(--radius) var(--radius)',
                  maxHeight: 200, overflowY: 'auto',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}>
                  {(state.bases || [])
                    .filter(b => b.nome.toLowerCase().includes(searchBase.toLowerCase()))
                    .map(b => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setFormData({ ...formData, base_id: b.id });
                          setSearchBase(b.nome);
                          setOpenBaseDropdown(false);
                        }}
                        style={{
                          padding: '10px 12px', fontSize: 13, cursor: 'pointer',
                          borderBottom: '1px solid #f0f0f0',
                          background: formData.base_id === b.id ? '#f0f0f0' : '#fff',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = formData.base_id === b.id ? '#f0f0f0' : '#fff'}
                      >
                        {b.nome}
                      </div>
                    ))}
                  {(state.bases || []).filter(b => b.nome.toLowerCase().includes(searchBase.toLowerCase())).length === 0 && (
                    <div style={{ padding: '10px 12px', fontSize: 13, color: '#999', textAlign: 'center' }}>
                      Nenhum centro de custo encontrado
                    </div>
                  )}
                </div>
              )}
            </div>
            {errors.base_id && (
              <div style={{ fontSize: 12, color: '#cc4444', marginTop: 4 }}>{errors.base_id}</div>
            )}
          </div>

          {/* Botões */}
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
