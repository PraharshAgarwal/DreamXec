import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  Search,
  Filter,
  Shield,
  ExternalLink,
  ChevronRight,
  Plus,
} from 'lucide-react';
import apiRequest, { getToken } from '../../services/api';
import { OnboardExternalOrgModal } from '../admin/OnboardExternalOrgModal';

interface OrganizationItem {
  id: string;
  name: string;
  slug: string;
  orgType: string;
  lifecycleStatus: string;
  createdAt: string;
  parent?: { id: string; name: string; slug: string };
  memberships?: Array<{
    user: { id: string; fullName: string; email: string };
  }>;
}

export const DxOrgOnboardingConsole: React.FC = () => {
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [selectedOrg, setSelectedOrg] = useState<OrganizationItem | null>(null);
  const [newStatus, setNewStatus] = useState<string>('ACTIVE');
  const [remarks, setRemarks] = useState<string>('');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [updating, setUpdating] = useState<boolean>(false);
  const [externalOrgModalOpen, setExternalOrgModalOpen] = useState<boolean>(false);

  const fetchOrganizations = async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await apiRequest<any>('/dx-admin/onboarding/orgs', {
        params: {
          ...(statusFilter ? { status: statusFilter } : {}),
          ...(search ? { search } : {}),
        },
      });
      setOrganizations(res.data?.organizations || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchOrganizations();
  }, [statusFilter]);

  const handleOpenStatusModal = (org: OrganizationItem) => {
    setSelectedOrg(org);
    setNewStatus(org.lifecycleStatus || 'ACTIVE');
    setRemarks('');
    setModalOpen(true);
  };

  const handleStatusUpdate = async () => {
    if (!selectedOrg) return;

    setUpdating(true);
    try {
      await apiRequest(`/dx-admin/onboarding/orgs/${selectedOrg.id}/status`, {
        method: 'POST',
        body: JSON.stringify({
          status: newStatus,
          remarks,
        }),
      });

      toast.success(`Organization updated to ${newStatus}`);
      setModalOpen(false);
      setSelectedOrg(null);
      fetchOrganizations();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Status update failed');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border-2 border-dreamxec-navy shadow-md">
        <div>
          <h2 className="text-xl font-black text-dreamxec-navy flex items-center gap-2 font-display">
            <Building2 className="w-6 h-6 text-dreamxec-orange" />
            Organization Onboarding Console
          </h2>
          <p className="text-sm text-dreamxec-navy/80 mt-1 font-medium">
            Review institution registrations, verify administrative credentials, and update governance lifecycle status.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-dreamxec-navy/50 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search org name or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrganizations()}
              className="pl-9 pr-4 py-2 bg-[#fdf8f0] border-2 border-dreamxec-navy rounded-xl text-dreamxec-navy placeholder-dreamxec-navy/50 text-sm focus:outline-none focus:border-dreamxec-orange font-medium"
            />
          </div>

          <div className="flex items-center gap-2 bg-[#fdf8f0] px-3 py-2 border-2 border-dreamxec-navy rounded-xl">
            <Filter className="w-4 h-4 text-dreamxec-navy/70" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-dreamxec-navy text-sm font-bold focus:outline-none cursor-pointer"
            >
              <option value="">All Lifecycle Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setExternalOrgModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_#121316] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#FFDD33]" />
            <span>Onboard External Org</span>
          </button>
        </div>
      </div>

      {/* Organizations Table / Grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-4 border-dreamxec-orange"></div>
        </div>
      ) : organizations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dreamxec-navy/30 shadow-sm">
          <Building2 className="w-12 h-12 text-dreamxec-navy/40 mx-auto mb-3" />
          <h3 className="text-lg font-black text-dreamxec-navy font-display">No organizations found</h3>
          <p className="text-dreamxec-navy/60 text-sm mt-1">There are no organization onboardings matching your filter criteria.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {organizations.map((org) => {
            const adminUser = org.memberships && org.memberships.length > 0 ? org.memberships[0].user : null;

            return (
              <div
                key={org.id}
                className="bg-white border-2 border-dreamxec-navy rounded-2xl p-5 shadow-md hover:shadow-lg transition flex flex-col md:flex-row justify-between md:items-center gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-lg font-black text-dreamxec-navy font-display">
                      {org.name}
                    </span>
                    <span className="px-2.5 py-0.5 bg-dreamxec-orange/10 text-dreamxec-orange text-xs font-black rounded-full border border-dreamxec-orange/30 font-mono">
                      {org.orgType}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-xs rounded-full font-bold ${
                        org.lifecycleStatus === 'ACTIVE' || org.lifecycleStatus === 'APPROVED'
                          ? 'bg-[#0B9C2C]/10 text-[#0B9C2C] border border-[#0B9C2C]/30'
                          : org.lifecycleStatus === 'REJECTED' || org.lifecycleStatus === 'SUSPENDED'
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                      }`}
                    >
                      {org.lifecycleStatus}
                    </span>
                  </div>

                  <div className="text-sm text-dreamxec-navy/80 flex items-center gap-4 flex-wrap font-medium">
                    <span>
                      <strong className="font-bold text-dreamxec-navy">Slug:</strong> {org.slug}
                    </span>
                    {org.parent && (
                      <span>
                        <strong className="font-bold text-dreamxec-navy">Parent Org:</strong> {org.parent.name}
                      </span>
                    )}
                    {adminUser && (
                      <span>
                        <strong className="font-bold text-dreamxec-navy">Primary Admin:</strong> {adminUser.fullName} ({adminUser.email})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`/onboarding/${org.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3.5 py-2 bg-[#fdf8f0] hover:bg-dreamxec-navy/5 text-dreamxec-navy font-bold text-sm rounded-xl border-2 border-dreamxec-navy transition flex items-center gap-1.5"
                  >
                    View Portal <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleOpenStatusModal(org)}
                    className="px-4 py-2 bg-dreamxec-orange hover:bg-dreamxec-navy text-white font-bold text-sm rounded-xl border-2 border-dreamxec-navy transition flex items-center gap-1.5 shadow-sm"
                  >
                    Manage Status <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Status Update Modal */}
      {modalOpen && selectedOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white border-3 border-dreamxec-navy rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <h3 className="text-lg font-black text-dreamxec-navy flex items-center gap-2 font-display">
              <Shield className="w-5 h-5 text-dreamxec-orange" />
              Update Lifecycle Status for {selectedOrg.name}
            </h3>

            <div>
              <label className="block text-sm font-bold text-dreamxec-navy mb-1.5">Lifecycle Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full bg-[#fdf8f0] border-2 border-dreamxec-navy rounded-xl p-3 text-dreamxec-navy text-sm font-bold focus:outline-none focus:border-dreamxec-orange"
              >
                <option value="DRAFT">DRAFT</option>
                <option value="SUBMITTED">SUBMITTED</option>
                <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                <option value="APPROVED">APPROVED</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-dreamxec-navy mb-1.5">Governance Remarks</label>
              <textarea
                rows={3}
                placeholder="Notes or status transition reason..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full bg-[#fdf8f0] border-2 border-dreamxec-navy rounded-xl p-3 text-dreamxec-navy text-sm placeholder-dreamxec-navy/50 focus:outline-none focus:border-dreamxec-orange font-medium"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                disabled={updating}
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 bg-white border-2 border-dreamxec-navy text-dreamxec-navy font-bold text-sm rounded-xl hover:bg-dreamxec-navy/5 transition"
              >
                Cancel
              </button>
              <button
                disabled={updating}
                onClick={handleStatusUpdate}
                className="px-5 py-2 bg-dreamxec-orange hover:bg-dreamxec-navy text-white font-bold text-sm rounded-xl border-2 border-dreamxec-navy transition shadow-sm flex items-center gap-2"
              >
                {updating ? 'Updating...' : 'Save Lifecycle Status'}
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

export default DxOrgOnboardingConsole;
