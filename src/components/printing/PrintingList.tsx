'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Printer, 
  ChevronRight,
  Search,
  Trash2,
  Package
} from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { GlassCard } from '@/components/shared/GlassCard';
import { Sheet } from '@/components/shared/Sheet';
import { AlertModal } from '@/components/shared/AlertModal';
import { IssueForPrintingForm } from '@/components/printing/IssueForPrintingForm';
import { ReceiveFromPrintingForm } from '@/components/printing/ReceiveFromPrintingForm';
import { deletePrintingIssue, deletePrintingReceive } from '@/app/actions/printing';
import { Pagination } from '@/components/shared/Pagination';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TabType = 'issue' | 'receive';

interface PrintingRecord {
  id: string;
  lotNo: string;
  date: string;
  challanNo?: string;
  remark?: string;
  printer: { vendorName: string };
  batches: any[];
  [key: string]: any;
}

interface PrintingListProps {
  initialData: PrintingRecord[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  activeTab: TabType;
}

export function PrintingList({ 
  initialData, 
  totalCount, 
  totalPages, 
  currentPage,
  activeTab 
}: PrintingListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<PrintingRecord | null>(null);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetId, setTargetId] = useState<string | null>(null);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    const params = new URLSearchParams(searchParams);
    if (value) params.set('q', value);
    else params.delete('q');
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  const handleTabChange = (tab: TabType) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const handleRecordAdded = () => {
    setShowForm(false);
    setEditingRecord(null);
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    const toastId = toast.loading('Deleting record...');
    let result: { success: boolean; error?: string } | undefined;
    if (activeTab === 'issue') result = await deletePrintingIssue(id);
    else if (activeTab === 'receive') result = await deletePrintingReceive(id);

    if (result?.success) {
      toast.success('Record deleted successfully', { id: toastId });
      router.refresh();
    } else {
      toast.error(result?.error || 'Failed to delete record', { id: toastId });
    }
  };

  const titles: Record<TabType, string> = {
    'issue': 'Issue For Printing',
    'receive': 'Receive From Printing'
  };

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className="flex items-center p-1 bg-muted/50 rounded-2xl w-fit border border-border/50">
        {(['issue', 'receive'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeTab === tab 
                ? "bg-background text-primary shadow-sm border border-border/50" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab === 'issue' ? 'Outgoing' : 'Incoming'}
          </button>
        ))}
      </div>

      <ModuleHeader 
        title={titles[activeTab]}
        subtitle="Printing Process"
        icon={Printer}
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        searchPlaceholder={`Search through ${titles[activeTab]}...`}
        actionButton={(
          <button 
            onClick={() => {
              setEditingRecord(null);
              setShowForm(true);
            }}
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
        {initialData.length === 0 ? (
          <motion.div 
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card/50 rounded-[3rem] border border-border/50 shadow-2xl overflow-hidden backdrop-blur-sm"
          >
            <div className="p-10">
              <EmptyState 
                title={`No ${titles[activeTab]} Records`}
                description={`You haven't recorded any entries for ${activeTab}. Start by creating your first one.`}
                onAdd={() => setShowForm(true)}
              />
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key={`${activeTab}-list`}
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
                    <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {initialData.map((item: any) => (
                    <React.Fragment key={item.id}>
                      <tr 
                        className="hover:bg-muted/30 transition-colors cursor-pointer group"
                        onClick={() => toggleRow(item.id)}
                      >
                        <td className="px-8 py-5 text-center">
                          <ChevronRight 
                            size={16} 
                            className={cn("text-muted-foreground transition-transform", expandedRows.includes(item.id) && "rotate-90")} 
                          />
                        </td>
                        <td className="px-8 py-5 text-sm font-medium text-muted-foreground">
                          {new Date(item.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-8 py-5 font-bold text-foreground">#{item.lotNo}</td>
                        <td className="px-8 py-5 font-bold text-foreground">{item.printer?.vendorName}</td>
                        <td className="px-8 py-5 text-sm text-muted-foreground">{item.challanNo || '-'}</td>
                        <td className="px-8 py-5">
                          <span className={cn(
                            "text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider",
                            activeTab === 'issue' ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500"
                          )}>
                            {activeTab === 'issue' ? 'Out for Printing' : 'Ready for Dispatch'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setEditingRecord(item);
                                 setShowForm(true);
                               }}
                               className="p-2 hover:bg-primary/10 rounded-xl text-primary/60 hover:text-primary transition-all duration-300"
                             >
                               <Search size={18} />
                             </button>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setTargetId(item.id);
                                 setShowConfirm(true);
                               }}
                               className="p-2 hover:bg-red-500/10 rounded-xl text-red-500/40 hover:text-red-500 transition-all duration-300"
                             >
                               <Trash2 size={16} />
                             </button>
                           </div>
                        </td>
                      </tr>
                      {expandedRows.includes(item.id) && (
                        <tr>
                          <td colSpan={7} className="px-8 py-4 bg-muted/5 border-b border-border/30">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                              {item.batches?.map((batch: any) => (
                                <div key={batch.id} className="p-3 rounded-2xl bg-background border border-border/50 shadow-sm">
                                  <div className="text-[10px] font-black text-blue-600 uppercase mb-1">{batch.batchNo}</div>
                                  <div className="text-sm font-bold">
                                    {activeTab === 'issue' ? `${batch.rfdMtrs} Mtr (RFD)` : `${batch.printMtrs} Mtr (Finish)`}
                                  </div>
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
            {initialData.length > 0 && (
              <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                totalCount={totalCount}
                onPageChange={handlePageChange}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <Sheet 
        isOpen={showForm} 
        onClose={() => setShowForm(false)}
        title={editingRecord ? `Edit ${titles[activeTab]}` : `New ${titles[activeTab]}`}
        description="Production Management"
        size="xl"
      >
        {activeTab === 'issue' ? (
          <IssueForPrintingForm onSuccess={handleRecordAdded} initialData={editingRecord} />
        ) : (
          <ReceiveFromPrintingForm onSuccess={handleRecordAdded} initialData={editingRecord} />
        )}
      </Sheet>

      <AlertModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={() => targetId && handleDelete(targetId)}
        title="Delete Printing Record"
        description="Are you sure you want to delete this record? This will revert the batch statuses and cannot be undone."
      />
    </div>
  );
}
