'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Waves,
  Droplets,
  Layers,
  Package,
  History,
  Building2,
  Search
} from 'lucide-react';
import { GreyOutwardForm } from '@/components/dyeing/GreyOutwardForm';
import { RFDInwardForm } from '@/components/dyeing/RFDInwardForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { GlassCard } from '@/components/shared/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { getGreyOutwards, getRFDInwards } from '@/app/actions/dyeing';
import { HeaderPortal } from '@/components/layout/HeaderPortal';

type TabType = 'grey-outward' | 'rfd-inward' | 'history';

function DyeingHousePageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('grey-outward');
  const [showForm, setShowForm] = useState(true); // Default to show form as per user request
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setData([]);
    if (activeTab === 'grey-outward') {
      const result = await getGreyOutwards();
      if (result?.success) setData(result.data || []);
    } else if (activeTab === 'rfd-inward') {
      const result = await getRFDInwards();
      if (result?.success) setData(result.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['grey-outward', 'rfd-inward', 'history'].includes(tab)) {
      setActiveTab(tab);
    }
    fetchData();
  }, [searchParams, activeTab]);

  const titles: Record<TabType, string> = {
    'grey-outward': 'Grey Outward',
    'rfd-inward': 'RFD Inward',
    'history': 'Processing History'
  };

  const handleRecordAdded = () => {
    // For now, just stay on form or show list? User usually wants to see what happened.
    // setShowForm(false); 
    fetchData();
  };

  return (
    <div className="space-y-8">
      <HeaderPortal>
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-6 min-w-[300px]">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
              <h1 className="text-xl font-bold text-foreground capitalize tracking-tight whitespace-nowrap">
                {titles[activeTab]}
              </h1>
            </div>

            <div className="flex gap-1 bg-muted/30 p-1 rounded-xl border border-border/50 backdrop-blur-sm">
                <button 
                    onClick={() => setActiveTab('grey-outward')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 uppercase tracking-wider ${activeTab === 'grey-outward' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                    <Droplets size={12} />
                    Grey Out
                </button>
                <button 
                    onClick={() => setActiveTab('rfd-inward')}
                    className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 uppercase tracking-wider ${activeTab === 'rfd-inward' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                    <Layers size={12} />
                    RFD In
                </button>
            </div>
          </div>

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

          <div className="min-w-[300px]" /> {/* Spacer to keep search centered */}
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
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-3">
                <motion.div 
                    key={activeTab + "-form"}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="max-w-5xl"
                >
                    <GlassCard>
                        <div className="p-10">
                            {activeTab === 'grey-outward' && <GreyOutwardForm onSuccess={handleRecordAdded} />}
                            {activeTab === 'rfd-inward' && <RFDInwardForm onSuccess={handleRecordAdded} />}
                        </div>
                    </GlassCard>
                </motion.div>
            </div>

            <div className="space-y-6">
                <div className="bg-card/50 backdrop-blur-md rounded-[2rem] border border-border p-6 shadow-xl">
                    <h3 className="text-lg font-black flex items-center gap-2 mb-6 uppercase tracking-widest text-foreground/70">
                        <History size={18} className="text-blue-600" />
                        Recent Log
                    </h3>
                    <div className="space-y-4">
                        {data.length === 0 ? (
                            <div className="py-20 text-center">
                                <Package size={32} className="mx-auto text-muted-foreground/20 mb-3" />
                                <p className="text-muted-foreground font-bold italic text-xs">No records yet.</p>
                            </div>
                        ) : (
                            data.slice(0, 8).map((item) => (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={item.id} 
                                    className="p-4 bg-background/50 border border-border/50 rounded-2xl hover:border-blue-500/50 transition-all group"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-black text-sm text-foreground group-hover:text-blue-600 transition-colors">#{item.lotNo}</span>
                                        <span className="text-[9px] font-black text-muted-foreground uppercase">
                                            {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                                        </span>
                                    </div>
                                    <div className="text-[11px] font-bold text-muted-foreground flex items-center gap-1.5">
                                        <Building2 size={12} className="text-blue-500" />
                                        <span className="truncate">{item.dyeingHouse?.vendorName}</span>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DyeingHousePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Module...</div>}>
      <DyeingHousePageContent />
    </Suspense>
  );
}
