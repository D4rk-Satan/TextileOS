'use client';
export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Users,
  ShoppingBag,
  Package,
  Search,
  Upload
} from 'lucide-react';
import { CustomerForm } from '@/components/master/CustomerForm';
import { VendorForm } from '@/components/master/VendorForm';
import { ItemForm } from '@/components/master/ItemForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { GlassCard } from '@/components/shared/GlassCard';
import { MasterTable } from '@/components/shared/MasterTable';
import { ImportModal } from '@/components/shared/ImportModal';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getCustomers, getVendors, getItems, deleteCustomer, deleteVendor, deleteItem,
  bulkCreateCustomers, bulkCreateVendors, bulkCreateItems
} from '@/app/actions/master';
import { getUserRole } from '@/app/actions/auth';
import { ModuleHeader } from '@/components/layout/ModuleHeader';
import { AdvancedFilters } from '@/components/shared/AdvancedFilters';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';

type TabType = 'customers' | 'vendors' | 'items' | 'batches' | 'reports';

function MasterPageContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('customers');
  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [fetchedTab, setFetchedTab] = useState<TabType | null>(null);
  const [userRole, setUserRole] = useState<string>('User');
  const [showImport, setShowImport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ totalCount: 0, totalPages: 1 });

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<{ status?: string }>({});

  const fetchData = async (tab: TabType, search?: string, fltrs?: { status?: string }, page: number = 1) => {
    setLoading(true);
    const role = await getUserRole();
    setUserRole(role);

    setData([]);
    let result: { success: boolean; data?: any[]; totalCount?: number; totalPages?: number; error?: string } | undefined;
    if (tab === 'customers') result = await getCustomers(search, fltrs, page);
    else if (tab === 'vendors') result = await getVendors(search, fltrs, page);
    else if (tab === 'items') result = await getItems(search, fltrs, page);

    if (result?.success) {
      setData(result.data || []);
      setPagination({
        totalCount: result.totalCount || 0,
        totalPages: result.totalPages || 1
      });
    }
    setFetchedTab(tab);
    setLoading(false);
  };

  useEffect(() => {
    const tab = searchParams.get('tab') as TabType;
    if (tab && ['customers', 'vendors', 'items', 'batches', 'reports'].includes(tab)) {
      setActiveTab(tab);
      setShowForm(false);
      setEditingRecord(null);
      setCurrentPage(1);
      fetchData(tab, debouncedSearch, filters, 1);
    } else {
      fetchData(activeTab, debouncedSearch, filters, currentPage);
    }
  }, [searchParams, activeTab, debouncedSearch, filters, currentPage]);

  // Reset page when tab or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, debouncedSearch, filters]);

  const handleRecordAddedOrUpdated = () => {
    setShowForm(false);
    setEditingRecord(null);
    fetchData(activeTab);
  };

  const handleEdit = (record: any) => {
    setEditingRecord(record);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    let result;
    if (activeTab === 'customers') result = await deleteCustomer(id);
    else if (activeTab === 'vendors') result = await deleteVendor(id);
    else if (activeTab === 'items') result = await deleteItem(id);

    if (result?.success) {
      toast.success('Record deleted successfully');
      fetchData(activeTab);
    } else {
      toast.error(result?.error || 'Failed to delete record');
    }
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingRecord(null);
  };

  // RBAC: Only Admin can add Customers/Vendors. All can add Items.
  const role = userRole?.toLowerCase();
  const canAdd = role === 'admin' || activeTab === 'items';

  return (
    <div className="space-y-8">
      <ModuleHeader 
        title={activeTab}
        subtitle="Master"
        icon={activeTab === 'customers' ? Users : activeTab === 'vendors' ? ShoppingBag : Package}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder={`Search through ${activeTab}...`}
        showSearch={!showForm}
        onFilterToggle={() => setShowFilters(!showFilters)}
        isFilterActive={Object.keys(filters).length > 0}
        actionButton={!showForm && canAdd && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowImport(true)}
              className="bg-muted hover:bg-muted/80 text-muted-foreground px-6 h-12 rounded-2xl font-black transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98]"
            >
              <Upload size={16} />
              Import
            </button>
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
              Add {activeTab.slice(0, -1)}
            </button>
          </div>
        )}
      />

      <AdvancedFilters 
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFilterChange={setFilters}
        options={{
          statuses: [
            { label: 'Active', value: 'Active' },
            { label: 'Inactive', value: 'Inactive' }
          ]
        }}
      />

      {/* Main Content Area */}
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
          <motion.div 
            key={`${activeTab}-form`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="max-w-5xl mx-auto"
          >
             <div className="mb-6 flex items-center justify-between">
                <button 
                  onClick={handleBack}
                  className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
                >
                  ← Back to {activeTab}
                </button>
                <h2 className="text-2xl font-black text-foreground flex items-center gap-3">
                  {editingRecord ? 'Edit' : 'New'} {activeTab.slice(0, -1)} Entry
                </h2>
             </div>
             <GlassCard>
                <div className="p-10">
                  {activeTab === 'customers' && <CustomerForm onSuccess={handleRecordAddedOrUpdated} initialData={editingRecord} />}
                  {activeTab === 'vendors' && <VendorForm onSuccess={handleRecordAddedOrUpdated} initialData={editingRecord} />}
                  {activeTab === 'items' && <ItemForm onSuccess={handleRecordAddedOrUpdated} initialData={editingRecord} />}
                </div>
             </GlassCard>
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Table Control Bar removed and moved to header */}

            {data.length === 0 ? (
               <motion.div 
                 key="empty"
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="bg-card/50 rounded-[3rem] border border-border shadow-xl overflow-hidden backdrop-blur-sm"
               >
                 <div className="p-10">
                    <EmptyState 
                      title={`No ${activeTab} found`}
                      description={`You haven't added any ${activeTab} yet. Start by creating your first one.`}
                      onAdd={canAdd ? () => {
                        setEditingRecord(null);
                        setShowForm(true);
                      } : undefined}
                      onImport={canAdd ? () => setShowImport(true) : undefined}
                    />
                 </div>
               </motion.div>
            ) : (
               <div className="bg-card rounded-[2.5rem] border border-border shadow-xl overflow-hidden">
                 <MasterTable 
                    data={data} 
                    userRole={userRole}
                    type={activeTab === 'customers' ? 'customers' : activeTab === 'vendors' ? 'vendors' : 'items'} 
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    totalCount={pagination.totalCount}
                    onPageChange={setCurrentPage}
                  />
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Placeholder for batches/reports */}
      {(activeTab === 'batches' || activeTab === 'reports') && (
        <div className="bg-card/50 rounded-[2.5rem] border border-border shadow-xl overflow-hidden backdrop-blur-sm">
           <EmptyState 
             title={`${activeTab} Coming Soon`}
             description={`The ${activeTab} module is currently under development. Check back soon for updates!`}
             icon={<Package size={48} className="text-blue-600/20" />}
           />
        </div>
      )}

      {/* Import Modal */}
      <ImportModal 
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        templateColumns={
          activeTab === 'customers' ? ['Customer Name', 'Address', 'City', 'State', 'Pincode', 'Phone', 'GSTIN'] :
          activeTab === 'vendors' ? ['Vendor Name', 'Contact Person', 'City', 'State', 'GSTIN'] :
          ['Item Name', 'SKU']
        }
        onImport={async (data) => {
          let res;
          if (activeTab === 'customers') res = await bulkCreateCustomers(data);
          else if (activeTab === 'vendors') res = await bulkCreateVendors(data);
          else if (activeTab === 'items') res = await bulkCreateItems(data);
          
          if (res?.success) {
            fetchData(activeTab);
          }
          return res || { success: false, error: 'Unknown error' };
        }}
      />
    </div>
  );
}

export default function MasterPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading Module...</div>}>
      <MasterPageContent />
    </Suspense>
  );
}
