'use client';

import React from 'react';
import { Search, LucideIcon } from 'lucide-react';
import { HeaderPortal } from './HeaderPortal';

interface ModuleHeaderProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  actionButton?: React.ReactNode;
}

export function ModuleHeader({
  title,
  subtitle = "Module",
  icon: Icon,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
  actionButton
}: ModuleHeaderProps) {
  return (
    <HeaderPortal>
      <div className="flex items-center justify-between w-full h-full">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
             <Icon size={20} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-black text-foreground capitalize tracking-tight leading-none mb-1">
              {title}
            </h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
               <span>{subtitle}</span>
               <div className="w-1 h-1 rounded-full bg-border" />
               <span>Directory</span>
            </div>
          </div>
        </div>

        {showSearch && (
          <div className="relative flex-1 max-w-lg hidden lg:block mx-8 group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-primary transition-colors">
              <Search size={18} />
            </div>
            <input 
              type="text" 
              value={searchValue}
              onChange={(e) => onSearchChange?.(e.target.value)}
              placeholder={searchPlaceholder} 
              className="w-full h-12 pl-12 pr-4 rounded-2xl border border-border/50 bg-muted/20 focus:bg-background focus:ring-4 focus:ring-primary/10 focus:border-primary/40 outline-none transition-all text-sm font-bold text-foreground placeholder:text-muted-foreground/30 shadow-sm"
            />
          </div>
        )}

        <div className="flex items-center gap-4">
          {actionButton}
        </div>
      </div>
    </HeaderPortal>
  );
}
