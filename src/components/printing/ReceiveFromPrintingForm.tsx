'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider, useWatch } from 'react-hook-form';
import { 
  Printer, 
  Calendar, 
  User, 
  FileText, 
  Save, 
  RotateCcw, 
  Info,
  Layers,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Hash
} from 'lucide-react';
import { FormHeader } from '@/components/shared/FormHeader';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';
import { getPrinters, getOutForPrintingLots, createPrintingReceive, getNextProductionNumber } from '@/app/actions/printing';
import { getCustomers } from '@/app/actions/master';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface ReceiveFromPrintingFormProps {
  onSuccess?: () => void;
}

export function ReceiveFromPrintingForm({ onSuccess }: ReceiveFromPrintingFormProps) {
  const [printers, setPrinters] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm({
    defaultValues: {
      productionNumber: '',
      date: new Date().toISOString().split('T')[0],
      lotNo: '',
      printerId: '',
      customerId: '',
      processType: '',
      billNo: '',
      challanNo: '',
      remark: '',
      batches: [] as any[]
    }
  });

  const { control, handleSubmit, watch, setValue, reset } = methods;
  const { fields, replace, remove } = useFieldArray({
    control,
    name: "batches"
  });

  useEffect(() => {
    async function loadData() {
      const [printerRes, lotRes, customerRes, prodRes] = await Promise.all([
        getPrinters(),
        getOutForPrintingLots(),
        getCustomers(),
        getNextProductionNumber()
      ]);
      if (printerRes.success) setPrinters(printerRes.data || []);
      if (lotRes.success) setLots(lotRes.data || []);
      if (customerRes.success) setCustomers(customerRes.data || []);
      if (prodRes.success && prodRes.data) setValue('productionNumber', prodRes.data);
      setLoading(false);
    }
    loadData();
  }, [setValue]);

  const selectedLotNo = watch('lotNo');
  useEffect(() => {
    if (selectedLotNo) {
      const lot = lots.find(l => l.lotNo === selectedLotNo);
      if (lot) {
        setValue('printerId', lot.printerId);
        setValue('customerId', lot.customer?.id || '');
        setValue('processType', lot.processType || '');
        replace(lot.batches.map((b: any) => ({
          id: b.id,
          batchNo: b.batchNo,
          mtrs: b.mtrs,
          rfdMtrs: b.rfdMtrs,
          printMtrs: b.rfdMtrs, // Default to RFD meters
          printShortage: 0,
          isTP: b.isTP || false,
          tpDetail: b.tpDetail || ''
        })));
      }
    } else {
      replace([]);
    }
  }, [selectedLotNo, lots, replace, setValue]);

  // Real-time calculation for print shortage
  const batchesData = useWatch({
    control,
    name: 'batches'
  });

  useEffect(() => {
    batchesData?.forEach((batch: any, index: number) => {
      if (batch.rfdMtrs !== undefined && batch.printMtrs !== undefined) {
        const shortage = (batch.rfdMtrs - batch.printMtrs) / 100;
        const currentShortage = methods.getValues(`batches.${index}.printShortage`);
        if (currentShortage !== Number(shortage.toFixed(2))) {
          setValue(`batches.${index}.printShortage`, Number(shortage.toFixed(2)));
        }
      }
    });
  }, [batchesData, setValue, methods]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    const result = await createPrintingReceive(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Printing receipt recorded successfully');
      reset();
      replace([]);
      if (onSuccess) onSuccess();
    } else {
      toast.error(result.error || 'Failed to record printing receipt');
    }
  };

  if (loading) return <div className="h-40 flex items-center justify-center">Loading form data...</div>;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <FormHeader title="Receive From Printing" icon={Printer} color="indigo" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-8">
          <div className="space-y-6">
            <FormInput
              label="Production Number"
              name="productionNumber"
              icon={Hash}
              readOnly
              className="bg-muted/30 cursor-default"
            />
            <FormInput
              label="Receive Date"
              name="date"
              type="date"
              required
              icon={Calendar}
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Lot No</label>
              <div className="relative">
                <select
                  {...methods.register('lotNo', { required: true })}
                  className="w-full h-12 bg-card border border-border/50 rounded-xl px-4 pl-11 text-sm font-bold appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                >
                  <option value="">Choose a lot...</option>
                  {lots.map(lot => (
                    <option key={lot.id} value={lot.lotNo}>Lot #{lot.lotNo} ({lot.batches.length} batches)</option>
                  ))}
                </select>
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Customer</label>
              <div className="relative">
                <select
                  {...methods.register('customerId', { required: true })}
                  className="w-full h-12 bg-card border border-border/50 rounded-xl px-4 pl-11 text-sm font-bold appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                >
                  <option value="">Select Customer...</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customerName}</option>
                  ))}
                </select>
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Printer</label>
              <div className="relative">
                <select
                  {...methods.register('printerId', { required: true })}
                  className="w-full h-12 bg-muted/50 border border-border/50 rounded-xl px-4 pl-11 text-sm font-bold appearance-none pointer-events-none outline-none"
                  tabIndex={-1}
                >
                  <option value="">Printer...</option>
                  {printers.map(p => (
                    <option key={p.id} value={p.id}>{p.vendorName}</option>
                  ))}
                </select>
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Process Type</label>
              <div className="relative">
                <select
                  {...methods.register('processType', { required: true })}
                  className="w-full h-12 bg-card border border-border/50 rounded-xl px-4 pl-11 text-sm font-bold appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                >
                  <option value="">Select Process...</option>
                  <option value="RFD & Print">RFD & Print</option>
                  <option value="Direct Print">Direct Print</option>
                  <option value="Dyeing & Print">Dyeing & Print</option>
                </select>
                <Layers className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* Batch Table */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Received Batches</h4>
            <Info size={14} className="text-muted-foreground" />
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/20">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-4 w-12 text-center">Sr No</th>
                  <th className="px-4 py-4">Batch No</th>
                  <th className="px-4 py-4 text-right">Grey Mts</th>
                  <th className="px-4 py-4 text-right">RFD Mtr</th>
                  <th className="px-4 py-4 text-center">Finish Mtr <span className="text-red-500">*</span></th>
                  <th className="px-4 py-4 text-center">TP</th>
                  <th className="px-4 py-4">TP Detail</th>
                  <th className="px-4 py-4 text-right">Shortage (%)</th>
                  <th className="px-4 py-4 w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {fields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-card/50 transition-colors">
                    <td className="px-4 py-3 text-center text-xs font-black text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-foreground">
                      {methods.watch(`batches.${index}.batchNo`)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-muted-foreground/60">
                      {methods.watch(`batches.${index}.mtrs`)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-bold text-muted-foreground">
                      {methods.watch(`batches.${index}.rfdMtrs`)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <input
                          {...methods.register(`batches.${index}.printMtrs`, { required: true, valueAsNumber: true })}
                          type="number"
                          step="0.01"
                          className="w-24 border border-border/50 rounded-lg px-3 py-1.5 text-sm font-bold text-center bg-card focus:border-indigo-500 outline-none transition-all"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <input
                          {...methods.register(`batches.${index}.isTP`)}
                          type="checkbox"
                          className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        {...methods.register(`batches.${index}.tpDetail`)}
                        className="w-full border border-border/50 rounded-lg px-3 py-1.5 text-sm font-bold bg-card focus:border-indigo-500 outline-none transition-all"
                        placeholder="Detail"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {methods.watch(`batches.${index}.printShortage`) < 0 ? <TrendingUp size={12} className="text-green-500" /> : <TrendingDown size={12} className="text-red-500" />}
                        <span className={`text-sm font-black ${methods.watch(`batches.${index}.printShortage`) < 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {methods.watch(`batches.${index}.printShortage`)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        type="button" 
                        onClick={() => remove(index)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-10">
          <FormButton 
              type="submit" 
              variant="primary" 
              disabled={isSubmitting || fields.length === 0}
              className="h-12 px-10 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 flex gap-2"
          >
            <Save size={18} />
            {isSubmitting ? 'Receiving...' : 'Save Receipt'}
          </FormButton>
          <FormButton 
              type="button" 
              onClick={() => { reset(); replace([]); }} 
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
