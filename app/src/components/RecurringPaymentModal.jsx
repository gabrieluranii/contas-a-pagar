'use client';
import { useState, useEffect, useRef } from 'react';
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
  const [openSupplier, setOpenSupplier] = useState(false);
  const [openBase, setOpenBase] = useState(false);
  const supplierRef = useRef(null);
  const baseRef = useRef(null);

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
    } else {
      setFormData({
        supplier_id: '',
        day_of_month: '1',
        value: '',
        base_id: '',
      });
      setErrors({});
    }
    setSearchSupplier('');
    setSearchBase('');
    setOpenSupplier(false);
    setOpenBase(false);
  }, [editingPayment, isOpen]);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (supplierRef.current && !supplierRef.current.contains(e.target)) {
        setOpenSupplier(false);
      }
      if (baseRef.current && !baseRef.current.contains(e.target)) {
        setOpenBase(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  
  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchSupplier.toLowerCase())
  );
  
  const filteredBases = bases.filter(b =>
    b.nome.toLowerCase().includes(searchBase.toLowerCase())
  );

  const selectedSupplier = suppliers.find(s => s.id === parseInt(formData.supplier_id));
  const selectedBase = bases.find(b => b.id === parseInt(formData.base_id));

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
          {/* Fornecedor Combobox */}
          <div>
            <label style={{
              display: 'block', marginBottom: 6, fontSize: 13,
              fontWeight: 500, color: '#1a1a1a',
            }}>
              Fornecedor *
            </label>
            <div
              ref={supplierRef}
              style={{
                position: 'relative',
                border: `1px solid ${errors.supplier_id ? '#cc4444' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                background: '#fff',
                overflow: 'hidden',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                minHeight: 40,
                borderBottom: openSupplier ? '1px solid var(--border)' : 'none',
              }}>
                <input
                  type="text"
                  placeholder={selectedSupplier ? selectedSupplier.name : 'Pesquisar...'}
                  value={openSupplier ? searchSupplier : ''}
                  onChange={(e) => setSearchSupplier(e.target.value)}
                  onFocus={() => {
                    setOpenSupplier(true);
                    setSearchSupplier('');
                  }}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: 13,
                    background: 'transparent',
                    color: '#1a1a1a',
                    fontFamily: 'inherit',
                    padding: '10px 0',
                  }}
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#999"
                  strokeWidth="2"
                  style={{ transform: openSupplier ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {openSupplier && (
                <div style={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  background: '#fff',
                }}>
                  {filteredSuppliers.length > 0 ? (
                    filteredSuppliers.map(s => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setFormData({ ...formData, supplier_id: s.id });
                          setOpenSupplier(false);
                          setSearchSupplier('');
                        }}
                        style={{
                          padding: '10px 12px',
                          fontSize: 13,
                          cursor: 'pointer',
                          background: formData.supplier_id === s.id ? '#f0f0f0' : '#fff',
                          borderBottom: '1px solid #f5f5f5',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = formData.supplier_id === s.id ? '#f0f0f0' : '#fff'}
                      >
                        {s.name}
                      </div>
                    ))
                  ) : (
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

          {/* Centro de Custo Combobox */}
          <div>
            <label style={{
              display: 'block', marginBottom: 6, fontSize: 13,
              fontWeight: 500, color: '#1a1a1a',
            }}>
              Centro de Custo *
            </label>
            <div
              ref={baseRef}
              style={{
                position: 'relative',
                border: `1px solid ${errors.base_id ? '#cc4444' : 'var(--border)'}`,
                borderRadius: 'var(--radius)',
                background: '#fff',
                overflow: 'hidden',
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0 12px',
                minHeight: 40,
                borderBottom: openBase ? '1px solid var(--border)' : 'none',
              }}>
                <input
                  type="text"
                  placeholder={selectedBase ? selectedBase.nome : 'Pesquisar...'}
                  value={openBase ? searchBase : ''}
                  onChange={(e) => setSearchBase(e.target.value)}
                  onFocus={() => {
                    setOpenBase(true);
                    setSearchBase('');
                  }}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: 13,
                    background: 'transparent',
                    color: '#1a1a1a',
                    fontFamily: 'inherit',
                    padding: '10px 0',
                  }}
                />
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#999"
                  strokeWidth="2"
                  style={{ transform: openBase ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>

              {openBase && (
                <div style={{
                  maxHeight: 200,
                  overflowY: 'auto',
                  background: '#fff',
                }}>
                  {filteredBases.length > 0 ? (
                    filteredBases.map(b => (
                      <div
                        key={b.id}
                        onClick={() => {
                          setFormData({ ...formData, base_id: b.id });
                          setOpenBase(false);
                          setSearchBase('');
                        }}
                        style={{
                          padding: '10px 12px',
                          fontSize: 13,
                          cursor: 'pointer',
                          background: formData.base_id === b.id ? '#f0f0f0' : '#fff',
                          borderBottom: '1px solid #f5f5f5',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
                        onMouseLeave={(e) => e.currentTarget.style.background = formData.base_id === b.id ? '#f0f0f0' : '#fff'}
                      >
                        {b.nome}
                      </div>
                    ))
                  ) : (
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
