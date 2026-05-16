'use client';

import React from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { Ruler, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { FormHeader } from '@/components/shared/FormHeader';

export function BatchInfoForm() {
  const methods = useFormContext();
  const { control } = methods;
  const { fields } = useFieldArray({
    control,
    name: 'batches',
  });

  return (
    <div className="space-y-4">
      <FormHeader title="Batch Info" icon={Package} color="blue" className="mb-4" />

      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-4 px-2">
            <Ruler size={14} className="text-blue-600" />
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                Computed Grey Mtrs
            </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence mode="popLayout">
                {fields.map((field, index) => (
                    <motion.div
                        key={field.id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <div className="flex items-center gap-3 bg-muted/10 p-2 rounded-xl border border-border/50 group hover:border-blue-500/30 transition-all">
                            <div className="w-10 h-10 rounded-lg bg-background border border-border/50 flex flex-col items-center justify-center shadow-sm group-hover:bg-blue-600/5 transition-colors">
                                <span className="text-[7px] font-black text-muted-foreground/40 uppercase">No.</span>
                                <span className="text-xs font-black text-blue-600">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                                <div className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest mb-0.5 ml-1">Meters</div>
                                <div className="text-sm font-black text-foreground">
                                    {methods.getValues(`batches.${index}.mtrs`)}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
            
            {fields.length === 0 && (
                <div className="col-span-full py-8 text-center text-muted-foreground italic font-medium bg-muted/5 rounded-2xl border-2 border-dashed border-border/20">
                    <div className="flex flex-col items-center gap-1">
                        <Package size={24} className="opacity-10 mb-1" />
                        <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">No batches generated</span>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
