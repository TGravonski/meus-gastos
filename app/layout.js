import './globals.css';

export const metadata = { title: 'Meus Gastos', description: 'Controle financeiro pessoal com clareza e simplicidade.' };
export const viewport = { width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}

