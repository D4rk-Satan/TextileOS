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
import { getOutForPrintingLots, createPrintingReceive, updatePrintingReceive, getNextReceiveProductionNumber, PrintingReceiveData, PrintingBatchInput } from '@/app/actions/printing';
import { toast } from 'sonner';
import { X } from 'lucide-react';

interface ReceiveFromPrintingFormProps {
  onSuccess?: () => void;
  initialData?: any; // Keeping any for now as it maps to Prisma include types
}

interface FormValues {
  productionNumber: string;
  date: string;
  jobCardNumber: string;
  lotNo: string;
  customerId: string;
  customerName: string;
  processType: string;
  printer: string;
  billNo: string;
  challanNo: string;
  remark: string;
  batches: PrintingBatchInput[];
}

export function ReceiveFromPrintingForm({ onSuccess, initialData }: ReceiveFromPrintingFormProps) {
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm<FormValues>({
    defaultValues: {
      productionNumber: initialData?.productionNumber || '',
      date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      jobCardNumber: initialData?.jobCardId || '',
      lotNo: initialData?.lotNo || '',
      customerId: initialData?.customerId || '',
      customerName: initialData?.customer?.customerName || '',
      processType: initialData?.processType || '',
      printer: initialData?.printerId || '',
      billNo: initialData?.billNo || '',
      challanNo: initialData?.challanNo || '',
      remark: initialData?.remark || '',
      batches: (initialData?.batches || []) as PrintingBatchInput[]
    }
  });

  const { control, handleSubmit, watch, setValue, reset } = methods;
  const { fields, replace, remove } = useFieldArray({
    control,
    name: "batches"
  });

  useEffect(() => {
    async function loadData() {
      const [lotRes, prodRes] = await Promise.all([
        getOutForPrintingLots(),
        !initialData ? getNextReceiveProductionNumber() : Promise.resolve(null)
      ]);
      if (lotRes.success) setLots(lotRes.data || []);
      if (!initialData && prodRes?.success && prodRes.data) setValue('productionNumber', prodRes.data);
      setLoading(false);
    }
    loadData();
  }, [initialData, setValue]);

  const selectedJobCardId = watch('jobCardNumber');
  useEffect(() => {
    if (initialData) return;
    if (selectedJobCardId) {
      const lot = lots.find(l => l.id === selectedJobCardId);
      if (lot) {
        setValue('lotNo', lot.lotNo);
        setValue('customerId', lot.customer?.id || '');
        setValue('customerName', lot.customer?.customerName || '');
        setValue('processType', lot.processType || '');
        setValue('printer', lot.printerId || '');
        replace(lot.batches.map((b: any) => ({
          id: b.id,
          ids: b.ids, // All linked IDs for this grouped row
          batchNo: b.batchNo,
          mtrs: b.mtrs,
          rfdMtrs: b.rfdMtrs,
          printMtrs: 0,
          printShortage: 0,
          isTP: b.isTP || false,
          tpDetail: b.tpDetail || ''
        })));
      }
    } else {
      setValue('lotNo', '');
      setValue('customerId', '');
      setValue('customerName', '');
      setValue('processType', '');
      replace([]);
    }
  }, [selectedJobCardId, lots, replace, setValue, initialData]);

  // Helper to parse TP Detail string (e.g. "90+10+20")
  const calculateTPSum = (detail: string) => {
    if (!detail) return 0;
    const parts = detail.split(/[+\s,]+/).map(p => parseFloat(p)).filter(p => !isNaN(p));
    return parts.reduce((sum, p) => sum + p, 0);
  };

  // Real-time calculation for print shortage - ONLY IF NOT EDITING
  const batchesData = useWatch({
    control,
    name: 'batches'
  });

  useEffect(() => {
    if (initialData) return;
    batchesData?.forEach((batch: any, index: number) => {
      // Clear TP details if isTP is unchecked
      if (!batch.isTP && batch.tpDetail !== '') {
        setValue(`batches.${index}.tpDetail`, '');
      }

      let currentPrintMtrs = parseFloat(batch.printMtrs) || 0;

      // Handle TP Logic: If TP is checked, calculate Finish Mtr from TP Detail
      if (batch.isTP) {
        const calculatedSum = calculateTPSum(batch.tpDetail);
        if (calculatedSum !== currentPrintMtrs) {
          setValue(`batches.${index}.printMtrs`, parseFloat(calculatedSum.toFixed(2)));
          currentPrintMtrs = calculatedSum;
        }
      }

      if (batch.rfdMtrs !== undefined && currentPrintMtrs !== undefined && batch.rfdMtrs > 0) {
        const shortage = ((batch.rfdMtrs - currentPrintMtrs) / batch.rfdMtrs) * 100;
        const currentShortage = methods.getValues(`batches.${index}.printShortage` as any);
        if (currentShortage !== Number(shortage.toFixed(2))) {
          setValue(`batches.${index}.printShortage` as any, Number(shortage.toFixed(2)));
        }
      }
    });
  }, [batchesData, setValue, methods, initialData]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    const formattedData: PrintingReceiveData = {
      date: data.date,
      lotNo: data.lotNo,
      printer: data.printer,
      billNo: data.billNo,
      challanNo: data.challanNo,
      remark: data.remark,
      batches: data.batches
    };

    const result = initialData
      ? await updatePrintingReceive(initialData.id, formattedData)
      : await createPrintingReceive(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success(`Printing receipt ${initialData ? 'updated' : 'recorded'} successfully`);
      if (!initialData) {
        reset();
        replace([]);
      }
      if (onSuccess) onSuccess();
    } else {
      toast.error(result.error || `Failed to ${initialData ? 'update' : 'record'} printing receipt`);
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
              className="bg-muted/30 cursor-default font-bold"
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
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Job Card</label>
              <div className="relative">
                <select
                  {...methods.register('jobCardNumber' as any, { required: true })}
                  className="w-full h-12 bg-card border border-border/50 rounded-xl px-4 pl-11 text-sm font-bold appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                >
                  <option value="">Choose a job card...</option>
                  {lots.map(lot => (
                    <option key={lot.id} value={lot.id}>
                      {lot.jobCardNumber ? `JC #${lot.jobCardNumber}` : 'No JC#'} (Lot #{lot.lotNo})
                    </option>
                  ))}
                </select>
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
              </div>
            </div>

            <div className="space-y-2">
              <FormInput
                label="Customer"
                name="customerName"
                icon={User}
                readOnly
                placeholder="Select Job Card first..."
                className="bg-muted/50 cursor-default font-bold"
              />
              <input type="hidden" {...methods.register('customerId' as any)} />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <FormInput
                label="Lot No"
                name="lotNo"
                icon={Layers}
                readOnly
                placeholder="Lot Number"
                className="bg-muted/50 cursor-default font-bold"
              />
            </div>

            <div className="space-y-2">
              <FormInput
                label="Process Type"
                name="processType"
                icon={Layers}
                readOnly
                placeholder="Process Type"
                className="bg-muted/50 cursor-default font-bold"
              />
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
                {(() => {
                  const batchesData = watch('batches');
                  return fields.map((field, index) => {
                    const batch = batchesData[index];
                    return (
                      <tr key={field.id} className="hover:bg-card/50 transition-colors">
                        <td className="px-4 py-3 text-center text-xs font-black text-muted-foreground">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-sm font-bold text-foreground">
                          {batch?.batchNo}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-muted-foreground/60">
                          {batch?.mtrs}
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-muted-foreground">
                          {batch?.rfdMtrs}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center">
                            <input
                              {...methods.register(`batches.${index}.printMtrs`, { required: true, valueAsNumber: true })}
                              type="number"
                              step="0.01"
                              readOnly={batch?.isTP}
                              className={`w-24 border border-border/50 rounded-lg px-3 py-1.5 text-sm font-bold text-center outline-none transition-all ${
                                batch?.isTP 
                                  ? "bg-muted/50 cursor-default" 
                                  : "bg-card focus:border-indigo-500"
                              }`}
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
                            readOnly={!batch?.isTP}
                            className={`w-full border border-border/50 rounded-lg px-3 py-1.5 text-sm font-bold outline-none transition-all ${
                              !batch?.isTP 
                                ? "bg-muted/50 cursor-default" 
                                : "bg-card focus:border-indigo-500"
                            }`}
                            placeholder="Detail"
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(batch?.printShortage || 0) < 0 ? <TrendingUp size={12} className="text-green-500" /> : <TrendingDown size={12} className="text-red-500" />}
                            <span className={`text-sm font-black ${(batch?.printShortage || 0) < 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {(batch?.printShortage || 0)}%
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
                    );
                  });
                })()}
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
