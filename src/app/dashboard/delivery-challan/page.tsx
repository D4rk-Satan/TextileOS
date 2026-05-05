'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Truck, 
  FileText, 
  Plus, 
  Search, 
  Package, 
  ChevronRight,
  FilePlus,
  Info
} from 'lucide-react';
import { HeaderPortal } from '@/components/layout/HeaderPortal';
import { GlassCard } from '@/components/shared/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'send-to-dispatch';

function DeliveryChallanPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('send-to-dispatch');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && ['send-to-dispatch'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      setShowForm(false);
    }
  }, [searchParams]);

  const titles: Record<TabType, string> = {
    'send-to-dispatch': 'Send to Dispatch'
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

          <div className="flex items-center gap-3 min-w-[200px] justify-end">
            {!showForm && (
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-[12px] whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                New Dispatch
              </button>
            )}
          </div>
        </div>
      </HeaderPortal>

      <AnimatePresence mode="wait">
        {showForm ? (
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <button 
                onClick={() => setShowForm(false)}
                className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                ← Back to List
              </button>
            </div>
            <GlassCard>
              <div className="p-10 flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mb-6">
                  <FilePlus className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Send to Dispatch Form</h2>
                <p className="text-muted-foreground max-w-md">
                  This form is currently under development. Here you will be able to create delivery challans for dispatching batches.
                </p>
              </div>
            </GlassCard>
          </div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden min-h-[400px] flex items-center justify-center"
          >
            <div className="text-center p-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Info className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-bold text-foreground">No Delivery Challans Found</h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2 italic">
                Start by creating a new delivery challan to send batches to dispatch.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DeliveryChallanPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Delivery Module...</div>}>
      <DeliveryChallanPageContent />
    </Suspense>
  );
}
