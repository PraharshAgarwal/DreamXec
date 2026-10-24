import React, { useState, useEffect, useCallback } from 'react';
import {
  Rocket,
  CheckCircle2,
  Calendar,
  Video,
  Clock,
  User,
  Check,
  FileText,
  ExternalLink,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import UnifiedDashboardLayout from '../layout/UnifiedDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { campaignService } from '../../services/campaignService';
import { navigateToCampaign } from '../../utils/campaignRouting';
import toast from 'react-hot-toast';

interface GuidanceSession {
  id: string;
  studentName: string;
  projectTitle: string;
  date: string;
  time: string;
  meetLink: string;
  status: string;
}

const DEFAULT_SESSIONS: GuidanceSession[] = [];

export default function MentorDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get('tab') || 'startups') as 'startups' | 'milestones' | 'schedule';
  const [activeTab, setActiveTabState] = useState<'startups' | 'milestones' | 'schedule'>(
    tabParam === 'startups' || tabParam === 'milestones' || tabParam === 'schedule' ? tabParam : 'startups'
  );

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<GuidanceSession[]>(() => {
    try {
      const saved = localStorage.getItem('mentor_guidance_slots');
      return saved ? JSON.parse(saved) : DEFAULT_SESSIONS;
    } catch {
      return DEFAULT_SESSIONS;
    }
  });

  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newMeetLink, setNewMeetLink] = useState('');

  useEffect(() => {
    if (searchParams.get('tab')) {
      setActiveTabState(searchParams.get('tab') as any);
    }
  }, [searchParams]);

  const setActiveTab = (tab: 'startups' | 'milestones' | 'schedule') => {
    setActiveTabState(tab);
    setSearchParams(tab === 'startups' ? {} : { tab });
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await campaignService.getPublicCampaigns({ limit: 12 });
      const list = res.data?.campaigns || (res as any)?.campaigns || [];
      setCampaigns(list);
    } catch (err) {
      console.warn('Failed to load campaigns for mentor:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddSlot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate || !newTime) return;

    const newSlot: GuidanceSession = {
      id: `sess_${Date.now()}`,
      studentName: 'Open Mentorship Slot',
      projectTitle: newTitle || 'Guidance & Architecture Session',
      date: newDate,
      time: newTime,
      meetLink: newMeetLink || 'https://meet.google.com/new',
      status: 'CONFIRMED',
    };

    const updated = [newSlot, ...sessions];
    setSessions(updated);
    try {
      localStorage.setItem('mentor_guidance_slots', JSON.stringify(updated));
    } catch {}

    toast.success('Guidance slot published successfully');
    setShowAddSlotModal(false);
    setNewDate('');
    setNewTime('');
    setNewTitle('');
    setNewMeetLink('');
  };

  const pendingMilestones = campaigns.flatMap((c) =>
    (c.milestones || []).map((m: any) => ({
      ...m,
      campaignTitle: c.title,
      campaignId: c.id,
      studentName: c.studentName || c.student?.fullName || 'Student Lead',
    }))
  );

  return (
    <UnifiedDashboardLayout
      title="Mentor Guidance Workspace | DreamXec"
      headerTitle="Mentor Workspace & Guidance Engine"
      headerSubtitle="Review student milestones, evaluate startup proposals, and conduct 1-on-1 guidance sessions"
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* ── METRICS OVERVIEW ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-[#FFDD33] p-6 border-4 border-[#121316] shadow-[4px_4px_0_#FE4E1A]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-headline font-black text-xs uppercase text-[#121316]">
                Available Startups
              </span>
              <Rocket className="w-5 h-5 text-[#0F534A]" />
            </div>
            <div className="font-headline font-black text-3xl text-[#0F534A]">{campaigns.length} Projects</div>
            <p className="text-[11px] text-gray-700 font-bold uppercase mt-1">Active Innovation Cohort</p>
          </div>

          <div className="bg-[#FCFBF7] p-6 border-4 border-[#121316] shadow-[4px_4px_0_#121316]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-headline font-black text-xs uppercase text-[#121316]">
                Milestone Tranches
              </span>
              <CheckCircle2 className="w-5 h-5 text-[#FE4E1A]" />
            </div>
            <div className="font-headline font-black text-3xl text-[#FE4E1A]">{pendingMilestones.length} In Pipeline</div>
            <p className="text-[11px] text-gray-500 font-bold uppercase mt-1">Proof of Execution Tranches</p>
          </div>

          <div className="bg-[#0F534A] text-white p-6 border-4 border-[#121316] shadow-[4px_4px_0_#FFDD33]">
            <div className="flex items-center justify-between mb-2">
              <span className="font-headline font-black text-xs uppercase text-[#9EFC5F]">
                Guidance Sessions
              </span>
              <Calendar className="w-5 h-5 text-[#FFDD33]" />
            </div>
            <div className="font-headline font-black text-3xl text-white">{sessions.length} Slots</div>
            <p className="text-[11px] text-gray-200 font-bold uppercase mt-1">Published Availability</p>
          </div>
        </div>

        {/* ── WORKSPACE TABS ── */}
        <div className="bg-white rounded-xl border-4 border-[#121316] shadow-[6px_6px_0_#121316] overflow-hidden">
          <div className="flex border-b-4 border-[#121316] bg-[#FCFBF7]">
            <button
              onClick={() => setActiveTab('startups')}
              className={`flex-1 py-4 px-6 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-r-3 border-[#121316] transition-all cursor-pointer ${
                activeTab === 'startups'
                  ? 'bg-[#0F534A] text-white shadow-[inset_0_-4px_0_#FE4E1A]'
                  : 'text-[#121316] hover:bg-[#FFDD33]'
              }`}
            >
              <Rocket className="w-4 h-4" /> Startups & Innovations
            </button>

            <button
              onClick={() => setActiveTab('milestones')}
              className={`flex-1 py-4 px-6 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-r-3 border-[#121316] transition-all cursor-pointer ${
                activeTab === 'milestones'
                  ? 'bg-[#0F534A] text-white shadow-[inset_0_-4px_0_#FE4E1A]'
                  : 'text-[#121316] hover:bg-[#FFDD33]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" /> Milestone Verifications
            </button>

            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex-1 py-4 px-6 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'schedule'
                  ? 'bg-[#0F534A] text-white shadow-[inset_0_-4px_0_#FE4E1A]'
                  : 'text-[#121316] hover:bg-[#FFDD33]'
              }`}
            >
              <Calendar className="w-4 h-4" /> Schedule Guidance
            </button>
          </div>

          <div className="p-8">
            {/* ── TAB 1: ASSIGNED STARTUPS ── */}
            {activeTab === 'startups' && (
              <div>
                {loading ? (
                  <div className="text-center py-12 text-[#0F534A] font-headline font-black text-lg animate-pulse uppercase">
                    Loading Innovation Projects...
                  </div>
                ) : campaigns.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 font-headline font-bold uppercase">
                    No active startup proposals in current cohort.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {campaigns.map((c) => {
                      const targetAmt = Number(c.targetAmount || 0);
                      const raisedAmt = Number(c.currentRaisedAmount || 0);
                      const progressPct = Math.min(Math.round((raisedAmt / (targetAmt || 1)) * 100), 100);

                      return (
                        <div key={c.id} className="p-6 bg-white border-4 border-[#121316] shadow-[4px_4px_0_#121316] space-y-4 flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="bg-[#FFDD33] border-2 border-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase">
                                {c.category?.replace(/_/g, ' ') || 'INNOVATION'}
                              </span>
                              <span className="text-xs font-mono font-bold text-gray-500">
                                {c.stage || 'DISCOVERY'}
                              </span>
                            </div>

                            <h3 className="font-headline font-black text-xl uppercase text-[#121316]">
                              {c.title}
                            </h3>
                            <p className="text-xs text-gray-600 font-medium line-clamp-2">
                              {c.shortDescription || c.description || 'Student-led innovation project.'}
                            </p>

                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase">
                                <span>Progress</span>
                                <span>₹{raisedAmt.toLocaleString('en-IN')} / ₹{targetAmt.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="w-full bg-gray-200 border-2 border-[#121316] h-3">
                                <div
                                  className="bg-[#9EFC5F] h-full border-r-2 border-[#121316]"
                                  style={{ width: `${progressPct}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t-2 border-dashed border-gray-200">
                            <span className="text-xs font-headline font-black uppercase text-[#0F534A]">
                              Lead: {c.studentName || c.student?.fullName || 'Student Lead'}
                            </span>
                            <button
                              onClick={() => navigateToCampaign(c.slug || c.id, navigate)}
                              className="px-3.5 py-1.5 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-2 border-[#121316] shadow-[2px_2px_0_#FFDD33] text-[10px] font-headline font-black uppercase transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              Review Project <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 2: MILESTONE APPROVALS ── */}
            {activeTab === 'milestones' && (
              <div className="space-y-6">
                {pendingMilestones.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 font-headline font-bold uppercase border-2 border-dashed border-[#121316] p-8">
                    No pending milestone verification requests at this moment.
                  </div>
                ) : (
                  pendingMilestones.slice(0, 5).map((m: any, idx: number) => (
                    <div key={m.id || idx} className="p-6 bg-white border-4 border-[#121316] shadow-[4px_4px_0_#121316] space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-headline font-black text-lg uppercase text-[#121316]">
                            Milestone #{m.sequenceOrder || idx + 1}: {m.title}
                          </h4>
                          <p className="text-xs text-gray-600 font-medium mt-0.5">
                            Project: <span className="font-bold text-[#0F534A]">{m.campaignTitle}</span> (Lead: {m.studentName})
                          </p>
                        </div>
                        <span className="bg-[#FFDD33] border-2 border-[#121316] px-3 py-1 text-xs font-headline font-black uppercase self-start sm:self-auto">
                          Target: ₹{Number(m.targetAmount || 0).toLocaleString('en-IN')}
                        </span>
                      </div>

                      {m.description && (
                        <p className="text-xs text-gray-700 bg-[#FCFBF7] p-3 border-2 border-[#121316]">
                          {m.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 pt-2">
                        <button
                          onClick={() => {
                            toast.success(`Milestone #${m.sequenceOrder || idx + 1} reviewed successfully!`);
                          }}
                          className="px-6 py-2.5 bg-[#9EFC5F] hover:bg-[#85e845] text-[#0F534A] border-3 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-all"
                        >
                          <Check className="w-4 h-4" /> Endorse Milestone
                        </button>

                        <button
                          onClick={() => navigateToCampaign(m.campaignId, navigate)}
                          className="px-6 py-2.5 bg-white hover:bg-[#FFDD33] border-3 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase tracking-wider cursor-pointer transition-all"
                        >
                          Inspect Full Project
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── TAB 3: SCHEDULE SESSION ── */}
            {activeTab === 'schedule' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="font-headline font-black text-base uppercase text-[#121316]">
                    Upcoming 1-on-1 Guidance Sessions
                  </h4>
                  <button
                    onClick={() => setShowAddSlotModal(true)}
                    className="px-4 py-2 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-3 border-[#121316] shadow-[3px_3px_0_#FFDD33] font-headline font-black text-xs uppercase tracking-wider inline-flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" /> Create Guidance Slot
                  </button>
                </div>

                {sessions.length === 0 ? (
                  <div className="text-center py-12 bg-[#FCFBF7] border-4 border-dashed border-[#121316] p-8 space-y-3">
                    <div className="w-12 h-12 bg-[#FFDD33] border-2 border-[#121316] shadow-[2px_2px_0_#121316] flex items-center justify-center mx-auto">
                      <Calendar className="w-6 h-6 text-[#0F534A]" />
                    </div>
                    <h5 className="font-headline font-black text-lg uppercase text-[#121316]">
                      No Guidance Slots Published
                    </h5>
                    <p className="text-xs text-gray-600 font-medium max-w-sm mx-auto">
                      You haven&apos;t scheduled any 1-on-1 mentorship slots yet. Click &quot;Create Guidance Slot&quot; above to publish your availability for student innovators.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessions.map((s) => (
                      <div
                        key={s.id}
                        className="p-6 bg-white border-4 border-[#121316] shadow-[4px_4px_0_#121316] flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-[#0F534A] text-white border-3 border-[#121316] shadow-[2px_2px_0_#FFDD33] flex items-center justify-center font-headline font-black text-xl flex-shrink-0">
                            <User className="w-6 h-6 text-[#FFDD33]" />
                          </div>
                          <div>
                            <h5 className="font-headline font-black text-lg uppercase text-[#121316]">
                              {s.studentName}
                            </h5>
                            <p className="text-xs text-gray-600 font-bold uppercase">
                              {s.projectTitle}
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs font-mono font-bold text-[#0F534A]">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" /> {s.date}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" /> {s.time}
                              </span>
                            </div>
                          </div>
                        </div>

                        <a
                          href={s.meetLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-5 py-2.5 bg-[#18D7E8] hover:bg-[#9EFC5F] text-[#121316] border-3 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase tracking-wider inline-flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <Video className="w-4 h-4" /> Join Guidance Call <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {/* Create Slot Modal */}
                {showAddSlotModal && (
                  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white border-5 border-[#121316] shadow-[8px_8px_0_#FE4E1A] p-8 max-w-md w-full space-y-6">
                      <h3 className="font-headline font-black text-xl uppercase text-[#121316]">
                        Create Guidance Session Slot
                      </h3>

                      <form onSubmit={handleAddSlot} className="space-y-4">
                        <div>
                          <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                            Topic / Purpose
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Architecture Review, Pitch Deck Feedback"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#FCFBF7] border-3 border-[#121316] text-xs font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                            Session Date
                          </label>
                          <input
                            type="date"
                            required
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#FCFBF7] border-3 border-[#121316] text-xs font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                            Time Window
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 14:00 PM - 15:00 PM"
                            required
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#FCFBF7] border-3 border-[#121316] text-xs font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                            Video Meeting URL (Google Meet / Zoom)
                          </label>
                          <input
                            type="url"
                            placeholder="https://meet.google.com/..."
                            value={newMeetLink}
                            onChange={(e) => setNewMeetLink(e.target.value)}
                            className="w-full px-4 py-2.5 bg-[#FCFBF7] border-3 border-[#121316] text-xs font-medium"
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                          <button
                            type="button"
                            onClick={() => setShowAddSlotModal(false)}
                            className="px-4 py-2 bg-gray-200 border-2 border-[#121316] text-xs font-headline font-black uppercase cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="px-6 py-2 bg-[#FE4E1A] text-white border-2 border-[#121316] shadow-[2px_2px_0_#FFDD33] text-xs font-headline font-black uppercase cursor-pointer"
                          >
                            Publish Slot
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </UnifiedDashboardLayout>
  );
}
