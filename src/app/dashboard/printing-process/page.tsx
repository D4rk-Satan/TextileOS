/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Printer, 
  FileText, 
  RotateCcw, 
  History, 
  Search, 
  Package, 
  ChevronRight,
  TrendingDown,
  TrendingUp,
  User,
  Layers,
  Hash,
  Plus
} from 'lucide-react';
import { IssueForPrintingForm } from '@/components/printing/IssueForPrintingForm';
import { ReceiveFromPrintingForm } from '@/components/printing/ReceiveFromPrintingForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { GlassCard } from '@/components/shared/GlassCard';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { getOutForPrintingLots, getPrintingReceives } from '@/app/actions/printing';
import { useDebounce } from '@/hooks/useDebounce';

type TabType = 'issue' | 'receive';

function PrintingProcessPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('issue');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [fetchedTab, setFetchedTab] = useState<TabType | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && tabFromUrl !== activeTab && ['issue', 'receive'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      setShowForm(false);
      return;
    }

    let isCurrent = true;
    const fetchTabData = async () => {
      setLoading(true);
      setData([]);
      
      let result: any;
      if (activeTab === 'issue') {
        result = await getOutForPrintingLots(debouncedSearch);
      } else if (activeTab === 'receive') {
        result = await getPrintingReceives(debouncedSearch);
      }

      if (isCurrent && result?.success) {
        setData(result.data || []);
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
    setActiveTab(prev => prev); // Simple trigger
  };

  const titles: Record<TabType, string> = {
    'issue': 'Issue For Printing',
    'receive': 'Receive From Printing'
  };

  const handleSuccess = () => {
    setShowForm(false);
    fetchData();
  };

  return (
    <div className="space-y-8">
      <ModuleHeader 
        title={titles[activeTab]}
        subtitle="Printing Process"
        icon={Printer}
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
            New {activeTab === 'issue' ? 'Issue' : 'Receive'}
          </button>
        )}
      />

      <AnimatePresence mode="wait">
        {loading || fetchedTab !== activeTab ? (
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
                {activeTab === 'issue' && <IssueForPrintingForm onSuccess={handleSuccess} />}
                {activeTab === 'receive' && <ReceiveFromPrintingForm onSuccess={handleSuccess} />}
              </div>
            </GlassCard>
          </div>
        ) : data.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card/50 rounded-[3rem] border border-border/50 shadow-2xl overflow-hidden backdrop-blur-sm"
          >
            <div className="p-10">
              <EmptyState 
                title={`No ${titles[activeTab]} Records`}
                description={`You haven't recorded any ${titles[activeTab].toLowerCase()} entries yet. Start by creating your first one.`}
                onAdd={() => setShowForm(true)}
                actionLabel={`Add ${titles[activeTab]}`}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key={`${activeTab}-list`}
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
                    <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Printer</th>
                    <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">DC No</th>
                    <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {data.map((item: any) => (
                    <React.Fragment key={item.id}>
                      <tr 
                        className="hover:bg-muted/30 transition-colors cursor-pointer"
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
                        <td className="px-8 py-5 font-bold text-foreground">#{item.lotNo}</td>
                        <td className="px-8 py-5 font-bold text-foreground">{item.printer?.vendorName}</td>
                        <td className="px-8 py-5 text-sm text-muted-foreground">{item.challanNo || '-'}</td>
                        <td className="px-8 py-5">
                          {activeTab === 'issue' ? (
                            <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider bg-orange-500/10 text-orange-500">
                              Out for Printing
                            </span>
                          ) : (
                            <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider bg-green-500/10 text-green-500">
                              Ready for Dispatch
                            </span>
                          )}
                        </td>
                      </tr>
                      {expandedRows.includes(item.id) && (
                        <tr>
                          <td colSpan={6} className="px-8 py-4 bg-muted/5">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                              {item.batches?.map((batch: any) => (
                                <div key={batch.id} className="p-3 rounded-2xl bg-background border border-border/50">
                                  <div className="text-[10px] font-black text-blue-600 uppercase mb-1">{batch.batchNo}</div>
                                  <div className="text-sm font-bold">
                                    {activeTab === 'issue' ? `${batch.rfdMtrs} Mtr (RFD)` : `${batch.printMtrs} Mtr (Finish)`}
                                  </div>
                                  {batch.isTP && (
                                    <div className="mt-1 text-[9px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded font-black uppercase w-fit">
                                      TP: {batch.tpDetail}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PrintingProcessPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Printing Module...</div>}>
      <PrintingProcessPageContent />
    </Suspense>
  );
}
