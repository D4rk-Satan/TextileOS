'use client';

import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';
import { Plus, Trash2, Hash, Ruler, Weight, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function BatchInfoForm() {
  const methods = useFormContext();
  const { control } = methods;
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'batches',
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/10 rounded-xl text-blue-600">
            <Package size={20} />
          </div>
          <h3 className="text-xl font-black text-foreground tracking-tight uppercase">Batch Info</h3>
        </div>
      </div>

      <div className="max-w-md">
        <div className="bg-muted/50 rounded-xl p-2 mb-4 inline-block px-6">
            <span className="text-sm font-bold text-foreground/70 uppercase tracking-widest flex items-center gap-2">
                <Ruler size={14} className="text-blue-600" />
                Grey Mts
                <span className="text-blue-600 font-bold">*</span>
            </span>
        </div>

        <div className="space-y-3">
            <AnimatePresence mode="popLayout">
                {fields.map((field, index) => (
                    <motion.div
                        key={field.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                        <div className="flex items-center gap-3 w-full bg-card p-2 rounded-xl border border-border shadow-sm">
                            <div className="bg-blue-600/10 text-blue-600 px-3 py-2 rounded-lg text-xs font-black min-w-[100px] text-center border border-blue-600/20">
                                {methods.getValues(`batches.${index}.batchNo`) || `Batch ${index + 1}`}
                            </div>
                            <div className="flex-1">
                                 <FormInput
                                    name={`batches.${index}.mtrs`}
                                    label=""
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="!gap-0"
                                    suppressHydrationWarning
                                    readOnly
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            
            {fields.length === 0 && (
                <div className="py-8 text-center text-muted-foreground italic font-medium bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
                    No batches added yet.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
