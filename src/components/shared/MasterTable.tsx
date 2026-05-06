'use client';

import React from 'react';
import { MoreHorizontal, Mail, Phone, MapPin, Tag, Hash } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MasterTableProps {
  data: any[];
  type: 'customers' | 'vendors' | 'items';
  onEdit?: (item: any) => void;
  onDelete?: (id: string) => void;
}

export function MasterTable({ data, type, onEdit, onDelete }: MasterTableProps) {
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
        "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
        isActive 
          ? "bg-success/10 text-success border-success/20 dark:bg-success/10 dark:text-success" 
          : "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-400/10 dark:text-slate-400"
      )}>
        {status || 'Unknown'}
      </span>
    );
  };

  return (
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
            <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-16"></th>
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
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white text-xs font-black shadow-lg shadow-primary/10 group-hover:scale-110 transition-transform">
                      {initials}
                    </div>
                    <div>
                      <div className="text-[13px] font-bold text-foreground group-hover:text-primary transition-colors">{name}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                         {item.vendorNumber && <span className="flex items-center gap-1"><Hash size={10} /> {item.vendorNumber}</span>}
                         {item.masterName && <span className="ml-2 opacity-60">| {item.masterName}</span>}
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
                <td className="px-6 py-5">
                  <button className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
