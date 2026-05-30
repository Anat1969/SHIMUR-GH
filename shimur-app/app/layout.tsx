import type { Metadata, Viewport } from 'next';
import { Heebo, Playfair_Display } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  variable: '--font-heebo',
  subsets: ['hebrew', 'latin'],
  weight: ['300', '400', '500', '700'],
});

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'SHIMUR.ASHDOD — מערכת ניהול מורשת בנויה',
  description: 'ממשק ניהול תיקי תיעוד שימור למורשת בנויה בעיריית אשדוד',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
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
      className={`${heebo.variable} ${playfair.variable} h-full scroll-smooth`}
    >
      <head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#C8B89A" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
