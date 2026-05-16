'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, LayoutDashboard, Building2, Droplets, Printer, Truck, X, Command } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Grey Inward', href: '/dashboard/grey', icon: Building2 },
  { name: 'RFD (Dyeing)', href: '/dashboard/dyeing-house', icon: Droplets },
  { name: 'Printing', href: '/dashboard/printing-process', icon: Printer },
  { name: 'Dispatch', href: '/dashboard/dispatch', icon: Truck },
];

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const router = useRouter();

  const toggle = useCallback(() => setIsOpen(open => !open), []);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [toggle]);

  const filteredNav = navigation.filter(item => 
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  const navigate = (href: string) => {
    router.push(href);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200]"
          />
          
          <div className="fixed inset-0 z-[201] flex items-start justify-center pt-[15vh] px-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="w-full max-w-2xl bg-background/80 backdrop-blur-2xl border border-border/50 shadow-2xl rounded-3xl overflow-hidden pointer-events-auto"
            >
              {/* Search Input */}
              <div className="p-6 border-b border-border/50 flex items-center gap-4">
                <Search size={20} className="text-muted-foreground" />
                <input 
                  autoFocus
                  placeholder="Type to search modules..."
                  className="flex-1 bg-transparent border-none outline-none text-lg font-bold text-foreground placeholder:text-muted-foreground/40"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredNav.length > 0) {
                      navigate(filteredNav[0].href);
                    }
                  }}
                />
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted text-[10px] font-black text-muted-foreground border border-border/50">
                  <Command size={10} />
                  <span>K</span>
                </div>
              </div>

              {/* Results */}
              <div className="p-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                {filteredNav.length > 0 ? (
                  <div className="space-y-1">
                    {filteredNav.map((item) => (
                      <button
                        key={item.href}
                        onClick={() => navigate(item.href)}
                        className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-primary/10 group transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-muted group-hover:bg-primary/20 flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          <item.icon size={20} />
                        </div>
                        <div>
                          <div className="text-sm font-black text-foreground">{item.name}</div>
                          <div className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Jump to {item.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">No results found for "{query}"</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 bg-muted/30 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest">
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[8px]">ENTER</span>
                    <span>to select</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded bg-muted border border-border/50 text-[8px]">ESC</span>
                    <span>to close</span>
                  </div>
                </div>
                <img src="/logo.png" className="h-4 opacity-20 grayscale" alt="" />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
