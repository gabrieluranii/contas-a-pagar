'use client';
import { useState, useEffect, useRef } from 'react';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/Modal';
import { fmt, fmtDate } from '@/lib/utils';

export default function SuccessLancModal({ open, onClose, lanc }) {
  const { state } = useApp();
  const [stage, setStage] = useState('checking');

  useEffect(() => {
    if (!open || !lanc) return;
    setStage('checking');
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      const found = state.lancamentos.some(l => l.id === lanc.id);
      if (found || attempts >= 10) {
        clearInterval(interval);
        setStage('success');
      }
    }, 200);
    return () => clearInterval(interval);
  }, [open, lanc]); // eslint-disable-line

  if (!lanc) return null;

  return (
    <Modal open={open} onClose={onClose} title="">
      <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
        {stage === 'checking' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <style>{`@keyframes _spin { to { transform: rotate(360deg); } }`}</style>
            <div style={{ width: 48, height: 48, borderRadius: '50%', border: '3px solid var(--border2)', borderTop: '3px solid #d97757', animation: '_spin 0.8s linear infinite' }}/>
            <span style={{ fontSize: 14, color: 'var(--text2)' }}>Verificando lançamento...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <style>{`@keyframes _scaleIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#e6f4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: '_scaleIn 0.25s ease' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2d7a4f" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 18, fontWeight: 600, color: '#1a1a1a' }}>
              Lançamento adicionado!
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1rem 1.25rem', width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Fornecedor', value: lanc.supplier || '—' },
                { label: 'Valor',      value: fmt(lanc.value) },
                { label: 'CC Pgto',    value: lanc.ccpgto || '—' },
                { label: 'Data Solic.',value: fmtDate(lanc.soldate) },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: 'var(--text3)', fontWeight: 500 }}>{label}</span>
                  <span style={{ color: 'var(--text)' }}>{value}</span>
                </div>
              ))}
            </div>
            <button onClick={onClose} style={{ marginTop: 4, padding: '9px 28px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: '#d97757', color: '#fff', border: 'none', width: '100%' }}>
              Fechar
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
