/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
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
  Info,
  Calendar,
  User,
  Hash,
  ArrowRight
} from 'lucide-react';
import { HeaderPortal } from '@/components/layout/HeaderPortal';
import { GlassCard } from '@/components/shared/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';
import { DeliveryChallanForm } from '@/components/dispatch/DeliveryChallanForm';
import { getDeliveryChallans } from '@/app/actions/dispatch';
import { useDebounce } from '@/hooks/useDebounce';

type TabType = 'delivery-challan';

function DeliveryChallanPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('delivery-challan');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const fetchChallans = async () => {
    setLoading(true);
    const result = await getDeliveryChallans(debouncedSearch);
    if (result.success) {
      setData(result.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && ['delivery-challan'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      setShowForm(false);
    }
    fetchChallans();
  }, [searchParams, debouncedSearch]);

  const handleSuccess = () => {
    setShowForm(false);
    fetchChallans();
  };

  const titles: Record<TabType, string> = {
    'delivery-challan': 'Delivery Challan'
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                New Challan
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
              <div className="p-10">
                <DeliveryChallanForm onSuccess={handleSuccess} />
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
            {loading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest w-12"></th>
                      <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Date</th>
                      <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Challan No</th>
                      <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Customer</th>
                      <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Lots</th>
                      <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest text-right">Total Mtrs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {data.map((item: any) => (
                      <React.Fragment key={item.id}>
                        <tr 
                          className="hover:bg-muted/30 transition-colors cursor-pointer group"
                          onClick={() => toggleRow(item.id)}
                        >
                          <td className="px-8 py-5 text-center">
                            <ChevronRight 
                              size={16} 
                              className={`text-muted-foreground transition-transform ${expandedRows.includes(item.id) ? 'rotate-90' : ''}`} 
                            />
                          </td>
                          <td className="px-8 py-5 text-sm font-medium text-muted-foreground">
                            {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </td>
                          <td className="px-8 py-5 font-bold text-foreground">{item.challanNo}</td>
                          <td className="px-8 py-5 font-bold text-foreground">{item.customer?.customerName}</td>
                          <td className="px-8 py-5">
                            <div className="flex flex-wrap gap-1">
                              {item.lotNumbers?.map((lot: string) => (
                                <span key={lot} className="text-[9px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 font-black">#{lot}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-8 py-5 text-right font-black text-blue-600">
                            {Number(item.totalMtrs).toFixed(2)}
                          </td>
                        </tr>
                        {expandedRows.includes(item.id) && (
                          <tr>
                            <td colSpan={6} className="px-8 py-4 bg-muted/5">
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {item.batches?.map((batch: any) => (
                                  <div key={batch.id} className="p-4 rounded-2xl bg-background border border-border/50 shadow-sm">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{batch.batchNo}</div>
                                      <div className="text-[9px] font-black text-muted-foreground uppercase">Lot #{batch.greyInward?.lotNo}</div>
                                    </div>
                                    <div className="flex items-end justify-between">
                                      <div className="text-xs text-muted-foreground font-medium">Finished Mtrs</div>
                                      <div className="text-lg font-black text-foreground">{Number(batch.printMtrs).toFixed(2)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                    {data.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-8 py-20 text-center">
                          <Package size={32} className="mx-auto text-muted-foreground/20 mb-3" />
                          <p className="text-muted-foreground font-bold italic text-xs">No delivery challans found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DeliveryChallanPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Dispatch Module...</div>}>
      <DeliveryChallanPageContent />
    </Suspense>
  );
}
