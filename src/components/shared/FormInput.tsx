'use client';

import React from 'react';
import { useFormContext, RegisterOptions } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label: string;
  required?: boolean;
  icon?: LucideIcon;
  rules?: RegisterOptions;
}

export function FormInput({ name, label, required, icon: Icon, rules, className, ...props }: InputProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.995 }}
      className={cn('flex flex-col gap-1.5 w-full', className)}
      suppressHydrationWarning
    >
      <label htmlFor={name} className="text-sm font-semibold text-foreground/90 flex gap-0.5 ml-1">
        {label}
        {required && <span className="text-blue-600 font-bold">*</span>}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-600 transition-colors pointer-events-none">
            <Icon size={18} />
          </div>
        )}
        <input
          {...register(name, { 
            required: required ? 'This field is required' : false,
            ...rules 
          })}
          id={name}
          className={cn(
            'flex h-12 w-full rounded-xl border border-border bg-white/50 dark:bg-black/20 py-3 text-sm transition-all',
            'placeholder:text-muted-foreground outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            Icon ? 'pl-11 pr-4' : 'px-4',
            error ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'hover:border-blue-400 dark:hover:border-blue-500'
          )}
          {...props}
        />
        <div className="absolute inset-0 rounded-xl bg-blue-500/0 group-hover:bg-blue-500/[0.02] pointer-events-none transition-colors" />
      </div>
      {error && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-0.5"
        >
          {error.message as string}
        </motion.span>
      )}
    </motion.div>
  );
}
