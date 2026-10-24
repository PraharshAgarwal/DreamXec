import React from 'react';
import { useLocation } from 'react-router-dom';
import DxPlatformOverview from './DxPlatformOverview';
import DxVerificationQueue from './DxVerificationQueue';
import DxOrgManagementConsole from './DxOrgManagementConsole';
import DxCampaignApprovals from './DxCampaignApprovals';
import DxGlobalLedger from './DxGlobalLedger';
import DxAuditLogs from './DxAuditLogs';
import UnifiedDashboardLayout from '../layout/UnifiedDashboardLayout';
export const DxAdminDashboard: React.FC = () => {
  const location = useLocation();

  const currentPath = location.pathname.toLowerCase();

  const isPlatformOverview =
    currentPath.endsWith('/platform-overview') || currentPath === '/dx-admin' || currentPath === '/admin';
  const isOrgControl = currentPath.endsWith('/org-control') || currentPath.endsWith('/onboarding');
  const isUsersApprovals = currentPath.endsWith('/users-approvals');
  const isCampaignsApprovals = currentPath.endsWith('/campaigns-approvals');
  const isLedger = currentPath.endsWith('/ledger');
  const isAuditLogs = currentPath.endsWith('/audit-logs');

  return (
    <UnifiedDashboardLayout
      title="DX Platform Governance & Administration | DreamX Admin"
      headerTitle="DX Platform Governance Hub"
      headerSubtitle="Centralized super-admin access control, manual verification task queues, and org onboarding"
    >
      <div>
        {isPlatformOverview && <DxPlatformOverview />}
        {isOrgControl && <DxOrgManagementConsole />}
        {isUsersApprovals && <DxVerificationQueue />}
        {isCampaignsApprovals && <DxCampaignApprovals />}
        {isLedger && <DxGlobalLedger />}
        {isAuditLogs && <DxAuditLogs />}
      </div>
    </UnifiedDashboardLayout>
  );
};

export default DxAdminDashboard;

