import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TextileOS',
  description: 'Role-based registration for Admin, Customer, and Vendor',
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
            <main>
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
