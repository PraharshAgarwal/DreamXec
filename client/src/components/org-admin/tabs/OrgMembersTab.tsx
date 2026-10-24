import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Building2,
  Mail,
  ShieldCheck,
  CheckCircle2,
  X,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import UserAvatar from '../../common/UserAvatar';
import { inviteOrgMember } from '../../../services/adminService';

interface OrgMembersTabProps {
  members: any[];
  childOrgs: any[];
  parentOrg: any;
  loading: boolean;
  selectedChildOrg: string;
  onSelectChildOrg: (orgId: string) => void;
  onRefresh: () => void;
}

export const OrgMembersTab: React.FC<OrgMembersTabProps> = ({
  members,
  childOrgs,
  parentOrg,
  loading,
  selectedChildOrg,
  onSelectChildOrg,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviting, setInviting] = useState(false);

  // Invite Form State
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('STUDENT');
  const [inviteOrgId, setInviteOrgId] = useState(parentOrg?.id || '');
  const [inviteDept, setInviteDept] = useState('');
  const [inviteDesignation, setInviteDesignation] = useState('');

  const parentOrgName = parentOrg?.name || 'Institutional Network';

  const filteredMembers = useMemo(() => {
    return members.filter((u) => {
      // 1. Child org filter
      if (selectedChildOrg !== 'ALL') {
        const hasOrgMembership = (u.memberships || []).some(
          (m: any) => m.organizationId === selectedChildOrg || m.organization?.id === selectedChildOrg
        );
        if (!hasOrgMembership) return false;
      }

      // 2. Role filter
      if (roleFilter !== 'ALL') {
        const uRole = (u.role || u.memberships?.[0]?.role || '').toUpperCase();
        if (uRole !== roleFilter.toUpperCase()) return false;
      }

      // 3. Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const name = (u.fullName || u.name || '').toLowerCase();
      const username = (u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const dept = (u.department || u.memberships?.[0]?.department || '').toLowerCase();

      return name.includes(q) || username.includes(q) || email.includes(q) || dept.includes(q);
    });
  }, [members, selectedChildOrg, roleFilter, searchQuery]);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteOrgId) {
      toast.error('Email and Organization are required.');
      return;
    }

    setInviting(true);
    const toastId = toast.loading('Enrolling institutional member...');
    try {
      await inviteOrgMember({
        email: inviteEmail.trim(),
        fullName: inviteName.trim() || undefined,
        role: inviteRole,
        organizationId: inviteOrgId,
        department: inviteDept.trim() || undefined,
        designation: inviteDesignation.trim() || undefined,
      });

      toast.success('Member enrolled successfully into the organization roster!', { id: toastId });
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteDept('');
      setInviteDesignation('');
      onRefresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to enroll member.', { id: toastId });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER TOOLBAR ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#4717AE] p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-[#4717AE] text-white border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
              <Users className="w-3.5 h-3.5" /> Institutional Community Directory
            </div>
            <h2 className="font-headline font-black text-2xl sm:text-3xl text-[#0F534A] uppercase tracking-tight">
              Member Roster ({members.length})
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-3xl">
              Directory of students, research scholars, faculty mentors, club presidents, and departmental admins across {parentOrgName} and its child units.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setInviteOrgId(parentOrg?.id || '');
                setInviteModalOpen(true);
              }}
              className="flex items-center gap-2 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white px-4 py-2.5 text-xs font-headline font-black uppercase tracking-wider border-3 border-[#121316] shadow-[3px_3px_0_#121316] transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" /> Enroll New Member
            </button>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="bg-[#0F534A] hover:bg-[#0b3d36] text-white px-3.5 py-2 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#4717AE] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh Roster'}
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="pt-3 border-t-2 border-dashed border-gray-300 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, username, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white uppercase tracking-wider"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Child Org Selector */}
            {childOrgs.length > 0 && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F534A]" />
                <select
                  value={selectedChildOrg}
                  onChange={(e) => onSelectChildOrg(e.target.value)}
                  className="px-3 py-1.5 text-xs font-headline font-black uppercase border-2 border-[#121316] bg-white text-[#121316] shadow-[2px_2px_0_#121316] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Units ({childOrgs.length + 1})</option>
                  <option value={parentOrg?.id}>{parentOrgName} (Main)</option>
                  {childOrgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.orgType})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              {['ALL', 'STUDENT', 'PROFESSOR', 'RESEARCHER', 'STUDENT_PRESIDENT', 'MENTOR', 'ORG_ADMIN'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] transition-all cursor-pointer ${
                    roleFilter === r
                      ? 'bg-[#4717AE] text-white shadow-[2px_2px_0_#121316]'
                      : 'bg-white text-[#121316] hover:bg-[#FFDD33]'
                  }`}
                >
                  {r.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── MEMBERS TABLE ── */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-12 text-center max-w-lg mx-auto space-y-3">
          <Users className="w-12 h-12 text-[#4717AE] mx-auto" />
          <h3 className="font-headline font-black text-2xl text-[#121316] uppercase">
            No Members Found
          </h3>
          <p className="text-xs text-gray-600 font-medium">
            Try adjusting your search query, role filter, or child unit selector.
          </p>
        </div>
      ) : (
        <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-[#0F534A] text-white font-headline font-black uppercase tracking-wider border-b-3 border-[#121316]">
              <tr>
                <th className="p-4">Member Name &amp; Profile</th>
                <th className="p-4">Assigned Org Unit</th>
                <th className="p-4">Institutional Role</th>
                <th className="p-4">Department / Designation</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-gray-200 font-medium">
              {filteredMembers.map((u) => {
                const primaryMembership = u.memberships?.[0];
                const memberOrg = primaryMembership?.organization?.name || parentOrgName;
                const roleStr = (u.role || primaryMembership?.role || 'STUDENT').toUpperCase();
                const roleFormatted = roleStr.replace(/_/g, ' ');

                return (
                  <tr key={u.id} className="hover:bg-[#FCFBF7] transition-colors">
                    {/* User Profile */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <UserAvatar
                          user={u}
                          name={u.fullName || u.name}
                          username={u.username}
                          size="md"
                          shape="neo"
                        />
                        <div className="min-w-0">
                          <p className="font-headline font-black text-sm text-[#0F534A] uppercase truncate">
                            {u.fullName || u.name}
                          </p>
                          <p className="text-xs text-gray-600 font-mono">{u.email}</p>
                          {u.username && (
                            <p className="text-[10px] text-[#FE4E1A] font-mono">@{u.username}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Org Unit */}
                    <td className="p-4 font-bold text-gray-700">
                      <span className="inline-flex items-center gap-1 bg-[#FCFBF7] border border-[#121316] px-2.5 py-1 text-xs">
                        🏛 {memberOrg}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-headline font-black uppercase border-2 border-[#121316] ${
                          roleStr === 'ORG_ADMIN' || roleStr === 'ADMIN'
                            ? 'bg-[#FE4E1A] text-white'
                            : roleStr === 'PROFESSOR' || roleStr === 'RESEARCHER'
                            ? 'bg-[#4717AE] text-white'
                            : roleStr === 'STUDENT_PRESIDENT'
                            ? 'bg-[#FFDD33] text-[#121316]'
                            : 'bg-[#9EFC5F] text-[#0F534A]'
                        }`}
                      >
                        {roleFormatted}
                      </span>
                    </td>

                    {/* Department / Designation */}
                    <td className="p-4 text-xs font-bold text-gray-600">
                      {u.department || primaryMembership?.department ? (
                        <span>{u.department || primaryMembership?.department}</span>
                      ) : (
                        <span className="text-gray-400 font-normal">Not specified</span>
                      )}
                      {u.designation && <span className="block text-[10px] text-[#4717AE]">{u.designation}</span>}
                    </td>

                    {/* Status */}
                    <td className="p-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] ${
                          u.status === 'ACTIVE' || u.accountStatus === 'ACTIVE'
                            ? 'bg-[#9EFC5F] text-[#0F534A]'
                            : 'bg-[#FFDD33] text-[#121316]'
                        }`}
                      >
                        {u.status || u.accountStatus || 'ACTIVE'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      {u.email && (
                        <a
                          href={`mailto:${u.email}`}
                          className="inline-flex items-center gap-1 bg-white hover:bg-[#FFDD33] text-[#121316] px-3 py-1 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all"
                        >
                          <Mail className="w-3 h-3" /> Email
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── ENROLL MEMBER MODAL ── */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-4 border-[#121316] shadow-[10px_10px_0_#4717AE] max-w-lg w-full p-6 sm:p-8 relative space-y-5">
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-4 right-4 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] p-1.5 hover:bg-[#FE4E1A] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="inline-block bg-[#4717AE] text-white border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
                Institutional Membership
              </div>
              <h3 className="font-headline font-black text-2xl text-[#0F534A] uppercase tracking-tight">
                Enroll Member to Roster
              </h3>
              <p className="text-xs text-gray-600 font-medium">
                Add a student researcher, professor, or club member to {parentOrgName} or an affiliated child club.
              </p>
            </div>

            <form onSubmit={handleInviteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-headline font-black uppercase text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="student@institution.edu"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full p-2.5 font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-headline font-black uppercase text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Aarav Sharma"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full p-2.5 font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-headline font-black uppercase text-gray-700 mb-1">
                    Institutional Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full p-2.5 font-headline font-black uppercase border-2 border-[#121316] bg-white focus:outline-none"
                  >
                    <option value="STUDENT">Student Researcher</option>
                    <option value="STUDENT_PRESIDENT">Club President</option>
                    <option value="PROFESSOR">Faculty Advisor</option>
                    <option value="RESEARCHER">Researcher</option>
                    <option value="MENTOR">Technical Mentor</option>
                    <option value="INCUBATOR_MANAGER">Incubator Manager</option>
                    <option value="ORG_ADMIN">Organization Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-headline font-black uppercase text-gray-700 mb-1">
                    Target Org Unit *
                  </label>
                  <select
                    value={inviteOrgId}
                    onChange={(e) => setInviteOrgId(e.target.value)}
                    className="w-full p-2.5 font-headline font-black uppercase border-2 border-[#121316] bg-white focus:outline-none"
                  >
                    <option value={parentOrg?.id}>{parentOrgName} (Main)</option>
                    {childOrgs.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-headline font-black uppercase text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={inviteDept}
                    onChange={(e) => setInviteDept(e.target.value)}
                    className="w-full p-2.5 font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-headline font-black uppercase text-gray-700 mb-1">
                    Designation / Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lead Roboticist"
                    value={inviteDesignation}
                    onChange={(e) => setInviteDesignation(e.target.value)}
                    className="w-full p-2.5 font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-[#121316]">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 font-headline font-black uppercase bg-gray-100 border-2 border-[#121316]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={inviting}
                  className="px-6 py-2 font-headline font-black uppercase bg-[#0F534A] hover:bg-[#0b3d36] text-white border-2 border-[#121316] shadow-[3px_3px_0_#4717AE] disabled:opacity-50 cursor-pointer"
                >
                  {inviting ? 'Enrolling...' : 'Enroll Member ✓'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgMembersTab;
