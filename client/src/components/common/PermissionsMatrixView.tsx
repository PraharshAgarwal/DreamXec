import React, { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  Filter,
  FlaskConical,
  Award,
  Rocket,
  Building2,
  Workflow,
  Users,
  Receipt,
  FileText,
  SlidersHorizontal,
  TableProperties,
  LayoutGrid,
  Info,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../hooks/usePermissions';
import {
  fetchPermissionMatrix,
  type PermissionDefinition,
  type PermissionMatrixResponse,
} from '../../services/permissionService';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
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

interface PermissionsMatrixViewProps {
  customTitle?: string;
  customSubtitle?: string;
  roleName?: string;
  showRoleComparison?: boolean;
}

export default function PermissionsMatrixView({
  customTitle,
  customSubtitle,
  roleName,
  showRoleComparison,
}: PermissionsMatrixViewProps) {
  const { user } = useAuth();
  const { can } = usePermissions();

  const [loading, setLoading] = useState(false);
  const [syncedAt, setSyncedAt] = useState<string>('');
  const [matrixData, setMatrixData] = useState<PermissionMatrixResponse | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'GRANTED' | 'RESTRICTED'>('ALL');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(showRoleComparison ? 'table' : 'grid');

  const activeRole = (roleName || user?.activeProfile?.role || user?.role || 'USER').toUpperCase();
  const activeOrgId = (user?.activeProfile as any)?.organizationId || (user as any)?.organizationId || null;
  const activeOrgName = (user?.activeProfile as any)?.orgName || 'Active Organization Context';

  const loadMatrix = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const data = await fetchPermissionMatrix({ role: activeRole, forceRefresh });
      setMatrixData(data);
      setSyncedAt(new Date(data.syncedAt || Date.now()).toLocaleTimeString());
      if (forceRefresh) {
        toast.success('Permissions matrix synced dynamically with database');
      }
    } catch (err) {
      console.error('Failed to fetch dynamic permissions matrix:', err);
      toast.error('Could not sync dynamic matrix. Displaying cached permissions.');
    } finally {
      setLoading(false);
    }
  }, [activeRole]);

  useEffect(() => {
    loadMatrix(false);
  }, [loadMatrix, activeRole]);

  // Derived catalog of permissions (from dynamic API response or fallback)
  const allPermissions: PermissionDefinition[] = useMemo(() => {
    if (matrixData?.permissions && matrixData.permissions.length > 0) {
      return matrixData.permissions;
    }
    // Fallback static list if server is unreachable
    return [];
  }, [matrixData]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set<string>();
    allPermissions.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [allPermissions]);

  // Check if current user has permission key for the strictly active role
  const isPermissionGranted = useCallback(
    (key: string) => {
      // 1. Strict dynamic role matrix segregation for the currently selected role
      if (matrixData?.roleMatrix && matrixData.roleMatrix[activeRole]) {
        return matrixData.roleMatrix[activeRole].includes(key);
      }
      // 2. Dynamic matrix userContext if activeRole matches
      if (matrixData?.userContext?.activeRole === activeRole && matrixData.userContext.effectiveKeys) {
        return matrixData.userContext.effectiveKeys.includes(key);
      }
      // 3. Fallback to user permissions only if active profile matches activeRole
      if (user?.activeProfile?.role?.toUpperCase() === activeRole && user?.permissions?.includes(key)) {
        return true;
      }
      // 4. Fallback to client hook
      return can(key);
    },
    [matrixData, activeRole, user, can]
  );

  // Filtered permissions
  const filteredPermissions = useMemo(() => {
    return allPermissions.filter((item) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesKey = item.key.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        if (!matchesName && !matchesKey && !matchesDesc) return false;
      }

      // Category
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) {
        return false;
      }

      // Status
      const granted = isPermissionGranted(item.key);
      if (statusFilter === 'GRANTED' && !granted) return false;
      if (statusFilter === 'RESTRICTED' && granted) return false;

      return true;
    });
  }, [allPermissions, searchQuery, selectedCategory, statusFilter, isPermissionGranted]);

  // Grouped by Category
  const groupedByCategory = useMemo(() => {
    const map: Record<string, PermissionDefinition[]> = {};
    filteredPermissions.forEach((p) => {
      const cat = p.category || 'General';
      if (!map[cat]) map[cat] = [];
      map[cat].push(p);
    });
    return map;
  }, [filteredPermissions]);

  const totalCount = allPermissions.length;
  const grantedCount = allPermissions.filter((p) => isPermissionGranted(p.key)).length;
  const restrictedCount = totalCount - grantedCount;

  return (
    <div className="space-y-6">
      {/* ── HERO BANNER ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 bg-[#0F534A] text-white border-2 border-[#121316] px-3 py-1 text-xs font-headline font-black uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#9EFC5F]" /> Security Clearance &amp; RBAC Matrix
              </span>
              <span className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-1 text-xs font-headline font-black uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-[#0F534A]" /> {roleName || activeRole.replace(/_/g, ' ')}
              </span>
              {activeOrgName && (
                <span className="inline-flex items-center gap-1 bg-[#FCFBF7] text-gray-700 border border-gray-300 px-2.5 py-1 text-[11px] font-bold">
                  <Building2 className="w-3 h-3 text-[#FE4E1A]" /> {activeOrgName}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-headline font-black text-[#121316] uppercase tracking-tight">
              {customTitle || 'Role Access & Authority Matrix'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-3xl">
              {customSubtitle ||
                'Real-time cryptographic and institutional RBAC permissions matrix. Capabilities are dynamically resolved from the central database schema according to your authenticated organization role.'}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => loadMatrix(true)}
              disabled={loading}
              className="bg-[#0F534A] hover:bg-[#0b3d36] text-white px-4 py-2.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#9EFC5F] transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Syncing...' : 'Sync Live Matrix'}</span>
            </button>
          </div>
        </div>

        {/* 4 Stat Overview Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t-2 border-dashed border-gray-200">
          <div className="bg-[#9EFC5F]/20 border-2 border-[#0F534A] p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-headline font-black uppercase tracking-wider text-[#0F534A] block">
                Active Permissions
              </span>
              <p className="font-headline font-black text-3xl text-[#0F534A] mt-0.5">
                {grantedCount}
              </p>
              <p className="text-[10px] text-gray-600 font-bold mt-1">Granted to this role</p>
            </div>
            <Unlock className="w-8 h-8 text-[#0F534A]/40" />
          </div>

          <div className="bg-[#FCFBF7] border-2 border-[#121316] p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-600 block">
                Restricted Operations
              </span>
              <p className="font-headline font-black text-3xl text-gray-700 mt-0.5">
                {restrictedCount}
              </p>
              <p className="text-[10px] text-gray-500 font-bold mt-1">Requires elevated role</p>
            </div>
            <Lock className="w-8 h-8 text-gray-400" />
          </div>

          <div className="bg-[#FCFBF7] border-2 border-[#121316] p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-600 block">
                System Catalog
              </span>
              <p className="font-headline font-black text-3xl text-[#121316] mt-0.5">
                {totalCount}
              </p>
              <p className="text-[10px] text-gray-500 font-bold mt-1">Total RBAC operations</p>
            </div>
            <ShieldCheck className="w-8 h-8 text-[#4717AE]/30" />
          </div>

          <div className="bg-[#FFDD33]/20 border-2 border-[#121316] p-4 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-headline font-black uppercase tracking-wider text-[#121316] block">
                Live Schema Status
              </span>
              <p className="font-headline font-black text-base text-[#0F534A] mt-1 truncate">
                Dynamic DB Active
              </p>
              <p className="text-[10px] text-gray-600 font-bold mt-1">
                Synced at: {syncedAt || 'Just now'}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-[#0F534A]/40" />
          </div>
        </div>
      </div>

      {/* ── FILTER & SEARCH TOOLBAR ── */}
      <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-4 flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search permissions by name, key, or scope..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white tracking-wider"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-[#121316] text-white shadow-[2px_2px_0_#FE4E1A]'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter('GRANTED')}
            className={`px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'GRANTED'
                ? 'bg-[#0F534A] text-white shadow-[2px_2px_0_#9EFC5F]'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Granted ({grantedCount})
          </button>
          <button
            onClick={() => setStatusFilter('RESTRICTED')}
            className={`px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] transition-all cursor-pointer flex items-center gap-1 ${
              statusFilter === 'RESTRICTED'
                ? 'bg-gray-700 text-white shadow-[2px_2px_0_#121316]'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Restricted ({restrictedCount})
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 border-2 border-[#121316] p-0.5 bg-[#FCFBF7]">
          <button
            onClick={() => setViewMode('grid')}
            title="Card Grid View"
            className={`p-1.5 cursor-pointer ${
              viewMode === 'grid' ? 'bg-[#121316] text-white' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('table')}
            title="Comparison Matrix Table View"
            className={`p-1.5 cursor-pointer ${
              viewMode === 'table' ? 'bg-[#121316] text-white' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            <TableProperties className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('ALL')}
          className={`px-3 py-1 text-xs font-headline font-bold uppercase whitespace-nowrap border border-[#121316] transition-all cursor-pointer ${
            selectedCategory === 'ALL'
              ? 'bg-[#0F534A] text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          All Domains
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-xs font-headline font-bold uppercase whitespace-nowrap border border-[#121316] transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === cat
                ? 'bg-[#0F534A] text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>{CATEGORY_ICONS[cat]}</span>
            <span>{cat}</span>
          </button>
        ))}
      </div>

      {/* ── MAIN CONTENT (GRID VIEW) ── */}
      {viewMode === 'grid' && (
        <div className="space-y-6">
          {Object.keys(groupedByCategory).length === 0 ? (
            <div className="bg-white border-3 border-[#121316] p-12 text-center space-y-3">
              <ShieldCheck className="w-10 h-10 text-gray-400 mx-auto" />
              <h3 className="font-headline font-black text-lg text-gray-700 uppercase">
                No matching permissions found
              </h3>
              <p className="text-xs text-gray-500">Try adjusting your search query or filters.</p>
            </div>
          ) : (
            Object.entries(groupedByCategory).map(([category, items]) => (
              <div
                key={category}
                className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] overflow-hidden"
              >
                {/* Category Header */}
                <div className="bg-[#FCFBF7] border-b-2 border-[#121316] px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[#0F534A]">{CATEGORY_ICONS[category]}</span>
                    <h3 className="font-headline font-black text-sm uppercase tracking-wider text-[#121316]">
                      {category}
                    </h3>
                  </div>
                  <span className="text-[11px] font-bold text-gray-500 uppercase">
                    {items.filter((i) => isPermissionGranted(i.key)).length} of {items.length} Active
                  </span>
                </div>

                {/* Cards Grid */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {items.map((item) => {
                    const isGranted = isPermissionGranted(item.key);
                    const rolesWhoHaveIt = item.rolesWithPermission || [];

                    return (
                      <div
                        key={item.key}
                        className={`p-4 border-2 transition-all flex flex-col justify-between gap-3 ${
                          isGranted
                            ? 'bg-[#9EFC5F]/10 border-[#0F534A] shadow-[2px_2px_0_#0F534A]'
                            : 'bg-[#FCFBF7] border-gray-200 opacity-70'
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-[10px] font-bold text-gray-500 bg-white px-2 py-0.5 border border-gray-200 rounded">
                              {item.key}
                            </span>
                            {isGranted ? (
                              <span className="inline-flex items-center gap-1 bg-[#9EFC5F] text-[#0F534A] text-[10px] font-headline font-black uppercase px-2 py-0.5 rounded">
                                <Check className="w-3 h-3 stroke-[3]" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 bg-gray-200 text-gray-600 text-[10px] font-headline font-black uppercase px-2 py-0.5 rounded">
                                <Lock className="w-3 h-3" /> Locked
                              </span>
                            )}
                          </div>

                          <h4 className="font-headline font-black text-sm text-[#121316]">
                            {item.name}
                          </h4>

                          <p className="text-xs text-gray-600 leading-relaxed font-medium">
                            {item.description}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-gray-200 text-[10px]">
                          {isGranted ? (
                            <div className="flex items-center gap-1 text-[#0F534A] font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>Supported under {activeRole.replace(/_/g, ' ')} authority</span>
                            </div>
                          ) : (
                            <div className="text-gray-500 font-medium">
                              <span className="font-bold">Required Roles: </span>
                              <span>
                                {rolesWhoHaveIt.slice(0, 3).map((r) => r.replace(/_/g, ' ')).join(', ')}
                                {rolesWhoHaveIt.length > 3 ? ` +${rolesWhoHaveIt.length - 3} more` : ''}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TABLE VIEW (CROSS-ROLE RBAC MATRIX) ── */}
      {viewMode === 'table' && (
        <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-gray-100 pb-4">
            <div>
              <h3 className="font-headline font-black text-base uppercase text-[#121316]">
                Cross-Role Access Comparison Matrix
              </h3>
              <p className="text-xs text-gray-500">
                Compare authorizations between your current role ({activeRole}) and other campus stakeholders
              </p>
            </div>
            <span className="text-xs font-bold bg-[#FFDD33] text-[#121316] px-2.5 py-1 border border-[#121316]">
              Your Role: {activeRole.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FCFBF7] border-b-2 border-[#121316] font-headline font-black uppercase text-gray-700">
                <tr>
                  <th className="py-3 px-3">Operation / Capability</th>
                  <th className="py-3 px-3">Domain</th>
                  <th className="py-3 px-3 text-center bg-[#9EFC5F]/20 border-x-2 border-[#121316]">
                    Your Access ({activeRole})
                  </th>
                  <th className="py-3 px-3">All Authorized Roles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredPermissions.map((item) => {
                  const isGranted = isPermissionGranted(item.key);
                  const rolesWhoHaveIt = item.rolesWithPermission || [];

                  return (
                    <tr key={item.key} className="hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <p className="font-bold text-[#121316]">{item.name}</p>
                        <p className="font-mono text-[10px] text-gray-500">{item.key}</p>
                      </td>
                      <td className="py-3 px-3 text-gray-600">{item.category}</td>
                      <td className="py-3 px-3 text-center bg-[#9EFC5F]/10 border-x-2 border-gray-200">
                        {isGranted ? (
                          <span className="inline-flex items-center gap-1 text-[#0F534A] font-headline font-black text-xs uppercase bg-[#9EFC5F] px-2 py-0.5 rounded">
                            <Check className="w-3 h-3 stroke-[3]" /> Granted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-500 font-bold text-xs uppercase">
                            <Lock className="w-3 h-3" /> Locked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1">
                          {rolesWhoHaveIt.map((r) => (
                            <span
                              key={r}
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                                r === activeRole
                                  ? 'bg-[#0F534A] text-white border-[#0F534A]'
                                  : 'bg-gray-100 text-gray-700 border-gray-200'
                              }`}
                            >
                              {r.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
