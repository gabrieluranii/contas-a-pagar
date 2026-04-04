'use client';
import { AppProvider, useApp } from '@/context/AppContext';
import AuthGate from '@/components/AuthGate';
import Navbar from '@/components/Navbar';

function LoadingOverlay() {
  const { state } = useApp();
  
  if (state.loaded) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'white',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      gap: '16px'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(217, 119, 87, 0.1)',
        borderTop: '3px solid #d97757',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }} />
      <span style={{
        fontFamily: 'Poppins, sans-serif',
        fontSize: '14px',
        fontWeight: 500,
        color: '#d97757'
      }}>
        Carregando dados...
      </span>
    </div>
  );
}

export default function Providers({ children }) {
  return (
    <AppProvider>
      <LoadingOverlay />
      <AuthGate>
        <Navbar />
        <main style={{ padding: '40px' }}>
          {children}
        </main>
      </AuthGate>
    </AppProvider>
  );
}
