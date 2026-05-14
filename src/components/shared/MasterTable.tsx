'use client';

import React from 'react';
import { MoreHorizontal, Mail, Phone, MapPin, Tag, Hash, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MasterTableProps {
  data: any[];
  type: 'customers' | 'vendors' | 'items';
  userRole?: string;
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
  // Pagination Props
  currentPage?: number;
  totalPages?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
}

export function MasterTable({ 
  data, 
  type, 
  userRole = 'User', 
  onEdit, 
  onDelete,
  currentPage = 1,
  totalPages = 1,
  totalCount = 0,
  onPageChange
}: MasterTableProps) {
  const role = userRole?.toLowerCase();
  const isReadOnly = role !== 'admin' && (type === 'customers' || type === 'vendors');
  const pageSize = 20;
  const startRange = (currentPage - 1) * pageSize + 1;
  const endRange = Math.min(currentPage * pageSize, totalCount);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const isActive = status?.toLowerCase() === 'active' || status?.toLowerCase() === 'success';
    return (
      <span className={cn(
        "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] border transition-all",
        isActive 
          ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" 
          : "bg-slate-500/10 text-slate-500 border-slate-500/20"
      )}>
        {status || 'Unknown'}
      </span>
    );
  };

  return (
    <div className="w-full space-y-4">
      <div className="w-full overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-20">ID</th>
              <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {type === 'items' ? 'Item Details' : 'Identity'}
              </th>
              <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {type === 'items' ? 'SKU Code' : 'Contact / Tax'}
              </th>
              <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {type === 'items' ? 'Created At' : 'Location'}
              </th>
              <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
              {!isReadOnly && <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-16"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item, index) => {
              const name = item.customerName || item.vendorName || item.itemName;
              const initials = getInitials(name);
              const shortId = item.id.substring(item.id.length - 4).toUpperCase();

              return (
                <tr 
                  key={item.id} 
                  className="group hover:bg-muted/30 transition-all cursor-default"
                >
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded">#{shortId}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent flex items-center justify-center text-primary text-xs font-black border border-primary/10 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        {initials}
                      </div>
                      <div>
                        <div className="text-sm font-black text-foreground group-hover:text-primary transition-colors tracking-tight">{name}</div>
                        <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2 mt-1">
                           {item.vendorNumber && <span className="flex items-center gap-1"><Hash size={10} className="text-primary/40" /> {item.vendorNumber}</span>}
                           {item.masterName && <span>• {item.masterName}</span>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="space-y-1">
                      {type === 'items' ? (
                        <div className="text-[13px] font-mono text-primary font-bold">{item.sku}</div>
                      ) : (
                        <>
                          <div className="text-[13px] font-medium text-foreground flex items-center gap-2">
                             <Phone size={12} className="text-muted-foreground" /> {item.phone || 'No phone'}
                          </div>
                          {item.gstin && (
                            <div className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2">
                              <Tag size={10} /> {item.gstin}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[13px] text-muted-foreground flex flex-col gap-1">
                      {type === 'items' ? (
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                      ) : (
                        <>
                          <span className="flex items-center gap-2 font-medium text-foreground/80">
                            <MapPin size={12} className="text-primary" /> {item.city || 'N/A'}
                          </span>
                          <span className="text-xs ml-5">{item.state || 'N/A'}, {item.country || 'India'}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={item.status || 'Active'} />
                  </td>
                  {!isReadOnly && (
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button 
                          onClick={() => onEdit?.(item)}
                          className="p-2 hover:bg-primary/10 rounded-xl text-primary/60 hover:text-primary transition-all duration-300 group/edit"
                          title="Edit Record"
                        >
                          <MoreHorizontal size={18} className="group-hover/edit:rotate-90 transition-transform duration-300" />
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this record? This action cannot be undone.')) {
                              onDelete?.(item.id);
                            }
                          }}
                          className="p-2 hover:bg-red-500/10 rounded-xl text-red-500/40 hover:text-red-500 transition-all duration-300"
                          title="Delete Record"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-muted/5 rounded-2xl border border-border/50">
        <div className="text-xs font-bold text-muted-foreground">
          Showing <span className="text-foreground">{startRange}</span> to <span className="text-foreground">{endRange}</span> of <span className="text-primary">{totalCount}</span> records
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Simple pagination logic for first 5 pages
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange?.(pageNum)}
                  className={cn(
                    "w-8 h-8 rounded-xl text-[10px] font-black transition-all",
                    currentPage === pageNum 
                      ? "bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)]" 
                      : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && <span className="text-muted-foreground px-1">...</span>}
          </div>

          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-2 rounded-xl border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
