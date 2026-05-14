'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  totalCount, 
  pageSize = 20, 
  onPageChange 
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startRange = (currentPage - 1) * pageSize + 1;
  const endRange = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-5 bg-card/50 rounded-[2rem] border border-border/50 backdrop-blur-sm mt-6">
      <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
        Showing <span className="text-foreground">{startRange}</span> to <span className="text-foreground">{endRange}</span> of <span className="text-primary">{totalCount}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-2.5 rounded-xl border border-border/50 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-sm"
        >
          <ChevronLeft size={18} />
        </button>
        
        <div className="flex items-center gap-1.5">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => onPageChange(pageNum)}
                className={cn(
                  "w-10 h-10 rounded-xl text-xs font-black transition-all hover:scale-105 active:scale-95 shadow-sm",
                  currentPage === pageNum 
                    ? "bg-primary text-primary-foreground shadow-[0_0_20px_rgba(var(--primary),0.3)]" 
                    : "hover:bg-muted text-muted-foreground border border-border/30"
                )}
              >
                {pageNum}
              </button>
            );
          })}
          {totalPages > 5 && <span className="text-muted-foreground px-2 font-black">...</span>}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-2.5 rounded-xl border border-border/50 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95 shadow-sm"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
