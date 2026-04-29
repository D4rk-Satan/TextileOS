'use client';

import React from 'react';
import { useFormContext, RegisterOptions } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ChevronDown, LucideIcon } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  name: string;
  label: string;
  options: { label: string; value: string }[];
  required?: boolean;
  icon?: LucideIcon;
  placeholder?: string;
  rules?: RegisterOptions;
  variant?: 'light' | 'dark';
  showPlaceholder?: boolean;
}

export function FormSelect({ name, label, options, required, icon: Icon, placeholder, rules, className, variant = 'light', showPlaceholder = true, ...props }: SelectProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col gap-0.5 w-full', className)}
      suppressHydrationWarning
    >
      <label htmlFor={name} className="text-xs font-semibold text-foreground/80 flex gap-0.5 ml-1">
        {label}
        {required && <span className="text-blue-600 font-bold">*</span>}
      </label>
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-600 transition-colors pointer-events-none">
            <Icon size={16} />
          </div>
        )}
        <select
          {...register(name, { 
            required: required ? 'This field is required' : false,
            ...rules 
          })}
          id={name}
          className={cn(
            'flex h-9 w-full rounded-lg border border-border py-2 text-sm transition-all appearance-none cursor-pointer',
            'placeholder:text-muted-foreground outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            variant === 'dark' ? 'bg-black/60 dark:bg-black/40 border-border/50' : 'bg-white/50 dark:bg-black/20',
            Icon ? 'pl-9 pr-9' : 'px-3 pr-9',
            error ? 'border-red-500 focus:ring-red-500/10 focus:border-red-500' : 'hover:border-blue-400 dark:hover:border-blue-500'
          )}
          {...props}
        >
          {showPlaceholder && (
            <option value="" className="bg-card">{placeholder || 'Select an option'}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-card">
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground group-hover:text-blue-600 transition-colors">
          <ChevronDown size={16} />
        </div>
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
