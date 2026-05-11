'use client';

import React, { useEffect, useState } from 'react';
import { useForm, FormProvider, useFieldArray, useWatch } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormSelect } from '@/components/shared/FormSelect';
import { FormButton } from '@/components/shared/FormButton';
import { 
  Calendar, 
  Layers,
  Save,
  RotateCcw,
  Building2,
  Hash,
  FileText,
  Info
} from 'lucide-react';
import { createRFDInward, updateRFDInward, getDyeingHouses, getGreyOutwardsByHouse } from '@/app/actions/dyeing';

export function RFDInwardForm({ onSuccess, initialData }: { onSuccess?: () => void; initialData?: any }) {
  const methods = useForm({
    defaultValues: {
      date: initialData?.date ? new Date(initialData.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      dyeingHouse: initialData?.dyeingHouseId || '',
      billNo: initialData?.billNo || '',
      challanNo: initialData?.challanNo || '', // This might need mapping if it's the display name
      lotNo: initialData?.lotNo || '',
      remark: initialData?.remark || '',
      batches: initialData?.batches || [],
    },
    mode: 'onTouched',
  });

  const { control, setValue, reset, handleSubmit } = methods;
  const { fields, replace } = useFieldArray({
    control,
    name: 'batches',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dyeingHouses, setDyeingHouses] = useState<any[]>([]);
  const [outwards, setOutwards] = useState<any[]>([]);

  const selectedDyeingHouse = useWatch({ control, name: 'dyeingHouse' });
  const selectedChallanId = useWatch({ control, name: 'challanNo' });
  const watchedBatches = useWatch({ control, name: 'batches' });

  // Calculate Total RFD Mtr
  const totalRFDMtr = watchedBatches?.reduce((sum: number, batch: any) => sum + (parseFloat(batch.rfdMtrs) || 0), 0) || 0;

  // Helper to parse TP Detail string (e.g. "90+10+20")
  const calculateTPSum = (detail: string) => {
    if (!detail) return 0;
    const parts = detail.split(/[+\s,]+/).map(p => parseFloat(p)).filter(p => !isNaN(p));
    return parts.reduce((sum, p) => sum + p, 0);
  };

  // Real-time Calculation Logic - ONLY IF NOT EDITING
  useEffect(() => {
    if (initialData) return;
    if (!watchedBatches) return;

    watchedBatches.forEach((batch: any, index: number) => {
      const grey = parseFloat(batch.greyMtrs) || 0;
      let rfd = parseFloat(batch.rfdMtrs) || 0;

      if (batch.isTP) {
        const calculatedRFD = calculateTPSum(batch.tpDetail);
        if (calculatedRFD !== rfd) {
          methods.setValue(`batches.${index}.rfdMtrs`, parseFloat(calculatedRFD.toFixed(2)));
          rfd = calculatedRFD;
        }
      }
      
      if (rfd > 0 && grey > 0) {
        const shortage = ((grey - rfd) / grey) * 100;
        const currentShortage = methods.getValues(`batches.${index}.millShortage`);
        
        if (shortage.toFixed(2) !== parseFloat(currentShortage || 0).toFixed(2)) {
          methods.setValue(`batches.${index}.millShortage`, parseFloat(shortage.toFixed(2)));
        }
      } else {
        methods.setValue(`batches.${index}.millShortage`, '');
      }
    });
  }, [watchedBatches, methods, initialData]);

  // Load Dyeing Houses
  useEffect(() => {
    async function loadHouses() {
      const res = await getDyeingHouses();
      if (res?.success) {
        setDyeingHouses((res.data || []).map((h: any) => ({ label: h.vendorName, value: h.id })));
      }
    }
    loadHouses();
  }, []);

  // Load Outwards when Dyeing House changes - ONLY IF NOT EDITING
  useEffect(() => {
    if (initialData) return;
    if (selectedDyeingHouse) {
      async function loadOutwards() {
        const res = await getGreyOutwardsByHouse(selectedDyeingHouse);
        if (res?.success) {
          setOutwards(res.data || []);
        }
      }
      loadOutwards();
      setValue('challanNo', '');
      replace([]);
    } else {
      setOutwards([]);
      replace([]);
    }
  }, [selectedDyeingHouse, setValue, replace, initialData]);

  // Update batches when Challan changes - ONLY IF NOT EDITING
  useEffect(() => {
    if (initialData) return;
    if (selectedChallanId) {
      const selectedOutward = outwards.find(o => o.id === selectedChallanId);
      if (selectedOutward) {
        setValue('lotNo', selectedOutward.lotNo);
        const batchData = selectedOutward.batches.map((b: any) => ({
          id: b.id,
          batchNo: b.batchNo,
          lotNo: selectedOutward.lotNo,
          greyMtrs: b.mtrs,
          rfdMtrs: '', 
          isTP: false,
          tpDetail: '',
          millShortage: ''
        }));
        replace(batchData);
      }
    } else {
      setValue('lotNo', '');
      replace([]);
    }
  }, [selectedChallanId, outwards, setValue, replace, initialData]);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      let submissionData;
      
      if (initialData) {
        submissionData = {
          ...data,
          // For edit, we don't recalculate batches or challan display
        };
      } else {
        const selectedOutward = outwards.find(o => o.id === data.challanNo);
        const challanDisplay = selectedOutward ? `${selectedOutward.challanNo} Lot-${selectedOutward.lotNo}` : data.challanNo;
        
        submissionData = {
          ...data,
          challanNo: challanDisplay,
          batches: data.batches.map((b: any) => ({
            id: b.id,
            rfdMtrs: Number(b.rfdMtrs),
            isTP: b.isTP,
            tpDetail: b.tpDetail,
            millShortage: Number(b.millShortage)
          }))
        };
      }

      const result = initialData 
        ? await updateRFDInward(initialData.id, submissionData)
        : await createRFDInward(submissionData);
        
      if (result.success) {
        alert(`RFD Inward entry ${initialData ? 'updated' : 'saved'} successfully!`);
        if (!initialData) reset();
        onSuccess?.();
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <FormHeader title="RFD Inward" icon={Layers} color="indigo" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          <FormSelect
            name="dyeingHouse"
            label="Dyeing House Name"
            required
            placeholder="Select Dyeing House"
            icon={Building2}
            options={dyeingHouses}
          />

          <FormInput
            name="billNo"
            label="Bill No"
            required
            placeholder="Enter Bill Number"
            icon={Hash}
          />

          <FormInput
            name="date"
            label="Date"
            type="date"
            required
            icon={Calendar}
          />

          <FormSelect
            name="challanNo"
            label="Challan No"
            required
            placeholder="Select Challan"
            icon={FileText}
            options={outwards.map(o => ({ 
              label: `${o.challanNo} Lot-${o.lotNo}`, 
              value: o.id 
            }))}
          />
        </div>

        {/* Batch Info Table */}
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Batch Info</h4>
              <Info size={14} className="text-muted-foreground" />
            </div>

            <div className="bg-muted/30 border border-border/50 rounded-xl px-4 py-2 flex items-center gap-4 shadow-sm">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total RFD Mtr</span>
              <span className="text-lg font-black text-indigo-600">
                {totalRFDMtr.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-border/50 bg-muted/20">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Lot No</th>
                  <th className="px-4 py-3 text-right">Grey Mts</th>
                  <th className="px-4 py-3 text-center">RFD Mtr <span className="text-red-500">*</span></th>
                  <th className="px-4 py-3 text-center">TP</th>
                  <th className="px-4 py-3">TP Detail</th>
                  <th className="px-4 py-3 text-right min-w-[140px]">Mill Shortage (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {fields.map((field, index) => (
                  <tr key={field.id} className="hover:bg-card/50 transition-colors">
                    <td className="px-4 py-2">
                      <input
                        {...methods.register(`batches.${index}.lotNo`)}
                        readOnly
                        className="w-full bg-transparent border-none text-sm font-bold text-muted-foreground outline-none cursor-default"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        {...methods.register(`batches.${index}.greyMtrs`)}
                        readOnly
                        className="w-20 bg-transparent border-none text-sm font-bold text-muted-foreground text-right outline-none cursor-default"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-center">
                        <input
                          {...methods.register(`batches.${index}.rfdMtrs`, { required: true })}
                          type="number"
                          step="0.01"
                          readOnly={methods.watch(`batches.${index}.isTP`)}
                          className={`w-32 border border-border/50 rounded-lg px-3 py-1.5 text-sm font-bold text-center outline-none transition-all ${
                            methods.watch(`batches.${index}.isTP`) 
                              ? "bg-muted/50 cursor-default" 
                              : "bg-card focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                          }`}
                          placeholder="0.00"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex justify-center">
                        <input
                          {...methods.register(`batches.${index}.isTP`)}
                          type="checkbox"
                          className="w-4 h-4 rounded border-border text-indigo-600 focus:ring-indigo-500"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input
                        {...methods.register(`batches.${index}.tpDetail`)}
                        readOnly={!methods.watch(`batches.${index}.isTP`)}
                        className={`w-full border border-border/50 rounded-lg px-3 py-1.5 text-sm outline-none transition-all ${
                          !methods.watch(`batches.${index}.isTP`) 
                            ? "bg-muted/50 cursor-default" 
                            : "bg-card focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                        }`}
                        placeholder="Detail"
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <input
                        {...methods.register(`batches.${index}.millShortage`)}
                        type="number"
                        step="0.01"
                        readOnly
                        className="w-32 bg-muted/50 border border-border/50 rounded-lg px-3 py-1.5 text-sm font-bold text-right outline-none cursor-default ml-auto"
                        placeholder="0.00"
                      />
                    </td>
                  </tr>
                ))}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-sm text-muted-foreground font-medium italic">
                      Select a Dyeing House and Challan to view batches
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
              className="h-12 px-10 rounded-xl font-black uppercase tracking-wider shadow-lg shadow-indigo-600/20 flex gap-2"
          >
            <Save size={18} />
            {isSubmitting ? 'Submitting...' : 'Save Inward'}
          </FormButton>
          <FormButton 
              type="button" 
              onClick={() => {
                reset();
                replace([]);
              }} 
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
