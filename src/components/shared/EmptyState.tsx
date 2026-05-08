'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FormButton } from './FormButton';
import { Plus, Import } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  onAdd?: () => void;
  onImport?: () => void;
  icon?: React.ReactNode;
  actionLabel?: string;
}

export function EmptyState({
  title = "There are no records in this report.",
  description = "Get started by adding your first record or importing from a file.",
  onAdd,
  onImport,
  icon,
  actionLabel = "Add a Record"
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center animate-in fade-in zoom-in duration-700">
      <div className="relative mb-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          className="w-56 h-56 bg-primary/5 rounded-[4rem] flex items-center justify-center border border-primary/10 relative overflow-hidden shadow-inner"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-10 right-10 w-3 h-3 bg-primary rounded-full blur-[1px]" />
            <div className="absolute bottom-16 left-10 w-4 h-4 bg-primary/40 rounded-full blur-[2px]" />
            <div className="absolute top-1/2 left-8 w-6 h-1 bg-primary/20 -rotate-12 rounded-full" />
          </div>
          
          {icon || (
            <div className="relative flex flex-col items-center">
               <div className="w-28 h-20 bg-background/80 backdrop-blur-md border border-border rounded-2xl flex flex-col p-3 gap-2 shadow-2xl">
                  <div className="w-6 h-6 bg-primary/10 rounded-lg" />
                  <div className="w-14 h-1.5 bg-muted rounded-full" />
                  <div className="w-10 h-1.5 bg-muted/60 rounded-full" />
               </div>
               <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-primary-foreground border-4 border-background shadow-xl shadow-primary/30">
                 <Plus size={20} strokeWidth={3} />
               </div>
            </div>
          )}
        </motion.div>
        
        {/* Floating icons */}
        <motion.div 
          animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }} 
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className="absolute -top-6 -left-6 p-3 bg-background rounded-2xl border border-border shadow-lg text-primary"
        >
          <Plus size={18} strokeWidth={3} />
        </motion.div>
      </div>

      <h3 className="text-3xl font-black text-foreground mb-4 tracking-tighter uppercase">
        {title}
      </h3>
      <p className="text-muted-foreground font-bold max-w-sm mx-auto mb-12 text-sm leading-relaxed opacity-60">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {onAdd && (
          <button 
            onClick={onAdd}
            className="px-10 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-black shadow-2xl shadow-primary/20 text-xs uppercase tracking-widest flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group"
          >
            {actionLabel}
            <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500" />
          </button>
        )}
        
        {onImport && (
          <button 
            onClick={onImport}
            className="px-10 h-14 bg-muted/30 hover:bg-muted/50 text-foreground rounded-2xl font-black border border-border shadow-sm text-xs uppercase tracking-widest flex items-center gap-3 transition-all hover:scale-105 active:scale-95 group"
          >
            Import Data
            <Import size={18} strokeWidth={2.5} className="group-hover:-translate-y-1 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}
