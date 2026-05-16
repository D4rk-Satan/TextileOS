import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { CommandPalette } from '@/components/shared/CommandPalette';
import { Toaster } from 'sonner';

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TextileOS',
  description: 'Next-gen Textile Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={jakarta.className}>
        <ThemeProvider>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <CommandPalette />
            <main>
              {children}
            </main>
            <Toaster position="top-right" richColors closeButton />
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
