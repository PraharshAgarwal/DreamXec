import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  Plus,
  CheckCircle2,
  Search,
  Filter,
  ChevronRight,
  UserCheck,
  Workflow,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Settings,
  GitFork,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import apiRequest, { getToken } from '../../services/api';
import WorkflowStageBuilder from './WorkflowStageBuilder';
import { LeetCodeCardSkeleton } from '../common/LeetCodeSkeleton';
import { OnboardExternalOrgModal } from '../admin/OnboardExternalOrgModal';

export const AVAILABLE_ROLES = [
  { id: 'ORG_ADMIN', label: 'Organization Admin', desc: 'Primary administrative manager for institution' },
  { id: 'PROFESSOR', label: 'Professor / Faculty', desc: 'Academic supervisor and grant reviewer' },
  { id: 'RESEARCHER', label: 'Researcher / Scholar', desc: 'Lead investigator for research proposals' },
  { id: 'STUDENT_PRESIDENT', label: 'Student President', desc: 'Leader of university student council/clubs' },
  { id: 'INCUBATOR_MANAGER', label: 'Incubator Manager', desc: 'Manager of startup incubation programs' },
  { id: 'COMPLIANCE_OFFICER', label: 'Compliance Officer', desc: 'Auditor for financial and ethical compliance' },
  { id: 'FINANCE_OFFICER', label: 'Finance Officer', desc: 'Disbursement checker and financial controller (4-eyes PBAC)' },
  { id: 'GOV_OFFICER', label: 'Government Officer', desc: 'Central/State/District government representative' },
  { id: 'GOV_OFFICIAL', label: 'Government Official', desc: 'State and national regulatory representative' },
  { id: 'MENTOR', label: 'Industry Mentor', desc: 'External advisor for projects and startups' },
  { id: 'CORPORATE_ADMIN', label: 'Corporate Partner Admin', desc: 'CSR and corporate sponsorship coordinator' },
  { id: 'DONOR', label: 'Donor / Backer', desc: 'Verified philanthropic or institutional supporter' },
  { id: 'SPONSOR', label: 'Corporate / Project Sponsor', desc: 'Sponsorship and philanthropic contributor' },
  { id: 'ALUMNI', label: 'Alumni Mentor / Backer', desc: 'Graduated institution alumni and network advisor' },
  { id: 'STUDENT', label: 'Student Member', desc: 'Standard student applicant' },
  { id: 'EXTERNAL_ORG_MEMBER', label: 'External Organisation Member', desc: 'Accredited external partner facility or service provider' },
];

export const ORG_TYPES = [
  { id: 'COLLEGE', label: 'College / University', desc: 'Higher education academic institution' },
  { id: 'CLUB', label: 'Student / Innovation Club', desc: 'Specialized club or department subordinate to an institution' },
  { id: 'RESEARCH_INSTITUTION', label: 'Research Institution / Lab', desc: 'Dedicated scientific or technological research lab' },
  { id: 'INCUBATOR', label: 'Incubator / Accelerator', desc: 'Startup incubation or entrepreneurial center' },
  { id: 'CORPORATE', label: 'Corporate Partner / CSR', desc: 'Industry partner or corporate sponsor' },
  { id: 'NGO', label: 'Non-Profit / NGO', desc: 'Non-governmental development organization' },
  { id: 'GOVERNMENT_BODY', label: 'Government Body / Ministry', desc: 'Central, state or municipal department or funding agency' },
];

export const DEFAULT_STAGES: any[] = [];

export interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  orgType: string;
  parentId?: string | null;
  allowedRoles?: string[];
  lifecycleStatus: string;
  createdAt: string;
  parent?: { id: string; name: string; slug: string } | null;
  memberships?: Array<{
    user: { id: string; fullName: string; email: string };
  }>;
  workflowTemplates?: Array<{
    id: string;
    name: string;
    slug: string;
    status: string;
    stages?: Array<{ id?: string; name: string; description?: string; stageType: string; executionOrder: number; config?: any }>;
  }>;
}

/**
 * Searchable Select Component for Parent Organization Hierarchy
 */
interface ParentOrgSearchSelectProps {
  label?: string;
  value: string;
  onChange: (orgId: string) => void;
  organizations: OrganizationItem[];
  excludeOrgId?: string;
  placeholder?: string;
}

