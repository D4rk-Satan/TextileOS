'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
import { 
  Printer, 
  Calendar, 
  User, 
  FileText, 
  Save, 
  RotateCcw, 
  Info,
  Layers,
  Building2,
  Tag,
  Hash
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { FormHeader } from '@/components/shared/FormHeader';
import { FormInput } from '@/components/shared/FormInput';
import { FormSelect } from '@/components/shared/FormSelect';
import { FormButton } from '@/components/shared/FormButton';
import { getReadyForPrintingLots, createPrintingIssue, getNextProductionNumber } from '@/app/actions/printing';
import { toast } from 'sonner';

interface IssueForPrintingFormProps {
  onSuccess?: () => void;
}

export function IssueForPrintingForm({ onSuccess }: IssueForPrintingFormProps) {
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm({
    defaultValues: {
      productionNumber: '',
      date: new Date().toISOString().split('T')[0],
      lotNo: '',
      remark: '',
      processType: '',
      customerName: '',
      batches: [] as any[]
    }
  });

  const { control, handleSubmit, watch, setValue, reset } = methods;
  const { fields, replace } = useFieldArray({
    control,
    name: "batches"
  });

  useEffect(() => {
    async function loadData() {
      const [lotRes, prodRes] = await Promise.all([
        getReadyForPrintingLots(),
        getNextProductionNumber()
      ]);
      if (lotRes.success) setLots(lotRes.data || []);
      if (prodRes.success && prodRes.data) setValue('productionNumber', prodRes.data);
      setLoading(false);
    }
    loadData();
  }, []);

  const selectedLotNo = watch('lotNo');
  useEffect(() => {
    if (selectedLotNo) {
      const lot = lots.find(l => l.lotNo === selectedLotNo);
      if (lot) {
        setValue('processType', lot.processType || 'N/A');
        setValue('customerName', lot.customer?.customerName || 'N/A');
        replace(lot.batches.map((b: any) => ({
          id: b.id,
          ids: b.ids,
          batchNo: b.batchNo,
          mtrs: Number(b.mtrs),
          rfdMtrs: Number(b.rfdMtrs)
        })));
      }
    } else {
      setValue('processType', '');
      setValue('customerName', '');
      replace([]);
    }
  }, [selectedLotNo, lots, replace, setValue]);

  const totalGreyMtr = useMemo(() => {
    return fields.reduce((sum, field: any) => sum + (Number(field.mtrs) || 0), 0);
  }, [fields]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    const result = await createPrintingIssue(data);
    setIsSubmitting(false);

    if (result.success) {
      toast.success('Printing issue recorded successfully');
      reset();
      replace([]);
      if (onSuccess) onSuccess();
    } else {
      toast.error(result.error || 'Failed to record printing issue');
    }
  };

  if (loading) return <div className="h-40 flex items-center justify-center">Loading form data...</div>;

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
        <FormHeader title="Issue For Printing" icon={Printer} color="blue" />

        {/* Centralized Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-8 max-w-5xl mx-auto">
          {/* Row 1 */}
          <FormInput
            label="Date"
            name="date"
            type="date"
            required
            icon={Calendar}
          />
          <FormInput
            label="Process Type"
            name="processType"
            readOnly
            placeholder="Auto-filled from Lot"
            icon={Tag}
            className="bg-muted/30"
          />

          {/* Row 2 */}
          <FormSelect
            label="Lot No"
            name="lotNo"
            required
            icon={Layers}
            options={lots.map(l => ({ 
              label: `Lot #${l.lotNo} (${l.batches.length} batches)`, 
              value: l.lotNo 
            }))}
            placeholder="Select a lot..."
          />
          <FormInput
            label="Customers"
            name="customerName"
            readOnly
            placeholder="Auto-filled from Lot"
            icon={Building2}
            className="bg-muted/30"
          />

          {/* Row 3 - Production Number */}
          <FormInput
            label="Production Number"
            name="productionNumber"
            readOnly
            placeholder="Generating..."
            icon={Hash}
            className="bg-muted/30 font-bold"
          />
        </div>

        {/* Batch Table Section */}
        <div className="max-w-5xl mx-auto mt-12">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Layers size={16} className="text-blue-500" />
              Batch Info
            </h4>
          </div>
          
          <div className="overflow-hidden rounded-3xl border border-border/50 bg-muted/10 shadow-inner">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <tr>
                  <th className="px-8 py-5 w-20">Sr No</th>
                  <th className="px-8 py-5">Batch No</th>
                  <th className="px-8 py-5 text-right">Grey Mts</th>
                  <th className="px-8 py-5 text-right">RFD Mtr</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {fields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-card/50 transition-colors group">
                    <td className="px-8 py-5 text-xs font-black text-muted-foreground/50">
                      {String(index + 1).padStart(2, '0')}
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-foreground">
                      {watch(`batches.${index}.batchNo`)}
                    </td>
                    <td className="px-8 py-5 text-right text-sm font-bold text-muted-foreground">
                      {watch(`batches.${index}.mtrs`).toFixed(2)}
                    </td>
                    <td className="px-8 py-5 text-right text-sm font-black text-blue-600">
                      {watch(`batches.${index}.rfdMtrs`).toFixed(2)}
                    </td>
                  </tr>
                ))}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-16 text-center text-sm text-muted-foreground italic bg-background/30">
                      <div className="flex flex-col items-center gap-3">
                        <Info size={24} className="text-muted-foreground/30" />
                        <span>Select a lot to view its ready batches</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary Row */}
          <div className="mt-8 flex justify-end">
            <div className="bg-card border border-border/50 p-6 rounded-2xl shadow-sm min-w-[300px]">
              <div className="flex justify-between items-center gap-8">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Grey Mtr</span>
                <span className="text-xl font-black text-blue-600 tracking-tighter">
                  {totalGreyMtr.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-6 max-w-5xl mx-auto">
          <FormButton 
              type="submit" 
              variant="primary" 
              disabled={isSubmitting || fields.length === 0}
              className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 flex gap-3 transition-all hover:scale-105"
          >
            <Save size={20} />
            {isSubmitting ? 'Issuing...' : 'Submit'}
          </FormButton>
          <FormButton 
              type="button" 
              onClick={() => { reset(); replace([]); }} 
              variant="secondary" 
              className="h-14 px-12 rounded-2xl font-black uppercase tracking-widest flex gap-3 transition-all hover:bg-muted"
          >
            <RotateCcw size={20} />
            Reset
          </FormButton>
        </div>
      </form>
    </FormProvider>
  );
}
