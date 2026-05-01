'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormHeaderProps {
  title: string;
  icon: LucideIcon;
  color?: 'blue' | 'indigo' | 'purple' | 'emerald' | 'orange';
  className?: string;
}

export function FormHeader({ title, icon: Icon, color = 'blue', className }: FormHeaderProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-600/10 text-blue-600',
    indigo: 'bg-indigo-600/10 text-indigo-600',
    purple: 'bg-purple-600/10 text-purple-600',
    emerald: 'bg-emerald-600/10 text-emerald-600',
    orange: 'bg-orange-600/10 text-orange-500',
  };

  return (
    <div className={cn("flex items-center gap-3 mb-8 border-b border-border/50 pb-4", className)}>
      <div className={cn("p-2 rounded-xl", colorClasses[color])}>
        <Icon size={20} />
      </div>
      <h3 className="text-xl font-black text-foreground tracking-tight uppercase">
        {title}
      </h3>
    </div>
  );
}
