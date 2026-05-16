'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { GlassCard } from '@/components/shared/GlassCard';
import { Sheet } from '@/components/shared/Sheet';
import { GreyInwardForm } from '@/components/warehouse/GreyInwardForm';
import { Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface GreyInward {
  id: string;
  lotNo: string;
  challanNo: string;
  quality: string;
  status: string;
}

interface GreyListProps {
  initialData: GreyInward[];
  totalCount: number;
}

export function GreyList({ initialData, totalCount }: GreyListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set('q', value);
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleRecordAdded = () => {
    setShowForm(false);
    router.refresh();
  };

  return (
    <div className="space-y-8">
      <ModuleHeader 
        title="Grey Inward"
        subtitle="Warehouse"
        icon={Building2}
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        searchPlaceholder="Search through grey inward..."
        actionButton={(
          <button 
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-12 rounded-2xl font-black transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
               <span className="text-lg leading-none">+</span>
            </div>
            Add Inward
          </button>
        )}
      />

      <AnimatePresence mode="wait">
        {initialData.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card/50 rounded-[2.5rem] border border-border shadow-xl overflow-hidden backdrop-blur-sm"
          >
            <div className="p-10">
              <EmptyState 
                title="No grey inward records"
                description="You haven't recorded any grey inward entries yet."
                onAdd={() => setShowForm(true)}
                onImport={() => toast.info('Import feature coming soon!')}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden"
          >
            <div className="p-8">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Recent Entries</h3>
                  <span className="text-xs font-bold text-muted-foreground/40 uppercase tracking-widest">
                    Showing {initialData.length} of {totalCount} records
                  </span>
               </div>
               <div className="grid gap-4">
                  {initialData.map((item: any) => (
                    <motion.div 
                      key={item.id} 
                      layout
                      className="group p-4 rounded-xl bg-muted/30 border border-border flex justify-between items-center hover:bg-muted/50 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                          {item.lotNo.substring(0, 2)}
                        </div>
                        <div>
                          <span className="font-black block text-foreground group-hover:text-primary transition-colors">{item.lotNo}</span>
                          <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">
                            Challan: {item.challanNo} • {item.quality}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-3 py-1 rounded-full font-black uppercase tracking-wider shadow-sm">
                          {item.status}
                        </span>
                      </div>
                    </motion.div>
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-over Form */}
      <Sheet 
        isOpen={showForm} 
        onClose={() => setShowForm(false)}
        title="New Grey Inward"
        description="Warehouse Management"
        size="xl"
      >
        <GreyInwardForm onSuccess={handleRecordAdded} />
      </Sheet>
    </div>
  );
}
