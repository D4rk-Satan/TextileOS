/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Building2,
  Package,
  Factory,
  Search,
  Trash2,
  Upload,
  Filter
} from 'lucide-react';
import { GreyInwardForm } from '@/components/warehouse/GreyInwardForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { GlassCard } from '@/components/shared/GlassCard';
import { ImportModal } from '@/components/shared/ImportModal';
import { AdvancedFilters } from '@/components/shared/AdvancedFilters';
import { Pagination } from '@/components/shared/Pagination';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getGreyInwards, getBatches, updateGreyInward, deleteGreyInward,
  bulkCreateGreyInwards 
} from '@/app/actions/warehouse';
import { getCustomers, getItems } from '@/app/actions/master';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';

type TabType = 'inwards' | 'batches' | 'out-for-rfd' | 'ready-for-printing' | 'under-printing' | 'ready-for-dispatch' | 'dispatched';

function WarehousePageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('inwards');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [fetchedTab, setFetchedTab] = useState<TabType | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1 });
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);

  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{ status?: string; entityId?: string; quality?: string; startDate?: string; endDate?: string }>({});
  const [filterOptions, setFilterOptions] = useState<{ customers: { label: string; value: string }[]; qualities: { label: string; value: string }[] }>({
    customers: [],
    qualities: []
  });

  useEffect(() => {
    const loadOptions = async () => {
      const [custRes, itemRes] = await Promise.all([getCustomers(), getItems()]);
      setFilterOptions({
        customers: custRes.success ? (custRes.data || []).map((c: any) => ({ label: c.customerName, value: c.id })) : [],
        qualities: itemRes.success ? (itemRes.data || []).map((i: any) => ({ label: i.itemName, value: i.itemName })) : []
      });
    };
    loadOptions();
  }, []);

  useEffect(() => {
    const tabFromUrl = searchParams.get('tab') as TabType;
    if (tabFromUrl && tabFromUrl !== activeTab && ['inwards', 'batches', 'out-for-rfd', 'ready-for-printing', 'under-printing', 'ready-for-dispatch', 'dispatched'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
      setShowForm(false);
      setEditingRecord(null);
      return;
    }

    let isCurrent = true;
    const fetchTabData = async () => {
      setLoading(true);
      setData([]); 
      
      let result: { success: boolean; data?: any[]; totalCount?: number; totalPages?: number; error?: string } | undefined;
      if (activeTab === 'inwards') {
        result = await getGreyInwards(debouncedSearch, filters, currentPage);
      } else if (activeTab === 'batches') {
        result = await getBatches('In-Warehouse', debouncedSearch, filters, currentPage);
      } else if (activeTab === 'out-for-rfd') {
        result = await getBatches('Out For RFD', debouncedSearch, filters, currentPage);
      } else if (activeTab === 'ready-for-printing') {
        result = await getBatches('Ready for Printing', debouncedSearch, filters, currentPage);
      } else if (activeTab === 'under-printing') {
        result = await getBatches('Under Printing', debouncedSearch, filters, currentPage);
      } else if (activeTab === 'ready-for-dispatch') {
        result = await getBatches('Ready For Dispatch', debouncedSearch, filters, currentPage);
      } else if (activeTab === 'dispatched') {
        result = await getBatches('Dispatched', debouncedSearch, filters, currentPage);
      }

      if (isCurrent) {
        if (result?.success) {
          setData(result.data || []);
          setPagination({
            totalCount: result.totalCount || 0,
            totalPages: result.totalPages || 1
          });
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
  }, [searchParams, activeTab, debouncedSearch, filters, currentPage]);

  // Reset page when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, debouncedSearch, filters]);

  const titles: Record<TabType, string> = {
    'inwards': 'Grey Inwards',
    'batches': 'In-Warehouse',
    'out-for-rfd': 'Out For RFD',
    'ready-for-printing': 'Ready For Printing',
    'under-printing': 'Under Printing',
    'ready-for-dispatch': 'Ready For Dispatch',
    'dispatched': 'Dispatched'
  };

  const handleRecordAddedOrUpdated = () => {
    setShowForm(false);
    setEditingRecord(null);
    // Force re-fetch by triggering effect
    setFetchedTab(null);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this inward? All associated batches will also be deleted.')) return;
    
    const result = await deleteGreyInward(id);
    if (result.success) {
      toast.success('Inward deleted successfully');
      setFetchedTab(null); // Force re-fetch
    } else {
      toast.error(result.error || 'Failed to delete inward');
    }
  };

  const InwardsList = ({ inwards }: { inwards: any[] }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 border-b border-border">
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Lot No</th>
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Customer</th>
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Quality</th>
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Challan No</th>
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Total Mtrs</th>
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {inwards.map((inward: any) => (
              <tr key={inward.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-8 py-5 font-bold text-foreground">
                  {inward.lotNo}
                </td>
                <td className="px-8 py-5 text-sm font-medium text-muted-foreground">
                  {inward.customer?.customerName || 'N/A'}
                </td>
                <td className="px-8 py-5 text-sm font-medium text-muted-foreground">
                  {inward.quality}
                </td>
                <td className="px-8 py-5 text-sm font-medium text-muted-foreground">
                  {inward.challanNo}
                </td>
                <td className="px-8 py-5 font-black text-blue-600">
                  {(inward.totalMtr || 0).toFixed(2)}
                </td>
                <td className="px-8 py-5">
                  <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                    inward.status === 'In-Warehouse' ? 'bg-muted text-muted-foreground' :
                    'bg-blue-600/10 text-blue-600'
                  }`}>
                    {inward.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                   <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button 
                       onClick={() => handleEdit(inward)}
                       className="p-2 hover:bg-primary/10 rounded-xl text-primary/60 hover:text-primary transition-all duration-300"
                     >
                       <Search size={18} />
                     </button>
                     <button 
                       onClick={() => handleDelete(inward.id)}
                       className="p-2 hover:bg-red-500/10 rounded-xl text-red-500/40 hover:text-red-500 transition-all duration-300"
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );

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
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Lot No</th>
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Quality</th>
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Mtrs</th>
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest">Status</th>
              <th className="px-8 py-5 text-xs font-black text-muted-foreground uppercase tracking-widest w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {batches.map((batch: any) => (
              <tr key={batch.id} className="hover:bg-muted/30 transition-colors group">
                <td className="px-8 py-5 font-bold text-foreground">
                  {batch.batchNo}
                </td>
                <td className="px-8 py-5 text-sm font-medium text-muted-foreground">
                  {batch.greyInward?.customer?.customerName || 'N/A'}
                </td>
                <td className="px-8 py-5 text-sm font-medium text-muted-foreground">
                  {batch.greyInward?.lotNo || 'N/A'}
                </td>
                <td className="px-8 py-5 text-sm font-medium text-muted-foreground">
                  {batch.greyInward?.quality || 'N/A'}
                </td>
                <td className="px-8 py-5 font-black text-blue-600">
                  {(batch.mtrs || 0).toFixed(2)}
                </td>
                <td className="px-8 py-5">
                  <span className="text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider bg-blue-600/10 text-blue-600">
                    {batch.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right text-muted-foreground/30 italic text-[10px]">
                  Batch Mode
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
        searchPlaceholder={`Search ${titles[activeTab]}...`}
        showSearch={!showForm}
        onFilterToggle={() => setShowFilters(!showFilters)}
        isFilterActive={Object.keys(filters).length > 0}
        actionButton={!showForm && (
          <div className="flex items-center gap-3">
            {(activeTab === 'batches' || activeTab === 'inwards') && (
              <button 
                onClick={() => setShowImport(true)}
                className="bg-muted hover:bg-muted/80 text-muted-foreground px-6 h-12 rounded-2xl font-black transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98]"
              >
                <Upload size={16} />
                Import
              </button>
            )}
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
              Add Inward
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
                   onClick={() => {
                     setShowForm(false);
                     setEditingRecord(null);
                   }}
                   className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  ← Back to {titles[activeTab]}
                </button>
                <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                  {editingRecord ? 'Edit' : 'New'} {titles[activeTab]} Entry
                </h2>
             </div>
             <GlassCard>
                <div className="p-10">
                   <GreyInwardForm onSuccess={handleRecordAddedOrUpdated} initialData={editingRecord} />
                </div>
             </GlassCard>
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
        ) : activeTab === 'inwards' ? (
          data.length === 0 ? (
            <motion.div 
               key="empty-inwards"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-card/50 rounded-[3rem] border border-border shadow-xl overflow-hidden backdrop-blur-sm"
            >
               <div className="p-10">
                 <EmptyState 
                   title="No Inwards Found"
                   description="Start by adding your first grey inward entry."
                   onAdd={() => setShowForm(true)}
                 />
               </div>
            </motion.div>
          ) : (
            <>
              <InwardsList inwards={data} />
              <Pagination 
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                onPageChange={setCurrentPage}
              />
            </>
          )
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
                  onImport={activeTab === 'batches' ? () => setShowImport(true) : undefined}
                  actionLabel="Add New Inward"
                />
              </div>
            </motion.div>
          ) : (
            <div key={`${activeTab}-batchlist`}>
              <BatchList batches={data} />
              <Pagination 
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                onPageChange={setCurrentPage}
              />
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
                    <div key={item.id} className="p-4 rounded-xl bg-muted/30 border border-border flex justify-between items-center group">
                      <div>
                        <span className="font-bold block">{item.lotNo}</span>
                        <span className="text-xs text-muted-foreground">Challan: {item.challanNo} • {item.quality}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] bg-blue-600/10 text-blue-600 px-3 py-1 rounded-full font-black uppercase tracking-wider">{item.status}</span>
                        <button 
                          onClick={() => handleEdit(item)}
                          className="p-2 hover:bg-primary/10 rounded-xl text-primary/60 hover:text-primary transition-all duration-300 opacity-0 group-hover:opacity-100"
                        >
                          <Search size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ImportModal 
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title="Grey Inwards"
        templateColumns={['Date', 'Lot No', 'Challan No', 'Customer', 'Quality', 'Pcs', 'Mtrs', 'Weight']}
        onImport={async (data) => {
          const res = await bulkCreateGreyInwards(data);
          if (res.success) {
            setFetchedTab(null); // Force re-fetch
          }
          return res;
        }}
      />
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
