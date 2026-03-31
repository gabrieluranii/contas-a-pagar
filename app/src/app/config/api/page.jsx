'use client';
import { useState, useEffect } from 'react';

export default function ApiConfigPage() {
  const [key, setKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => { setKey(localStorage.getItem('gemini_key') || ''); }, []);

  function save() {
    if (!key.trim()) return;
    localStorage.setItem('gemini_key', key.trim());
    setStatus({ text: '✓ Chave salva com sucesso!', color: 'var(--accent)' });
    setTimeout(() => setStatus(null), 3000);
  }

  function clear() {
    localStorage.removeItem('gemini_key');
    setKey('');
    setStatus({ text: 'Chave removida.', color: 'var(--warning)' });
    setTimeout(() => setStatus(null), 2000);
  }

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontFamily: 'Poppins, sans-serif', fontSize: 24, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.3px', lineHeight: 1.2 }}>Chave API</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>Configure a chave do Google Gemini para leitura de PDFs</div>
      </div>
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', maxWidth: 520 }}>
        <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text3)', marginBottom: '1.25rem' }}>Chave Google Gemini</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: '1rem', lineHeight: 1.6 }}>
          Necessária para leitura automática de boletos e notas fiscais.<br/>
          Acesse <strong>aistudio.google.com</strong> → API Keys para gerar sua chave.
        </p>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>Chave API</label>
          <input type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="AIza..." style={{ fontFamily: 'monospace', fontSize: 13 }}/>
        </div>
        {status && <div style={{ fontSize: 13, marginBottom: '1rem', color: status.color }}>{status.text}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={save} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'var(--accent)', color: '#fff', border: 'none' }}>Salvar chave</button>
          <button onClick={clear} style={{ padding: '9px 20px', fontSize: 14, fontFamily: 'inherit', borderRadius: 'var(--radius)', cursor: 'pointer', fontWeight: 500, background: 'transparent', color: 'var(--text2)', border: '1px solid var(--border2)' }}>Remover chave</button>
        </div>
        <div style={{ marginTop: '1.25rem', padding: '0.75rem 1rem', background: 'var(--warning-light)', borderRadius: 'var(--radius)', border: '1px solid rgba(201,150,26,0.3)' }}>
          <div style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 500, marginBottom: 4 }}>⚠ Segurança</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>A chave é salva apenas no seu navegador (localStorage). Nunca é enviada para nenhum servidor nosso.</div>
        </div>
      </div>
    </div>
  );
}
