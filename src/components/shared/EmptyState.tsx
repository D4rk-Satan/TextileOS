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
    <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
      <div className="relative mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-48 h-48 bg-muted/30 rounded-[3rem] flex items-center justify-center border-2 border-dashed border-border/50 relative overflow-hidden"
        >
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-4 right-4 w-2 h-2 bg-foreground rounded-full" />
            <div className="absolute bottom-10 left-6 w-3 h-3 bg-blue-500 rounded-full" />
            <div className="absolute top-1/2 left-4 w-4 h-0.5 bg-foreground rotate-45" />
          </div>
          
          {icon || (
            <div className="relative flex flex-col items-center">
               <div className="w-24 h-16 bg-card border-2 border-border rounded-xl flex flex-col p-2 gap-1.5 shadow-sm">
                  <div className="w-4 h-4 bg-muted rounded-sm" />
                  <div className="w-10 h-1 bg-muted rounded-full" />
                  <div className="w-8 h-1 bg-muted rounded-full" />
               </div>
               <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white border-4 border-background">
                 <Plus size={16} strokeWidth={3} />
               </div>
            </div>
          )}
        </motion.div>
        
        {/* Floating icons */}
        <motion.div 
          animate={{ y: [0, -10, 0] }} 
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className="absolute -top-4 -left-4 p-2 bg-card rounded-lg border border-border shadow-sm text-blue-500"
        >
          <Plus size={16} />
        </motion.div>
      </div>

      <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight uppercase">
        {title}
      </h3>
      <p className="text-muted-foreground font-medium max-w-sm mx-auto mb-10 italic">
        {description}
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {onAdd && (
          <FormButton 
            onClick={onAdd}
            variant="primary" 
            className="px-8 py-4 rounded-full font-black shadow-xl shadow-blue-600/20 text-lg flex items-center gap-2 group"
          >
            {actionLabel}
            <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </FormButton>
        )}
        
        {onImport && (
          <button 
            onClick={onImport}
            className="px-8 py-4 rounded-full font-bold border-2 border-border bg-background hover:bg-muted transition-all text-lg text-muted-foreground flex items-center gap-2"
          >
            Import
            <Import size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
