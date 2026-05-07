'use client';
export const dynamic = 'force-dynamic';

import React from 'react';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle,
  ShieldCheck,
  ShieldAlert,
  Info
} from 'lucide-react';
import { GlassCard } from '@/components/shared/GlassCard';
import { FormButton } from '@/components/shared/FormButton';
import { FormInput } from '@/components/shared/FormInput';
import { getRoles, createRole, updateRole, deleteRole } from '@/app/actions/roles';
import { ALL_PERMISSIONS, PERMISSION_LABELS, Permission } from '@/lib/permissions';
import { cn } from '@/lib/utils';

export default function RolesPage() {
  const [roles, setRoles] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState<string | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    permissions: [] as string[]
  });

  const fetchRoles = async () => {
    setIsLoading(true);
    const result = await getRoles();
    if (result.success && result.data) {
      setRoles(result.data);
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    fetchRoles();
  }, []);

  const handleTogglePermission = (perm: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter(p => p !== perm)
        : [...prev.permissions, perm]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const result = isEditing 
      ? await updateRole(isEditing, formData)
      : await createRole(formData);

    if (result.success) {
      setIsAdding(false);
      setIsEditing(null);
      setFormData({ name: '', permissions: [] });
      fetchRoles();
    } else {
      alert(result.error);
    }
  };

  const handleEdit = (role: any) => {
    setFormData({
      name: role.name,
      permissions: role.permissions
    });
    setIsEditing(role.id);
    setIsAdding(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this role?')) {
      const result = await deleteRole(id);
      if (result.success) {
        fetchRoles();
      } else {
        alert(result.error);
      }
    }
  };

  // Final Safety Render Guard
  if (isLoading && roles.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-muted-foreground font-medium animate-pulse">
        Initializing roles system...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <ShieldCheck className="text-primary" size={32} />
            Roles & Permissions
          </h1>
          <p className="text-muted-foreground font-medium mt-1">Define access levels and module permissions for your team.</p>
        </div>
        
        {!isAdding && (
          <FormButton 
            onClick={() => {
              setIsAdding(true);
              setFormData({ name: '', permissions: [] });
            }}
            className="flex items-center gap-2"
          >
            <Plus size={18} /> Create New Role
          </FormButton>
        )}
      </div>

      {isAdding && (
        <GlassCard className="animate-in fade-in slide-in-from-top-4 duration-300 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Shield className="text-primary" size={24} />
              {isEditing ? 'Edit Role' : 'Create Custom Role'}
            </h2>
            <button 
              onClick={() => {
                setIsAdding(false);
                setIsEditing(null);
              }}
              className="text-muted-foreground hover:text-foreground text-sm font-bold uppercase tracking-widest"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="max-w-md">
              <FormInput 
                label="Role Name" 
                name="name"
                placeholder="e.g. Inventory Manager"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-muted-foreground ml-1">
                <Info size={14} />
                Assign Permissions
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ALL_PERMISSIONS.map((perm) => {
                  const isChecked = formData.permissions.includes(perm);
                  return (
                    <div 
                      key={perm}
                      onClick={() => handleTogglePermission(perm)}
                      className={cn(
                        "p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 group",
                        isChecked 
                          ? "bg-primary/10 border-primary shadow-sm" 
                          : "bg-card border-border hover:border-primary/50"
                      )}
                    >
                      <div className={cn(
                        "mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors",
                        isChecked ? "bg-primary border-primary text-white" : "border-muted-foreground/30 group-hover:border-primary"
                      )}>
                        {isChecked && <CheckCircle2 size={14} />}
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className={cn("text-[13px] font-bold", isChecked ? "text-primary" : "text-foreground")}>
                          {perm.split(':').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </span>
                        <span className="text-[10px] text-muted-foreground leading-tight">
                          {PERMISSION_LABELS[perm]}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border/50">
              <FormButton type="submit" className="px-12">
                {isEditing ? 'Update Role' : 'Create Role'}
              </FormButton>
            </div>
          </form>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground font-medium animate-pulse">
            Loading roles...
          </div>
        ) : roles.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground font-medium">
            No custom roles defined yet.
          </div>
        ) : (
          roles.map((role) => (
            <GlassCard key={role.id} className="group hover:border-primary/30 transition-all flex flex-col h-full">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary border border-primary/20">
                  <Shield size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEdit(role)}
                    className="p-2 hover:bg-primary/10 text-primary rounded-lg transition-colors"
                    title="Edit Role"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => handleDelete(role.id)}
                    className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                    title="Delete Role"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-foreground mb-1">{role.name}</h3>
              <p className="text-xs text-muted-foreground mb-6 font-medium">
                {role._count.users} member{role._count.users !== 1 ? 's' : ''} assigned
              </p>

              <div className="mt-auto space-y-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <ShieldCheck size={12} className="text-primary" />
                  Permissions ({role.permissions.length})
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.slice(0, 5).map((p: string) => (
                    <span key={p} className="px-2 py-0.5 bg-muted rounded-md text-[9px] font-bold text-muted-foreground border border-border/50">
                      {p.split(':')[1] || p}
                    </span>
                  ))}
                  {role.permissions.length > 5 && (
                    <span className="px-2 py-0.5 bg-muted rounded-md text-[9px] font-bold text-muted-foreground border border-border/50">
                      +{role.permissions.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      <GlassCard className="bg-amber-500/5 border-amber-500/20">
        <div className="flex gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20 flex-shrink-0">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-1">System Roles</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Standard "Administrator" roles created by the system have all permissions by default and cannot be deleted. 
              Custom roles allow you to create restricted access levels for different departments in your textile business.
            </p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
