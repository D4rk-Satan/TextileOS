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
  Search,
  ChevronRight,
  Hash
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
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

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
                  {activeTab === 'grey-outward' && <GreyOutwardForm onSuccess={handleRecordAdded} />}
                  {activeTab === 'rfd-inward' && <RFDInwardForm onSuccess={handleRecordAdded} />}
                </div>
             </GlassCard>
          </div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest w-12"></th>
                    <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Date</th>
                    <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Lot No</th>
                    <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Dyeing House</th>
                    <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.map((item: any) => (
                    <React.Fragment key={item.id}>
                      <tr 
                        className={`hover:bg-muted/30 transition-colors cursor-pointer ${expandedRows.includes(item.id) ? 'bg-muted/20' : ''}`}
                        onClick={() => toggleRow(item.id)}
                      >
                        <td className="px-8 py-5 text-center">
                          <ChevronRight 
                            size={16} 
                            className={`text-muted-foreground transition-transform duration-300 ${expandedRows.includes(item.id) ? 'rotate-90' : ''}`} 
                          />
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-muted-foreground">
                          {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-8 py-5">
                          <span className="font-bold text-foreground">#{item.lotNo}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                             <Building2 size={14} className="text-blue-500" />
                             <span className="text-sm font-bold text-foreground">{item.dyeingHouse?.vendorName}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                            activeTab === 'grey-outward' 
                              ? 'bg-orange-500/10 text-orange-500' 
                              : 'bg-green-500/10 text-green-500'
                          }`}>
                            {activeTab === 'grey-outward' ? 'Out For RFD' : 'Inwarded'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm text-muted-foreground italic">
                          {item.remark || '-'}
                        </td>
                      </tr>
                      
                      {/* Expanded Batch View */}
                      {expandedRows.includes(item.id) && (
                        <tr>
                          <td colSpan={6} className="px-8 py-0 bg-muted/5">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="py-6 space-y-4">
                                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border/30 pb-2">
                                  <Hash size={12} />
                                  Batches for Lot {item.lotNo}
                                </div>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                  {item.allLotBatches?.map((batch: any) => {
                                    const isProcessedInThisRecord = item.batches?.some((b: any) => b.id === batch.id);
                                    
                                    return (
                                      <div 
                                        key={batch.id} 
                                        className={`p-3 rounded-2xl border transition-all ${
                                          isProcessedInThisRecord 
                                            ? 'bg-blue-600/5 border-blue-600/20 ring-1 ring-blue-600/10' 
                                            : 'bg-background/50 border-border/50 opacity-60'
                                        }`}
                                      >
                                        <div className="flex justify-between items-start mb-1">
                                          <span className="text-[10px] font-black text-blue-600 uppercase">{batch.batchNo}</span>
                                          {isProcessedInThisRecord && (
                                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                                          )}
                                        </div>
                                        <div className="text-sm font-bold text-foreground mb-2">{batch.mtrs.toFixed(2)} Mtr</div>
                                        <div className={`text-[8px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full inline-block ${
                                          (isProcessedInThisRecord && activeTab === 'grey-outward') || batch.status === 'Out For RFD' ? 'bg-orange-500/10 text-orange-500' :
                                          (isProcessedInThisRecord && activeTab === 'rfd-inward') || batch.status === 'RFD Inward' ? 'bg-green-500/10 text-green-500' :
                                          batch.status === 'In-Warehouse' ? 'bg-muted text-muted-foreground' :
                                          'bg-blue-500/10 text-blue-500'
                                        }`}>
                                          {isProcessedInThisRecord 
                                            ? (activeTab === 'grey-outward' ? 'Out For RFD' : 'RFD Inward')
                                            : batch.status}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                
                                <div className="flex items-center gap-4 text-[9px] text-muted-foreground font-medium pt-2">
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-blue-600/20 border border-blue-600/30 rounded" />
                                    <span>Processed in this {activeTab === 'grey-outward' ? 'Outward' : 'Inward'}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-background border border-border/50 rounded" />
                                    <span>Other batches in this Lot</span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-8 py-20 text-center">
                        <Package size={32} className="mx-auto text-muted-foreground/20 mb-3" />
                        <p className="text-muted-foreground font-bold italic text-xs">No records yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
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
