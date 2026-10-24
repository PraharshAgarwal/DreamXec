import React, { useState, useEffect } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuth } from '../../context/AuthContext';
import { fetchPermissionMatrix, type PermissionMatrixResponse } from '../../services/permissionService';
import {
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Rocket,
  Users,
  Receipt,
  FileText,
  Building2,
  FlaskConical,
  Award,
  Workflow,
} from 'lucide-react';

/* ── Permission display metadata ── */
const PERMISSION_LABELS: Record<string, { label: string; group: string }> = {
  'irb:approve':                  { label: 'Approve IRB Ethics Reviews',         group: 'Research & Ethics' },
  'grant:allocate':               { label: 'Allocate Grant Funds',               group: 'Grants' },
  'grant:post':                   { label: 'Post Grant Opportunities',           group: 'Grants' },
  'milestone:verify':             { label: 'Verify Project Milestones',          group: 'Research & Ethics' },
  'stagegate:approve':            { label: 'Approve Stage-Gate Reviews',         group: 'Research & Ethics' },
  'lab:book':                     { label: 'Book Lab Resources',                 group: 'Research & Ethics' },
  'project:create':               { label: 'Create Projects',                    group: 'Projects' },
  'project:edit':                 { label: 'Edit Projects',                      group: 'Projects' },
  'project:delete':               { label: 'Delete Projects',                    group: 'Projects' },
  'admin:access':                 { label: 'Access Admin Panel',                 group: 'Administration' },
  'dx:onboarding:manage':         { label: 'Manage Platform Onboarding',        group: 'Administration' },
  'dx:verification:task_manage':  { label: 'Manage Verification Tasks',          group: 'Administration' },
  'dx:workflow:design':           { label: 'Design Platform Workflows',          group: 'Administration' },
  'org:update':                   { label: 'Update Organization',                group: 'Organization' },
  'org:member:invite':            { label: 'Invite Members',                     group: 'Organization' },
  'org:member:manage':            { label: 'Manage Members',                     group: 'Organization' },
  'org:billing:manage':           { label: 'Manage Billing',                     group: 'Organization' },
  'workflow:template:manage':     { label: 'Manage Workflow Templates',          group: 'Workflows' },
  'workflow:instance:view':       { label: 'View Workflow Instances',            group: 'Workflows' },
  'workflow:instance:create':     { label: 'Create Workflow Instances',          group: 'Workflows' },
  'workflow:stage:review':        { label: 'Review Workflow Stages',             group: 'Workflows' },
  'verification:view':            { label: 'View Verification Cases',            group: 'Verification' },
  'verification:evaluate':        { label: 'Evaluate Verifications',             group: 'Verification' },
  'fraud:case:manage':            { label: 'Manage Fraud Cases',                 group: 'Verification' },
  'finance:ledger:view':          { label: 'View Financial Ledger',              group: 'Finance' },
  'finance:disburse:check':       { label: 'Approve Disbursements',              group: 'Finance' },
  'finance:reconcile':            { label: 'Reconcile Finances',                 group: 'Finance' },
  'payment:refund':               { label: 'Process Refunds',                    group: 'Finance' },
  'gov:problem_statement:manage': { label: 'Manage Problem Statements',          group: 'Government' },
  'gov:grant_scheme:manage':      { label: 'Manage Grant Schemes',               group: 'Government' },
  'gov:uc:export':                { label: 'Export Utilization Certificates',     group: 'Government' },
};

const GROUP_ICONS: Record<string, React.ReactNode> = {
  'Research & Ethics': <FlaskConical className="w-4 h-4" />,
  'Grants':            <Award className="w-4 h-4" />,
  'Projects':          <Rocket className="w-4 h-4" />,
  'Administration':    <ShieldCheck className="w-4 h-4" />,
  'Organization':      <Building2 className="w-4 h-4" />,
  'Workflows':         <Workflow className="w-4 h-4" />,
  'Verification':      <Users className="w-4 h-4" />,
  'Finance':           <Receipt className="w-4 h-4" />,
  'Government':        <FileText className="w-4 h-4" />,
};

interface MyPermissionsCardProps {
  compact?: boolean;
}

export default function MyPermissionsCard({ compact = false }: MyPermissionsCardProps) {
  const { can } = usePermissions();
  const { user } = useAuth();
  const [matrixData, setMatrixData] = useState<PermissionMatrixResponse | null>(null);

  const activeRole = (user?.activeProfile?.role || user?.role || 'USER').toUpperCase();
  const roleName = activeRole.replace(/_/g, ' ');

  useEffect(() => {
    let isMounted = true;
    fetchPermissionMatrix({ role: activeRole })
      .then((data) => {
        if (isMounted) setMatrixData(data);
      })
      .catch((err) => console.warn('Failed to load matrix for MyPermissionsCard', err));
    return () => {
      isMounted = false;
    };
  }, [activeRole]);

  // Evaluate permission strictly for the active role
  const isAllowed = (key: string): boolean => {
    if (matrixData?.roleMatrix && matrixData.roleMatrix[activeRole]) {
      return matrixData.roleMatrix[activeRole].includes(key);
    }
    if (user?.activeProfile?.role?.toUpperCase() === activeRole && user?.permissions?.includes(key)) {
      return true;
    }
    return can(key);
  };

  // Group permissions by domain
  const grouped: Record<string, { key: string; label: string; allowed: boolean }[]> = {};
  for (const [key, meta] of Object.entries(PERMISSION_LABELS)) {
    if (!grouped[meta.group]) grouped[meta.group] = [];
    grouped[meta.group].push({
      key,
      label: meta.label,
      allowed: isAllowed(key),
    });
  }

  // Filter to only groups that have at least one allowed permission
  const activeGroups = Object.entries(grouped).filter(
    ([, items]) => items.some((i) => i.allowed)
  );

  const activeCount = Object.values(grouped).flat().filter((i) => i.allowed).length;

  if (activeCount === 0) {
    return (
      <div className="bg-white border-2 border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="w-5 h-5 text-gray-400" />
          <h3 className="font-headline font-black text-sm uppercase tracking-wider text-gray-700">
            Your Permissions
          </h3>
        </div>
        <p className="text-xs text-gray-500">No permissions assigned to this profile.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-[#121316] rounded-xl shadow-[3px_3px_0_#0F534A] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 bg-[#0F534A] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="font-headline font-black text-sm uppercase tracking-wider">
            Your Permissions
          </h3>
        </div>
        <span className="bg-white/20 text-white px-2.5 py-0.5 rounded-full text-[10px] font-headline font-bold uppercase tracking-wider">
          {roleName} — {activeCount} Active
        </span>
      </div>

      {/* Permission Groups */}
      <div className={`p-4 ${compact ? 'max-h-64 overflow-y-auto' : ''}`}>
        <div className="space-y-4">
          {activeGroups.map(([group, items]) => (
            <div key={group}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#0F534A]">{GROUP_ICONS[group]}</span>
                <h4 className="font-headline font-bold text-xs uppercase tracking-wider text-gray-600">
                  {group}
                </h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {items
                  .filter((i) => i.allowed)
                  .map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center gap-2 px-3 py-2 bg-[#9EFC5F]/15 border border-[#0F534A]/20 rounded-lg"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#0F534A] flex-shrink-0" />
                      <span className="text-[11px] font-medium text-gray-700">{item.label}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
