'use client';
import { AppProvider } from '@/context/AppContext';
import AuthGate from '@/components/AuthGate';
import Navbar from '@/components/Navbar';

export default function Providers({ children }) {
  return (
    <AppProvider>
      <AuthGate>
        <Navbar />
        <main style={{ padding: '40px' }}>
          {children}
        </main>
      </AuthGate>
    </AppProvider>
  );
}
