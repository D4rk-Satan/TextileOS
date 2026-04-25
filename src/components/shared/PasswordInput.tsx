'use client';

import React, { useState } from 'react';
import { useFormContext, RegisterOptions } from 'react-hook-form';
import { Eye, EyeOff, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface PasswordInputProps {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  rules?: RegisterOptions;
  className?: string;
}

export function PasswordInput({
  name,
  label,
  placeholder = '••••••••',
  required,
  rules,
  className,
}: PasswordInputProps) {
  const {
    register,
    watch,
    formState: { errors },
  } = useFormContext();

  const [showPassword, setShowPassword] = useState(false);
  const passwordValue = watch(name) || '';
  const error = errors[name];

  const criteria = [
    { label: 'At least 8 characters', met: passwordValue.length >= 8 },
    { label: 'Lower & Upper case letters', met: /[a-z]/.test(passwordValue) && /[A-Z]/.test(passwordValue) },
    { label: 'At least one special character', met: /[^A-Za-z0-9]/.test(passwordValue) },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col gap-1.5 w-full', className)}
    >
      <label htmlFor={name} className="text-sm font-semibold text-foreground/90 flex gap-0.5 ml-1">
        {label}
        {required && <span className="text-blue-600 font-bold">*</span>}
      </label>
      <div className="relative group">
        <input
          {...register(name, {
            required: required ? 'Password is required' : false,
            ...rules,
          })}
          id={name}
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          className={cn(
            'flex h-12 w-full rounded-xl border border-input bg-background/50 px-4 py-3 text-sm transition-all focus-within:shadow-lg focus-within:shadow-blue-500/5 pr-12',
            'placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-border'
          )}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-blue-600 transition-colors"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {/* Checklist */}
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        className="mt-2 space-y-1.5 p-3 bg-muted/30 rounded-xl border border-border/50"
      >
        <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground/70 mb-1 ml-1">Password Requirements</p>
        {criteria.map((item, index) => (
          <div key={index} className="flex items-center gap-2 ml-1">
            <div className={cn(
              "flex items-center justify-center w-4 h-4 rounded-full transition-all duration-300",
              item.met ? "bg-blue-600 text-white shadow-sm" : "bg-muted text-muted-foreground"
            )}>
              {item.met ? <Check size={10} strokeWidth={3} /> : <X size={10} strokeWidth={3} />}
            </div>
            <span className={cn(
              "text-[11px] transition-colors duration-300",
              item.met ? "text-blue-600 font-semibold" : "text-muted-foreground"
            )}>
              {item.label}
            </span>
          </div>
        ))}
      </motion.div>

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
