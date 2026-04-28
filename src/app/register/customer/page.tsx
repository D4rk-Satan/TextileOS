'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormSelect } from '@/components/shared/FormSelect';
import { FormButton } from '@/components/shared/FormButton';
import { PhoneInput } from '@/components/shared/PhoneInput';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { Shield, User, MapPin, Mail, Lock } from 'lucide-react';

export default function CustomerRegistration() {
  const methods = useForm({
    defaultValues: {
      status: 'active',
      customerName: '',
      gstin: '',
      address1: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'IN',
      phone: '',
      password: '',
      confirmPassword: '',
    },
    mode: 'onTouched',
  });

  const { watch } = methods;
  const password = watch('password');

  const onSubmit = (data: any) => {
    console.log('Customer Data:', data);
    alert('Customer Registration Successful!');
  };

  return (
    <div className="w-full max-w-2xl bg-card p-6 rounded-2xl border border-border shadow-xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">Customer Registration</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Please fill in your details to create a customer account.</p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2 flex items-center gap-2">
              <User size={18} className="text-blue-500" />
              General Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormSelect
                name="status"
                label="Status"
                required
                options={[
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                ]}
              />
              <FormInput 
                name="customerName" 
                label="Customer Name" 
                required 
                placeholder="Enter full name"
                rules={{ minLength: { value: 3, message: 'Minimum 3 characters required' } }}
              />
            </div>
            <FormInput 
              name="gstin" 
              label="GSTIN" 
              required 
              placeholder="e.g. 22AAAAA0000A1Z5"
              className="mt-2"
              rules={{ 
                pattern: { 
                  value: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 
                  message: 'Invalid Indian GSTIN format' 
                } 
              }}
            />
          </div>

          <div className="space-y-3 pt-3 border-t border-border">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-1.5 flex items-center gap-2">
              <MapPin size={16} className="text-green-500" />
              Address Details
            </h2>
            <FormInput name="address1" label="Address Line 1" required placeholder="Street address, P.O. box" />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormInput name="city" label="City" required placeholder="City name" />
              <FormInput name="state" label="State" required placeholder="State name" />
              <FormInput 
                name="postalCode" 
                label="Postal Code" 
                required 
                placeholder="123456"
                rules={{ 
                  pattern: { value: /^\d{6}$/, message: 'Invalid (6 digits)' } 
                }}
              />
            </div>

            <FormSelect
              name="country"
              label="Country"
              required
              options={[
                { label: 'India', value: 'IN' },
                { label: 'United States', value: 'US' },
              ]}
            />
          </div>

          <div className="space-y-3 pt-3 border-t border-border">
            <h2 className="text-base font-semibold text-foreground border-b border-border pb-1.5 flex items-center gap-2">
              <Mail size={16} className="text-purple-500" />
              Contact & Security
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PhoneInput 
                name="phone" 
                label="Phone Number" 
                required
                rules={{ 
                  pattern: { value: /^\d{10}$/, message: 'Invalid (10 digits)' } 
                }}
              />
              <FormInput
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                required
                placeholder="Re-enter password"
                rules={{
                  validate: (value) => value === password || 'Passwords do not match'
                }}
              />
            </div>
            
            <PasswordInput
              name="password"
              label="Password"
              required
              rules={{
                validate: {
                  length: (v: string) => v.length >= 8 || 'At least 8 chars',
                  case: (v: string) => (/[a-z]/.test(v) && /[A-Z]/.test(v)) || 'Upper & Lower',
                  special: (v: string) => /[^A-Za-z0-9]/.test(v) || 'Special char',
                }
              }}
            />
          </div>

          <div className="flex gap-4 pt-4">
            <FormButton type="submit" variant="primary" className="flex-1">
              Submit
            </FormButton>
            <FormButton type="button" variant="reset" onClick={() => methods.reset()} className="px-6">
              Reset
            </FormButton>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
