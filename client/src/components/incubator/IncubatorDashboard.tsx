import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Briefcase,
  Rocket,
  Award,
  TrendingUp,
  CheckCircle2,
  Users,
  Search,
  Building2,
  ArrowRight,
  Target,
  ExternalLink,
  Layers,
  Sparkles
} from 'lucide-react';
import UnifiedDashboardLayout from '../layout/UnifiedDashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function IncubatorDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  const activeOrgId = (user?.activeProfile as any)?.organizationId || (user as any)?.organizationId;
  const activeOrgName = (user?.activeProfile as any)?.orgName || 'Campus Innovation Incubator';

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'overview');
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  const [startups, setStartups] = useState<any[]>([
    {
      id: 'st-01',
      name: 'TerraCharge Energy Labs',
      stage: 'INCUBATION',
      founder: 'Vikram Joshi',
      seedRaised: '₹18,00,000',
      cohort: 'Cohort Fall 2025',
      mentor: 'Dr. Suresh V.',
      milestoneStatus: 'TRL 6 Prototype'
    },
    {
      id: 'st-02',
      name: 'AeroAutonomous Systems',
      stage: 'ACCELERATION',
      founder: 'Sneha Roy',
      seedRaised: '₹35,00,000',
      cohort: 'Cohort Spring 2025',
      mentor: 'Priya Narang',
      milestoneStatus: 'First Commercial Pilot'
    },
    {
      id: 'st-03',
      name: 'BioSensor Diagnostics',
      stage: 'PRE_INCUBATION',
      founder: 'Rohan Deshmukh',
      seedRaised: '₹5,00,000',
      cohort: 'Cohort Fall 2026',
      mentor: 'Prof. Ananya Sen',
      milestoneStatus: 'Lab Validation'
    }
  ]);

  const [milestones, setMilestones] = useState<any[]>([
    {
      id: 'ms-inc-01',
      startupName: 'TerraCharge Energy Labs',
      title: 'Pack Level Battery Thermal Safety Validation',
      status: 'PENDING_EVALUATION',
      grantRelease: '₹3,00,000'
    },
    {
      id: 'ms-inc-02',
      startupName: 'AeroAutonomous Systems',
      title: 'Customer Purchase Order & Deployment Contract',
      status: 'PENDING_EVALUATION',
      grantRelease: '₹5,00,000'
    }
  ]);

  const handleVerifyMilestone = (id: string) => {
    setMilestones(prev =>
      prev.map(m => m.id === id ? { ...m, status: 'VERIFIED' } : m)
    );
    toast.success('Incubator milestone verified. Fund disbursement queued.');
  };

  return (
    <UnifiedDashboardLayout
      title={`${activeOrgName} • Incubator & Accelerator Hub | DreamXec`}
      headerTitle={`${activeOrgName} • Incubator Manager Hub`}
      headerSubtitle="Manage campus startup pipeline, conduct stage gate advancement panels, and verify commercial milestones"
    >
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#18D7E8] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#18D7E8]/20 text-[#0F534A] border-2 border-[#121316] px-2.5 py-0.5 text-xs font-headline font-black uppercase tracking-wider">
                    <Briefcase className="w-3.5 h-3.5 text-[#0F534A]" /> Incubator Manager Console
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#0F534A]/10 text-[#0F534A] border-2 border-[#121316] px-2 py-0.5 text-[11px] font-headline font-black uppercase">
                    <Building2 className="w-3 h-3" /> {activeOrgName}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-headline font-black text-[#121316] uppercase tracking-tight">
                  Startup Incubation Pipeline &amp; Portfolio Hub
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-2xl">
                  Nurture deeptech student ventures from lab proof-of-concept through incubator cohorts, funding syndicates, and market scaling.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => handleTabChange('pipeline')}
                  className="bg-[#FE4E1A] hover:bg-[#e03d0d] text-white text-xs font-headline font-black uppercase tracking-wider px-3.5 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Rocket className="w-4 h-4" /> Active Ventures ({startups.length})
                </button>
                <button
                  onClick={() => handleTabChange('milestones')}
                  className="bg-[#0F534A] hover:bg-[#0b3d36] text-white text-xs font-headline font-black uppercase tracking-wider px-3.5 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Milestones ({milestones.filter(m => m.status === 'PENDING_EVALUATION').length})
                </button>
              </div>
            </div>

            {/* 4 KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#18D7E8] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Incubated Startups</span>
                  <Rocket className="w-4 h-4 text-[#18D7E8]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#121316]">
                  {startups.length} Ventures
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Across 3 Active Cohorts</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#9EFC5F] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Seed Capital Mobilized</span>
                  <TrendingUp className="w-4 h-4 text-[#0F534A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#0F534A]">
                  ₹58.0 Lakhs
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Grants &amp; Angel Syndicate</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FFDD33] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Stage Gate Reviews</span>
                  <Award className="w-4 h-4 text-[#FE4E1A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#121316]">
                  2 Due This Month
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Cohort Advancement</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Commercial Pilots</span>
                  <CheckCircle2 className="w-4 h-4 text-[#FE4E1A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#FE4E1A]">
                  4 Signed LOIs
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Industry Partner Deployments</p>
              </div>
            </div>

            {/* Pipeline Preview */}
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-black text-base uppercase text-[#121316]">
                    Portfolio Ventures Overview
                  </h3>
                  <p className="text-xs text-gray-500">Active deeptech startup cohorts in the incubation funnel</p>
                </div>
                <button
                  onClick={() => handleTabChange('pipeline')}
                  className="text-xs font-headline font-black uppercase text-[#FE4E1A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View Pipeline Kanban</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {startups.map((s) => (
                  <div key={s.id} className="p-4 border-2 border-[#121316] bg-[#FCFBF7] shadow-[2px_2px_0_#0F534A] space-y-2">
                    <span className="text-[10px] font-headline font-black uppercase px-2 py-0.5 bg-[#FFDD33] text-[#121316] border border-[#121316] inline-block">
                      {s.stage}
                    </span>
                    <h4 className="font-headline font-black text-sm text-[#121316]">{s.name}</h4>
                    <p className="text-xs text-gray-600">Founder: {s.founder} • {s.cohort}</p>
                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-500">Funding:</span>
                      <span className="font-headline font-black text-[#0F534A]">{s.seedRaised}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STARTUP PIPELINE */}
        {activeTab === 'pipeline' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Incubation Lifecycle Pipeline
              </h2>
              <p className="text-xs text-gray-500">
                Kanban tracking across Pre-incubation, Active Incubation, Acceleration, and Graduation
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['PRE_INCUBATION', 'INCUBATION', 'ACCELERATION'].map((colStage) => (
                <div key={colStage} className="bg-[#FCFBF7] border-2 border-[#121316] p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b-2 border-[#121316]">
                    <h3 className="font-headline font-black text-xs uppercase text-[#121316]">
                      {colStage.replace(/_/g, ' ')}
                    </h3>
                    <span className="bg-[#121316] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {startups.filter(s => s.stage === colStage).length}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {startups.filter(s => s.stage === colStage).map(st => (
                      <div key={st.id} className="p-3 bg-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] space-y-1.5">
                        <h4 className="font-headline font-black text-xs uppercase text-[#121316]">{st.name}</h4>
                        <p className="text-[11px] text-gray-600">Lead: {st.founder}</p>
                        <p className="text-[10px] text-gray-500 font-bold">Progress: {st.milestoneStatus}</p>
                        <div className="pt-1.5 border-t border-gray-100 flex justify-between text-[11px]">
                          <span className="font-bold text-[#0F534A]">{st.seedRaised}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{st.cohort}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: STAGE GATE REVIEWS */}
        {activeTab === 'stagegate' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Incubator Stage Gate Advancement Panels
              </h2>
              <p className="text-xs text-gray-500">
                Formal review committees to promote startups to higher seed funding tranches
              </p>
            </div>

            <div className="p-4 border-2 border-[#121316] bg-[#FCFBF7] flex justify-between items-center">
              <div>
                <span className="text-[10px] font-bold uppercase bg-[#9EFC5F] text-[#0F534A] px-2 py-0.5">
                  Advance to Acceleration
                </span>
                <h4 className="font-headline font-black text-sm text-[#121316] mt-1">TerraCharge Energy Labs</h4>
                <p className="text-xs text-gray-600">All lab test gates cleared. Ready for ₹25 Lakh Acceleration Tranche.</p>
              </div>
              <button
                onClick={() => toast.success('Startup advanced to Acceleration cohort')}
                className="bg-[#0F534A] hover:bg-[#0b3d36] text-white text-xs font-headline font-black uppercase px-3 py-1.5 cursor-pointer"
              >
                Approve Advancement
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: MILESTONES */}
        {activeTab === 'milestones' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Commercial &amp; Technical Milestone Verification
              </h2>
              <p className="text-xs text-gray-500">
                Confirm deliverable achievement to trigger milestone tranche release from smart escrow
              </p>
            </div>

            <div className="space-y-3">
              {milestones.map((m) => (
                <div key={m.id} className="p-4 border-2 border-[#121316] bg-[#FCFBF7] shadow-[2px_2px_0_#18D7E8] flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase bg-[#FFDD33] text-[#121316] px-2 py-0.5">
                      Release: {m.grantRelease}
                    </span>
                    <h4 className="font-headline font-black text-sm text-[#121316] mt-1">{m.title}</h4>
                    <p className="text-xs text-gray-600">Venture: <span className="font-bold">{m.startupName}</span></p>
                  </div>
                  <div>
                    {m.status === 'PENDING_EVALUATION' ? (
                      <button
                        onClick={() => handleVerifyMilestone(m.id)}
                        className="bg-[#0F534A] hover:bg-[#0b3d36] text-white text-xs font-headline font-black uppercase px-3.5 py-1.5 cursor-pointer"
                      >
                        Verify &amp; Disburse
                      </button>
                    ) : (
                      <span className="text-xs font-headline font-black text-[#0F534A] uppercase bg-[#9EFC5F]/30 px-3 py-1.5 rounded">
                        Released ✓
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: WORKFLOWS */}
        {activeTab === 'workflows' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Incubation Program Workflows
              </h2>
              <p className="text-xs text-gray-500">
                Cohort onboarding, legal incorporation advisory, and patent review workflows
              </p>
            </div>

            <div className="p-4 border-2 border-[#121316] bg-[#9EFC5F]/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#0F534A]" />
                <span className="text-xs font-bold text-[#0F534A]">All venture workflows active. Zero bottlenecks.</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </UnifiedDashboardLayout>
  );
}
