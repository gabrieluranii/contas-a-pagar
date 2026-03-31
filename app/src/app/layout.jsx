import './globals.css';
import { AppProvider } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import { APP_VERSION, THEME } from '@/lib/version';

export const metadata = {
  title: 'Contas a Pagar',
  description: 'Sistema de gestão de contas a pagar e receber',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <AppProvider>
          <Navbar />
          <main style={{ padding: '40px' }}>
            {children}
          </main>
          <footer className="app-version-footer">
            <span className="app-version-footer__dot" />
            <span>v{APP_VERSION}</span>
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
