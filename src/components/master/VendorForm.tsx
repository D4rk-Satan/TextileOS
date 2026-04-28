'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormSelect } from '@/components/shared/FormSelect';
import { FormButton } from '@/components/shared/FormButton';
import { ShoppingBag, CreditCard, Hash, MapPin } from 'lucide-react';
import { createVendor } from '@/app/actions/master';

export function VendorForm({ onSuccess }: { onSuccess?: () => void }) {
  const methods = useForm({
    defaultValues: {
      status: 'Active',
      vendorName: '',
      masterName: '',
      vendorNumber: '',
      booksId: '',
      addressLine1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      gstin: '',
    },
    mode: 'onTouched',
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await createVendor(data);
      if (result.success) {
        alert('Vendor record created successfully!');
        methods.reset();
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

  const onReset = () => {
    methods.reset();
  };

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
          {/* Left Column: Vendor Details */}
          <div className="space-y-6">
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
              name="vendorName"
              label="Vendor Name"
              required
              placeholder="Primary vendor name"
            />

            <FormInput
              name="masterName"
              label="Master Name"
              placeholder="Associated master record name"
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput
                name="vendorNumber"
                label="Vendor Number"
                placeholder="V-0000"
              />
              <FormInput
                name="booksId"
                label="Books ID"
                placeholder="BK-0000"
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

          {/* Right Column: Address Details */}
          <div className="space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={16} className="text-muted-foreground" />
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Address Information</span>
            </div>

            <FormInput
              name="addressLine1"
              label="Address Line 1"
              placeholder="Street, building name, etc."
            />

            <div className="grid grid-cols-2 gap-4">
              <FormInput name="city" label="City / District" placeholder="City" />
              <FormInput name="state" label="State / Province" placeholder="State/UT" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormInput name="postalCode" label="Postal Code" placeholder="6-digits" />
              <FormSelect
                name="country"
                label="Country"
                options={[
                  { label: 'India', value: 'India' },
                  { label: 'China', value: 'China' },
                  { label: 'Bangladesh', value: 'Bangladesh' },
                  { label: 'Vietnam', value: 'Vietnam' },
                ]}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-8 border-t border-border">
          <FormButton type="submit" variant="primary" disabled={isSubmitting} className="px-8 py-2.5 rounded-xl text-[13px] font-bold shadow-lg shadow-blue-600/10">
            {isSubmitting ? 'Creating...' : 'Create Vendor'}
          </FormButton>
          <FormButton type="button" onClick={onReset} variant="secondary" disabled={isSubmitting} className="px-8 py-2.5 rounded-xl text-[13px] font-bold border">
            Clear Fields
          </FormButton>
        </div>
      </form>
    </FormProvider>
  );
}
