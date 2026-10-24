import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  FlaskConical,
  Rocket,
  CheckCircle2,
  Calendar,
  Award,
  FileText,
  Clock,
  Users,
  Search,
  Building2,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Microscope,
  ShieldCheck
} from 'lucide-react';
import UnifiedDashboardLayout from '../layout/UnifiedDashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function ProfessorDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  const activeOrgId = (user?.activeProfile as any)?.organizationId || (user as any)?.organizationId;
  const activeOrgName = (user?.activeProfile as any)?.orgName || 'Department Research Faculty';

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'overview');
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  const [projects, setProjects] = useState<any[]>([
    {
      id: 'proj-801',
      title: 'Solid-State Battery Anode Degradation Analysis',
      teamLead: 'Vikram Joshi (M.Tech 2nd Yr)',
      trlLevel: 'TRL 4 (Lab Validation)',
      studentsCount: 3,
      status: 'ACTIVE_RESEARCH',
      milestonesPending: 1
    },
    {
      id: 'proj-802',
      title: 'Autonomous Drone Swarm Cooperative SLAM',
      teamLead: 'Sneha Roy (B.Tech 4th Yr)',
      trlLevel: 'TRL 5 (Field Prototype)',
      studentsCount: 4,
      status: 'ACTIVE_RESEARCH',
      milestonesPending: 1
    },
    {
      id: 'proj-803',
      title: 'Graphene Biosensor for Dengue NS1 Detection',
      teamLead: 'Rohan Deshmukh (Ph.D. Scholar)',
      trlLevel: 'TRL 3 (Proof of Concept)',
      studentsCount: 2,
      status: 'STAGE_GATE_PENDING',
      milestonesPending: 0
    }
  ]);

  const [milestones, setMilestones] = useState<any[]>([
    {
      id: 'ms-401',
      projectId: 'proj-801',
      projectTitle: 'Solid-State Battery Anode Degradation Analysis',
      milestoneTitle: 'SEM Micrograph & Impedance Spectroscopy Data',
      submittedBy: 'Vikram Joshi',
      date: '2026-09-24',
      status: 'PENDING_FACULTY_REVIEW'
    },
    {
      id: 'ms-402',
      projectId: 'proj-802',
      projectTitle: 'Autonomous Drone Swarm Cooperative SLAM',
      milestoneTitle: 'ROS2 Gazebo Simulation & Hardware Flight Log',
      submittedBy: 'Sneha Roy',
      date: '2026-09-22',
      status: 'PENDING_FACULTY_REVIEW'
    }
  ]);

  const [labBookings, setLabBookings] = useState<any[]>([
    {
      id: 'lb-101',
      labName: 'Advanced Materials & Nanotech Facility',
      equipment: 'Scanning Electron Microscope (SEM)',
      reservedBy: 'Rohan Deshmukh',
      timeSlot: '2026-09-28 10:00 - 13:00',
      status: 'CONFIRMED'
    },
    {
      id: 'lb-102',
      labName: 'Robotics & Autonomous Systems Arena',
      equipment: 'Vicon Motion Capture Cage',
      reservedBy: 'Sneha Roy',
      timeSlot: '2026-09-29 14:00 - 18:00',
      status: 'PENDING_APPROVAL'
    }
  ]);

  const handleVerifyMilestone = (id: string) => {
    setMilestones(prev =>
      prev.map(m => m.id === id ? { ...m, status: 'VERIFIED' } : m)
    );
    toast.success('Academic milestone verified. Tranche approved for release.');
  };

  const handleApproveLabBooking = (id: string) => {
    setLabBookings(prev =>
      prev.map(b => b.id === id ? { ...b, status: 'CONFIRMED' } : b)
    );
    toast.success('Lab reservation authorized.');
  };

  return (
    <UnifiedDashboardLayout
      title={`${activeOrgName} • Faculty Research Hub | DreamXec`}
      headerTitle={`${activeOrgName} • Professor Research Console`}
      headerSubtitle="Supervise student innovation thesis, verify academic milestones, and approve stage gate progressions"
    >
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#4717AE] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#4717AE]/15 text-[#4717AE] border-2 border-[#121316] px-2.5 py-0.5 text-xs font-headline font-black uppercase tracking-wider">
                    <FlaskConical className="w-3.5 h-3.5" /> Faculty Mentor Console
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#0F534A]/10 text-[#0F534A] border-2 border-[#121316] px-2 py-0.5 text-[11px] font-headline font-black uppercase">
                    <Building2 className="w-3 h-3" /> {activeOrgName}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-headline font-black text-[#121316] uppercase tracking-tight">
                  Academic Research &amp; Supervised Lab Hub
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-2xl">
                  Guide undergraduate and graduate research teams, authenticate milestone deliverables, and evaluate Technology Readiness Levels (TRL).
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => handleTabChange('milestones')}
                  className="bg-[#FE4E1A] hover:bg-[#e03d0d] text-white text-xs font-headline font-black uppercase tracking-wider px-3.5 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Pending Milestones ({milestones.filter(m => m.status === 'PENDING_FACULTY_REVIEW').length})
                </button>
                <button
                  onClick={() => handleTabChange('projects')}
                  className="bg-[#4717AE] hover:bg-[#39128f] text-white text-xs font-headline font-black uppercase tracking-wider px-3.5 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Rocket className="w-4 h-4" /> Active Labs ({projects.length})
                </button>
              </div>
            </div>

            {/* 4 Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#4717AE] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Supervised Projects</span>
                  <Rocket className="w-4 h-4 text-[#4717AE]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#121316]">
                  {projects.length} Active
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Student &amp; Scholar Teams</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Milestone Reviews</span>
                  <CheckCircle2 className="w-4 h-4 text-[#FE4E1A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#FE4E1A]">
                  {milestones.filter(m => m.status === 'PENDING_FACULTY_REVIEW').length} Awaiting Review
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Proof of Research Execution</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#0F534A] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Student Researchers</span>
                  <Users className="w-4 h-4 text-[#0F534A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#0F534A]">
                  9 Scholars
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Under Department Mentorship</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FFDD33] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Lab Equipment Reservations</span>
                  <Microscope className="w-4 h-4 text-[#FE4E1A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#121316]">
                  {labBookings.length} Slots Booked
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Advanced Facilities</p>
              </div>
            </div>

            {/* Quick Milestones Preview */}
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-black text-base uppercase text-[#121316]">
                    Milestone Verifications Pending
                  </h3>
                  <p className="text-xs text-gray-500">Student submissions requiring academic evaluation</p>
                </div>
                <button
                  onClick={() => handleTabChange('milestones')}
                  className="text-xs font-headline font-black uppercase text-[#FE4E1A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Review Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {milestones.map((m) => (
                  <div key={m.id} className="p-4 border-2 border-[#121316] bg-[#FCFBF7] flex justify-between items-center">
                    <div>
                      <span className="font-mono text-[10px] font-bold bg-[#4717AE] text-white px-2 py-0.5 rounded">
                        {m.id}
                      </span>
                      <h4 className="font-headline font-black text-sm text-[#121316] mt-1">{m.milestoneTitle}</h4>
                      <p className="text-xs text-gray-600">Project: {m.projectTitle} • Submitted by: {m.submittedBy}</p>
                    </div>
                    {m.status === 'PENDING_FACULTY_REVIEW' ? (
                      <button
                        onClick={() => handleVerifyMilestone(m.id)}
                        className="bg-[#0F534A] hover:bg-[#0b3d36] text-white text-xs font-headline font-black uppercase px-3 py-1.5 cursor-pointer"
                      >
                        Verify &amp; Sign
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-[#0F534A] uppercase">Verified ✓</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: RESEARCH PROJECTS */}
        {activeTab === 'projects' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Supervised Research &amp; Innovation Labs
              </h2>
              <p className="text-xs text-gray-500">
                Departmental student thesis projects and Technology Readiness Level tracking
              </p>
            </div>

            <div className="space-y-4">
              {projects.map((proj) => (
                <div key={proj.id} className="p-5 border-2 border-[#121316] bg-[#FCFBF7] shadow-[2px_2px_0_#4717AE] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold bg-[#FFDD33] text-[#121316] px-2 py-0.5 border border-[#121316]">
                      {proj.trlLevel}
                    </span>
                    <h3 className="font-headline font-black text-base text-[#121316]">{proj.title}</h3>
                    <p className="text-xs text-gray-600">Lead: <span className="font-bold">{proj.teamLead}</span> • Team: {proj.studentsCount} Researchers</p>
                  </div>
                  <div className="text-right space-y-1">
                    <span className="px-2 py-0.5 text-[10px] font-headline font-black uppercase bg-[#9EFC5F] text-[#0F534A] rounded inline-block">
                      {proj.status}
                    </span>
                    <p className="text-xs text-gray-500 font-bold">{proj.milestonesPending} Pending Milestones</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MILESTONE REVIEWS */}
        {activeTab === 'milestones' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Academic Milestone Verification &amp; Rubric Evaluation
              </h2>
              <p className="text-xs text-gray-500">
                Confirm deliverable validity to trigger automated smart escrow release
              </p>
            </div>

            <div className="space-y-4">
              {milestones.map((m) => (
                <div key={m.id} className="p-5 border-2 border-[#121316] bg-[#FCFBF7] shadow-[2px_2px_0_#FE4E1A] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-bold bg-[#0F534A] text-white px-2 py-0.5 rounded">
                      {m.id}
                    </span>
                    <h3 className="font-headline font-black text-base text-[#121316]">{m.milestoneTitle}</h3>
                    <p className="text-xs text-gray-600">Project: <span className="font-bold">{m.projectTitle}</span></p>
                    <p className="text-xs text-gray-500">Submitted by: {m.submittedBy} on {m.date}</p>
                  </div>

                  <div>
                    {m.status === 'PENDING_FACULTY_REVIEW' ? (
                      <button
                        onClick={() => handleVerifyMilestone(m.id)}
                        className="bg-[#0F534A] hover:bg-[#0b3d36] text-white px-4 py-2 text-xs font-headline font-black uppercase transition-all cursor-pointer"
                      >
                        Authenticate Milestone
                      </button>
                    ) : (
                      <span className="text-xs font-headline font-black text-[#0F534A] uppercase bg-[#9EFC5F]/30 px-3 py-1.5 rounded">
                        Milestone Certified ✓
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: STAGE GATE APPROVALS */}
        {activeTab === 'stagegate' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Technology Readiness Level (TRL) Stage Gates
              </h2>
              <p className="text-xs text-gray-500">
                Formal faculty sign-off to advance academic concept into incubator prototype stage
              </p>
            </div>

            <div className="p-4 border-2 border-[#121316] bg-[#FCFBF7] flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase bg-[#FFDD33] text-[#121316] px-2 py-0.5">
                  Pending Gate: TRL 3 → TRL 4
                </span>
                <h4 className="font-headline font-black text-sm text-[#121316] mt-1">
                  Graphene Biosensor for Dengue NS1 Detection
                </h4>
                <p className="text-xs text-gray-600">Proof of Concept established. Ready for wet lab microfluidic validation.</p>
              </div>
              <button
                onClick={() => toast.success('Stage Gate TRL 4 approved by supervising faculty')}
                className="bg-[#4717AE] hover:bg-[#39128f] text-white text-xs font-headline font-black uppercase px-3 py-1.5 cursor-pointer"
              >
                Approve Stage Gate
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: LAB BOOKINGS */}
        {activeTab === 'labs' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Department Lab Equipment Scheduling
              </h2>
              <p className="text-xs text-gray-500">
                Manage high-precision analytical instruments and student bench allocation
              </p>
            </div>

            <div className="space-y-3">
              {labBookings.map((b) => (
                <div key={b.id} className="p-4 border-2 border-[#121316] bg-[#FCFBF7] flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-gray-500">{b.id}</span>
                    <h4 className="font-headline font-black text-sm text-[#121316]">{b.equipment}</h4>
                    <p className="text-xs text-gray-600">{b.labName} • Reserved by: <span className="font-bold">{b.reservedBy}</span></p>
                    <p className="text-xs text-gray-500 font-bold">{b.timeSlot}</p>
                  </div>
                  <div>
                    {b.status === 'PENDING_APPROVAL' ? (
                      <button
                        onClick={() => handleApproveLabBooking(b.id)}
                        className="bg-[#0F534A] hover:bg-[#0b3d36] text-white text-xs font-headline font-black uppercase px-3 py-1.5 cursor-pointer"
                      >
                        Approve Slot
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-[#0F534A] uppercase bg-[#9EFC5F]/20 px-2 py-1 rounded">
                        Authorized ✓
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 6: WORKFLOW REVIEWS */}
        {activeTab === 'workflows' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Academic Workflow Approvals
              </h2>
              <p className="text-xs text-gray-500">
                Research grant approvals, travel grants for paper presentations, and institutional sign-offs
              </p>
            </div>

            <div className="p-4 border-2 border-[#121316] bg-[#9EFC5F]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0F534A]" />
                <span className="text-xs font-bold text-[#0F534A]">All academic review pipelines up to date.</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </UnifiedDashboardLayout>
  );
}
