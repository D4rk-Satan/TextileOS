'use client';

import React, { useState, useEffect } from 'react';
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
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { FormHeader } from '@/components/shared/FormHeader';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';
import { getPrinters, getReadyForPrintingLots, createPrintingIssue } from '@/app/actions/printing';
import { toast } from 'sonner';

interface IssueForPrintingFormProps {
  onSuccess?: () => void;
}

export function IssueForPrintingForm({ onSuccess }: IssueForPrintingFormProps) {
  const [printers, setPrinters] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const methods = useForm({
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      lotNo: '',
      printerId: '',
      dcNo: '',
      remark: '',
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
      const [printerRes, lotRes] = await Promise.all([
        getPrinters(),
        getReadyForPrintingLots()
      ]);
      if (printerRes.success) setPrinters(printerRes.data || []);
      if (lotRes.success) setLots(lotRes.data || []);
      setLoading(false);
    }
    loadData();
  }, []);

  const selectedLotNo = watch('lotNo');
  useEffect(() => {
    if (selectedLotNo) {
      const lot = lots.find(l => l.lotNo === selectedLotNo);
      if (lot) {
        replace(lot.batches.map((b: any) => ({
          id: b.id,
          batchNo: b.batchNo,
          mtrs: b.mtrs,
          rfdMtrs: b.rfdMtrs
        })));
      }
    } else {
      replace([]);
    }
  }, [selectedLotNo, lots, replace]);

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
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        <FormHeader title="Issue For Printing" icon={Printer} color="blue" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <div className="space-y-6">
            <FormInput
              label="Issue Date"
              name="date"
              type="date"
              required
              icon={Calendar}
            />
            
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
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Select Printer</label>
              <div className="relative">
                <select
                  {...methods.register('printerId', { required: true })}
                  className="w-full h-12 bg-card border border-border/50 rounded-xl px-4 pl-11 text-sm font-bold appearance-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all"
                >
                  <option value="">Choose printer...</option>
                  {printers.map(p => (
                    <option key={p.id} value={p.id}>{p.vendorName}</option>
                  ))}
                </select>
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/60" size={18} />
              </div>
            </div>

            <FormInput
              label="DC Number"
              name="dcNo"
              placeholder="Enter Challan No"
              icon={FileText}
            />
          </div>
        </div>

        {/* Batch Table */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Batches to Issue</h4>
            <Info size={14} className="text-muted-foreground" />
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/20">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-4">Batch No</th>
                  <th className="px-6 py-4 text-right">Grey Meters</th>
                  <th className="px-6 py-4 text-right">RFD Meters</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {fields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-card/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-bold text-foreground">
                      {methods.watch(`batches.${index}.batchNo`)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-muted-foreground">
                      {methods.watch(`batches.${index}.mtrs`)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-black text-blue-600">
                      {methods.watch(`batches.${index}.rfdMtrs`)}
                    </td>
                  </tr>
                ))}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-6 py-10 text-center text-sm text-muted-foreground italic">
                      Select a lot to view batches
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-10">
          <FormButton 
              type="submit" 
              variant="primary" 
              disabled={isSubmitting || fields.length === 0}
              className="h-12 px-10 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-blue-600/20 flex gap-2"
          >
            <Save size={18} />
            {isSubmitting ? 'Issuing...' : 'Save Issue'}
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
