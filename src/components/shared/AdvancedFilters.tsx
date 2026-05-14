/* eslint-disable @typescript-eslint/no-explicit-any */
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

function CustomSelect({ 
  value, 
  onChange, 
  options, 
  placeholder
}: { 
  value: string; 
  onChange: (val: string) => void; 
  options: FilterOption[]; 
  placeholder: string;
}) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-2.5 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all flex items-center justify-between hover:bg-muted/50 group"
      >
        <span className={value ? 'text-foreground' : 'text-muted-foreground/60'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg 
          className={`text-muted-foreground/40 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute z-50 w-full mt-2 bg-card/95 backdrop-blur-2xl border border-border/50 rounded-2xl shadow-2xl overflow-hidden py-2"
          >
            <button
              onClick={() => { onChange(''); setIsOpen(false); }}
              className="w-full px-4 py-2 text-left text-xs font-bold hover:bg-primary/10 transition-colors text-muted-foreground/60"
            >
              {placeholder}
            </button>
            {options.map(({ label, value: optValue }) => (
              <button
                key={optValue}
                onClick={() => { onChange(optValue); setIsOpen(false); }}
                className={`w-full px-4 py-2 text-left text-xs font-bold hover:bg-primary/10 transition-colors ${value === optValue ? 'text-primary bg-primary/5' : 'text-foreground'}`}
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-x-10 gap-y-8">
              {/* Date Range */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} />
                  Date Range
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <input 
                      type="date"
                      value={filters.startDate || ''}
                      onChange={(e) => updateFilter('startDate', e.target.value)}
                      className="w-full bg-muted/30 border border-border/50 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                  <span className="text-muted-foreground/30 font-bold">-</span>
                  <div className="flex-1 min-w-0">
                    <input 
                      type="date"
                      value={filters.endDate || ''}
                      onChange={(e) => updateFilter('endDate', e.target.value)}
                      className="w-full bg-muted/30 border border-border/50 rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Customer/Vendor */}
              {(options.customers || options.vendors) && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <User size={12} />
                    {options.customers ? 'Customer' : 'Vendor'}
                  </label>
                  <CustomSelect 
                    value={filters.entityId || ''}
                    onChange={(val) => updateFilter('entityId', val)}
                    options={options.customers || options.vendors || []}
                    placeholder={`All ${options.customers ? 'Customers' : 'Vendors'}`}
                  />
                </div>
              )}

              {/* Status */}
              {options.statuses && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Tag size={12} />
                    Status
                  </label>
                  <CustomSelect 
                    value={filters.status || ''}
                    onChange={(val) => updateFilter('status', val)}
                    options={options.statuses}
                    placeholder="All Statuses"
                  />
                </div>
              )}

              {/* Quality */}
              {options.qualities && (
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Tag size={12} />
                    Quality
                  </label>
                  <CustomSelect 
                    value={filters.quality || ''}
                    onChange={(val) => updateFilter('quality', val)}
                    options={options.qualities}
                    placeholder="All Qualities"
                  />
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
