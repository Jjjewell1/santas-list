import type { Metadata, Viewport } from 'next';
import { Fredoka, Nunito } from 'next/font/google';
import FestiveLayer from '@/components/FestiveLayer';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';
import './globals.css';

const fredoka = Fredoka({ subsets: ['latin'], variable: '--font-fredoka' });
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' });

export const metadata: Metadata = {
  title: { default: "Santa's List", template: '%s · Santa\u2019s List' },
  description: 'The family Christmas wish-list app.',
  icons: { icon: '/icons/icon-192.png', apple: '/icons/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: "Santa's List", statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0a2f24',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fredoka.variable} ${nunito.variable}`}>
      <body className="min-h-screen">
        <FestiveLayer />
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
