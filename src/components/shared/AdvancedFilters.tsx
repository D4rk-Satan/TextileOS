'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, User, Tag, RotateCcw, Filter } from 'lucide-react';

export interface FilterOption {
  label: string;
  value: string;
}

interface AdvancedFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
  onFilterChange: (filters: any) => void;
  options?: {
    customers?: FilterOption[];
    vendors?: FilterOption[];
    qualities?: FilterOption[];
    statuses?: FilterOption[];
  };
}

export function AdvancedFilters({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  options = {}
}: AdvancedFiltersProps) {
  const handleClear = () => {
    onFilterChange({});
  };

  const updateFilter = (key: string, value: any) => {
    onFilterChange({ ...filters, [key]: value });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden mb-6"
        >
          <div className="bg-card/50 backdrop-blur-xl border border-border rounded-[2rem] p-8 shadow-2xl relative">
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-muted rounded-xl text-muted-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <Filter size={20} />
              </div>
              <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Advanced Filters</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Date Range */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} />
                  Date Range
                </label>
                <div className="flex gap-2">
                  <input 
                    type="date"
                    value={filters.startDate || ''}
                    onChange={(e) => updateFilter('startDate', e.target.value)}
                    className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                  <input 
                    type="date"
                    value={filters.endDate || ''}
                    onChange={(e) => updateFilter('endDate', e.target.value)}
                    className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              </div>

              {/* Customer/Vendor */}
              {(options.customers || options.vendors) && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <User size={12} />
                    {options.customers ? 'Customer' : 'Vendor'}
                  </label>
                  <select
                    value={filters.entityId || ''}
                    onChange={(e) => updateFilter('entityId', e.target.value)}
                    className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">All {options.customers ? 'Customers' : 'Vendors'}</option>
                    {(options.customers || options.vendors || []).map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status */}
              {options.statuses && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Tag size={12} />
                    Status
                  </label>
                  <select
                    value={filters.status || ''}
                    onChange={(e) => updateFilter('status', e.target.value)}
                    className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    {options.statuses.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quality */}
              {options.qualities && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Tag size={12} />
                    Quality
                  </label>
                  <select
                    value={filters.quality || ''}
                    onChange={(e) => updateFilter('quality', e.target.value)}
                    className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none cursor-pointer"
                  >
                    <option value="">All Qualities</option>
                    {options.qualities.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-border/50 flex justify-end">
              <button 
                onClick={handleClear}
                className="flex items-center gap-2 text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
              >
                <RotateCcw size={14} />
                Clear All Filters
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
