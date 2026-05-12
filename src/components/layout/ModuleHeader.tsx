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
  onFilterToggle?: () => void;
  isFilterActive?: boolean;
}

export function ModuleHeader({
  title,
  subtitle = "Module",
  icon: Icon,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  showSearch = true,
  actionButton,
  onFilterToggle,
  isFilterActive = false,
}: ModuleHeaderProps) {
  return (
    <HeaderPortal>
      <div className="flex flex-col w-full h-full justify-center">
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

          <div className="flex items-center gap-4 flex-1 justify-end max-w-4xl">
            {showSearch && (
              <div className="relative flex-1 max-w-lg hidden lg:block group">
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

            {onFilterToggle && (
              <button 
                onClick={onFilterToggle}
                className={`h-12 px-5 rounded-2xl font-black transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] border ${
                  isFilterActive 
                    ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/5' 
                    : 'bg-muted/30 border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <div className="relative">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="2" y1="14" x2="6" y2="14" />
                    <line x1="10" y1="8" x2="14" y2="8" />
                    <line x1="18" y1="16" x2="22" y2="16" />
                  </svg>
                  {isFilterActive && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background animate-pulse" />
                  )}
                </div>
                Filter
              </button>
            )}

            <div className="flex items-center gap-4">
              {actionButton}
            </div>
          </div>
        </div>
      </div>
    </HeaderPortal>
  );
}
