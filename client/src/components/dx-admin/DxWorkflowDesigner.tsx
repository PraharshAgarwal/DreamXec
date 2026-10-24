import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Workflow,
  Plus,
  Trash2,
  Layers,
  FolderPlus,
} from 'lucide-react';
import apiRequest, { getToken } from '../../services/api';

interface Stage {
  id?: string;
  name: string;
  description?: string;
  stageType: string;
  executionOrder: number;
  config?: any;
}

interface WorkflowTemplate {
  id: string;
  tenantId: string;
  name: string;
  slug: string;
  description?: string;
  version: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  organization?: { id: string; name: string; slug: string };
  stages?: Stage[];
  _count?: { instances: number };
}

export const DxWorkflowDesigner: React.FC = () => {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);

  // New Template Modal State
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [newTemplateSlug, setNewTemplateSlug] = useState<string>('');
  const [newTemplateTenantId, setNewTemplateTenantId] = useState<string>('');
  const [newTemplateDescription, setNewTemplateDescription] = useState<string>('');
  const [orgOptions, setOrgOptions] = useState<Array<{ id: string; name: string }>>([]);

  // Stage Modal State
  const [stageModalOpen, setStageModalOpen] = useState<boolean>(false);
  const [stageName, setStageName] = useState<string>('');
  const [stageDescription, setStageDescription] = useState<string>('');
  const [stageType, setStageType] = useState<string>('FORM');

  const [saving, setSaving] = useState<boolean>(false);

  const fetchTemplates = async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<any>('/dx-admin/workflows/templates');
      const list = res.data?.templates || [];
      setTemplates(list);
      if (list.length > 0 && !selectedTemplate) {
        setSelectedTemplate(list[0]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  const fetchOrgs = async () => {
    if (!getToken()) return;
    try {
      const res = await apiRequest<any>('/dx-admin/onboarding/orgs');
      if (res.data?.organizations) {
        setOrgOptions(res.data.organizations);
        if (res.data.organizations.length > 0) {
          setNewTemplateTenantId(res.data.organizations[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };


  useEffect(() => {
    fetchTemplates();
    fetchOrgs();
  }, []);

  const handleCreateTemplate = async () => {
    if (!newTemplateName || !newTemplateSlug || !newTemplateTenantId) {
      toast.error('Template Name, Slug, and Organization are required');
      return;
    }

    setSaving(true);
    try {
      await apiRequest('/dx-admin/workflows/templates', {
        method: 'POST',
        body: JSON.stringify({
          tenantId: newTemplateTenantId,
          name: newTemplateName,
          slug: newTemplateSlug,
          description: newTemplateDescription,
          status: 'PUBLISHED',
        }),
      });

      toast.success('Workflow template created successfully');
      setCreateModalOpen(false);
      setNewTemplateName('');
      setNewTemplateSlug('');
      setNewTemplateDescription('');
      fetchTemplates();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error creating template');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStage = async () => {
    if (!selectedTemplate || !stageName || !stageType) {
      toast.error('Stage Name and Stage Type are required');
      return;
    }

    setSaving(true);
    try {
      await apiRequest(`/dx-admin/workflows/templates/${selectedTemplate.id}/stages`, {
        method: 'POST',
        body: JSON.stringify({
          name: stageName,
          description: stageDescription,
          stageType,
          executionOrder: (selectedTemplate.stages?.length || 0) + 1,
        }),
      });

      toast.success('Stage added to workflow template');
      setStageModalOpen(false);
      setStageName('');
      setStageDescription('');

      fetchTemplates();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error adding stage');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    if (!confirm('Are you sure you want to delete this stage?')) return;

    try {
      await apiRequest(`/dx-admin/workflows/stages/${stageId}`, {
        method: 'DELETE',
      });

      toast.success('Stage deleted');
      fetchTemplates();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error deleting stage');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-dreamxec-navy shadow-md">
        <div>
          <h2 className="text-xl font-black text-dreamxec-navy flex items-center gap-2 font-display">
            <Workflow className="w-6 h-6 text-[#0B9C2C]" />
            Dynamic Workflow Designer & Stage Builder
          </h2>
          <p className="text-sm text-dreamxec-navy/80 mt-1 font-medium">
            Construct multi-stage governance pipelines, form requirements, document verification steps, and automated checks.
          </p>
        </div>

        <button
          onClick={() => setCreateModalOpen(true)}
          className="px-4 py-2.5 bg-[#0B9C2C] hover:bg-[#0B9C2C]/90 text-white font-bold text-sm rounded-xl border-2 border-dreamxec-navy transition flex items-center gap-2 shadow-sm self-start md:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Workflow Template
        </button>
      </div>

      {/* Main Workspace Layout */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-dreamxec-orange"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel: Template List */}
          <div className="bg-white border-2 border-dreamxec-navy rounded-2xl p-5 space-y-4 shadow-md">
            <h3 className="text-xs font-black uppercase tracking-wider text-dreamxec-navy/70 flex items-center gap-2 font-display">
              <Layers className="w-4 h-4 text-[#0B9C2C]" /> Available Templates ({templates.length})
            </h3>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {templates.map((tmpl) => {
                const isSelected = selectedTemplate?.id === tmpl.id;
                return (
                  <div
                    key={tmpl.id}
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`p-4 rounded-xl border-2 transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#fdf8f0] border-dreamxec-navy text-dreamxec-navy shadow-sm'
                        : 'bg-white border-dreamxec-navy/30 text-dreamxec-navy hover:border-dreamxec-navy'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm line-clamp-1">{tmpl.name}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          tmpl.status === 'PUBLISHED'
                            ? 'bg-[#0B9C2C]/10 text-[#0B9C2C] border border-[#0B9C2C]/30'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                        }`}
                      >
                        {tmpl.status}
                      </span>
                    </div>
                    <div className="text-xs text-dreamxec-navy/70 mt-1 flex items-center gap-3 font-medium">
                      <span>Org: {tmpl.organization?.name || 'Global'}</span>
                      <span>Stages: {tmpl.stages?.length || 0}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Selected Template Stage Canvas */}
          <div className="lg:col-span-2 bg-white border-2 border-dreamxec-navy rounded-2xl p-6 space-y-6 shadow-md">
            {selectedTemplate ? (
              <>
                <div className="flex items-center justify-between pb-4 border-b-2 border-dreamxec-navy/10">
                  <div>
                    <h3 className="text-lg font-black text-dreamxec-navy font-display">{selectedTemplate.name}</h3>
                    <p className="text-xs text-dreamxec-navy/70 font-mono mt-0.5">
                      Slug: {selectedTemplate.slug} | Version: v{selectedTemplate.version} | Tenant:{' '}
                      {selectedTemplate.organization?.name}
                    </p>
                  </div>

                  <button
                    onClick={() => setStageModalOpen(true)}
                    className="px-3.5 py-2 bg-[#fdf8f0] hover:bg-dreamxec-navy/5 text-dreamxec-navy font-bold text-xs rounded-xl border-2 border-dreamxec-navy transition flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Stage
                  </button>
                </div>

                {/* Stage Pipeline Visualization */}
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-dreamxec-navy/70">
                    Stage Pipeline Builder
                  </h4>

                  {!selectedTemplate.stages || selectedTemplate.stages.length === 0 ? (
                    <div className="text-center py-12 bg-[#fdf8f0] rounded-xl border-2 border-dreamxec-navy/20">
                      <FolderPlus className="w-8 h-8 text-dreamxec-navy/40 mx-auto mb-2" />
                      <p className="text-sm font-medium text-dreamxec-navy/70">No stages defined in this workflow yet.</p>
                      <button
                        onClick={() => setStageModalOpen(true)}
                        className="mt-3 px-3.5 py-1.5 bg-[#0B9C2C] text-white text-xs font-bold rounded-lg border-2 border-dreamxec-navy"
                      >
                        + Add First Stage
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTemplate.stages.map((stg, idx) => (
                        <div
                          key={stg.id || idx}
                          className="bg-[#fdf8f0] border-2 border-dreamxec-navy/30 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-dreamxec-navy transition shadow-xs"
                        >
                          <div className="flex items-center gap-4">
                            <span className="w-8 h-8 rounded-full bg-dreamxec-orange text-white font-black text-xs flex items-center justify-center border-2 border-dreamxec-navy">
                              {stg.executionOrder}
                            </span>

                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="text-sm font-bold text-dreamxec-navy">{stg.name}</h5>
                                <span className={`px-2 py-0.5 text-[10px] rounded-md font-mono font-bold border ${
                                  stg.stageType === 'APAAR_VERIFICATION'
                                    ? 'bg-[#0F534A]/10 text-[#0F534A] border-[#0F534A]/40'
                                    : stg.stageType === 'ORCID_VERIFICATION'
                                    ? 'bg-[#18D7E8]/20 text-[#041A16] border-[#041A16]/40'
                                    : stg.stageType === 'EMAIL_VERIFICATION'
                                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                                    : 'bg-white border-dreamxec-navy/30 text-dreamxec-navy'
                                }`}>
                                  {stg.stageType}
                                </span>
                              </div>
                              {stg.description && (
                                <p className="text-xs text-dreamxec-navy/70 mt-0.5 font-medium">{stg.description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {stg.id && (
                              <button
                                onClick={() => handleDeleteStage(stg.id!)}
                                className="p-2 text-dreamxec-navy/50 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Stage"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-20 text-dreamxec-navy/50 text-sm font-medium">
                Select a workflow template from the list to manage stage details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Template */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border-3 border-dreamxec-navy rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-dreamxec-navy flex items-center gap-2 font-display">
              <Workflow className="w-5 h-5 text-[#0B9C2C]" /> Create New Workflow Template
            </h3>

            <div>
              <label className="block text-sm font-bold text-dreamxec-navy mb-1">Target Organization</label>
              <select
                value={newTemplateTenantId}
                onChange={(e) => setNewTemplateTenantId(e.target.value)}
                className="w-full bg-[#fdf8f0] border-2 border-dreamxec-navy rounded-xl p-3 text-dreamxec-navy text-sm font-bold"
              >
                {orgOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-dreamxec-navy mb-1">Template Name</label>
              <input
                type="text"
                placeholder="e.g. Student Leadership Authorization Workflow"
                value={newTemplateName}
                onChange={(e) => {
                  setNewTemplateName(e.target.value);
                  setNewTemplateSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                }}
                className="w-full bg-[#fdf8f0] border-2 border-dreamxec-navy rounded-xl p-3 text-dreamxec-navy text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-dreamxec-navy mb-1">Template Slug</label>
              <input
                type="text"
                value={newTemplateSlug}
                onChange={(e) => setNewTemplateSlug(e.target.value)}
                className="w-full bg-[#fdf8f0] border-2 border-dreamxec-navy rounded-xl p-3 text-dreamxec-navy text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-dreamxec-navy mb-1">Description</label>
              <textarea
                rows={2}
                value={newTemplateDescription}
                onChange={(e) => setNewTemplateDescription(e.target.value)}
                className="w-full bg-[#fdf8f0] border-2 border-dreamxec-navy rounded-xl p-3 text-dreamxec-navy text-sm font-medium"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 bg-white border-2 border-dreamxec-navy text-dreamxec-navy font-bold text-sm rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={handleCreateTemplate}
                className="px-5 py-2 bg-[#0B9C2C] hover:bg-[#0B9C2C]/90 text-white font-bold text-sm rounded-xl border-2 border-dreamxec-navy transition shadow-sm"
              >
                {saving ? 'Creating...' : 'Create Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Stage */}
      {stageModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border-3 border-dreamxec-navy rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-black text-dreamxec-navy flex items-center gap-2 font-display">
              <Plus className="w-5 h-5 text-[#0B9C2C]" /> Add Stage to {selectedTemplate.name}
            </h3>

            <div>
              <label className="block text-sm font-bold text-dreamxec-navy mb-1">Stage Name</label>
              <input
                type="text"
                placeholder="e.g. Executive Sign-off"
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                className="w-full bg-[#fdf8f0] border-2 border-dreamxec-navy rounded-xl p-3 text-dreamxec-navy text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-dreamxec-navy mb-1">Stage Type</label>
              <select
                value={stageType}
                onChange={(e) => {
                  const val = e.target.value;
                  setStageType(val);
                  if (val === 'APAAR_VERIFICATION' && (!stageName || stageName.includes('Stage'))) {
                    setStageName('Student APAAR ID Verification');
                    setStageDescription('Real-time automated verification of 12-digit student One Nation One Student ID with Government API Setu & DigiLocker.');
                  } else if (val === 'ORCID_VERIFICATION' && (!stageName || stageName.includes('Stage'))) {
                    setStageName('ORCID Academic Identity Verification');
                    setStageDescription('Real-time identity verification of researcher ORCID record and publications against the official public ORCID Registry.');
                  } else if (val === 'EMAIL_VERIFICATION' && (!stageName || stageName.includes('Stage'))) {
                    setStageName('Official Institutional Email Verification');
                    setStageDescription('Verify official university/institutional email address via one-time password (OTP).');
                  }
                }}
                className="w-full bg-[#fdf8f0] border-2 border-dreamxec-navy rounded-xl p-3 text-dreamxec-navy text-sm font-mono font-bold"
              >
                <option value="FORM">FORM (Dynamic Field Inputs)</option>
                <option value="APAAR_VERIFICATION">APAAR_VERIFICATION (Govt DigiLocker / API Setu)</option>
                <option value="ORCID_VERIFICATION">ORCID_VERIFICATION (Researcher Registry / OAuth)</option>
                <option value="DOCUMENT_UPLOAD">DOCUMENT_UPLOAD (File Collection)</option>
                <option value="EMAIL_VERIFICATION">EMAIL_VERIFICATION (Official Domain OTP)</option>
                <option value="MANUAL_REVIEW">MANUAL_REVIEW (Admin Approval Step)</option>
                <option value="COMPLIANCE_REVIEW">COMPLIANCE_REVIEW (Legal Audit)</option>
                <option value="APPROVAL">APPROVAL (Final Sign-off)</option>
                <option value="COMPLETE">COMPLETE (Instant Role Activation)</option>
              </select>
            </div>

            {stageType === 'APAAR_VERIFICATION' && (
              <div className="p-3 bg-[#0F534A]/10 border-2 border-[#0F534A] rounded-xl text-xs space-y-1">
                <p className="font-bold text-[#0F534A]">🇮🇳 Real-Time APAAR / DigiLocker Verification</p>
                <p className="text-[#121316]/70">
                  During onboarding, applicants will verify their 12-digit One Nation One Student ID against official Government API Setu and DigiLocker ABC registries.
                </p>
              </div>
            )}

            {stageType === 'ORCID_VERIFICATION' && (
              <div className="p-3 bg-[#18D7E8]/15 border-2 border-[#041A16] rounded-xl text-xs space-y-1">
                <p className="font-bold text-[#041A16]">🔬 Real-Time ORCID Registry Verification</p>
                <p className="text-[#121316]/70">
                  During onboarding, researchers will verify their official ORCID iD against the public ORCID Registry, validating author identities and research keywords.
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-dreamxec-navy mb-1">Description</label>
              <textarea
                rows={2}
                value={stageDescription}
                onChange={(e) => setStageDescription(e.target.value)}
                className="w-full bg-[#fdf8f0] border-2 border-dreamxec-navy rounded-xl p-3 text-dreamxec-navy text-sm font-medium"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setStageModalOpen(false)}
                className="px-4 py-2 bg-white border-2 border-dreamxec-navy text-dreamxec-navy font-bold text-sm rounded-xl"
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={handleAddStage}
                className="px-5 py-2 bg-[#0B9C2C] hover:bg-[#0B9C2C]/90 text-white font-bold text-sm rounded-xl border-2 border-dreamxec-navy transition shadow-sm"
              >
                {saving ? 'Adding...' : 'Add Stage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DxWorkflowDesigner;
