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
  ArrowRight,
  Edit,
  Trash2,
  Upload
} from 'lucide-react';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { GlassCard } from '@/components/shared/GlassCard';
import { ImportModal } from '@/components/shared/ImportModal';
import { motion, AnimatePresence } from 'framer-motion';
import { DeliveryChallanForm } from '@/components/dispatch/DeliveryChallanForm';
import { 
  getDeliveryChallans, deleteDeliveryChallan,
  bulkCreateDeliveryChallans 
} from '@/app/actions/dispatch';
import { getCustomers } from '@/app/actions/master';
import { AdvancedFilters } from '@/components/shared/AdvancedFilters';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';

type TabType = 'delivery-challan';

function DeliveryChallanPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('delivery-challan');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [editData, setEditData] = useState<any>(null);
  const [showImport, setShowImport] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<any>({});
  const [filterOptions, setFilterOptions] = useState<any>({});

  useEffect(() => {
    const loadOptions = async () => {
      const res = await getCustomers();
      setFilterOptions({
        customers: res.success ? (res.data || []).map((c: any) => ({ label: c.customerName, value: c.id })) : []
      });
    };
    loadOptions();
  }, []);

  const toggleRow = (id: string) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const fetchChallans = async () => {
    setLoading(true);
    const result = await getDeliveryChallans(debouncedSearch, filters);
    if (result.success) {
      setData(result.data || []);
    }
    setLoading(false);
  };

  const handleEdit = (item: any) => {
    setEditData(item);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this delivery challan? Associated batches will be reverted to "Ready For Dispatch" status.')) return;
    
    const res = await deleteDeliveryChallan(id);
    if (res.success) {
      toast.success('Challan deleted successfully');
      fetchChallans();
    } else {
      toast.error(res.error || 'Failed to delete challan');
    }
  };

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && ['delivery-challan'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      setShowForm(false);
    }
    fetchChallans();
  }, [searchParams, debouncedSearch, filters]);

  const handleSuccess = () => {
    setShowForm(false);
    setEditData(null);
    fetchChallans();
  };

  const titles: Record<TabType, string> = {
    'delivery-challan': 'Delivery Challan'
  };

  return (
    <div className="space-y-8">
      <ModuleHeader 
        title={titles[activeTab]}
        subtitle="Dispatch"
        icon={Truck}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={`Search through ${titles[activeTab]}...`}
        showSearch={!showForm}
        onFilterToggle={() => setShowFilters(!showFilters)}
        isFilterActive={Object.keys(filters).length > 0}
        actionButton={!showForm && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowImport(true)}
              className="bg-muted hover:bg-muted/80 text-muted-foreground px-6 h-12 rounded-2xl font-black transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98]"
            >
              <Upload size={16} />
              Import
            </button>
            <button 
              onClick={() => { setEditData(null); setShowForm(true); }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 h-12 rounded-2xl font-black transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                 <span className="text-lg leading-none">+</span>
              </div>
              New Challan
            </button>
          </div>
        )}
      />

      <AdvancedFilters 
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFilterChange={setFilters}
        options={filterOptions}
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
            <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          </motion.div>
        ) : showForm ? (
          <div key="form" className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <button 
                onClick={() => { setShowForm(false); setEditData(null); }}
                className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                ← Back to List
              </button>
            </div>
            <GlassCard>
              <div className="p-10">
                <DeliveryChallanForm onSuccess={handleSuccess} initialData={editData} />
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
                title="No Delivery Challans"
                description="You haven't recorded any delivery challans yet. Start by creating your first one."
                onAdd={() => setShowForm(true)}
                onImport={() => setShowImport(true)}
                actionLabel="New Challan"
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
                    <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest text-right">Actions</th>
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
                          <td className="px-8 py-5 text-right">
                            <div className="flex justify-end gap-2">
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                className="p-2 rounded-xl bg-blue-500/10 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                title="Edit Challan"
                              >
                                <Edit size={14} />
                              </button>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                className="p-2 rounded-xl bg-red-500/10 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                title="Delete Challan"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
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
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ImportModal 
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title="Delivery Challans"
        templateColumns={['Date', 'Challan No', 'Lot No', 'Customer', 'Remark']}
        onImport={async (data) => {
          const res = await bulkCreateDeliveryChallans(data);
          if (res.success) {
            fetchChallans();
          }
          return res;
        }}
      />
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
