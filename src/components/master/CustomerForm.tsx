'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormSelect } from '@/components/shared/FormSelect';
import { FormButton } from '@/components/shared/FormButton';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { createCustomer } from '@/app/actions/master';
import { Save, RotateCcw } from 'lucide-react';

export function CustomerForm({ onSuccess }: { onSuccess?: () => void }) {
  const methods = useForm({
    defaultValues: {
      status: 'Active',
      customerName: '',
      address: '',
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      phone: '',
      gstin: '',
    },
    mode: 'onTouched',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await createCustomer(data);
      if (result.success) {
        alert('Customer record created successfully!');
        methods.reset();
        onSuccess?.();
      } else {
        alert('Error saving customer: ' + result.error);
      }
    } catch (error) {
      alert('An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onReset = () => {
    methods.reset();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          {/* Left Column: Basic Info */}
          <div className="space-y-5">
            <FormSelect
              name="status"
              label="Status"
              required
              options={[
                { label: 'Active', value: 'Active' },
                { label: 'Inactive', value: 'Inactive' },
              ]}
            />

            <FormInput
              name="customerName"
              label="Customer Name"
              required
              placeholder="Full legal name"
              rules={{ minLength: { value: 3, message: 'Name too short' } }}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground/90 flex gap-0.5 ml-1">
                Street Address
              </label>
              <textarea
                {...methods.register('address')}
                className="flex min-h-[120px] w-full rounded-xl border border-border bg-white/50 dark:bg-black/20 px-4 py-3 text-sm transition-all focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none placeholder:text-muted-foreground text-foreground hover:border-blue-400 dark:hover:border-blue-500"
                placeholder="Complete street address"
              />
            </div>
            
            <FormInput
              name="gstin"
              label="GSTIN Number"
              required
              placeholder="e.g. 29ABCDE1234F1Z5"
              rules={{ 
                pattern: { 
                  value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 
                  message: 'Invalid GSTIN format (India)' 
                } 
              }}
            />
          </div>

          {/* Right Column: Location & Contact */}
          <div className="space-y-5">
            <FormInput
              name="addressLine1"
              label="Address Line 2"
              placeholder="Apartment, suite, etc. (Optional)"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput name="city" label="City" placeholder="City" />
              <FormInput name="state" label="State" placeholder="State" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput name="postalCode" label="Pincode" placeholder="6-digit ZIP" />
              <FormSelect
                name="country"
                label="Country"
                options={[
                  { label: 'India', value: 'India' },
                  { label: 'United States', value: 'USA' },
                  { label: 'United Kingdom', value: 'UK' },
                ]}
              />
            </div>

            <PhoneInput
              name="phone"
              label="Contact Number"
              required
              rules={{ pattern: { value: /^\d{10}$/, message: 'Must be 10 digits' } }}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-6 border-t border-border">
          <FormButton 
            type="submit" 
            variant="primary" 
            disabled={isSubmitting}
            className="px-10 py-3 rounded-xl text-lg font-black shadow-lg shadow-blue-600/10 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                Submit Record
              </>
            )}
          </FormButton>
          <FormButton 
            type="button" 
            onClick={onReset} 
            variant="secondary" 
            disabled={isSubmitting}
            className="px-10 py-3 rounded-xl text-lg font-bold border-2 flex items-center gap-2"
          >
            <RotateCcw size={20} />
            Reset Form
          </FormButton>
        </div>
      </form>
    </FormProvider>
  );
}
