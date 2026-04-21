'use client';
import { useApp } from '@/context/AppContext';
import { useState } from 'react';
import ConfirmModal from '@/components/ConfirmModal';

export default function CategoriasPage() {
  const { state, dispatch } = useApp();
  const [input, setInput] = useState('');
  const [confirmCfg, setConfirmCfg] = useState({ isOpen: false, message: '', onConfirm: null });

  function handleAdd() {
    const val = input.trim();
    if (val && !state.cats.includes(val)) {
      dispatch({ type: 'ADD_CAT', payload: val });
      setInput('');
    }
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Categorias</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Gerencie as categorias de despesa</div>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', maxWidth: 520 }}>
        <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text3)', marginBottom: '1.25rem' }}>
          Categorias de despesa
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1rem', minHeight: 32 }}>
          {state.cats.length ? state.cats.map((c, i) => (
            <div key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 10px', fontSize: 13 }}>
              {c}
              <button
                onClick={() => setConfirmCfg({
                  isOpen: true,
                  message: `Remover "${c}"?`,
                  onConfirm: () => dispatch({ type: 'REMOVE_CAT', idx: i }),
                })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 13, padding: 0, lineHeight: 1 }}
              >✕</button>
            </div>
          )) : <span style={{ fontSize: 13, color: 'var(--text3)' }}>Nenhuma categoria cadastrada</span>}
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
            placeholder="Nova categoria..."
            style={{ flex: 1 }}
          />
          <button
            onClick={handleAdd}
            style={{ padding: '9px 16px', fontSize: 13, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' }}
          >Adicionar</button>
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
