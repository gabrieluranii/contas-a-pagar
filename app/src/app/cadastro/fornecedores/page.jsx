'use client';
import { useApp } from '@/context/AppContext';
import { useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';
import { sb, getUser } from '@/lib/supabase';

export default function FornecedoresPage() {
  const { state, dispatch } = useApp();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [confirmCfg, setConfirmCfg] = useState({ isOpen: false, message: '', onConfirm: null });

  const showToast = (msg, color) => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  async function handleAdd() {
    const val = input.trim();
    if (!val) return;
    if (state.fornecedores.includes(val)) {
      showToast('Fornecedor já cadastrado!', 'var(--warning)');
      return;
    }

    setLoading(true);
    try {
      if (sb) {
        const user = await getUser();
        if (!user) throw new Error('Usuário não autenticado no Supabase.');
        const { error } = await sb
          .from('suppliers')
          .insert({ name: val, user_id: user.id });

        if (error) throw error;
      }
      
      dispatch({ type: 'ADD_FORNECEDOR', payload: val });
      setInput('');
      showToast('Fornecedor cadastrado com sucesso!', 'var(--accent)');
    } catch (err) {
      console.error(err);
      showToast('Erro ao cadastrar: ' + err.message, 'var(--danger)');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(val) {
    setLoading(true);
    try {
      if (sb) {
        const user = await getUser();
        if (!user) throw new Error('Usuário não autenticado no Supabase.');
        const { error } = await sb
          .from('suppliers')
          .delete()
          .eq('name', val)
          .eq('user_id', user.id);

        if (error) throw error;
      }
      
      dispatch({ type: 'REMOVE_FORNECEDOR', payload: val });
      showToast('Fornecedor removido com sucesso!', 'var(--accent)');
    } catch (err) {
      console.error(err);
      showToast('Erro ao remover: ' + err.message, 'var(--danger)');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
          background: toast.color, color: '#fff',
          padding: '12px 20px', borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: 13, fontWeight: 500,
          animation: 'slideUp 0.2s ease-out'
        }}>
          {toast.msg}
        </div>
      )}

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Fornecedores</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Gerencie os fornecedores</div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', maxWidth: 520 }}>
        <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text3)', marginBottom: '1.25rem' }}>
          Fornecedores cadastrados
        </div>

        {state.supplierError && (
          <div style={{
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '10px 14px',
            borderRadius: 'var(--radius)',
            fontSize: 13,
            marginBottom: '1rem',
            border: '1px solid var(--danger)'
          }}>
            ✕ Erro ao sincronizar: {state.supplierError}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem', minHeight: 32, alignItems: 'center' }}>
          {state.loadingSuppliers ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: '18px',
                height: '18px',
                border: '2px solid rgba(217, 119, 87, 0.1)',
                borderTop: '2px solid #d97757',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{ fontSize: 13, color: 'var(--text3)' }}>Carregando fornecedores...</span>
            </div>
          ) : state.fornecedores?.length ? state.fornecedores.map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px', fontSize: 13 }}>
              {f}
              <button
                disabled={loading}
                onClick={() => setConfirmCfg({ isOpen: true, message: `Remover "${f}"?`, onConfirm: () => handleRemove(f) })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 13, padding: 0, lineHeight: 1 }}
              >✕</button>
            </div>
          )) : <span style={{ fontSize: 13, color: 'var(--text3)' }}>Nenhum fornecedor cadastrado</span>}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            disabled={loading || state.loadingSuppliers}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="Novo fornecedor..."
            style={{ flex: 1 }}
          />
          <button
            onClick={handleAdd}
            disabled={loading || state.loadingSuppliers}
            style={{ padding: '9px 16px', fontSize: 13, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)', opacity: (loading || state.loadingSuppliers) ? 0.6 : 1 }}
          >
            {loading ? 'Adicionando...' : 'Adicionar'}
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmCfg.isOpen}
        message={confirmCfg.message}
        onConfirm={confirmCfg.onConfirm}
        onCancel={() => setConfirmCfg(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

