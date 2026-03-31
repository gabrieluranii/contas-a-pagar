'use client';
import { useEffect, useRef } from 'react';

export default function Modal({ open, onClose, title, children, wide = false, fullOnMobile = true }) {
  const bgRef = useRef(null);

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={bgRef}
      onClick={(e) => { if (e.target === bgRef.current) onClose?.(); }}
      style={{
        display: 'flex', position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.4)', zIndex: 100,
        alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div className="sys-modal" style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        padding: '2rem',
        width: wide ? 720 : 480,
        maxWidth: '96vw',
        border: '1px solid var(--border)',
        maxHeight: '94vh',
        overflowY: 'auto',
        position: 'relative',
      }}>
        {title && (
          <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 18, fontWeight: 600, color: '#1a1a1a', opacity: 1, marginBottom: '1.25rem', letterSpacing: '-0.2px' }}>
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
