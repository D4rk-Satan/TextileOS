'use client';

import React from 'react';
import { useFormContext, Controller, RegisterOptions } from 'react-hook-form';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  name: string;
  label: string;
  required?: boolean;
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

export function PhoneInput({ name, label, required, rules, className }: PhoneInputProps) {
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
      <div className="flex gap-2">
        <div className="relative min-w-[90px]">
          <select
            className="flex h-9 w-full rounded-lg border border-border bg-white/50 dark:bg-black/20 px-2 py-2 text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 appearance-none cursor-pointer"
            defaultValue="+91"
          >
            {countryCodes.map((c) => (
              <option key={c.code} value={c.code} className="bg-card">
                {c.code} ({c.country})
              </option>
            ))}
          </select>
        </div>
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
                'flex h-9 w-full rounded-lg border border-border bg-white/50 dark:bg-black/20 px-3 py-2 text-sm transition-all placeholder:text-muted-foreground outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50',
                error ? 'border-red-500 focus:ring-red-500/10' : 'hover:border-blue-400 dark:hover:border-blue-500'
              )}
            />
          )}
        />
      </div>
      {error && (
        <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider ml-1 mt-0.5">
          {error.message as string}
        </span>
      )}
    </div>
  );
}
