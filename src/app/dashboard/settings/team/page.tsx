'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Mail, 
  Calendar,
  MoreVertical,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { FormButton } from '@/components/shared/FormButton';
import { FormInput } from '@/components/shared/FormInput';
import { useForm, FormProvider } from 'react-hook-form';
import { createStaffUser, getOrganizationUsers, getUserRole } from '@/app/actions/auth';
import { getRoles } from '@/app/actions/roles';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: string | Date;
  dynamicRole?: { name: string };
}

export default function TeamPage() {
  const router = useRouter();
  const [users, setUsers] = React.useState<User[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddingUser, setIsAddingUser] = React.useState(false);
  const [roles, setRoles] = React.useState<any[]>([]);
  const [isRolesLoading, setIsRolesLoading] = React.useState(true);

  const methods = useForm({
    defaultValues: {
      email: '',
      password: '',
      roleId: ''
    }
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    const result = await getOrganizationUsers();
    if (result.success) {
      setUsers(result.users);
    }
    setIsLoading(false);
  };

  const fetchRoles = async () => {
    setIsRolesLoading(true);
    const result = await getRoles();
    if (result.success && result.data) {
      setRoles(result.data);
      if (result.data.length > 0) {
        methods.setValue('roleId', result.data[0].id);
      }
    }
    setIsRolesLoading(false);
  };

  React.useEffect(() => {
    const checkAccess = async () => {
      const role = await getUserRole();
      if (role !== 'Admin') {
        router.push('/dashboard');
        return;
      }
      fetchUsers();
      fetchRoles();
    };
    checkAccess();
  }, [router]);

  const onSubmit = async (data: any) => {
    const result = await createStaffUser(data);
    if (result.success) {
      alert('User created successfully');
      setIsAddingUser(false);
      methods.reset();
      fetchUsers();
    } else {
      alert('Error: ' + result.error);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <Users className="text-primary" size={32} />
            Team Management
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Manage organization members and their access levels.</p>
        </div>
        
        <FormButton 
          onClick={() => {
            if (roles.length === 0) {
              alert('Please create at least one Role in "Roles & Permissions" before adding team members.');
              return;
            }
            setIsAddingUser(!isAddingUser);
          }}
          variant={isAddingUser ? 'secondary' : 'primary'}
          className="flex items-center gap-2"
        >
          {isAddingUser ? 'Cancel' : <><UserPlus size={18} /> Add Member</>}
        </FormButton>
      </div>

      {isAddingUser && (
        <GlassCard className="animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
            <UserPlus className="text-primary" size={20} />
            Invite New Member
          </h2>
          <FormProvider {...methods}>
            <form onSubmit={methods.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
              <FormInput 
                name="email" 
                label="Email Address" 
                placeholder="colleague@company.com" 
                required 
                type="email"
              />
              <FormInput 
                name="password" 
                label="Temporary Password" 
                placeholder="••••••••" 
                required 
                type="password"
              />
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Access Level
                </label>
                <select 
                  {...methods.register('roleId')}
                  disabled={isRolesLoading}
                  className="w-full h-12 bg-muted/50 border border-border rounded-xl px-4 text-sm font-bold focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none disabled:opacity-50"
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                  {roles.length === 0 && !isRolesLoading && <option value="">No roles defined</option>}
                  {isRolesLoading && <option value="">Loading roles...</option>}
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end">
                <FormButton type="submit" className="w-full md:w-auto px-12">
                  Create Account
                </FormButton>
              </div>
            </form>
          </FormProvider>
        </GlassCard>
      )}

      <GlassCard className="p-0 overflow-hidden border-border/50">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/30 border-b border-border">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Member</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Access Level</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Joined On</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground animate-pulse font-medium">
                    Loading team members...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground font-medium">
                    No team members found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="group hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm border border-primary/20">
                          {user.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-bold text-foreground">{user.email}</span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Mail size={10} /> Account Verified
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
                        user.role === 'Admin' 
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20" 
                          : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      )}>
                        {user.role === 'Admin' ? <ShieldCheck size={12} /> : <Shield size={12} />}
                        {user.dynamicRole?.name || user.role}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <Calendar size={14} />
                        {new Date(user.createdAt).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="bg-primary/5 border-primary/10">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 flex-shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-1">Administrator Role</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Admins have full access to all organization settings, billing, and the ability to manage other team members.
              </p>
            </div>
          </div>
        </GlassCard>
        
        <GlassCard className="bg-blue-500/5 border-blue-500/10">
          <div className="flex gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20 flex-shrink-0">
              <Users size={24} />
            </div>
            <div>
              <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-1">Standard User Role</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Standard users can handle all operational workflows and manage Items. They have read-only access to Customers/Vendors and cannot access Organization Settings.
              </p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
