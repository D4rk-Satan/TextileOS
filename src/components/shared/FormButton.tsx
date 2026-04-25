'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface ButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'reset' | 'outline' | 'ghost';
}

export function FormButton({ variant = 'primary', className, children, ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:shadow-none',
    secondary: 'bg-muted/50 text-foreground hover:bg-muted/80 shadow-sm border border-border/50 font-semibold backdrop-blur-sm',
    reset: 'bg-gray-500 text-white hover:bg-gray-600 shadow-sm dark:bg-gray-700 dark:hover:bg-gray-600',
    outline: 'border-2 border-border bg-transparent hover:bg-muted text-foreground font-bold hover:border-blue-500/30 transition-all',
    ghost: 'hover:bg-muted text-foreground',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.01, y: -1 }}
      whileTap={{ scale: 0.98, y: 0 }}
      className={cn(
        'inline-flex items-center justify-center rounded-xl px-6 py-2.5 text-sm font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600/50 disabled:pointer-events-none disabled:opacity-50 h-12',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}
