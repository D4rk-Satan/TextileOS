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
  const [selectedLots, setSelectedLots] = useState<any[]>([]);
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
          setSelectedLots([]); // Reset selection when customer changes
        }
      } else {
        setReadyLots([]);
        setSelectedLots([]);
      }
    }
    loadLots();
  }, [selectedCustomerId]);

  const addLot = (lot: any) => {
    if (!selectedLots.find(l => l.lotNo === lot.lotNo)) {
      setSelectedLots([...selectedLots, lot]);
      setReadyLots(readyLots.filter(l => l.lotNo !== lot.lotNo));
    }
  };

  const removeLot = (lot: any) => {
    setSelectedLots(selectedLots.filter(l => l.lotNo !== lot.lotNo));
    setReadyLots([...readyLots, lot]);
  };

  const onSubmit = async (data: any) => {
    if (selectedLots.length === 0) {
      toast.error('Please select at least one lot to dispatch');
      return;
    }

    setIsSubmitting(true);
    const batchIds = selectedLots.flatMap(lot => lot.batches.map((b: any) => b.id));
    const result = await createDeliveryChallan({ ...data, batchIds });
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Delivery challan created successfully');
      reset();
      setSelectedLots([]);
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
              Available Lots (Ready for Dispatch)
            </h4>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {readyLots.length === 0 ? (
                <div className="p-8 border border-dashed border-border rounded-2xl text-center text-muted-foreground text-xs italic">
                  {selectedCustomerId ? 'No lots ready for dispatch for this customer.' : 'Select a customer to see available lots.'}
                </div>
              ) : (
                readyLots.map(lot => (
                  <div 
                    key={lot.lotNo} 
                    onClick={() => addLot(lot)}
                    className="p-4 rounded-2xl border border-border bg-card/50 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-black text-foreground">Lot #{lot.lotNo}</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{lot.quality} | {lot.processType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-blue-600">{lot.batches.length} Batches</div>
                        <div className="text-[10px] text-muted-foreground font-bold">{lot.batches.reduce((sum: number, b: any) => sum + b.printMtrs, 0).toFixed(2)} Mtrs</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Lots Column */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Truck size={14} className="text-green-500" />
              Selected for Dispatch
            </h4>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
              {selectedLots.length === 0 ? (
                <div className="p-8 border border-dashed border-border rounded-2xl text-center text-muted-foreground text-xs italic">
                  Click on an available lot to add it to this dispatch.
                </div>
              ) : (
                selectedLots.map(lot => (
                  <div 
                    key={lot.lotNo}
                    className="p-4 rounded-2xl border border-green-500/20 bg-green-500/5 relative group"
                  >
                    <button 
                      type="button"
                      onClick={() => removeLot(lot)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-black text-foreground">Lot #{lot.lotNo}</div>
                        <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{lot.quality} | {lot.processType}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-green-600">{lot.batches.length} Batches</div>
                        <div className="text-[10px] text-muted-foreground font-bold">{lot.batches.reduce((sum: number, b: any) => sum + b.printMtrs, 0).toFixed(2)} Mtrs</div>
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
              disabled={isSubmitting || selectedLots.length === 0}
              className="h-12 px-10 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 flex gap-2"
          >
            <Save size={18} />
            {isSubmitting ? 'Creating...' : 'Create Challan'}
          </FormButton>
          <FormButton 
              type="button" 
              onClick={() => { reset(); setSelectedLots([]); }} 
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
