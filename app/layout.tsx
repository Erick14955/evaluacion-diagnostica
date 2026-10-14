import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Actividad RT-03',
  description: 'Actividad interactiva RT-03'
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}