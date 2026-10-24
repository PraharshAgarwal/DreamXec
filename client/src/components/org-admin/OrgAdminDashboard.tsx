import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import UnifiedDashboardLayout from '../layout/UnifiedDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import {
  getDashboardStats,
  getAllProjects,
  getAllUsers,
  getOrgTree,
} from '../../services/adminService';
import OrgOverviewTab from './tabs/OrgOverviewTab';
import OrgCampaignsTab from './tabs/OrgCampaignsTab';
import OrgMembersTab from './tabs/OrgMembersTab';
import OrgChildOrgsTab from './tabs/OrgChildOrgsTab';
import OrgLedgerTab from './tabs/OrgLedgerTab';
import OrgSettingsTab from './tabs/OrgSettingsTab';

export const OrgAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabParam = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  const [loading, setLoading] = useState(true);
  const [organization, setOrganization] = useState<any>(null);
  const [childOrgs, setChildOrgs] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalCampaigns: 0,
    liveCampaigns: 0,
    pendingMilestones: 0,
    totalAmountRaised: 0,
    totalTargetGoal: 0,
    totalDonations: 0,
  });
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Selected child org filter state (can be 'ALL' or a specific child org ID)
  const [selectedChildOrg, setSelectedChildOrg] = useState<string>('ALL');

  const activeOrgId = (user?.activeProfile as any)?.organizationId || (user as any)?.organizationId;
  const activeOrgName = (user?.activeProfile as any)?.orgName || user?.name || 'Institutional';

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [treeRes, statsRes, projectsRes, usersRes] = await Promise.all([
        getOrgTree(activeOrgId).catch(() => ({ data: { organization: null, childOrgs: [] } })),
        getDashboardStats(activeOrgId).catch(() => ({ data: {} })),
        getAllProjects({ tenantId: activeOrgId, limit: 100 }).catch(() => ({
          data: { userProjects: { data: [] } },
        })),
        getAllUsers({ tenantId: activeOrgId, limit: 100 }).catch(() => ({ data: { users: [] } })),
      ]);

      const orgData = treeRes.data?.organization || null;
      const children = treeRes.data?.childOrgs || [];
      const statsData: any = (statsRes.data as any)?.stats || statsRes.data || {};

      const rawProjectsData: any = projectsRes.data || {};
      const projectsList: any[] =
        rawProjectsData?.userProjects?.data ||
        rawProjectsData?.userProjects ||
        rawProjectsData?.projects ||
        rawProjectsData?.campaigns ||
        (Array.isArray(rawProjectsData) ? rawProjectsData : []);

      const usersList: any[] = (usersRes.data as any)?.users || (usersRes as any)?.users || [];

      setOrganization(orgData);
      setChildOrgs(children);
      setCampaigns(projectsList);
      setMembers(usersList);

      const calculatedLiveCampaigns = projectsList.filter(
        (c: any) => c.status === 'LIVE' || c.status === 'APPROVED'
      ).length;
      const calculatedTotalRaised = projectsList.reduce(
        (acc: number, curr: any) => acc + Number(curr.amountRaised || curr.currentAmount || curr.currentRaisedAmount || 0),
        0
      );
      const calculatedTotalGoal = projectsList.reduce(
        (acc: number, curr: any) => acc + Number(curr.targetAmount || curr.goalAmount || 0),
        0
      );

      setStats({
        totalUsers: statsData.totalUsers || usersList.length || 0,
        totalCampaigns: statsData.totalCampaigns || projectsList.length || 0,
        liveCampaigns: calculatedLiveCampaigns || statsData.liveCampaigns || 0,
        pendingMilestones: statsData.pendingMilestones || 0,
        totalAmountRaised: statsData.totalAmountRaised || calculatedTotalRaised || 0,
        totalTargetGoal: statsData.totalTargetGoal || calculatedTotalGoal || 0,
        totalDonations: statsData.totalDonations || 0,
      });
    } catch (err) {
      console.error('Failed to load org admin dashboard data:', err);
      toast.error('Failed to load institutional dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [activeOrgId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  useEffect(() => {
    const currentTab = searchParams.get('tab') || 'overview';
    setActiveTab(currentTab);
  }, [searchParams]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  const handleFilterByChildOrg = (orgId: string, targetTab: 'campaigns' | 'members') => {
    setSelectedChildOrg(orgId);
    handleTabChange(targetTab);
  };

  const orgDisplayName = organization?.name || activeOrgName;

  const headerActions = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => navigate('/campaigns')}
        className="bg-white hover:bg-[#FFDD33] text-[#121316] px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
      >
        ← Marketplace
      </button>

      <button
        onClick={fetchDashboardData}
        disabled={loading}
        className="bg-[#0F534A] hover:bg-[#0b3d36] text-white px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] transition-all cursor-pointer disabled:opacity-50"
      >
        {loading ? 'Refreshing...' : '🔄 Refresh Data'}
      </button>
    </div>
  );

  return (
    <UnifiedDashboardLayout
      title={`${orgDisplayName} • Institutional Governance Hub | DreamXec`}
      headerTitle={`${orgDisplayName} • Admin Governance Hub`}
      headerSubtitle="Hierarchical oversight across academic departments, student clubs, research labs, and funding campaigns"
      headerActions={headerActions}
    >
      <div className="p-4 sm:p-6 space-y-6">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <OrgOverviewTab
            organization={organization}
            childOrgs={childOrgs}
            stats={stats}
            recentCampaigns={campaigns}
            recentMembers={members}
            onNavigateTab={handleTabChange}
            onInspectCampaign={(c) => {
              handleTabChange('campaigns');
            }}
            loading={loading}
          />
        )}

        {/* TAB 2: CAMPAIGN PORTFOLIO */}
        {activeTab === 'campaigns' && (
          <OrgCampaignsTab
            campaigns={campaigns}
            childOrgs={childOrgs}
            parentOrgName={orgDisplayName}
            loading={loading}
            selectedChildOrg={selectedChildOrg}
            onSelectChildOrg={setSelectedChildOrg}
            onRefresh={fetchDashboardData}
          />
        )}

        {/* TAB 3: MEMBER DIRECTORY */}
        {activeTab === 'members' && (
          <OrgMembersTab
            members={members}
            childOrgs={childOrgs}
            parentOrg={organization}
            loading={loading}
            selectedChildOrg={selectedChildOrg}
            onSelectChildOrg={setSelectedChildOrg}
            onRefresh={fetchDashboardData}
          />
        )}

        {/* TAB 4: CHILD ORGS & CLUBS */}
        {activeTab === 'child-orgs' && (
          <OrgChildOrgsTab
            childOrgs={childOrgs}
            parentOrg={organization}
            onFilterByChildOrg={handleFilterByChildOrg}
            onRefresh={fetchDashboardData}
            loading={loading}
          />
        )}

        {/* TAB 5: FINANCIAL LEDGER */}
        {activeTab === 'ledger' && (
          <OrgLedgerTab
            organization={organization}
            stats={stats}
          />
        )}

        {/* TAB 6: ORG SETTINGS */}
        {activeTab === 'settings' && (
          <OrgSettingsTab
            organization={organization}
            childOrgs={childOrgs}
            onRefresh={fetchDashboardData}
          />
        )}
      </div>
    </UnifiedDashboardLayout>
  );
};

export default OrgAdminDashboard;
