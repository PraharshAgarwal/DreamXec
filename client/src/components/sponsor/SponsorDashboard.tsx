import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  HeartHandshake,
  TrendingUp,
  Receipt,
  Award,
  Plus,
  Rocket,
  CheckCircle2,
  Building2,
  Download,
  ArrowRight,
  ExternalLink,
  Target
} from 'lucide-react';
import UnifiedDashboardLayout from '../layout/UnifiedDashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function SponsorDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  const activeOrgName = (user?.activeProfile as any)?.orgName || 'Corporate Innovation Partner';

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'overview');
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  const [fundedProjects, setFundedProjects] = useState<any[]>([
    {
      id: 'sp-01',
      title: 'TerraCharge High-Density Battery Storage',
      category: 'CleanTech & Sustainable Mobility',
      fundedAmount: '₹15,00,000',
      milestonesCompleted: '3 of 4',
      impactScore: '94/100',
      status: 'ON_TRACK'
    },
    {
      id: 'sp-02',
      title: 'AeroAutonomous AI Disaster Swarm',
      category: 'Public Safety & AI Robotics',
      fundedAmount: '₹20,00,000',
      milestonesCompleted: '2 of 3',
      impactScore: '98/100',
      status: 'ON_TRACK'
    }
  ]);

  return (
    <UnifiedDashboardLayout
      title={`${activeOrgName} • Corporate Sponsor Hub | DreamXec`}
      headerTitle={`${activeOrgName} • Corporate Partner Portal`}
      headerSubtitle="Deploy corporate R&D & CSR capital into verified student startups, track ESG impact, and review milestone audits"
    >
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#FE4E1A]/15 text-[#FE4E1A] border-2 border-[#121316] px-2.5 py-0.5 text-xs font-headline font-black uppercase tracking-wider">
                    <HeartHandshake className="w-3.5 h-3.5" /> Corporate Sponsor Console
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#0F534A]/10 text-[#0F534A] border-2 border-[#121316] px-2 py-0.5 text-[11px] font-headline font-black uppercase">
                    <Building2 className="w-3 h-3" /> {activeOrgName}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-headline font-black text-[#121316] uppercase tracking-tight">
                  Corporate Innovation &amp; CSR Portfolio
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-2xl">
                  Fund pioneering student inventions, govern milestone escrow releases, and download audited Section 135 CSR &amp; Section 80G tax certificates.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => handleTabChange('post-grants')}
                  className="bg-[#FE4E1A] hover:bg-[#e03d0d] text-white text-xs font-headline font-black uppercase tracking-wider px-3.5 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Create Challenge Grant
                </button>
                <button
                  onClick={() => handleTabChange('funded')}
                  className="bg-[#0F534A] hover:bg-[#0b3d36] text-white text-xs font-headline font-black uppercase tracking-wider px-3.5 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Rocket className="w-4 h-4" /> Backed Startups ({fundedProjects.length})
                </button>
              </div>
            </div>

            {/* 4 KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Total Capital Deployed</span>
                  <Receipt className="w-4 h-4 text-[#FE4E1A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#FE4E1A]">
                  ₹35,00,000
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">CSR &amp; Innovation Budget</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#0F534A] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Startups Backed</span>
                  <Rocket className="w-4 h-4 text-[#0F534A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#0F534A]">
                  {fundedProjects.length} Ventures
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Direct Campus Partnerships</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FFDD33] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">ESG Impact Score</span>
                  <Award className="w-4 h-4 text-[#FE4E1A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#121316]">
                  96 / 100
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Audited Sustainability Index</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#9EFC5F] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Tax Exemption</span>
                  <CheckCircle2 className="w-4 h-4 text-[#0F534A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#0F534A]">
                  100% Eligible
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Section 80G Certified</p>
              </div>
            </div>

            {/* Backed Projects Preview */}
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-black text-base uppercase text-[#121316]">
                    Funded Innovation Ventures
                  </h3>
                  <p className="text-xs text-gray-500">Student teams supported by your corporate endowment</p>
                </div>
                <button
                  onClick={() => handleTabChange('funded')}
                  className="text-xs font-headline font-black uppercase text-[#FE4E1A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All Projects</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fundedProjects.map((p) => (
                  <div key={p.id} className="p-4 border-2 border-[#121316] bg-[#FCFBF7] shadow-[2px_2px_0_#0F534A] space-y-2">
                    <span className="text-[10px] font-bold uppercase bg-[#FFDD33] text-[#121316] px-2 py-0.5 border border-[#121316]">
                      {p.category}
                    </span>
                    <h4 className="font-headline font-black text-sm text-[#121316]">{p.title}</h4>
                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block font-bold">Funding Deployed</span>
                        <span className="font-headline font-black text-[#0F534A]">{p.fundedAmount}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-gray-500 uppercase block font-bold">Milestones</span>
                        <span className="font-bold text-gray-800">{p.milestonesCompleted}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FUNDED PROJECTS */}
        {activeTab === 'funded' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Corporate-Funded Research &amp; Innovation Portfolio
              </h2>
              <p className="text-xs text-gray-500">
                Direct progress telemetry and milestone deliverables from supported ventures
              </p>
            </div>

            <div className="space-y-4">
              {fundedProjects.map((proj) => (
                <div key={proj.id} className="p-5 border-2 border-[#121316] bg-[#FCFBF7] shadow-[2px_2px_0_#FE4E1A] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase bg-[#FFDD33] text-[#121316] px-2 py-0.5 border border-[#121316]">
                      {proj.category}
                    </span>
                    <h3 className="font-headline font-black text-base text-[#121316]">{proj.title}</h3>
                    <p className="text-xs text-gray-600">Funded Amount: <span className="font-bold text-[#0F534A]">{proj.fundedAmount}</span> • Impact Score: <span className="font-bold">{proj.impactScore}</span></p>
                  </div>
                  <div className="text-right">
                    <span className="px-3 py-1 text-xs font-headline font-black uppercase bg-[#9EFC5F] text-[#0F534A] rounded inline-block">
                      {proj.status}
                    </span>
                    <p className="text-xs text-gray-500 font-bold mt-1">Milestones: {proj.milestonesCompleted}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: LEDGER */}
        {activeTab === 'ledger' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Corporate CSR &amp; Endowment Ledger
              </h2>
              <p className="text-xs text-gray-500">
                Audited transaction receipts and 80G tax deductions for corporate filings
              </p>
            </div>

            <div className="p-4 border-2 border-[#121316] bg-[#FCFBF7] flex justify-between items-center">
              <div>
                <h4 className="font-headline font-black text-sm text-[#121316]">Annual CSR Impact Dossier 2025-2026</h4>
                <p className="text-xs text-gray-600">Verified by institutional escrow controllers and eligible under Companies Act Schedule VII</p>
              </div>
              <button
                onClick={() => toast.success('CSR Audit Dossier downloaded')}
                className="bg-[#0F534A] text-white px-3.5 py-1.5 text-xs font-headline font-black uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download CSR Audit Dossier
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: POST GRANTS */}
        {activeTab === 'post-grants' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Issue Corporate Innovation Challenge / Bounty
              </h2>
              <p className="text-xs text-gray-500">
                Post targeted problem statements for campus innovators to prototype solutions
              </p>
            </div>

            <div className="p-6 border-2 border-[#121316] bg-[#FCFBF7] max-w-xl space-y-4 text-xs font-bold">
              <div>
                <label className="block uppercase text-gray-700 mb-1">Challenge Title</label>
                <input
                  type="text"
                  placeholder="e.g. Next-Gen EV Battery Recycling Bounty"
                  className="w-full p-2.5 border-2 border-[#121316] bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block uppercase text-gray-700 mb-1">Bounty / Grant Pool (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1000000"
                  className="w-full p-2.5 border-2 border-[#121316] bg-white focus:outline-none"
                />
              </div>
              <button
                onClick={() => toast.success('Corporate Challenge posted to campus network')}
                className="w-full py-3 bg-[#FE4E1A] hover:bg-[#d83f12] text-white font-headline font-black uppercase tracking-wider text-xs border-2 border-[#121316] shadow-[2px_2px_0_#121316] cursor-pointer"
              >
                Publish Challenge Grant
              </button>
            </div>
          </div>
        )}

      </div>
    </UnifiedDashboardLayout>
  );
}
