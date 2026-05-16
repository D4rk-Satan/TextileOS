'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function AlertModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: AlertModalProps) {
  
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const variants = {
    danger: {
      icon: <AlertTriangle className="text-red-500" size={24} />,
      bg: 'bg-red-500/10',
      button: 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/20'
    },
    warning: {
      icon: <AlertTriangle className="text-amber-500" size={24} />,
      bg: 'bg-amber-500/10',
      button: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
    },
    info: {
      icon: <AlertTriangle className="text-blue-500" size={24} />,
      bg: 'bg-blue-500/10',
      button: 'bg-blue-500 hover:bg-blue-600 text-white shadow-blue-500/20'
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250]"
          />
          
          <div className="fixed inset-0 z-[251] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-full max-w-md bg-background border border-border shadow-2xl rounded-[2rem] overflow-hidden pointer-events-auto"
            >
              <div className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", variants[variant].bg)}>
                    {variants[variant].icon}
                  </div>
                  <h2 className="text-xl font-black text-foreground tracking-tight">{title}</h2>
                </div>
                
                <p className="text-muted-foreground font-medium leading-relaxed mb-8">
                  {description}
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 h-12 rounded-xl font-bold text-muted-foreground hover:bg-muted transition-all"
                  >
                    {cancelText}
                  </button>
                  <button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    className={cn(
                      "flex-1 h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]",
                      variants[variant].button
                    )}
                  >
                    {confirmText}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
