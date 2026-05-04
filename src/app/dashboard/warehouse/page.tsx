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
import { HeaderPortal } from '@/components/layout/HeaderPortal';

type TabType = 'grey-inward' | 'batches' | 'out-for-rfd' | 'ready-for-printing' | 'under-printing' | 'ready-for-dispatch' | 'dispatched';

function WarehousePageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('grey-inward');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);

  const fetchData = async () => {
    setLoading(true);
    setData([]); // Clear old data to prevent layout mismatch during loading
    if (activeTab === 'grey-inward') {
      const result = await getGreyInwards();
      if (result?.success) {
        setData(result.data || []);
      }
    } else if (activeTab === 'batches') {
      const result = await getBatches('In-Warehouse');
      if (result?.success) {
        setData(result.data || []);
      }
    } else if (activeTab === 'out-for-rfd') {
      const result = await getBatches('Out For RFD');
      if (result?.success) {
        setData(result.data || []);
      }
    } else if (activeTab === 'ready-for-printing') {
      const result = await getBatches('Ready for Printing');
      if (result?.success) {
        setData(result.data || []);
      }
    } else if (activeTab === 'under-printing') {
      const result = await getBatches('Under Printing');
      if (result?.success) {
        setData(result.data || []);
      }
    } else if (activeTab === 'ready-for-dispatch') {
      const result = await getBatches('Ready For Dispatch');
      if (result?.success) {
        setData(result.data || []);
      }
    } else if (activeTab === 'dispatched') {
      const result = await getBatches('Dispatched');
      if (result?.success) {
        setData(result.data || []);
      }
    } else {
      setData([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['grey-inward', 'batches', 'out-for-rfd', 'ready-for-printing', 'under-printing', 'ready-for-dispatch', 'dispatched'].includes(tab)) {
      setActiveTab(tab);
      setShowForm(false);
    }
    fetchData();
  }, [searchParams, activeTab]);

  const titles: Record<TabType, string> = {
    'grey-inward': 'Grey Inward',
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
                  </div>
                </td>
                {activeTab === 'ready-for-printing' && (
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                      <span className={`text-xs font-bold ${Number(batch.millShortage) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                        {batch.millShortage}%
                      </span>
                      {batch.isTP && (
                        <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded font-black uppercase mt-1 w-fit">
                          {batch.tpDetail}
                        </span>
                      )}
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
            {batches.length === 0 && (
              <tr>
                <td colSpan={activeTab === 'ready-for-printing' || activeTab === 'under-printing' ? 6 : 5} className="px-8 py-20 text-center text-muted-foreground italic font-medium">
                  No batches found in this section.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

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

          {!showForm && activeTab === 'grey-inward' && (
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
            {!showForm && activeTab === 'grey-inward' && (
              <button 
                onClick={() => setShowForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 text-[12px] whitespace-nowrap"
              >
                Add {titles[activeTab].replace('Entry', '')}
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
          <div key="form" className="max-w-7xl mx-auto">
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
             <GlassCard>
                <div className="p-10">
                  {activeTab === 'grey-inward' && <GreyInwardForm onSuccess={handleRecordAdded} />}
                </div>
             </GlassCard>
          </div>
        ) : data.length === 0 && activeTab === 'grey-inward' ? (
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
                description={`You haven't recorded any ${activeTab.replace(/-/g, ' ')} entries yet.`}
                onAdd={() => setShowForm(true)}
                onImport={() => alert('Import feature coming soon!')}
              />
            </div>
          </motion.div>
        ) : (activeTab === 'batches' || activeTab === 'out-for-rfd' || activeTab === 'ready-for-printing' || activeTab === 'under-printing' || activeTab === 'ready-for-dispatch' || activeTab === 'dispatched') ? (
          <BatchList batches={data} />
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

export default function WarehousePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Module...</div>}>
      <WarehousePageContent />
    </Suspense>
  );
}
