'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Building2,
  Package,
  Factory,
  Search
} from 'lucide-react';
import { GreyInwardForm } from '@/components/warehouse/GreyInwardForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { GlassCard } from '@/components/shared/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { getGreyInwards, getBatches } from '@/app/actions/warehouse'; // Import with updated signature
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { useDebounce } from '@/hooks/useDebounce';

type TabType = 'batches' | 'out-for-rfd' | 'ready-for-printing' | 'under-printing' | 'ready-for-dispatch' | 'dispatched';

function WarehousePageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('batches');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [fetchedTab, setFetchedTab] = useState<TabType | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && tabFromUrl !== activeTab && ['batches', 'out-for-rfd', 'ready-for-printing', 'under-printing', 'ready-for-dispatch', 'dispatched'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      setShowForm(false);
      return; // Skip this effect run, wait for the next one with updated activeTab
    }

    let isCurrent = true;
    const fetchTabData = async () => {
      setLoading(true);
      setData([]); 
      
      let result: any;
      if (activeTab === 'batches') {
        result = await getBatches('In-Warehouse', debouncedSearch);
      } else if (activeTab === 'out-for-rfd') {
        result = await getBatches('Out For RFD', debouncedSearch);
      } else if (activeTab === 'ready-for-printing') {
        result = await getBatches('Ready for Printing', debouncedSearch);
      } else if (activeTab === 'under-printing') {
        result = await getBatches('Under Printing', debouncedSearch);
      } else if (activeTab === 'ready-for-dispatch') {
        result = await getBatches('Ready For Dispatch', debouncedSearch);
      } else if (activeTab === 'dispatched') {
        result = await getBatches('Dispatched', debouncedSearch);
      }

      if (isCurrent) {
        if (result?.success) {
          setData(result.data || []);
        } else {
          setData([]);
        }
        setFetchedTab(activeTab);
        setLoading(false);
      }
    };

    fetchTabData();

    return () => {
      isCurrent = false;
    };
  }, [searchParams, activeTab, debouncedSearch]);

  const fetchData = () => {
    // Legacy support for other parts of the component that call fetchData()
    // Trigger a state-based re-fetch by toggling a dummy value or just calling the effect logic if needed
    // But since the effect already tracks activeTab, we can just trigger a manual update if needed
    setActiveTab(prev => {
      const current = prev;
      return current;
    });
  };

  const titles: Record<TabType, string> = {
    'batches': 'In-Warehouse',
    'out-for-rfd': 'Out For RFD',
    'ready-for-printing': 'Ready For Printing',
    'under-printing': 'Under Printing',
    'ready-for-dispatch': 'Ready For Dispatch',
    'dispatched': 'Dispatched'
  };

  const handleRecordAdded = () => {
    setShowForm(false);
    fetchData();
  };

  const BatchList = ({ batches }: { batches: any[] }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Batch No</th>
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Customer</th>
              {activeTab === 'under-printing' && (
                <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Printer</th>
              )}
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Lot No</th>
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Mtrs</th>
              {activeTab === 'ready-for-printing' && (
                <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Shortage</th>
              )}
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {batches.map((batch: any) => (
              <tr key={batch.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-8 py-5">
                  <span className="font-bold text-foreground">{batch.batchNo}</span>
                </td>
                <td className="px-8 py-5 text-sm font-medium text-muted-foreground">
                  {batch.greyInward?.customer?.customerName || 'N/A'}
                </td>
                {activeTab === 'under-printing' && (
                  <td className="px-8 py-5 text-sm font-bold text-foreground">
                    {batch.printingIssue?.printer?.vendorName || '-'}
                  </td>
                )}
                <td className="px-8 py-5 text-sm font-medium text-muted-foreground">
                  {batch.greyInward?.lotNo}
                </td>
                <td className="px-8 py-5">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-blue-600">{(batch.mtrs || 0).toFixed(2)} Mtr</span>
                    {activeTab === 'ready-for-printing' && (
                      <span className="text-[10px] text-muted-foreground uppercase font-black tracking-tighter">
                        RFD: {(batch.rfdMtrs || 0).toFixed(2)}
                      </span>
                    )}
                    {batch.isTP && (
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded font-black uppercase mt-1 w-fit">
                        TP: {batch.tpDetail}
                      </span>
                    )}
                  </div>
                </td>
                {activeTab === 'ready-for-printing' && (
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${Number(batch.millShortage) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {batch.millShortage}%
                      </span>
                    </div>
                  </td>
                )}
                <td className="px-8 py-5">
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                    batch.status === 'In-Warehouse' ? 'bg-muted text-muted-foreground' :
                    batch.status === 'Out For RFD' ? 'bg-orange-500/10 text-orange-500' :
                    batch.status === 'RFD Inward' ? 'bg-green-500/10 text-green-500' :
                    'bg-blue-600/10 text-blue-600'
                  }`}>
                    {batch.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-8">
      <ModuleHeader 
        title={titles[activeTab]}
        subtitle="Warehouse"
        icon={Package}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={`Search through ${titles[activeTab]}...`}
        showSearch={!showForm}
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
            key={`${activeTab}-form`}
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
                  ← Back to {titles[activeTab]}
                </button>
                <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                  New {titles[activeTab]} Entry
                </h2>
             </div>
          </motion.div>
        ) : fetchedTab !== activeTab ? (
          <motion.div 
            key="loading-tab-sync"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-96 flex items-center justify-center"
          >
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </motion.div>
        ) : (activeTab === 'batches' || activeTab === 'out-for-rfd' || activeTab === 'ready-for-printing' || activeTab === 'under-printing' || activeTab === 'ready-for-dispatch' || activeTab === 'dispatched') ? (
          data.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card/50 rounded-[3rem] border border-border/50 shadow-2xl overflow-hidden backdrop-blur-sm"
            >
              <div className="p-10">
                <EmptyState 
                  title={`No ${titles[activeTab]} Batches`}
                  description={`There are currently no batches in the ${titles[activeTab].toLowerCase()} status.`}
                  onAdd={activeTab === 'batches' ? () => setShowForm(true) : undefined}
                  actionLabel="Add New Inward"
                />
              </div>
            </motion.div>
          ) : (
            <div key={`${activeTab}-batchlist`}>
              <BatchList batches={data} />
            </div>
          )
        ) : (
          <motion.div 
            key={`${activeTab}-list`}
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

export default function WarehousePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Module...</div>}>
      <WarehousePageContent />
    </Suspense>
  );
}
