import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'MADM Dashboard',
  description: 'Plataforma corporativa de indicadores operacionais e comerciais',
  icons: { icon: '/favicon.jpeg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-[#0a0f1e]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
