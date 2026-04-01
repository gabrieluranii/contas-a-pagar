import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'Contas a Pagar',
  description: 'Sistema de gestão de contas a pagar e receber',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
