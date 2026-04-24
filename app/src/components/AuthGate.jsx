'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { sb, isSupabaseConfigured } from '@/lib/supabase';

const THEME = {
  bg: '#f8f8f8',
  surface: '#ffffff',
  border: '#e8e8e5',
  text: '#111111',
  textSec: '#666666',
  accent: '#d97757',
};

export default function AuthGate({ children }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push('/');
    }
    setLoading(false);
  };

  if (!isSupabaseConfigured()) return children;
  if (loading) return null;

  if (!session) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        backgroundImage: "url('https://replicate.delivery/xpbkg/O5K8n6N6sNfA5O0O0O0O0O0O0O0O0O0O0O0O0O0O0O0O0O0O0/output.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        fontFamily: 'Inter, sans-serif'
      }}>
        <div style={{
          background: '#f0eeeb', border: `1px solid ${THEME.border}`,
          padding: '2rem', borderRadius: 12, width: '100%', maxWidth: 400,
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}>
          <h2 style={{ margin: '0 0 1.5rem', fontFamily: 'Poppins, sans-serif', color: THEME.text, textAlign: 'center' }}>
            Entrar no Sistema
          </h2>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: THEME.textSec }}>E-mail</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                style={{
                  padding: '10px 12px', border: `1px solid ${THEME.border}`, borderRadius: 6,
                  fontSize: 14, outline: 'none', transition: 'border 0.2s'
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 13, fontWeight: 500, color: THEME.textSec }}>Senha</label>
              <input
                type="password" required value={password} onChange={e => setPassword(e.target.value)}
                style={{
                  padding: '10px 12px', border: `1px solid ${THEME.border}`, borderRadius: 6,
                  fontSize: 14, outline: 'none', transition: 'border 0.2s'
                }}
              />
            </div>

            {errorMsg && (
              <div style={{ fontSize: 13, color: '#d32f2f', background: '#ffebee', padding: '8px 12px', borderRadius: 6, marginTop: 4 }}>
                {errorMsg}
              </div>
            )}

            <button type="submit" disabled={loading} style={{
              background: THEME.accent, color: '#fff', border: 'none', borderRadius: 6,
              padding: '10px', fontSize: 14, fontWeight: 600, marginTop: '0.5rem', cursor: 'pointer',
              opacity: loading ? 0.7 : 1
            }}>
              {loading ? 'Aguarde...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return children;
}
