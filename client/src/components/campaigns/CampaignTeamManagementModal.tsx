import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Trash2, Shield, X, Check, Crown, Award, Mail, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import { campaignService } from '../../services/campaignService';
import type { CampaignMember, User } from '../../types';
import { TactileNeobrutalistButton } from '../ui/TactileNeobrutalistButton';
import UserAvatar from '../common/UserAvatar';

interface CampaignTeamManagementModalProps {
  show: boolean;
  onClose: () => void;
  campaignId: string;
  campaignTitle: string;
  currentUser: User | null;
  onMembersUpdated?: () => void;
}

export function CampaignTeamManagementModal({
  show,
  onClose,
  campaignId,
  campaignTitle,
  currentUser,
  onMembersUpdated,
}: CampaignTeamManagementModalProps) {
  const [members, setMembers] = useState<CampaignMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'OWNER' | 'MEMBER'>('MEMBER');
  const [title, setTitle] = useState('');

  const fetchMembers = async () => {
    if (!campaignId) return;
    setIsLoading(true);
    try {
      const res = await campaignService.getCampaignMembers(campaignId);
      setMembers(res.data?.members || (res as any)?.members || []);
    } catch (err: any) {
      console.error('Failed to fetch team members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (show && campaignId) {
      fetchMembers();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [show, campaignId]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Please enter a valid user email.');
      return;
    }

    setIsSubmitting(true);
    try {
      await campaignService.addCampaignMember(campaignId, {
        email: email.trim(),
        role,
        title: title.trim() || 'Team Member',
      });
      toast.success('Team member added successfully!');
      setEmail('');
      setTitle('');
      setRole('MEMBER');
      await fetchMembers();
      onMembersUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to add member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberName?: string) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName || 'this member'} from the team?`)) {
      return;
    }

    try {
      await campaignService.removeCampaignMember(campaignId, memberId);
      toast.success('Team member removed.');
      await fetchMembers();
      onMembersUpdated?.();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to remove member.');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-white border-4 border-dreamxec-navy shadow-[8px_8px_0_#003366] my-8 overflow-hidden animate-scale-up"
        style={{ fontFamily: 'Poppins, sans-serif' }}
      >
        {/* Header */}
        <div className="bg-[#4717AE] text-white p-5 border-b-4 border-dreamxec-navy flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#FFDD33] text-dreamxec-navy border-2 border-dreamxec-navy shadow-[2px_2px_0_#003366]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                Team Collaboration & RBAC
              </h3>
              <p className="text-xs text-white/80 font-medium truncate max-w-md">
                {campaignTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white text-dreamxec-navy hover:bg-[#F4002C] hover:text-white border-2 border-dreamxec-navy shadow-[2px_2px_0_#003366] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Permission Notice */}
          <div className="p-4 bg-[#FEB3FC]/25 border-3 border-dreamxec-navy shadow-[4px_4px_0_#4717AE] text-xs font-semibold text-dreamxec-navy flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#4717AE] shrink-0 mt-0.5" />
            <div>
              <span className="font-black uppercase tracking-wide text-[#4717AE] block mb-0.5">
                Collaborative Access Architecture:
              </span>
              All team members have equal permissions to edit campaign details, create milestones, and submit progress evidence. Only the <strong>Project Owner</strong> can add or remove team members.
            </div>
          </div>

          {/* Add Member Form */}
          <form
            onSubmit={handleAddMember}
            className="p-4 sm:p-5 bg-[#F8F9FA] border-3 border-dreamxec-navy shadow-[4px_4px_0_#003366] space-y-4"
          >
            <h4 className="text-sm font-black uppercase tracking-wider text-dreamxec-navy flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#FE4E1A]" />
              Invite Team Member
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-dreamxec-navy mb-1">
                  User Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-dreamxec-navy/50" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@college.edu"
                    className="w-full pl-9 pr-3 py-2 text-xs font-semibold bg-white border-2 border-dreamxec-navy shadow-[2px_2px_0_#003366] focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-dreamxec-navy mb-1">
                  Custom Role Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AI Lead, Hardware Engineer"
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border-2 border-dreamxec-navy shadow-[2px_2px_0_#003366] focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <label className="text-xs font-black uppercase tracking-wider text-dreamxec-navy">
                  Role:
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'OWNER' | 'MEMBER')}
                  className="px-3 py-1.5 text-xs font-bold bg-white border-2 border-dreamxec-navy shadow-[2px_2px_0_#003366] focus:outline-none"
                >
                  <option value="MEMBER">Member (Full Execution Access)</option>
                  <option value="OWNER">Owner (Lead + Team Management)</option>
                </select>
              </div>

              <TactileNeobrutalistButton
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-black bg-[#9EFC5F] text-dreamxec-navy hover:bg-[#8ee850] border-2 border-dreamxec-navy shadow-[3px_3px_0_#003366]"
              >
                {isSubmitting ? 'Adding...' : '+ Add to Team'}
              </TactileNeobrutalistButton>
            </div>
          </form>

          {/* Members List */}
          <div className="space-y-3">
            <h4 className="text-sm font-black uppercase tracking-wider text-dreamxec-navy flex items-center justify-between">
              <span>Current Team Members ({members.length})</span>
              {isLoading && <span className="text-xs font-medium text-dreamxec-navy/60">Updating...</span>}
            </h4>

            {members.length === 0 && !isLoading ? (
              <div className="p-6 text-center bg-gray-50 border-2 border-dashed border-dreamxec-navy/30 text-dreamxec-navy/60 text-xs font-bold uppercase">
                No extra team members registered yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {members.map((m) => {
                  const isOwner = m.role === 'OWNER';
                  const isSelf = currentUser?.id === m.userId;
                  const displayName = m.user?.name || (m as any).user?.fullName || m.title || 'Team Member';
                  const displayEmail = m.user?.email || '';

                  return (
                    <div
                      key={m.id}
                      className="p-3 sm:p-4 bg-white border-2 border-dreamxec-navy shadow-[3px_3px_0_#003366] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <UserAvatar
                          user={m.user}
                          src={m.user?.profilePicture}
                          name={displayName}
                          size="md"
                          shape="square"
                          borderClassName="border-2 border-dreamxec-navy shadow-[2px_2px_0_#003366]"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs sm:text-sm font-black text-dreamxec-navy truncate">
                              {displayName}
                            </span>
                            {isSelf && (
                              <span className="text-[10px] font-black bg-dreamxec-navy text-white px-1.5 py-0.5">
                                YOU
                              </span>
                            )}
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 border border-dreamxec-navy ${
                                isOwner
                                  ? 'bg-[#FE4E1A] text-white shadow-[1px_1px_0_#003366]'
                                  : 'bg-[#4717AE] text-white shadow-[1px_1px_0_#003366]'
                              }`}
                            >
                              {isOwner ? '👑 Project Owner' : '👥 Team Member'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-dreamxec-navy/70 font-semibold truncate mt-0.5">
                            <span>{m.title || (isOwner ? 'Project Lead' : 'Collaborator')}</span>
                            {displayEmail && <span>• {displayEmail}</span>}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div>
                        {(!isOwner || members.filter((x) => x.role === 'OWNER').length > 1) && (
                          <button
                            onClick={() => handleRemoveMember(m.id, displayName)}
                            title="Remove Member"
                            className="p-1.5 text-[#F4002C] hover:bg-[#F4002C] hover:text-white border-2 border-dreamxec-navy shadow-[2px_2px_0_#003366] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t-3 border-dreamxec-navy flex justify-end">
          <TactileNeobrutalistButton
            onClick={onClose}
            className="px-6 py-2 text-xs font-black bg-dreamxec-navy text-white hover:bg-dreamxec-navy/90 border-2 border-dreamxec-navy shadow-[3px_3px_0_#FE4E1A]"
          >
            Done
          </TactileNeobrutalistButton>
        </div>
      </div>
    </div>
  );
}
