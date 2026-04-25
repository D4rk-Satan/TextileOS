'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormSelect } from '@/components/shared/FormSelect';
import { FormButton } from '@/components/shared/FormButton';

export default function VendorRegistration() {
  const methods = useForm({
    defaultValues: {
      status: '',
      vendorName: '',
      masterName: '',
      vendorNumber: '',
      booksId: '',
      address1: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
  });

  const onSubmit = (data: any) => {
    console.log('Vendor Data:', data);
    alert('Vendor Registration Successful!');
  };

  return (
    <div className="w-full max-w-4xl bg-card p-8 rounded-2xl border border-border shadow-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Vendor Registration</h1>
        <p className="text-muted-foreground mt-1">Complete the form below to register as a partner vendor.</p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {/* Vendor Info Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Business Details</h2>
              <FormSelect
                name="status"
                label="Status"
                required
                options={[
                  { label: 'Pending', value: 'pending' },
                  { label: 'Active', value: 'active' },
                ]}
              />
              <FormInput name="vendorName" label="Vendor Name" required placeholder="Legal business name" />
              <FormInput name="masterName" label="Master Name" required placeholder="Parent organization" />
              <div className="grid grid-cols-2 gap-4">
                <FormInput name="vendorNumber" label="Vendor #" required placeholder="V-000" />
                <FormInput name="booksId" label="Books ID" required placeholder="B-123" />
              </div>
            </div>

            {/* Address Info Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">Contact Address</h2>
              <FormInput name="address1" label="Address Line 1" required placeholder="Street address" />
              <div className="grid grid-cols-2 gap-4">
                <FormInput name="city" label="City" required placeholder="City name" />
                <FormInput name="state" label="State" required placeholder="State/Province" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormInput name="postalCode" label="Postal Code" required placeholder="678910" />
                <FormSelect
                  name="country"
                  label="Country"
                  required
                  options={[
                    { label: 'India', value: 'IN' },
                    { label: 'United Arab Emirates', value: 'AE' },
                    { label: 'Singapore', value: 'SG' },
                  ]}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-6 border-t border-border">
            <FormButton type="submit" variant="primary" className="w-full md:w-auto md:px-12">
              Submit Registration
            </FormButton>
            <FormButton type="button" variant="reset" onClick={() => methods.reset()} className="w-full md:w-auto md:px-12">
              Reset Form
            </FormButton>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
