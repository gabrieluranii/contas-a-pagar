import './globals.css';
import { AppProvider } from '@/context/AppContext';
import AuthGate from '@/components/AuthGate';
import Navbar from '@/components/Navbar';


export const metadata = {
  title: 'Contas a Pagar',
  description: 'Sistema de gestão de contas a pagar e receber',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProvider>
          <AuthGate>
            <Navbar />
            <main style={{ padding: '40px' }}>
              {children}
            </main>
          </AuthGate>
        </AppProvider>
      </body>
    </html>
  );
}
