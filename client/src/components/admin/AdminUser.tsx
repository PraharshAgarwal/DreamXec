import React, { useEffect, useState, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  Ban,
  CheckCircle,
  Eye,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminUserDetails from './AdminUserDetails';
import Pagination from './Pagination';
import { getAllUsers, manageUserStatus } from '../../services/adminService';
import type { User, AccountStatus } from '../../types';
import SEO from '../SEO';

export default function AdminUsers({ embedded = false }: { embedded?: boolean }) {
  const [users, setUsers] = useState<User[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [roleFilter, setRoleFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAllUsers({
        page,
        limit: itemsPerPage,
        search: debouncedSearch || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
      });
      const fetchedUsers = Array.isArray(res.data) ? res.data : (res.data?.users || []);
      const total = res.data?.total ?? (res as any)?.total ?? fetchedUsers.length;
      setUsers(fetchedUsers as User[]);
      setTotalCount(total);
    } catch (error) {
      console.error('Fetch users failed', error);
      toast.error('Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleStatusChange(userId: string, newStatus: AccountStatus) {
    if (!window.confirm(`Are you sure you want to change user status to ${newStatus}?`)) return;
    const toastId = toast.loading(`Updating status to ${newStatus}...`);
    try {
      await manageUserStatus(userId, newStatus);
      toast.success(`User status updated to ${newStatus}.`, { id: toastId });
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status.', { id: toastId });
    }
  }

  const totalPages = Math.ceil(totalCount / itemsPerPage) || 1;
  const paginatedUsers = users;

  const availableRoles = ['ALL', 'STUDENT', 'DONOR', 'PRESIDENT', 'ADMIN'];

  const content = (
    <div className="space-y-6">
      {selectedUserId && (
        <AdminUserDetails userId={selectedUserId} onClose={() => setSelectedUserId(null)} />
      )}

      {/* Header Banner */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#4717AE] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" /> Identity & Access Governance
          </div>
          <h1 className="text-3xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
            User & Donor Directory
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            Manage student creators, verified alumni donors, club leads, and administrator accounts.
          </p>
        </div>

        {/* Roles Filter Tabs */}
        <div className="flex bg-[#FCFBF7] p-1.5 border-3 border-[#121316] shadow-[3px_3px_0_#121316] gap-1 overflow-x-auto">
          {availableRoles.map((role) => (
            <button
              key={role}
              onClick={() => {
                setRoleFilter(role);
                setPage(1);
              }}
              className={`px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
                roleFilter === role
                  ? 'bg-[#4717AE] text-white border-[#121316] shadow-[2px_2px_0_#121316]'
                  : 'border-transparent text-gray-700 hover:bg-white'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-4 flex items-center justify-between gap-4">
        <div className="w-full max-w-md relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white uppercase tracking-wider"
          />
        </div>

        <div className="text-xs font-mono font-bold text-gray-600">
          Total Users: <span className="text-[#0F534A]">{totalCount}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#0F534A] font-headline font-black text-xl animate-pulse uppercase">
            Loading user accounts...
          </div>
        ) : paginatedUsers.length === 0 ? (
          <div className="p-16 text-center text-gray-500 font-headline font-bold text-base space-y-2">
            <AlertTriangle className="w-8 h-8 text-[#FE4E1A] mx-auto" />
            <p className="uppercase">No users found matching query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#0F534A] text-white font-headline font-black uppercase tracking-wider border-b-3 border-[#121316]">
                <tr>
                  <th className="p-4">
                    User Details
                  </th>
                  <th className="p-4">
                    Role
                  </th>
                  <th className="p-4">
                    Joined Date
                  </th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200 font-medium">
                {paginatedUsers.map((user: any) => {
                  const isVerifiedStudent = Boolean(user.profileMetadata?.studentVerified);
                  const isBlocked = user.accountStatus === 'BLOCKED';

                  return (
                    <tr key={user.id} className="hover:bg-[#FCFBF7] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-headline font-black text-sm text-[#0F534A] uppercase">
                            {user.fullName || user.name || 'User'}
                          </span>
                          {isVerifiedStudent && (
                            <span className="bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] px-1.5 py-0.5 text-[9px] font-headline font-black uppercase">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{user.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="bg-white px-2.5 py-1 text-[10px] font-headline font-black uppercase border-2 border-[#121316] shadow-[1px_1px_0_#121316]">
                          {user.role}
                        </span>
                      </td>
                      <td className="p-4 text-gray-500 font-mono">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] ${
                            isBlocked
                              ? 'bg-[#F4002C] text-white'
                              : 'bg-[#9EFC5F] text-[#0F534A]'
                          }`}
                        >
                          {user.accountStatus || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <button
                            onClick={() => setSelectedUserId(user.id)}
                            className="px-3 py-1.5 bg-[#4717AE] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#350f87]"
                          >
                            Profile
                          </button>
                          {!isBlocked ? (
                            <button
                              onClick={() => handleStatusChange(user.id, 'BLOCKED')}
                              className="px-3 py-1.5 bg-[#F4002C] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#c90024]"
                            >
                              Block
                            </button>
                          ) : (
                            <button
                              onClick={() => handleStatusChange(user.id, 'ACTIVE')}
                              className="px-3 py-1.5 bg-[#0F534A] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] hover:bg-[#0b3d36]"
                            >
                              Unblock
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="p-4 border-t-3 border-[#121316] bg-[#FCFBF7]">
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </div>
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <>
      <SEO
        title="User Governance Directory | DreamX Admin"
        description="Manage students, donors, club leads, and admin permissions."
      />
      <div className="flex min-h-screen bg-[#FCFBF7] text-[#121316]">
        <AdminSidebar activeTab="users" />
        <main className="flex-1 min-w-0 overflow-y-auto px-6 lg:px-10 py-8">
          {content}
        </main>
      </div>
    </>
  );
}