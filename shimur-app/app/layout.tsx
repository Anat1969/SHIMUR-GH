import type { Metadata, Viewport } from 'next';
import { Heebo, Playfair_Display, Frank_Ruhl_Libre } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  variable: '--font-heebo',
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '700'],
});

// Playfair ללטינית, פרנק רוהל לכותרות בעברית
const frankRuhl = Frank_Ruhl_Libre({
  variable: '--font-frank',
  subsets: ['hebrew', 'latin'],
  weight: ['500', '700'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: { default: 'מורשת אשדוד — מפת אתרי השימור', template: '%s · מורשת אשדוד' },
  description: 'מפה, מסלולי סיור ותיקי תיעוד לאתרי השימור של אשדוד — עיריית אשדוד, יחידת השימור',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${playfair.variable} ${frankRuhl.variable} h-full scroll-smooth`}
    >
      <head>
        <meta name="theme-color" content="#1B6B7D" />
        <link rel="icon" href="/dolphin.svg" type="image/svg+xml" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
