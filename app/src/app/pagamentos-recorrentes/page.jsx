'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { sb, getUser } from '@/lib/supabase';
import RecurringPaymentModal from '@/components/RecurringPaymentModal';
import ConfirmModal from '@/components/ConfirmModal';

const fmt = (v) => {
  const n = parseFloat(v);
  if (isNaN(n)) return '—';
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      background: toast.color, color: '#fff',
      padding: '12px 20px', borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      fontSize: 13, fontWeight: 500,
      animation: 'slideUp 0.2s ease-out',
    }}>
      {toast.msg}
    </div>
  );
}

function Spinner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2rem 0', color: 'var(--text3)', fontSize: 13 }}>
      <div style={{
        width: 20, height: 20,
        border: '2px solid rgba(217, 119, 87, 0.15)',
        borderTop: '2px solid #d97757',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
      }} />
      Carregando pagamentos recorrentes...
    </div>
  );
}

function Toggle({ active, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      title={active ? 'Ativo — clique para desativar' : 'Inativo — clique para ativar'}
      style={{
        width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer',
        background: active ? 'var(--accent)' : '#d0d0cc',
        position: 'relative', transition: 'background 0.2s',
        opacity: disabled ? 0.6 : 1,
        padding: 0,
        flexShrink: 0,
      }}
    >
      <span style={{
        position: 'absolute', top: 3, left: active ? 21 : 3,
        width: 16, height: 16, borderRadius: '50%', background: '#fff',
        transition: 'left 0.2s', display: 'block',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

export default function PagamentosRecorrentesPage() {
  const { state, dispatch } = useApp();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [confirmCfg, setConfirmCfg] = useState({ isOpen: false, message: '', onConfirm: null });
  const [toast, setToast] = useState(null);
  const [loadingId, setLoadingId] = useState(null);

  const showToast = (msg, color = 'var(--accent)') => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  async function addPayment(data) {
    try {
      const payload = { ...data, active: true };
      if (sb) {
        const user = await getUser();
        if (!user) throw new Error('Usuário não autenticado.');
        const { data: created, error } = await sb
          .from('recurring_payments')
          .insert({ ...payload, user_id: user.id })
          .select(`
            *,
            suppliers!inner(name),
            bases!inner(nome)
          `)
          .single();
        if (error) throw error;
        const mapped = {
          ...created,
          supplier_name: created.suppliers?.name || '—',
          base_name: created.bases?.nome || '—',
        };
        dispatch({ type: 'ADD_RECURRING_PAYMENT', payload: mapped });
      } else {
        dispatch({ type: 'ADD_RECURRING_PAYMENT', payload: { ...payload, id: Date.now(), created_at: new Date().toISOString() } });
      }
      showToast('Pagamento recorrente criado com sucesso!');
    } catch (err) {
      showToast('Erro ao criar: ' + err.message, 'var(--danger)');
      throw err;
    }
  }

  async function updatePayment(id, data) {
    try {
      if (sb) {
        const { data: updated, error } = await sb
          .from('recurring_payments')
          .update(data)
          .eq('id', id)
          .select(`
            *,
            suppliers!inner(name),
            bases!inner(nome)
          `)
          .single();
        if (error) throw error;
        const mapped = {
          ...updated,
          supplier_name: updated.suppliers?.name || '—',
          base_name: updated.bases?.nome || '—',
        };
        dispatch({ type: 'UPDATE_RECURRING_PAYMENT', payload: mapped });
      } else {
        const existing = state.recurringPayments.find(p => p.id === id);
        dispatch({ type: 'UPDATE_RECURRING_PAYMENT', payload: { ...existing, ...data } });
      }
      showToast('Pagamento atualizado com sucesso!');
    } catch (err) {
      showToast('Erro ao atualizar: ' + err.message, 'var(--danger)');
      throw err;
    }
  }

  async function deletePayment(id) {
    setLoadingId(id);
    try {
      if (sb) {
        const { error } = await sb.from('recurring_payments').delete().eq('id', id);
        if (error) throw error;
      }
      dispatch({ type: 'DELETE_RECURRING_PAYMENT', payload: id });
      showToast('Pagamento removido.');
    } catch (err) {
      showToast('Erro ao remover: ' + err.message, 'var(--danger)');
    } finally {
      setLoadingId(null);
    }
  }

  async function togglePayment(payment) {
    const newActive = !payment.active;
    setLoadingId(payment.id);
    try {
      if (sb) {
        const { error } = await sb
          .from('recurring_payments')
          .update({ active: newActive })
          .eq('id', payment.id);
        if (error) throw error;
      }
      dispatch({ type: 'TOGGLE_RECURRING_PAYMENT', payload: { id: payment.id, active: newActive } });
      showToast(newActive ? 'Pagamento ativado.' : 'Pagamento desativado.', newActive ? 'var(--accent)' : '#888');
    } catch (err) {
      showToast('Erro: ' + err.message, 'var(--danger)');
    } finally {
      setLoadingId(null);
    }
  }

  function handleEdit(payment) {
    setEditingPayment(payment);
    setModalOpen(true);
  }

  function handleNew() {
    setEditingPayment(null);
    setModalOpen(true);
  }

  async function handleSave(data) {
    if (editingPayment) {
      await updatePayment(editingPayment.id, data);
    } else {
      await addPayment(data);
    }
  }

  const payments = state.recurringPayments || [];

  const TH = ({ children, w }) => (
    <th style={{
      background: '#d97757', color: '#fff',
      fontFamily: 'Poppins, sans-serif', fontSize: 11, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '1px',
      padding: '12px 12px', textAlign: 'left',
      whiteSpace: 'nowrap', width: w,
    }}>{children}</th>
  );

  const TD = ({ children, center }) => (
    <td style={{
      fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#333',
      padding: '10px 12px', borderBottom: '1px solid #eeeeec',
      textAlign: center ? 'center' : 'left',
      verticalAlign: 'middle',
    }}>{children}</td>
  );

  return (
    <div>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes slideUp { from { transform: translateY(16px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>

      <Toast toast={toast} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>
            Pagamentos Recorrentes
          </div>
          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: 13, color: '#777', marginTop: 4 }}>
            Gerencie cobranças e despesas fixas mensais
          </div>
        </div>
        <button
          onClick={handleNew}
          style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: '#d97757', color: '#fff', border: 'none', whiteSpace: 'nowrap' }}
        >
          + Novo Pagamento
        </button>
      </div>

      {/* Error */}
      {state.recurringError && (
        <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: 'var(--radius)', fontSize: 13, marginBottom: '1rem', border: '1px solid var(--danger)' }}>
          ✕ Erro ao sincronizar: {state.recurringError}
        </div>
      )}

      {/* Loading */}
      {state.loadingRecurring && <Spinner />}

      {/* Table */}
      {!state.loadingRecurring && (
        <div style={{ border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface)', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ tableLayout: 'fixed', width: '100%', minWidth: 700, borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <TH w="25%">Fornecedor</TH>
                  <TH w="20%">Centro de Custo</TH>
                  <TH w="10%">Dia</TH>
                  <TH w="13%">Valor</TH>
                  <TH w="12%">Status</TH>
                  <TH w="100px">Ações</TH>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: '#777', fontFamily: 'Inter, sans-serif', fontSize: 13 }}>
                      Nenhum pagamento recorrente cadastrado.
                    </td>
                  </tr>
                )}
                {payments.map((p, idx) => (
                  <tr key={p.id} style={{ background: idx % 2 === 0 ? '#ffffff' : '#f7f7f5', transition: 'background 0.12s' }}>
                    <TD>
                      <span style={{ fontWeight: 500, color: '#1a1a1a' }}>{p.supplier_name || '—'}</span>
                    </TD>
                    <TD>{p.base_name || '—'}</TD>
                    <TD center>
                      <span style={{ fontFamily: 'monospace', fontSize: 13, background: '#f0f0ee', borderRadius: 4, padding: '2px 8px' }}>
                        Dia {p.day_of_month}
                      </span>
                    </TD>
                    <TD>
                      <span style={{ fontWeight: 500, fontVariantNumeric: 'tabular-nums' }}>{fmt(p.value)}</span>
                    </TD>
                    <TD center>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, justifyContent: 'center' }}>
                        <Toggle
                          active={p.active !== false}
                          onChange={() => togglePayment(p)}
                          disabled={loadingId === p.id}
                        />
                        <span style={{ fontSize: 11, color: p.active !== false ? 'var(--accent)' : '#999', fontWeight: 500 }}>
                          {p.active !== false ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                    </TD>
                    <TD center>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button
                          onClick={() => handleEdit(p)}
                          disabled={loadingId === p.id}
                          title="Editar"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d97757', padding: 4 }}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button
                          onClick={() => setConfirmCfg({
                            isOpen: true,
                            message: `Remover "${p.supplier_name}"?`,
                            onConfirm: () => deletePayment(p.id),
                          })}
                          disabled={loadingId === p.id}
                          title="Remover"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cc4444', padding: 4, fontSize: 14, lineHeight: 1 }}
                        >
                          ✕
                        </button>
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {payments.length > 0 && (
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', fontFamily: 'Inter, sans-serif', fontSize: 12, color: '#999', display: 'flex', justifyContent: 'space-between' }}>
              <span>{payments.length} pagamento{payments.length !== 1 ? 's' : ''} recorrente{payments.length !== 1 ? 's' : ''}</span>
              <span style={{ fontWeight: 500, color: '#555' }}>
                Total ativo mensal: {fmt(payments.filter(p => p.active !== false).reduce((s, p) => s + (parseFloat(p.value) || 0), 0))}
              </span>
            </div>
          )}
        </div>
      )}

      <RecurringPaymentModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingPayment(null); }}
        onSave={handleSave}
        editingPayment={editingPayment}
      />

      <ConfirmModal
        isOpen={confirmCfg.isOpen}
        message={confirmCfg.message}
        onConfirm={confirmCfg.onConfirm}
        onCancel={() => setConfirmCfg(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
