'use client';

import React from 'react';
import { useFormContext, Controller, RegisterOptions } from 'react-hook-form';
import { cn } from '@/lib/utils';

import { LucideIcon } from 'lucide-react';

interface PhoneInputProps {
  name: string;
  label: string;
  required?: boolean;
  icon?: LucideIcon;
  rules?: RegisterOptions;
  className?: string;
}

const countryCodes = [
  { code: '+1', country: 'US' },
  { code: '+91', country: 'IN' },
  { code: '+44', country: 'UK' },
  { code: '+61', country: 'AU' },
  { code: '+971', country: 'AE' },
  { code: '+65', country: 'SG' },
];

export function PhoneInput({ name, label, required, icon: Icon, rules, className }: PhoneInputProps) {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors[name];

  return (
    <div className={cn('flex flex-col gap-0.5 w-full', className)}>
      <label htmlFor={name} className="text-xs font-semibold text-foreground/80 flex gap-0.5 ml-1">
        {label}
        {required && <span className="text-blue-600 font-bold">*</span>}
      </label>
      <div className="flex gap-2 relative group">
        <div className="relative min-w-[100px]">
          <select
            className="flex h-11 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 appearance-none cursor-pointer font-bold shadow-sm"
            defaultValue="+91"
          >
            {countryCodes.map((c) => (
              <option key={c.code} value={c.code} className="bg-card">
                {c.code} ({c.country})
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground/50">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
        
        <div className="relative flex-1">
          {Icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-blue-600 transition-colors pointer-events-none">
              <Icon size={16} />
            </div>
          )}
          <Controller
            name={name}
            control={control}
            rules={{ 
              required: required ? 'Phone number is required' : false,
              ...rules 
            }}
            render={({ field }) => (
              <input
                {...field}
                type="tel"
                placeholder="00000 00000"
                className={cn(
                  'flex h-11 w-full rounded-xl border border-border bg-card py-2 text-sm transition-all placeholder:text-muted-foreground/50 outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm font-medium',
                  Icon ? 'pl-11 pr-4' : 'px-4',
                  error ? 'border-red-500/50 focus:ring-red-500/10' : 'hover:border-blue-500/50'
                )}
              />
            )}
          />
        </div>
      </div>
      {error && (
        <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-0.5">
          {error.message as string}
        </span>
      )}
    </div>
  );
}

