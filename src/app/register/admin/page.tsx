'use client';

import React from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormSelect } from '@/components/shared/FormSelect';
import { FormButton } from '@/components/shared/FormButton';
import { motion } from 'framer-motion';
import { UserPlus } from 'lucide-react';

export default function AdminRegistration() {
  const methods = useForm({
    defaultValues: {
      name: '',
      email: '',
      department: '',
    },
  });

  const onSubmit = (data: any) => {
    console.log('Admin Data:', data);
    alert('Admin Registration Successful!');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-xl mx-auto bg-card p-10 rounded-[2.5rem] border border-border shadow-2xl relative overflow-hidden backdrop-blur-sm"
    >
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500" />
      
      <div className="mb-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-600"
        >
          <UserPlus size={24} />
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-4xl font-black tracking-tight mb-2"
        >
          Admin Registration
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground font-medium"
        >
          Register a new administrative user for your workspace.
        </motion.p>
      </div>

      <FormProvider {...methods}>
        <motion.form 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onSubmit={methods.handleSubmit(onSubmit)} 
          className="space-y-6"
        >
          <FormInput name="name" label="Full Name" required placeholder="John Doe" />
          <FormInput name="email" label="Email Address" type="email" required placeholder="admin@example.com" />
          <FormSelect
            name="department"
            label="Department"
            required
            options={[
              { label: 'IT Support', value: 'IT' },
              { label: 'Human Resources', value: 'HR' },
              { label: 'Finance', value: 'FIN' },
              { label: 'Operations', value: 'OPS' },
            ]}
          />

          <div className="flex gap-4 pt-6">
            <FormButton type="submit" variant="primary" className="flex-1 py-7 text-lg font-black shadow-lg shadow-blue-600/10">
              Create Admin
            </FormButton>
          </div>
        </motion.form>
      </FormProvider>
    </motion.div>
  );
}
