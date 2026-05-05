/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { 
  Truck, 
  Calendar, 
  User, 
  FileText, 
  Save, 
  RotateCcw, 
  Layers,
  Hash,
  Trash2,
  Package
} from 'lucide-react';
import { FormHeader } from '@/components/shared/FormHeader';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';
import { getCustomers } from '@/app/actions/master';
import { getNextDeliveryChallanNumber, getReadyForDispatchLots, createDeliveryChallan } from '@/app/actions/dispatch';
import { toast } from 'sonner';

interface DeliveryChallanFormProps {
  onSuccess?: () => void;
}

export function DeliveryChallanForm({ onSuccess }: DeliveryChallanFormProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [readyLots, setReadyLots] = useState<any[]>([]);
  const [selectedBatches, setSelectedBatches] = useState<any[]>([]);
  const [expandedLots, setExpandedLots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm({
    defaultValues: {
      challanNo: '',
      date: new Date().toISOString().split('T')[0],
      customerId: '',
      remark: ''
    }
  });

  const { handleSubmit, watch, setValue, reset } = methods;
  const selectedCustomerId = watch('customerId');

  useEffect(() => {
    async function loadInitialData() {
      const [customerRes, challanRes] = await Promise.all([
        getCustomers(),
        getNextDeliveryChallanNumber()
      ]);
      if (customerRes.success) setCustomers(customerRes.data || []);
      if (challanRes.success && challanRes.data) setValue('challanNo', challanRes.data);
      setLoading(false);
    }
    loadInitialData();
  }, [setValue]);

  useEffect(() => {
    async function loadLots() {
      if (selectedCustomerId) {
        const res = await getReadyForDispatchLots(selectedCustomerId);
        if (res.success) {
          setReadyLots(res.data || []);
          setSelectedBatches([]); // Reset selection when customer changes
        }
      } else {
        setReadyLots([]);
        setSelectedBatches([]);
      }
    }
    loadLots();
  }, [selectedCustomerId]);

  const toggleBatch = (batch: any, lot: any) => {
    const isSelected = selectedBatches.find(b => b.id === batch.id);
    if (isSelected) {
      setSelectedBatches(selectedBatches.filter(b => b.id !== batch.id));
    } else {
      setSelectedBatches([...selectedBatches, { ...batch, lotNo: lot.lotNo, quality: lot.quality, processType: lot.processType }]);
    }
  };

  const removeBatch = (batchId: string) => {
    setSelectedBatches(selectedBatches.filter(b => b.id !== batchId));
  };

  const toggleLotExpansion = (lotNo: string) => {
    setExpandedLots(prev => 
      prev.includes(lotNo) ? prev.filter(l => l !== lotNo) : [...prev, lotNo]
    );
  };

  const onSubmit = async (data: any) => {
    if (selectedBatches.length === 0) {
      toast.error('Please select at least one batch to dispatch');
      return;
    }

    setIsSubmitting(true);
    const batchIds = selectedBatches.map(b => b.id);
    const result = await createDeliveryChallan({ ...data, batchIds });
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Delivery challan created successfully');
      reset();
      setSelectedBatches([]);
      if (onSuccess) onSuccess();
    } else {
      toast.error(result.error || 'Failed to create delivery challan');
    }
  };

  if (loading) return <div className="h-40 flex items-center justify-center">Loading form data...</div>;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <FormHeader title="Create Delivery Challan" icon={Truck} color="blue" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <FormInput
            label="Challan Number"
            name="challanNo"
            icon={Hash}
            readOnly
            className="bg-muted/30 cursor-default font-bold"
          />
          <FormInput
            label="Challan Date"
            name="date"
            type="date"
            required
            icon={Calendar}
          />
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Customer</label>
            <div className="relative">
              <select
                {...methods.register('customerId', { required: true })}
                className="w-full h-12 bg-card border border-border/50 rounded-xl px-4 pl-11 text-sm font-bold appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
              >
                <option value="">Choose a customer...</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.customerName}</option>
                ))}
              </select>
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Ready Lots Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Package size={14} className="text-blue-500" />
              Available Batches (Grouped by Lot)
            </h4>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
              {readyLots.length === 0 ? (
                <div className="p-8 border border-dashed border-border rounded-2xl text-center text-muted-foreground text-xs italic">
                  {selectedCustomerId ? 'No lots ready for dispatch for this customer.' : 'Select a customer to see available lots.'}
                </div>
              ) : (
                readyLots.map(lot => {
                  const isExpanded = expandedLots.includes(lot.lotNo);
                  const selectedInLot = lot.batches.filter((b: any) => selectedBatches.find(sb => sb.id === b.id));
                  
                  return (
                    <div 
                      key={lot.lotNo} 
                      className="rounded-2xl border border-border bg-card/50 overflow-hidden"
                    >
                      <div 
                        onClick={() => toggleLotExpansion(lot.lotNo)}
                        className="p-4 flex justify-between items-start cursor-pointer hover:bg-blue-500/5 transition-colors"
                      >
                        <div>
                          <div className="text-sm font-black text-foreground flex items-center gap-2">
                            Lot #{lot.lotNo}
                            {selectedInLot.length > 0 && (
                              <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-black">
                                {selectedInLot.length} Selected
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{lot.quality} | {lot.processType}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-blue-600">{lot.batches.length} Batches</div>
                          <div className="text-[10px] text-muted-foreground font-bold">{lot.batches.reduce((sum: number, b: any) => sum + b.printMtrs, 0).toFixed(2)} Mtrs</div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="px-4 pb-4 space-y-2 border-t border-border/50 pt-3 bg-muted/20">
                          {lot.batches.map((batch: any) => {
                            const isSelected = selectedBatches.find(sb => sb.id === batch.id);
                            return (
                              <div 
                                key={batch.id}
                                onClick={() => toggleBatch(batch, lot)}
                                className={`p-3 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                                  isSelected 
                                    ? 'bg-green-500/10 border-green-500/30' 
                                    : 'bg-background border-border/50 hover:border-blue-500/30'
                                }`}
                              >
                                <div>
                                  <div className="text-[11px] font-black uppercase tracking-widest text-foreground">{batch.batchNo}</div>
                                  <div className="text-[10px] text-muted-foreground font-medium">Finished Mtrs</div>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  <div className="text-xs font-black text-foreground">{Number(batch.printMtrs).toFixed(2)}</div>
                                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                                    isSelected ? 'bg-green-500 border-green-500' : 'border-border'
                                  }`}>
                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected Batches Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Truck size={14} className="text-green-500" />
              Selected for Dispatch ({selectedBatches.length})
            </h4>
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 no-scrollbar">
              {selectedBatches.length === 0 ? (
                <div className="p-8 border border-dashed border-border rounded-2xl text-center text-muted-foreground text-xs italic">
                  Select individual batches from the available lots to add them to this dispatch.
                </div>
              ) : (
                selectedBatches.map(batch => (
                  <div 
                    key={batch.id}
                    className="p-4 rounded-2xl border border-green-500/20 bg-green-500/5 relative group animate-in slide-in-from-right-4 duration-300"
                  >
                    <button 
                      type="button"
                      onClick={() => removeBatch(batch.id)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-[11px] font-black text-foreground uppercase tracking-widest">
                          {batch.batchNo} <span className="text-muted-foreground ml-2 font-bold opacity-50">Lot #{batch.lotNo}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{batch.quality} | {batch.processType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-green-600">{Number(batch.printMtrs).toFixed(2)} Mtrs</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <FormInput
          label="Remark"
          name="remark"
          placeholder="Optional notes about this dispatch..."
          icon={FileText}
        />

        <div className="flex items-center gap-4 mt-10">
          <FormButton 
              type="submit" 
              variant="primary" 
              disabled={isSubmitting || selectedBatches.length === 0}
              className="h-12 px-10 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 flex gap-2"
          >
            <Save size={18} />
            {isSubmitting ? 'Creating...' : 'Create Challan'}
          </FormButton>
          <FormButton 
              type="button" 
              onClick={() => { reset(); setSelectedBatches([]); }} 
              variant="secondary" 
              className="h-12 px-10 rounded-xl font-black uppercase tracking-wider flex gap-2"
          >
            <RotateCcw size={18} />
            Reset
          </FormButton>
        </div>
      </form>
    </FormProvider>
  );
}
