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
import { HeaderPortal } from '@/components/layout/HeaderPortal';

type TabType = 'grey-inward';

function GreyPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('grey-inward');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  const fetchTabData = async () => {
    setLoading(true);
    const result = await getGreyInwards();
    if (result?.success) {
      setData(result.data || []);
    } else {
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTabData();
  }, []);

  const titles: Record<TabType, string> = {
    'grey-inward': 'Grey Inward'
  };

  const handleRecordAdded = () => {
    setShowForm(false);
    fetchTabData();
  };

  return (
    <div className="space-y-8">
      <HeaderPortal>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 min-w-[200px]">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <h1 className="text-xl font-bold text-foreground capitalize tracking-tight whitespace-nowrap">
              {titles[activeTab]}
            </h1>
          </div>

          {!showForm && (
            <div className="relative flex-1 max-w-md hidden lg:block mx-auto">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                <Search size={16} />
              </div>
              <input 
                type="text" 
                placeholder={`Search ${titles[activeTab]}...`} 
                className="w-full h-10 pl-11 pr-4 rounded-xl border border-border bg-background/30 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all text-[13px] font-medium text-center"
              />
            </div>
          )}

          <div className="flex items-center gap-3 min-w-[200px] justify-end">
            {!showForm && (
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-[12px] whitespace-nowrap"
              >
                Add {titles[activeTab]}
              </button>
            )}
          </div>
        </div>
      </HeaderPortal>

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
