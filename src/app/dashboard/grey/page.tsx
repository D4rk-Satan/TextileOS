'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Building2,
  Search
} from 'lucide-react';
import { GreyInwardForm } from '@/components/warehouse/GreyInwardForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { GlassCard } from '@/components/shared/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { getGreyInwards } from '@/app/actions/warehouse';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { useDebounce } from '@/hooks/useDebounce';

type TabType = 'grey-inward';

function GreyPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('grey-inward');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const fetchTabData = async () => {
    setLoading(true);
    const result = await getGreyInwards(debouncedSearch);
    if (result?.success) {
      setData(result.data || []);
    } else {
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTabData();
  }, [debouncedSearch]);

  const titles: Record<TabType, string> = {
    'grey-inward': 'Grey Inward'
  };

  const handleRecordAdded = () => {
    setShowForm(false);
    fetchTabData();
  };

  return (
    <div className="space-y-8">
      <ModuleHeader 
        title={titles[activeTab]}
        subtitle="Grey"
        icon={Building2}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={`Search through ${titles[activeTab]}...`}
        showSearch={!showForm}
        actionButton={!showForm && (
          <button 
            onClick={() => setShowForm(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-12 rounded-2xl font-black transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
               <span className="text-lg leading-none">+</span>
            </div>
            Add {titles[activeTab]}
          </button>
        )}
      />

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-96 flex items-center justify-center"
          >
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </motion.div>
        ) : showForm ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-7xl mx-auto"
          >
             <div className="mb-6 flex items-center justify-between">
                <button 
                   onClick={() => setShowForm(false)}
                   className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  ← Back to List
                </button>
                <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                  New Grey Inward Entry
                </h2>
             </div>
             <GlassCard>
                <div className="p-10">
                  <GreyInwardForm onSuccess={handleRecordAdded} />
                </div>
             </GlassCard>
          </motion.div>
        ) : data.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card/50 rounded-[2.5rem] border border-border shadow-xl overflow-hidden backdrop-blur-sm"
          >
            <div className="p-10">
              <EmptyState 
                title={`No ${titles[activeTab]} records`}
                description="You haven't recorded any grey inward entries yet."
                onAdd={() => setShowForm(true)}
                onImport={() => alert('Import feature coming soon!')}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden"
          >
            <div className="p-8">
               <h3 className="text-xl font-bold mb-4">Recent {titles[activeTab]}</h3>
               <div className="grid gap-4">
                  {data.map((item: any) => (
                    <div key={item.id} className="p-4 rounded-xl bg-muted/30 border border-border flex justify-between items-center">
                      <div>
                        <span className="font-bold block">{item.lotNo}</span>
                        <span className="text-xs text-muted-foreground">Challan: {item.challanNo} • {item.quality}</span>
                      </div>
                      <span className="text-[10px] bg-blue-600/10 text-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-wider">{item.status}</span>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function GreyPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Grey Module...</div>}>
      <GreyPageContent />
    </Suspense>
  );
}
