'use client';

import React from 'react';
import Link from 'next/link';
import { useForm, FormProvider } from 'react-hook-form';
import { FormInput } from '@/components/shared/FormInput';
import { FormButton } from '@/components/shared/FormButton';
import { PasswordInput } from '@/components/shared/PasswordInput';
import { 
  ArrowLeft, 
  Lock, 
  Code2, 
  X, 
  Share2,
  ShieldCheck,
  TrendingUp,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { loginUser } from '@/app/actions/auth';

export default function LoginPage() {
  const methods = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = await loginUser(data);
      if (result.success && result.user) {
        // In a real app, the session would be set by the server action
        window.location.href = result.user.role === 'SuperAdmin' ? '/superadmin' : '/dashboard';
      } else if (!result.success) {
        alert('Login failed: ' + result.error);
      }
    } catch (error: any) {
      console.error('Login Submission Error:', error);
      alert('An unexpected error occurred during login: ' + (error.message || 'Unknown Error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-5xl bg-card rounded-[2rem] shadow-2xl shadow-blue-900/10 overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-border"
      >
        {/* Left Side: Form */}
        <div className="w-full md:w-[480px] p-10 flex flex-col bg-card">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white">T</div>
            <span className="text-xl font-black tracking-tighter text-foreground">TextileOS</span>
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-black text-foreground mb-2">Sign in</h1>
            <p className="text-muted-foreground text-sm font-medium mb-8">to access your TextileOS workspace</p>

            <FormProvider {...methods}>
              <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-5">
                <FormInput
                  name="email"
                  label="Business Email"
                  type="email"
                  required
                  placeholder="name@company.com"
                />
                
                <div className="space-y-1.5">
                  <PasswordInput
                    name="password"
                    label="Password"
                    required
                    placeholder="••••••••"
                  />
                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      className="text-[11px] text-blue-600 hover:underline font-bold"
                      suppressHydrationWarning
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                <FormButton 
                  type="submit" 
                  variant="primary" 
                  className="w-full py-4 text-base font-black shadow-lg shadow-blue-600/20 rounded-xl"
                  suppressHydrationWarning
                >
                  Sign In
                </FormButton>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    <span className="bg-card px-4">Sign in using</span>
                  </div>
                </div>

                {/* Social Logins */}
                <div className="flex items-center justify-center gap-4">
                  {[
                    { icon: Code2, color: 'hover:text-foreground' },
                    { icon: Share2, color: 'hover:text-blue-700' },
                    { icon: X, color: 'hover:text-foreground' },
                  ].map((item, i) => (
                    <button 
                      key={i} 
                      type="button"
                      className={`p-3 rounded-xl border border-border bg-muted/30 text-muted-foreground transition-all ${item.color} hover:bg-card hover:shadow-md hover:border-transparent`}
                    >
                      <item.icon size={18} />
                    </button>
                  ))}
                </div>
              </form>
            </FormProvider>
          </div>

          <div className="mt-10 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground font-medium">
              Don't have a TextileOS account?{' '}
              <Link href="/signup" className="text-blue-600 hover:underline font-bold">
                Sign up now
              </Link>
            </p>
          </div>
        </div>

        {/* Right Side: Info Panel */}
        <div className="flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white hidden md:flex flex-col justify-center relative overflow-hidden">
          {/* Abstract Deco */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400/20 rounded-full -ml-32 -mb-32 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-sm">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-black leading-tight mb-6">
                Scale your manufacturing with precision.
              </h2>
              <div className="space-y-6">
                {[
                  { icon: Zap, text: 'Real-time warehouse tracking across all units.' },
                  { icon: ShieldCheck, text: 'Enterprise-grade security and data isolation.' },
                  { icon: TrendingUp, text: 'Automated analytics for better decision making.' },
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-4 group">
                    <div className="p-2 bg-white/10 rounded-lg group-hover:bg-white/20 transition-colors">
                      <feature.icon size={20} />
                    </div>
                    <p className="text-blue-100 font-medium opacity-90 group-hover:opacity-100 transition-opacity translate-y-1">{feature.text}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <div className="mt-12 flex gap-1">
              {[0, 1, 2].map((i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${i === 0 ? 'w-8 bg-white' : 'w-2 bg-white/30'}`} />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
