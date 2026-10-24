import React, { useEffect, useState } from 'react';
import { getUserFullDetails } from '../../services/adminService';
import AdminNotesPanel from './AdminNotesPanel';
import { X, User, Award, DollarSign, Rocket } from 'lucide-react';

interface Props {
  userId: string;
  onClose: () => void;
}

export default function AdminUserDetails({ userId, onClose }: Props) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetails();
  }, [userId]);

  const fetchDetails = async () => {
    try {
      const res = await getUserFullDetails(userId);
      setUser(res.data.user);
    } catch (error) {
      console.error('Failed to fetch user details', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userId) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex justify-center items-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#FCFBF7] w-full max-w-4xl border-4 border-[#121316] shadow-[10px_10px_0_#4717AE] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#0F534A] border-b-3 border-[#121316] p-6 flex justify-between items-start text-white">
          <div className="space-y-1">
            <h2 className="text-2xl font-headline font-black uppercase tracking-tight">
              User Profile & Audit
            </h2>
            <p className="text-[#FFDD33] text-xs font-mono">User ID: {userId}</p>
          </div>
          <button
            onClick={onClose}
            className="bg-[#FFDD33] text-[#121316] hover:bg-[#FE4E1A] hover:text-white p-1.5 border-2 border-[#121316] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !user ? (
          <div className="p-16 text-center text-[#0F534A] font-headline font-black text-xl animate-pulse uppercase">
            Loading user profile...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Col: Info */}
              <div className="md:col-span-2 space-y-6">
                {/* Basic Info */}
                <div className="flex items-center gap-4 bg-white p-5 border-3 border-[#121316] shadow-[4px_4px_0_#121316]">
                  <div className="w-16 h-16 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] flex items-center justify-center font-headline font-black text-2xl flex-shrink-0">
                    {user.name?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="text-xl font-headline font-black text-[#0F534A] uppercase">
                      {user.fullName || user.name || 'User'}
                    </h3>
                    <p className="text-xs text-gray-600 font-mono">{user.email}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="bg-white px-2 py-0.5 text-[10px] font-headline font-black uppercase border-2 border-[#121316]">
                        {user.role}
                      </span>
                      {user.profileMetadata?.studentVerified && (
                        <span className="bg-[#9EFC5F] text-[#0F534A] px-2 py-0.5 text-[10px] font-headline font-black uppercase border-2 border-[#121316]">
                          ✓ Verified Student
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* KPI stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 border-2 border-[#121316] shadow-[3px_3px_0_#FE4E1A] text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Campaigns Created</p>
                    <p className="text-2xl font-headline font-black text-[#FE4E1A]">
                      {(user.userProjects || user.campaigns || []).length}
                    </p>
                  </div>
                  <div className="bg-white p-4 border-2 border-[#121316] shadow-[3px_3px_0_#0B9C2C] text-center">
                    <p className="text-[10px] text-gray-500 font-bold uppercase">Total Backed Donations</p>
                    <p className="text-2xl font-headline font-black text-[#0B9C2C]">
                      {(user.donations || []).length}
                    </p>
                  </div>
                </div>

                {/* Campaigns List */}
                <div className="bg-white p-5 border-3 border-[#121316] shadow-[4px_4px_0_#121316] space-y-3">
                  <h4 className="font-headline font-black text-sm uppercase text-[#0F534A] flex items-center gap-1.5">
                    <Rocket className="w-4 h-4 text-[#FE4E1A]" /> Associated Campaigns ({(user.userProjects || user.campaigns || []).length})
                  </h4>
                  {(user.userProjects || user.campaigns || []).length === 0 ? (
                    <p className="text-xs text-gray-400 font-medium">No campaigns created by this account.</p>
                  ) : (
                    <ul className="space-y-2">
                      {(user.userProjects || user.campaigns || []).map((p: any) => (
                        <li
                          key={p.id}
                          className="flex justify-between items-center bg-[#FCFBF7] p-3 border-2 border-[#121316] text-xs"
                        >
                          <span className="font-headline font-black text-[#0F534A] uppercase">{p.title}</span>
                          <span
                            className={`px-2 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] ${
                              p.status === 'APPROVED' || p.status === 'LIVE'
                                ? 'bg-[#9EFC5F] text-[#0F534A]'
                                : 'bg-[#FFDD33] text-[#121316]'
                            }`}
                          >
                            {p.status}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Right Col: Notes */}
              <div className="md:col-span-1 min-h-[260px]">
                <AdminNotesPanel entityType="user" entityId={user.id} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}