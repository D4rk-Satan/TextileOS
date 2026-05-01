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
  Hash
} from 'lucide-react';
import { IssueForPrintingForm } from '@/components/printing/IssueForPrintingForm';
import { ReceiveFromPrintingForm } from '@/components/printing/ReceiveFromPrintingForm';
import { GlassCard } from '@/components/shared/GlassCard';
import { HeaderPortal } from '@/components/layout/HeaderPortal';
import { motion, AnimatePresence } from 'framer-motion';
import { getOutForPrintingLots } from '@/app/actions/printing';

type TabType = 'issue' | 'receive' | 'history';

function PrintingProcessPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('issue');
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
    if (activeTab === 'issue' || activeTab === 'receive') {
      const result = await getOutForPrintingLots();
      if (result.success) setData(result.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['issue', 'receive', 'history'].includes(tab)) {
      setActiveTab(tab);
    }
    fetchData();
  }, [searchParams, activeTab]);

  const titles: Record<TabType, string> = {
    'issue': 'Issue For Printing',
    'receive': 'Receive From Printing',
    'history': 'Printing History'
  };

  const handleSuccess = () => {
    setShowForm(false);
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
                <Plus className="w-4 h-4" />
                New {activeTab === 'issue' ? 'Issue' : 'Receive'}
              </button>
            )}
          </div>
        </div>
      </HeaderPortal>

      {!showForm && (
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-2xl w-fit border border-border/50">
          {(['issue', 'receive', 'history'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-background text-blue-600 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          </div>
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
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
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
                          <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider bg-orange-500/10 text-orange-500">
                            Out for Printing
                          </span>
                        </td>
                      </tr>
                      {expandedRows.includes(item.id) && (
                        <tr>
                          <td colSpan={6} className="px-8 py-4 bg-muted/5">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                              {item.batches?.map((batch: any) => (
                                <div key={batch.id} className="p-3 rounded-2xl bg-background border border-border/50">
                                  <div className="text-[10px] font-black text-blue-600 uppercase mb-1">{batch.batchNo}</div>
                                  <div className="text-sm font-bold">{batch.rfdMtrs} Mtr (RFD)</div>
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
                        <p className="text-muted-foreground font-bold italic text-xs">No active printing processes found.</p>
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

function Plus({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M5 12h14"/><path d="M12 5v14"/></svg>
  );
}

export default function PrintingProcessPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Printing Module...</div>}>
      <PrintingProcessPageContent />
    </Suspense>
  );
}
