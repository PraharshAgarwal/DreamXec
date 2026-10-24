import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  ShieldCheck,
  Check,
  Save,
  Layers,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { updateOrgConfig } from '../../../services/adminService';

interface OrgSettingsTabProps {
  organization: any;
  childOrgs: any[];
  onRefresh: () => void;
}

const ALL_ROLES = [
  { id: 'STUDENT', label: 'Student Researcher', desc: 'Enrolled students eligible to create and collaborate on campaigns' },
  { id: 'STUDENT_PRESIDENT', label: 'Club President', desc: 'Student leader authorized to lead student clubs and groups' },
  { id: 'PROFESSOR', label: 'Faculty Advisor / Professor', desc: 'Academic faculty overseeing student research proposals' },
  { id: 'RESEARCHER', label: 'Research Scholar', desc: 'Independent or institutional researchers' },
  { id: 'MENTOR', label: 'Technical Mentor', desc: 'Industry and technical domain experts' },
  { id: 'INCUBATOR_MANAGER', label: 'Incubator Manager', desc: 'Staff managing campus startup incubators and lab grants' },
  { id: 'ORG_ADMIN', label: 'Organization Admin', desc: 'Primary administrator for the institution' },
];

export const OrgSettingsTab: React.FC<OrgSettingsTabProps> = ({
  organization,
  childOrgs,
  onRefresh,
}) => {
  const [name, setName] = useState(organization?.name || '');
  const [orgType, setOrgType] = useState(organization?.orgType || 'UNIVERSITY');
  const [allowedRoles, setAllowedRoles] = useState<string[]>(
    organization?.allowedRoles || ['STUDENT', 'PROFESSOR', 'RESEARCHER', 'STUDENT_PRESIDENT', 'ORG_ADMIN']
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (organization) {
      setName(organization.name || '');
      setOrgType(organization.orgType || 'UNIVERSITY');
      if (Array.isArray(organization.allowedRoles)) {
        setAllowedRoles(organization.allowedRoles);
      }
    }
  }, [organization]);

  const handleToggleRole = (roleId: string) => {
    if (allowedRoles.includes(roleId)) {
      if (allowedRoles.length <= 1) {
        toast.error('At least one role must remain enabled.');
        return;
      }
      setAllowedRoles(allowedRoles.filter((r) => r !== roleId));
    } else {
      setAllowedRoles([...allowedRoles, roleId]);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization?.id) return;

    setSaving(true);
    const toastId = toast.loading('Saving organization settings to database...');
    try {
      await updateOrgConfig(organization.id, {
        name: name.trim(),
        orgType,
        allowedRoles,
      });

      toast.success('Organization configuration updated successfully!', { id: toastId });
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update settings.', { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* ── HEADER ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
          <Settings className="w-3.5 h-3.5" /> Institutional Configuration
        </div>
        <h2 className="font-headline font-black text-2xl sm:text-3xl text-[#0F534A] uppercase tracking-tight">
          Organization Profile &amp; Governance Settings
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 font-medium">
          Manage institutional metadata, enabled member roles, and parent-child hierarchy parameters in the database.
        </p>
      </div>

      {/* ── CONFIGURATION FORM ── */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-6 space-y-4 text-xs">
          <h3 className="font-headline font-black text-base text-[#0F534A] uppercase border-b-2 border-gray-200 pb-2">
            Institutional Identity
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-headline font-black uppercase text-gray-700 mb-1">
                Organization Display Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-headline font-black uppercase text-gray-700 mb-1">
                Organization Slug (Identifier)
              </label>
              <input
                type="text"
                disabled
                value={organization?.slug || ''}
                className="w-full p-2.5 font-mono text-gray-500 border-2 border-gray-300 bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block font-headline font-black uppercase text-gray-700 mb-1">
                Organization Type *
              </label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="w-full p-2.5 font-headline font-black uppercase border-2 border-[#121316] bg-white focus:outline-none"
              >
                <option value="UNIVERSITY">University / College Campus</option>
                <option value="COLLEGE_DEPARTMENT">Academic Department</option>
                <option value="CLUB">Student Club / Society</option>
                <option value="LAB">Research Lab</option>
                <option value="INCUBATOR">Campus Incubator / Accelerator</option>
                <option value="CORPORATE">Corporate Partner</option>
                <option value="NGO">Non-Governmental Organization</option>
              </select>
            </div>

            <div>
              <label className="block font-headline font-black uppercase text-gray-700 mb-1">
                Hierarchy Depth &amp; Affiliates
              </label>
              <div className="p-2.5 bg-[#FCFBF7] border-2 border-[#121316] font-bold text-gray-700">
                Depth: {organization?.depth || 0} &bull; {childOrgs.length} Child Units Registered
              </div>
            </div>
          </div>
        </div>

        {/* Allowed Roles */}
        <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A] p-6 space-y-4 text-xs">
          <div className="space-y-1">
            <h3 className="font-headline font-black text-base text-[#0F534A] uppercase">
              Permissible Roles in this Institution
            </h3>
            <p className="text-gray-600 font-medium">
              Select the member roles that can be onboarded or claimed under {name || 'this organization'}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            {ALL_ROLES.map((role) => {
              const isChecked = allowedRoles.includes(role.id);
              return (
                <div
                  key={role.id}
                  onClick={() => handleToggleRole(role.id)}
                  className={`p-3.5 border-3 border-[#121316] cursor-pointer transition-all flex items-start gap-3 select-none ${
                    isChecked
                      ? 'bg-[#FCFBF7] shadow-[3px_3px_0_#FE4E1A]'
                      : 'bg-gray-50 opacity-60'
                  }`}
                >
                  <div
                    className={`w-5 h-5 border-2 border-[#121316] flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      isChecked ? 'bg-[#FE4E1A] text-white' : 'bg-white'
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <p className="font-headline font-black text-sm text-[#121316] uppercase">
                      {role.label}
                    </p>
                    <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                      {role.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 text-xs font-headline font-black uppercase tracking-wider bg-[#0F534A] hover:bg-[#0b3d36] text-white border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving Changes...' : 'Save Settings to Database ✓'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrgSettingsTab;