export const ParentOrgSearchSelect: React.FC<ParentOrgSearchSelectProps> = ({
  label = 'Parent Organization (Optional Hierarchy)',
  value,
  onChange,
  organizations,
  excludeOrgId,
  placeholder = 'Type to search parent institution...',
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const availableOrgs = organizations.filter((o) => !excludeOrgId || o.id !== excludeOrgId);

  const filteredOrgs = availableOrgs.filter((org) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      org.name.toLowerCase().includes(q) ||
      org.slug.toLowerCase().includes(q) ||
      (org.orgType && org.orgType.toLowerCase().includes(q))
    );
  });

  const selectedOrg = organizations.find((o) => o.id === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1.5">
        {label}
      </label>

      {/* Trigger / Display Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#FCFBF7] border-2 border-[#121316] p-2.5 text-xs font-bold text-[#121316] flex items-center justify-between cursor-pointer focus:outline-none hover:border-[#FE4E1A] transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-2">
          <GitFork className="w-3.5 h-3.5 text-[#FE4E1A] shrink-0" />
          {selectedOrg ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-headline font-black uppercase text-[#0F534A] truncate">
                {selectedOrg.name}
              </span>
              <span className="text-[10px] font-mono font-bold text-gray-500 bg-white border border-gray-300 px-1 py-0.5 shrink-0">
                {selectedOrg.slug}
              </span>
            </div>
          ) : (
            <span className="text-gray-400 font-medium italic">
              -- None (Top-Level Institution) --
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selectedOrg && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearchQuery('');
              }}
              className="p-0.5 text-gray-400 hover:text-red-600 cursor-pointer text-xs"
              title="Clear Selection"
            >
              ✕
            </button>
          )}
          <span className="text-gray-400 text-[10px] font-black">
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Searchable Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border-2 border-[#121316] shadow-[4px_4px_0_#121316] max-h-64 flex flex-col overflow-hidden">
          {/* Search Box */}
          <div className="p-2 border-b-2 border-gray-200 bg-[#FCFBF7] flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <input
              type="text"
              autoFocus
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent text-xs font-bold text-[#121316] focus:outline-none placeholder-gray-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Options List */}
          <div className="overflow-y-auto divide-y divide-gray-100">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
                setSearchQuery('');
              }}
              className={`w-full text-left p-2.5 text-xs font-bold transition-colors flex items-center justify-between cursor-pointer ${
                !value ? 'bg-[#FFDD33]/20 text-[#0F534A] font-headline font-black' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span>-- None (Top-Level Institution) --</span>
              {!value && <span className="text-[#FE4E1A] font-black">✓</span>}
            </button>

            {filteredOrgs.length === 0 ? (
              <div className="p-4 text-center text-xs text-gray-400 font-medium">
                No organizations matching "{searchQuery}"
              </div>
            ) : (
              filteredOrgs.map((org) => {
                const isSelected = org.id === value;
                return (
                  <button
                    key={org.id}
                    type="button"
                    onClick={() => {
                      onChange(org.id);
                      setIsOpen(false);
                      setSearchQuery('');
                    }}
                    className={`w-full text-left p-2.5 text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      isSelected ? 'bg-[#FFDD33]/20 text-[#0F534A]' : 'hover:bg-gray-50 text-[#121316]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="font-headline font-black text-xs uppercase text-[#0F534A] truncate">
                        {org.name}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5 flex items-center gap-2">
                        <span>Slug: {org.slug}</span>
                        <span className="px-1 py-0.5 bg-gray-100 border border-gray-300 font-bold">
                          {org.orgType}
                        </span>
                      </div>
                    </div>
                    {isSelected && (
                      <span className="text-[#FE4E1A] font-headline font-black text-xs shrink-0">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

let orgCache: OrganizationItem[] | null = null;

export const DxOrgManagementConsole: React.FC = () => {
  const [subView, setSubView] = useState<'register' | 'existing'>('existing');
  const [organizations, setOrganizations] = useState<OrganizationItem[]>(orgCache || []);
  const [loading, setLoading] = useState<boolean>(!orgCache);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [externalOrgModalOpen, setExternalOrgModalOpen] = useState<boolean>(false);

  // Register New Org Wizard State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [newOrgName, setNewOrgName] = useState<string>('');
  const [newOrgSlug, setNewOrgSlug] = useState<string>('');
  const [newOrgType, setNewOrgType] = useState<string>('COLLEGE');
  const [newParentId, setNewParentId] = useState<string>('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['ORG_ADMIN', 'PROFESSOR', 'RESEARCHER', 'STUDENT']);
  const [activeRoleWorkflowTab, setActiveRoleWorkflowTab] = useState<string>('ORG_ADMIN');
  const [roleWorkflowMap, setRoleWorkflowMap] = useState<Record<string, any[]>>({
    ORG_ADMIN: [],
    PROFESSOR: [],
    RESEARCHER: [],
    STUDENT: [],
  });
  const [expandedStageIdx, setExpandedStageIdx] = useState<number | null>(null);

  // Existing Org Editor State
  const [editingOrg, setEditingOrg] = useState<OrganizationItem | null>(null);
  const [editModalOpen, setEditModalOpen] = useState<boolean>(false);
  const [editOrgName, setEditOrgName] = useState<string>('');
  const [editOrgType, setEditOrgType] = useState<string>('COLLEGE');
  const [editParentId, setEditParentId] = useState<string>('');
  const [editAllowedRoles, setEditAllowedRoles] = useState<string[]>([]);
  const [editLifecycleStatus, setEditLifecycleStatus] = useState<string>('ACTIVE');
  const [activeEditRoleTab, setActiveEditRoleTab] = useState<string>('');
  const [editRoleWorkflowMap, setEditRoleWorkflowMap] = useState<Record<string, any[]>>({});
  const [expandedEditStageIdx, setExpandedEditStageIdx] = useState<number | null>(null);
  const [saving, setSaving] = useState<boolean>(false);

  const fetchOrganizations = async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    if (!orgCache) {
      setLoading(true);
    }
    try {
      const res = await apiRequest<any>('/dx-admin/onboarding/orgs', {
        params: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(search ? { search } : {}),
        },
      });
      const list = res.data?.organizations || [];
      orgCache = list;
      setOrganizations(list);
    } catch (err: any) {
      console.error('Error fetching organizations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [statusFilter]);

  // Handle Role Checkbox Toggle for Wizard
  const toggleWizardRole = (roleId: string) => {
    if (selectedRoles.includes(roleId)) {
      const updated = selectedRoles.filter((r) => r !== roleId);
      setSelectedRoles(updated);
      if (activeRoleWorkflowTab === roleId && updated.length > 0) {
        setActiveRoleWorkflowTab(updated[0]);
      }
    } else {
      const updated = [...selectedRoles, roleId];
      setSelectedRoles(updated);
      if (!roleWorkflowMap[roleId]) {
        setRoleWorkflowMap({ ...roleWorkflowMap, [roleId]: [] });
      }
      setActiveRoleWorkflowTab(roleId);
    }
  };

  // Add Stage to Role Workflow in Wizard
  const addStageToWizardRole = (roleId: string) => {
    const currentStages = roleWorkflowMap[roleId] || [];
    const newStage = {
      _uid: `stg_uid_${Date.now()}`,
      name: `Stage ${currentStages.length + 1}`,
      description: '',
      stageType: 'FORM',
      executionOrder: currentStages.length + 1,
      config: { fields: [] },
    };
    setRoleWorkflowMap({
      ...roleWorkflowMap,
      [roleId]: [...currentStages, newStage],
    });
    setExpandedStageIdx(currentStages.length);
  };

  // Delete Stage from Role Workflow in Wizard
  const removeStageFromWizardRole = (roleId: string, idx: number) => {
    const currentStages = roleWorkflowMap[roleId] || [];
    const updated = currentStages.filter((_, i) => i !== idx).map((st, i) => ({ ...st, executionOrder: i + 1 }));
    setRoleWorkflowMap({ ...roleWorkflowMap, [roleId]: updated });
    if (expandedStageIdx === idx) setExpandedStageIdx(null);
  };

  // Submit New Org Onboarding strictly formatted as backend requires
  const handleOnboardNewOrg = async () => {
    if (!newOrgName.trim() || !newOrgSlug.trim()) {
      toast.error('Organization Name and Slug are required');
      return;
    }

    setSaving(true);
    try {
      const roleWorkflowsPayload = selectedRoles.map((role) => ({
        role,
        stages: roleWorkflowMap[role] || [],
      }));

      await apiRequest('/dx-admin/onboarding/orgs', {
        method: 'POST',
        body: JSON.stringify({
          name: newOrgName.trim(),
          slug: newOrgSlug.trim().toLowerCase(),
          orgType: newOrgType,
          parentId: newParentId ? newParentId : null,
          allowedRoles: selectedRoles,
          roleWorkflows: roleWorkflowsPayload,
        }),
      });

      toast.success('Organization registered and role workflows configured successfully!');
      // Reset Wizard
      setNewOrgName('');
      setNewOrgSlug('');
      setNewParentId('');
      setWizardStep(1);
      setSubView('existing');
      fetchOrganizations();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to onboard organization');
    } finally {
      setSaving(false);
    }
  };

  // Open Edit Modal for Existing Org
  const handleOpenEditModal = (org: OrganizationItem) => {
    setEditingOrg(org);
    setEditOrgName(org.name || '');
    setEditOrgType(org.orgType || 'COLLEGE');
    setEditParentId(org.parentId || org.parent?.id || '');
    setEditAllowedRoles(org.allowedRoles || ['ORG_ADMIN', 'PROFESSOR', 'RESEARCHER', 'STUDENT']);
    setEditLifecycleStatus(org.lifecycleStatus || 'ACTIVE');

    // Populate role workflows map from template list
    const initialMap: Record<string, any[]> = {};
    if (org.workflowTemplates) {
      org.workflowTemplates.forEach((tmpl) => {
        AVAILABLE_ROLES.forEach((r) => {
          if (tmpl.slug.toLowerCase().includes(r.id.toLowerCase())) {
            initialMap[r.id] = tmpl.stages || [];
          }
        });
      });
    }

    // Ensure all allowed roles have empty array in map if none existed
    (org.allowedRoles || ['ORG_ADMIN', 'PROFESSOR', 'RESEARCHER', 'STUDENT']).forEach((r) => {
      if (!initialMap[r]) initialMap[r] = [];
    });

    setEditRoleWorkflowMap(initialMap);
    setActiveEditRoleTab((org.allowedRoles && org.allowedRoles[0]) || 'ORG_ADMIN');
    setEditModalOpen(true);
  };

  // Toggle Role for Existing Org
  const toggleEditOrgRole = (roleId: string) => {
    if (editAllowedRoles.includes(roleId)) {
      const updated = editAllowedRoles.filter((r) => r !== roleId);
      setEditAllowedRoles(updated);
      if (activeEditRoleTab === roleId && updated.length > 0) {
        setActiveEditRoleTab(updated[0]);
      }
    } else {
      const updated = [...editAllowedRoles, roleId];
      setEditAllowedRoles(updated);
      if (!editRoleWorkflowMap[roleId]) {
        setEditRoleWorkflowMap({ ...editRoleWorkflowMap, [roleId]: [] });
      }
      setActiveEditRoleTab(roleId);
    }
  };

  // Save Edit Configuration for Existing Org
  const handleSaveEditOrgConfig = async () => {
    if (!editingOrg) return;

    setSaving(true);
    try {
      const roleWorkflowsPayload = editAllowedRoles.map((role) => ({
        role,
        stages: editRoleWorkflowMap[role] || [],
      }));

      await apiRequest(`/dx-admin/onboarding/orgs/${editingOrg.id}/config`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editOrgName.trim(),
          orgType: editOrgType,
          parentId: editParentId ? editParentId : null,
          allowedRoles: editAllowedRoles,
          lifecycleStatus: editLifecycleStatus,
          roleWorkflows: roleWorkflowsPayload,
        }),
      });

      toast.success('Organization configuration and workflows updated successfully');
      setEditModalOpen(false);
      setEditingOrg(null);
      fetchOrganizations();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Sub-View Switcher Bar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border-3 border-[#121316] shadow-[4px_4px_0_#0F534A]"
      >
        <div>
          <h2 className="text-xl font-headline font-black text-[#0F534A] flex items-center gap-2 uppercase tracking-wide">
            <Building2 className="w-6 h-6 text-[#FE4E1A]" />
            Organization Registration &amp; Governance Console
          </h2>
          <p className="text-xs text-gray-600 mt-1 font-medium">
            Register new organizations matching backend schema (Name, Slug, OrgType, Hierarchy, Allowed Roles &amp; Workflows).
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#FCFBF7] p-1.5 border-2 border-[#121316]">
          <button
            onClick={() => setSubView('register')}
            className={`px-4 py-2 font-headline font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              subView === 'register'
                ? 'bg-[#FE4E1A] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316]'
                : 'text-[#0F534A] hover:bg-gray-100'
            }`}
          >
            <Plus className="w-4 h-4" /> Register New Org
          </button>

          <button
            onClick={() => setSubView('existing')}
            className={`px-4 py-2 font-headline font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer ${
              subView === 'existing'
                ? 'bg-[#0F534A] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316]'
                : 'text-[#0F534A] hover:bg-gray-100'
            }`}
          >
            <Building2 className="w-4 h-4" /> Existing Organizations ({organizations.length})
          </button>

          <button
            type="button"
            onClick={() => setExternalOrgModalOpen(true)}
            className="px-4 py-2 font-headline font-black text-xs uppercase tracking-wider bg-[#FFDD33] text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#ffe359] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[#FE4E1A]" /> Onboard External Org
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: REGISTER NEW ORGANIZATION (CLEAN 3-STEP WIZARD) */}
      {subView === 'register' && (
        <div className="bg-white border-3 border-[#121316] shadow-[6px_6px_0_#121316] p-6 sm:p-8 space-y-8">
          {/* Stepper Indicator */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 border-b-2 border-gray-200 pb-6 flex-wrap">
            <div className={`flex items-center gap-2 font-headline font-black text-xs uppercase tracking-wider ${wizardStep === 1 ? 'text-[#FE4E1A]' : 'text-gray-400'}`}>
              <span className={`w-8 h-8 flex items-center justify-center border-2 border-[#121316] ${wizardStep === 1 ? 'bg-[#FE4E1A] text-white' : 'bg-gray-100 text-gray-500'}`}>1</span>
              <span>Organization Details</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 hidden sm:block" />
            <div className={`flex items-center gap-2 font-headline font-black text-xs uppercase tracking-wider ${wizardStep === 2 ? 'text-[#FE4E1A]' : 'text-gray-400'}`}>
              <span className={`w-8 h-8 flex items-center justify-center border-2 border-[#121316] ${wizardStep === 2 ? 'bg-[#FE4E1A] text-white' : 'bg-gray-100 text-gray-500'}`}>2</span>
              <span>Allowed Roles</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 hidden sm:block" />
            <div className={`flex items-center gap-2 font-headline font-black text-xs uppercase tracking-wider ${wizardStep === 3 ? 'text-[#FE4E1A]' : 'text-gray-400'}`}>
              <span className={`w-8 h-8 flex items-center justify-center border-2 border-[#121316] ${wizardStep === 3 ? 'bg-[#FE4E1A] text-white' : 'bg-gray-100 text-gray-500'}`}>3</span>
              <span>Role Workflow Pipelines</span>
            </div>
          </div>

          {/* STEP 1: ORG DETAILS */}
          {wizardStep === 1 && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-lg font-headline font-black text-[#0F534A] uppercase tracking-wide flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#FE4E1A]" /> Step 1: Organization Schema Details
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Specify core institution identity, slug identifier, organization type, and searchable hierarchy.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1.5">
                    Organization Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Indian Institute of Technology Delhi"
                    value={newOrgName}
                    onChange={(e) => {
                      setNewOrgName(e.target.value);
                      setNewOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }}
                    className="w-full bg-[#FCFBF7] border-2 border-[#121316] p-3 text-[#121316] text-xs font-bold focus:outline-none focus:border-[#FE4E1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1.5">
                    Organization Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. iit-delhi"
                    value={newOrgSlug}
                    onChange={(e) => setNewOrgSlug(e.target.value)}
                    className="w-full bg-[#FCFBF7] border-2 border-[#121316] p-3 text-[#121316] text-xs font-mono font-bold focus:outline-none focus:border-[#FE4E1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1.5">
                    Organization Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newOrgType}
                    onChange={(e) => setNewOrgType(e.target.value)}
                    className="w-full bg-[#FCFBF7] border-2 border-[#121316] p-3 text-[#121316] text-xs font-headline font-black focus:outline-none focus:border-[#FE4E1A] cursor-pointer"
                  >
                    {ORG_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.label} ({t.id})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <ParentOrgSearchSelect
                    label="Parent Organization (Optional Hierarchy)"
                    value={newParentId}
                    onChange={setNewParentId}
                    organizations={organizations}
                    placeholder="Search parent by name, slug, or type..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  disabled={!newOrgName.trim() || !newOrgSlug.trim()}
                  onClick={() => setWizardStep(2)}
                  className="px-6 py-3 bg-[#FE4E1A] hover:bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0_#121316] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  Next: Select Allowed Roles <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ROLE SELECTION */}
          {wizardStep === 2 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-lg font-headline font-black text-[#0F534A] uppercase tracking-wide flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-[#FE4E1A]" /> Step 2: Select Allowed Roles for {newOrgName}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Choose which institutional roles will be enabled for onboarding at {newOrgName}.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {AVAILABLE_ROLES.map((r) => {
                  const isChecked = selectedRoles.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleWizardRole(r.id)}
                      className={`p-4 border-2 cursor-pointer transition-all flex items-start gap-3 ${
                        isChecked
                          ? 'bg-[#FFDD33]/20 border-[#121316] shadow-[3px_3px_0_#121316]'
                          : 'bg-white border-gray-300 hover:border-[#121316]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-0.5 w-4 h-4 accent-[#FE4E1A] cursor-pointer"
                      />
                      <div>
                        <h4 className="font-headline font-black text-xs uppercase text-[#0F534A]">{r.label}</h4>
                        <p className="text-[11px] text-gray-600 mt-0.5 font-medium leading-snug">{r.desc}</p>
                        <span className="inline-block mt-2 text-[9px] font-mono font-bold px-1.5 py-0.5 bg-white border border-[#121316]/30">
                          {r.id}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setWizardStep(1)}
                  className="px-5 py-2.5 bg-white border-2 border-[#121316] text-[#0F534A] font-headline font-black text-xs uppercase tracking-wider hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  disabled={selectedRoles.length === 0}
                  onClick={() => setWizardStep(3)}
                  className="px-6 py-3 bg-[#FE4E1A] hover:bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0_#121316] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  Next: Configure Workflows <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: WORKFLOW PIPELINES PER ROLE */}
          {wizardStep === 3 && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="border-b border-gray-200 pb-3">
                <h3 className="text-lg font-headline font-black text-[#0F534A] uppercase tracking-wide flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-[#0F534A]" /> Step 3: Configure Workflows for Selected Roles
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Design stage verification pipelines for each enabled role in {newOrgName}.
                </p>
              </div>

              {/* Role Tabs */}
              <div className="flex items-center gap-2 border-b-2 border-gray-200 pb-2 overflow-x-auto">
                {selectedRoles.map((roleId) => {
                  const roleObj = AVAILABLE_ROLES.find((r) => r.id === roleId);
                  const isSelected = activeRoleWorkflowTab === roleId;
                  const stages = roleWorkflowMap[roleId] || [];

                  return (
                    <button
                      key={roleId}
                      onClick={() => setActiveRoleWorkflowTab(roleId)}
                      className={`px-3.5 py-2 font-headline font-black text-xs uppercase whitespace-nowrap transition-all border-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#0F534A] text-white border-[#121316] shadow-[2px_2px_0_#121316]'
                          : 'bg-white text-[#0F534A] border-gray-300 hover:border-[#121316]'
                      }`}
                    >
                      {roleObj?.label || roleId} ({stages.length} Stages)
                    </button>
                  );
                })}
              </div>

              {/* Role Stage Canvas */}
              <div className="bg-[#FCFBF7] border-2 border-[#121316] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-headline font-black text-sm uppercase text-[#0F534A]">
                      Workflow Pipeline: {activeRoleWorkflowTab}
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5 font-medium">
                      Configure verification steps executed when an applicant claims this role.
                    </p>
                  </div>

                  <button
                    onClick={() => addStageToWizardRole(activeRoleWorkflowTab)}
                    className="px-3.5 py-2 bg-[#0F534A] hover:bg-[#FE4E1A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0_#121316]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Stage
                  </button>
                </div>

                {/* Stage List */}
                <div className="space-y-3">
                  {(roleWorkflowMap[activeRoleWorkflowTab] || []).length === 0 ? (
                    <div className="p-8 text-center bg-white border-2 border-dashed border-[#121316] space-y-3 shadow-[2px_2px_0_#121316]">
                      <div className="w-10 h-10 bg-[#FFDD33] text-[#121316] font-headline font-black text-lg flex items-center justify-center border-2 border-[#121316] mx-auto">
                        +
                      </div>
                      <h5 className="text-xs font-headline font-black uppercase text-[#0F534A]">
                        No stages added for {activeRoleWorkflowTab} yet
                      </h5>
                      <p className="text-[11px] text-gray-500 max-w-sm mx-auto font-medium">
                        Build your verification pipeline step by step by adding form fields, email verification, or document upload stages one by one.
                      </p>
                      <button
                        type="button"
                        onClick={() => addStageToWizardRole(activeRoleWorkflowTab)}
                        className="px-4 py-2 bg-[#FE4E1A] hover:bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add First Stage
                      </button>
                    </div>
                  ) : (
                    (roleWorkflowMap[activeRoleWorkflowTab] || []).map((stg, idx) => (
                      <div key={stg._uid || stg.id || `stg_${idx}`} className="bg-white border-2 border-[#121316] p-4 flex flex-col gap-3 shadow-[2px_2px_0_#121316]">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1">
                            <span className="w-7 h-7 bg-[#FE4E1A] text-white font-headline font-black text-xs flex items-center justify-center border-2 border-[#121316] flex-shrink-0">
                              {idx + 1}
                            </span>
                            <div className="space-y-1 flex-1">
                              <input
                                type="text"
                                value={stg.name}
                                placeholder={`Stage ${idx + 1} Name`}
                                onChange={(e) => {
                                  const updated = [...(roleWorkflowMap[activeRoleWorkflowTab] || [])];
                                  updated[idx].name = e.target.value;
                                  setRoleWorkflowMap({ ...roleWorkflowMap, [activeRoleWorkflowTab]: updated });
                                }}
                                className="font-headline font-black text-xs uppercase text-[#0F534A] bg-transparent border-b border-dashed border-gray-300 focus:outline-none focus:border-[#FE4E1A] w-full"
                              />
                              <input
                                type="text"
                                value={stg.description || ''}
                                placeholder="Stage description..."
                                onChange={(e) => {
                                  const updated = [...(roleWorkflowMap[activeRoleWorkflowTab] || [])];
                                  updated[idx].description = e.target.value;
                                  setRoleWorkflowMap({ ...roleWorkflowMap, [activeRoleWorkflowTab]: updated });
                                }}
                                className="text-xs text-gray-500 bg-transparent focus:outline-none w-full font-medium"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={stg.stageType}
                              onChange={(e) => {
                                const newType = e.target.value;
                                const updated = [...(roleWorkflowMap[activeRoleWorkflowTab] || [])];
                                updated[idx].stageType = newType;
                                if (newType === 'APAAR_VERIFICATION' && (!updated[idx].name || updated[idx].name.startsWith('Stage '))) {
                                  updated[idx].name = 'Student APAAR ID Verification';
                                  updated[idx].description = 'Real-time automated verification of 12-digit student One Nation One Student ID with Government API Setu & DigiLocker.';
                                } else if (newType === 'ORCID_VERIFICATION' && (!updated[idx].name || updated[idx].name.startsWith('Stage '))) {
                                  updated[idx].name = 'ORCID Academic Identity Verification';
                                  updated[idx].description = 'Real-time identity verification of researcher ORCID record and publications against the official public ORCID Registry.';
                                }
                                setRoleWorkflowMap({ ...roleWorkflowMap, [activeRoleWorkflowTab]: updated });
                              }}
                              className="bg-[#FCFBF7] border-2 border-[#121316] text-[11px] font-mono font-bold text-[#121316] p-1.5 cursor-pointer"
                            >
                              <option value="FORM">FORM</option>
                              <option value="APAAR_VERIFICATION">APAAR_VERIFICATION (Govt DigiLocker)</option>
                              <option value="ORCID_VERIFICATION">ORCID_VERIFICATION (Researcher Registry)</option>
                              <option value="DOCUMENT_UPLOAD">DOCUMENT_UPLOAD</option>
                              <option value="EMAIL_VERIFICATION">EMAIL_VERIFICATION</option>
                              <option value="MANUAL_REVIEW">MANUAL_REVIEW</option>
                              <option value="COMPLIANCE_REVIEW">COMPLIANCE_REVIEW</option>
                              <option value="APPROVAL">APPROVAL</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => setExpandedStageIdx(expandedStageIdx === idx ? null : idx)}
                              className={`p-1.5 border-2 border-[#121316] transition cursor-pointer ${expandedStageIdx === idx ? 'bg-[#FFDD33] text-[#121316]' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                              title="Configure Stage"
                            >
                              <Settings className="w-4 h-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => removeStageFromWizardRole(activeRoleWorkflowTab, idx)}
                              className="p-1.5 border-2 border-[#121316] bg-white text-gray-500 hover:text-red-600 transition cursor-pointer"
                              title="Remove stage"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {expandedStageIdx === idx && (
                          <WorkflowStageBuilder 
                            stage={stg} 
                            onChange={(updatedStage) => {
                              const updatedMap = [...(roleWorkflowMap[activeRoleWorkflowTab] || [])];
                              updatedMap[idx] = updatedStage;
                              setRoleWorkflowMap({ ...roleWorkflowMap, [activeRoleWorkflowTab]: updatedMap });
                            }}
                          />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setWizardStep(2)}
                  className="px-5 py-2.5 bg-white border-2 border-[#121316] text-[#0F534A] font-headline font-black text-xs uppercase tracking-wider hover:bg-gray-50 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <button
                  disabled={saving}
                  onClick={handleOnboardNewOrg}
                  className="px-7 py-3 bg-[#0B9C2C] hover:bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0_#121316] transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" /> {saving ? 'Onboarding...' : 'Onboard & Save Organization Workflows'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-VIEW 2: EXISTING ORGANIZATIONS DIRECTORY & EDITOR */}
      {subView === 'existing' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 border-3 border-[#121316] shadow-[4px_4px_0_#0F534A]">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search registered organization name or slug..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchOrganizations()}
                className="w-full pl-9 pr-4 py-2 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-bold text-[#121316] placeholder-gray-400 focus:outline-none focus:border-[#FE4E1A]"
              />
            </div>

            <div className="flex items-center gap-2 bg-[#FCFBF7] px-3 py-2 border-2 border-[#121316]">
              <Filter className="w-4 h-4 text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-[#0F534A] text-xs font-headline font-black focus:outline-none cursor-pointer"
              >
                <option value="">All Lifecycle Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="APPROVED">Approved</option>
                <option value="PENDING_VERIFICATION">Pending Verification</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Org Grid */}
          {loading ? (
            <div className="grid gap-4">
              <LeetCodeCardSkeleton />
              <LeetCodeCardSkeleton />
              <LeetCodeCardSkeleton />
            </div>
          ) : organizations.length === 0 ? (
            <div className="text-center py-16 bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316]">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-headline font-black text-[#0F534A] uppercase">No organizations found</h3>
              <p className="text-xs text-gray-500 mt-1">There are no organization onboardings matching your filter criteria.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {organizations.map((org) => {
                const allowedRolesList = org.allowedRoles || ['ORG_ADMIN', 'PROFESSOR', 'RESEARCHER', 'STUDENT'];

                return (
                  <div
                    key={org.id}
                    className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0_#121316] flex flex-col md:flex-row justify-between md:items-center gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-base font-headline font-black text-[#0F534A] uppercase">{org.name}</span>
                        <span className="px-2.5 py-0.5 bg-[#FE4E1A]/10 text-[#FE4E1A] text-[10px] font-headline font-black border border-[#FE4E1A]/30">
                          {org.orgType}
                        </span>
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-headline font-black border ${
                            org.lifecycleStatus === 'ACTIVE' || org.lifecycleStatus === 'APPROVED'
                              ? 'bg-[#0B9C2C]/10 text-[#0B9C2C] border-[#0B9C2C]/30'
                              : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                          }`}
                        >
                          {org.lifecycleStatus}
                        </span>
                      </div>

                      <div className="text-xs text-gray-600 flex items-center gap-4 flex-wrap font-medium">
                        <span><strong className="font-bold text-[#0F534A]">Slug:</strong> {org.slug}</span>
                        {org.parent && (
                          <span className="flex items-center gap-1">
                            <GitFork className="w-3.5 h-3.5 text-[#FE4E1A]" />
                            <strong className="font-bold text-[#0F534A]">Parent:</strong> {org.parent.name}
                          </span>
                        )}
                        <span><strong className="font-bold text-[#0F534A]">Workflows Configured:</strong> {org.workflowTemplates?.length || 0}</span>
                      </div>

                      {/* Allowed Roles badges */}
                      <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                        <span className="text-[10px] font-headline font-black uppercase text-gray-400 mr-1">Allowed Roles:</span>
                        {allowedRolesList.map((r) => (
                          <span key={r} className="px-2 py-0.5 bg-[#FCFBF7] text-[#121316] text-[10px] font-mono font-bold border border-gray-300">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-wrap">
                      <a
                        href={`/onboarding/${org.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 bg-white text-[#0F534A] font-headline font-black text-xs uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-gray-50 transition flex items-center gap-1.5"
                      >
                        View Portal <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleOpenEditModal(org)}
                        className="px-4 py-2 bg-[#FE4E1A] hover:bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Settings className="w-4 h-4" /> Edit Configuration
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EDIT MODAL FOR EXISTING ORG */}
      {editModalOpen && editingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-4 border-[#121316] shadow-[8px_8px_0_#0F534A] w-full max-w-3xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-gray-200 pb-4">
              <div>
                <h3 className="text-base font-headline font-black text-[#0F534A] uppercase flex items-center gap-2">
                  <Settings className="w-5 h-5 text-[#FE4E1A]" /> Edit Organization &amp; Workflows: {editingOrg.name}
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">Slug: {editingOrg.slug}</p>
              </div>

              <button
                onClick={() => setEditModalOpen(false)}
                className="w-7 h-7 bg-[#121316] text-white font-black text-xs flex items-center justify-center cursor-pointer hover:bg-red-600"
              >
                ✕
              </button>
            </div>

            {/* Core Editable Org Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={editOrgName}
                  onChange={(e) => setEditOrgName(e.target.value)}
                  className="w-full bg-[#FCFBF7] border-2 border-[#121316] p-2.5 text-xs font-bold text-[#121316] focus:outline-none focus:border-[#FE4E1A]"
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1">
                  Organization Type
                </label>
                <select
                  value={editOrgType}
                  onChange={(e) => setEditOrgType(e.target.value)}
                  className="w-full bg-[#FCFBF7] border-2 border-[#121316] p-2.5 text-xs font-headline font-black focus:outline-none cursor-pointer"
                >
                  {ORG_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label} ({t.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <ParentOrgSearchSelect
                  label="Parent Organization Hierarchy"
                  value={editParentId}
                  onChange={setEditParentId}
                  organizations={organizations}
                  excludeOrgId={editingOrg.id}
                  placeholder="Search parent by name, slug, or type..."
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1">
                  Lifecycle Status
                </label>
                <select
                  value={editLifecycleStatus}
                  onChange={(e) => setEditLifecycleStatus(e.target.value)}
                  className="w-full bg-[#FCFBF7] border-2 border-[#121316] p-2.5 text-xs font-headline font-black focus:outline-none cursor-pointer"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                  <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>

            {/* Edit Allowed Roles Section */}
            <div className="space-y-3 pt-2 border-t-2 border-gray-100">
              <h4 className="text-xs font-headline font-black uppercase tracking-wider text-[#0F534A]">
                1. Allowed Roles for this Institution
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_ROLES.map((r) => {
                  const isChecked = editAllowedRoles.includes(r.id);
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => toggleEditOrgRole(r.id)}
                      className={`p-2.5 border-2 text-left font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
                        isChecked
                          ? 'bg-[#FFDD33]/20 border-[#121316] text-[#0F534A]'
                          : 'bg-white border-gray-200 text-gray-400'
                      }`}
                    >
                      <input type="checkbox" checked={isChecked} onChange={() => {}} className="accent-[#FE4E1A]" />
                      <span className="truncate">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Edit Role Workflows Section */}
            <div className="space-y-4 pt-2 border-t-2 border-gray-100">
              <h4 className="text-xs font-headline font-black uppercase tracking-wider text-[#0F534A]">
                2. Role Workflow Pipelines
              </h4>

              {/* Role Tabs */}
              <div className="flex items-center gap-2 border-b-2 border-gray-200 pb-2 overflow-x-auto">
                {editAllowedRoles.map((roleId) => {
                  const roleObj = AVAILABLE_ROLES.find((r) => r.id === roleId);
                  const isSelected = activeEditRoleTab === roleId;
                  const stages = editRoleWorkflowMap[roleId] || [];

                  return (
                    <button
                      key={roleId}
                      type="button"
                      onClick={() => setActiveEditRoleTab(roleId)}
                      className={`px-3 py-1.5 font-headline font-black text-xs uppercase tracking-wider whitespace-nowrap transition border-2 cursor-pointer ${
                        isSelected
                          ? 'bg-[#0F534A] text-white border-[#121316]'
                          : 'bg-white text-[#0F534A] border-gray-300'
                      }`}
                    >
                      {roleObj?.label || roleId} ({stages.length} Stages)
                    </button>
                  );
                })}
              </div>

              {/* Stage Canvas */}
              {activeEditRoleTab && (
                <div className="bg-[#FCFBF7] border-2 border-[#121316] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-headline font-black text-xs uppercase tracking-wider text-[#0F534A]">
                      Stages for {activeEditRoleTab}
                    </h5>
                    <button
                      type="button"
                      onClick={() => {
                        const current = editRoleWorkflowMap[activeEditRoleTab] || [];
                        const newStage = {
                          name: `Stage ${current.length + 1}`,
                          description: '',
                          stageType: 'FORM',
                          executionOrder: current.length + 1,
                          config: { fields: [] },
                        };
                        setEditRoleWorkflowMap({
                          ...editRoleWorkflowMap,
                          [activeEditRoleTab]: [...current, newStage],
                        });
                        setExpandedEditStageIdx(current.length);
                      }}
                      className="px-3 py-1 bg-[#0F534A] hover:bg-[#FE4E1A] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] cursor-pointer shadow-[2px_2px_0_#121316] transition-all"
                    >
                      + Add Stage
                    </button>
                  </div>

                  <div className="space-y-2">
                    {(editRoleWorkflowMap[activeEditRoleTab] || []).length === 0 ? (
                      <div className="p-6 text-center bg-white border-2 border-dashed border-[#121316] space-y-2.5 shadow-[2px_2px_0_#121316]">
                        <div className="w-8 h-8 bg-[#FFDD33] text-[#121316] font-headline font-black text-sm flex items-center justify-center border-2 border-[#121316] mx-auto">
                          +
                        </div>
                        <h6 className="text-xs font-headline font-black uppercase text-[#0F534A]">
                          No stages added for {activeEditRoleTab} yet
                        </h6>
                        <p className="text-[11px] text-gray-500 max-w-sm mx-auto font-medium">
                          Click "+ Add Stage" to configure verification steps for applicants in this role.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            const newStage = {
                              name: `Stage 1`,
                              description: '',
                              stageType: 'FORM',
                              executionOrder: 1,
                              config: { fields: [] },
                            };
                            setEditRoleWorkflowMap({
                              ...editRoleWorkflowMap,
                              [activeEditRoleTab]: [newStage],
                            });
                            setExpandedEditStageIdx(0);
                          }}
                          className="px-3.5 py-1.5 bg-[#FE4E1A] hover:bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add First Stage
                        </button>
                      </div>
                    ) : (
                      (editRoleWorkflowMap[activeEditRoleTab] || []).map((stg, idx) => (
                        <div key={stg._uid || stg.id || `edit_stg_${idx}`} className="bg-white border-2 border-[#121316] p-3 flex flex-col gap-3 shadow-[1px_1px_0_#121316]">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="w-6 h-6 bg-[#FE4E1A] text-white font-headline font-black text-xs flex items-center justify-center border border-[#121316]">
                                {idx + 1}
                              </span>
                              <input
                                type="text"
                                value={stg.name}
                                placeholder={`Stage ${idx + 1} Name`}
                                onChange={(e) => {
                                  const updated = [...(editRoleWorkflowMap[activeEditRoleTab] || [])];
                                  updated[idx].name = e.target.value;
                                  setEditRoleWorkflowMap({ ...editRoleWorkflowMap, [activeEditRoleTab]: updated });
                                }}
                                className="font-headline font-black text-xs uppercase text-[#0F534A] border-b border-dashed border-gray-300 focus:outline-none flex-1"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <select
                                value={stg.stageType}
                                onChange={(e) => {
                                  const newType = e.target.value;
                                  const updated = [...(editRoleWorkflowMap[activeEditRoleTab] || [])];
                                  updated[idx].stageType = newType;
                                  if (newType === 'APAAR_VERIFICATION' && (!updated[idx].name || updated[idx].name.startsWith('Stage '))) {
                                    updated[idx].name = 'Student APAAR ID Verification';
                                    updated[idx].description = 'Real-time automated verification of 12-digit student One Nation One Student ID with Government API Setu & DigiLocker.';
                                  } else if (newType === 'ORCID_VERIFICATION' && (!updated[idx].name || updated[idx].name.startsWith('Stage '))) {
                                    updated[idx].name = 'ORCID Academic Identity Verification';
                                    updated[idx].description = 'Real-time identity verification of researcher ORCID record and publications against the official public ORCID Registry.';
                                  }
                                  setEditRoleWorkflowMap({ ...editRoleWorkflowMap, [activeEditRoleTab]: updated });
                                }}
                                className="bg-[#FCFBF7] border border-[#121316] text-[10px] font-mono font-bold p-1 cursor-pointer"
                              >
                                <option value="FORM">FORM</option>
                                <option value="APAAR_VERIFICATION">APAAR_VERIFICATION (Govt DigiLocker)</option>
                                <option value="ORCID_VERIFICATION">ORCID_VERIFICATION (Researcher Registry)</option>
                                <option value="DOCUMENT_UPLOAD">DOCUMENT_UPLOAD</option>
                                <option value="EMAIL_VERIFICATION">EMAIL_VERIFICATION</option>
                                <option value="MANUAL_REVIEW">MANUAL_REVIEW</option>
                                <option value="COMPLIANCE_REVIEW">COMPLIANCE_REVIEW</option>
                                <option value="APPROVAL">APPROVAL</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => setExpandedEditStageIdx(expandedEditStageIdx === idx ? null : idx)}
                                className={`p-1 border border-[#121316] transition cursor-pointer ${expandedEditStageIdx === idx ? 'bg-[#FFDD33] text-[#121316]' : 'bg-white text-gray-500'}`}
                                title="Configure Stage"
                              >
                                <Settings className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...(editRoleWorkflowMap[activeEditRoleTab] || [])];
                                  updated.splice(idx, 1);
                                  setEditRoleWorkflowMap({ ...editRoleWorkflowMap, [activeEditRoleTab]: updated });
                                  if (expandedEditStageIdx === idx) setExpandedEditStageIdx(null);
                                }}
                                className="p-1 border border-[#121316] bg-white text-gray-500 hover:text-red-600 transition cursor-pointer"
                                title="Remove stage"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {expandedEditStageIdx === idx && (
                            <WorkflowStageBuilder 
                              stage={stg} 
                              onChange={(updatedStage) => {
                                const updatedMap = [...(editRoleWorkflowMap[activeEditRoleTab] || [])];
                                updatedMap[idx] = updatedStage;
                                setEditRoleWorkflowMap({ ...editRoleWorkflowMap, [activeEditRoleTab]: updatedMap });
                              }}
                            />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t-2 border-gray-200">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2.5 bg-white border-2 border-[#121316] text-[#0F534A] font-headline font-black text-xs uppercase cursor-pointer hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                type="button"
                onClick={handleSaveEditOrgConfig}
                className="px-6 py-2.5 bg-[#FE4E1A] hover:bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Onboard External Organisation Modal */}
      <OnboardExternalOrgModal
        isOpen={externalOrgModalOpen}
        onClose={() => setExternalOrgModalOpen(false)}
        onSuccess={() => fetchOrganizations()}
      />
    </div>
  );
};

export default DxOrgManagementConsole;
