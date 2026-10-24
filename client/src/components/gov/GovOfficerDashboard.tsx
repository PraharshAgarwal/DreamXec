import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Building2,
  FileText,
  Award,
  Receipt,
  Download,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import UnifiedDashboardLayout from '../layout/UnifiedDashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function GovOfficerDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  const activeOrgName = (user?.activeProfile as any)?.orgName || 'Ministry of Science & Technology';

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'overview');
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  const [problemStatements, setProblemStatements] = useState<any[]>([
    {
      id: 'gov-ps-01',
      title: 'Low-Cost Real-Time Air Quality Sensor Mesh for Smart Cities',
      ministry: 'Ministry of Housing & Urban Affairs',
      bountyPool: '₹25,00,000',
      solutionsSubmitted: 18,
      status: 'ACTIVE'
    },
    {
      id: 'gov-ps-02',
      title: 'Indigenous High-Efficiency Solar Desalination Unit for Coastal Villages',
      ministry: 'Ministry of Jal Shakti',
      bountyPool: '₹50,00,000',
      solutionsSubmitted: 24,
      status: 'ACTIVE'
    }
  ]);

  const [grantSchemes, setGrantSchemes] = useState<any[]>([
    {
      id: 'sch-01',
      name: 'SERB Core Research Grant (CRG) Scheme 2026',
      totalAllocation: '₹1.50 Crore',
      activeProjects: 12,
      utilizationRate: '78%'
    },
    {
      id: 'sch-02',
      name: 'BIRAC BIG Deeptech Innovation Grant',
      totalAllocation: '₹2.00 Crore',
      activeProjects: 15,
      utilizationRate: '91%'
    }
  ]);

  return (
    <UnifiedDashboardLayout
      title={`${activeOrgName} • Government Officer Portal | DreamXec`}
      headerTitle={`${activeOrgName} • Government Innovation Portal`}
      headerSubtitle="Issue national problem statements, oversee public research schemes, and audit statutory Utilization Certificates (UC)"
    >
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#0F534A] text-white border-2 border-[#121316] px-2.5 py-0.5 text-xs font-headline font-black uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 text-[#FFDD33]" /> Public Sector Console
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2 py-0.5 text-[11px] font-headline font-black uppercase">
                    Government Official
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-headline font-black text-[#121316] uppercase tracking-tight">
                  National Innovation &amp; Grant Administration
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-2xl">
                  Mobilize university researchers against key national priorities and ensure auditable public fund disbursement through smart escrow contracts.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => handleTabChange('problems')}
                  className="bg-[#FE4E1A] hover:bg-[#e03d0d] text-white text-xs font-headline font-black uppercase tracking-wider px-3.5 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Issue Problem Statement
                </button>
                <button
                  onClick={() => handleTabChange('uc')}
                  className="bg-[#0F534A] hover:bg-[#0b3d36] text-white text-xs font-headline font-black uppercase tracking-wider px-3.5 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" /> Audit UCs
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#0F534A] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Problem Statements</span>
                  <FileText className="w-4 h-4 text-[#0F534A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#0F534A]">
                  {problemStatements.length} Active
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">National Grand Challenges</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FFDD33] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Active Schemes</span>
                  <Award className="w-4 h-4 text-[#FE4E1A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#121316]">
                  {grantSchemes.length} Managed
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">DST &amp; Central Schemes</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#9EFC5F] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Public Funds Allocated</span>
                  <TrendingUp className="w-4 h-4 text-[#0F534A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#0F534A]">
                  ₹3.50 Crores
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Escrow Tranche Protected</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">UC Audit Compliance</span>
                  <Receipt className="w-4 h-4 text-[#FE4E1A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#FE4E1A]">
                  100% Certified
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">CAG &amp; GFR Compliant</p>
              </div>
            </div>

            {/* Problem Statements Preview */}
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-black text-base uppercase text-[#121316]">
                    Active National Problem Statements
                  </h3>
                  <p className="text-xs text-gray-500">Government grand challenges open to university innovators</p>
                </div>
                <button
                  onClick={() => handleTabChange('problems')}
                  className="text-xs font-headline font-black uppercase text-[#FE4E1A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Manage Challenges</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {problemStatements.map((ps) => (
                  <div key={ps.id} className="p-4 border-2 border-[#121316] bg-[#FCFBF7] shadow-[2px_2px_0_#0F534A] flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-bold uppercase bg-[#FFDD33] text-[#121316] px-2 py-0.5">
                        {ps.ministry}
                      </span>
                      <h4 className="font-headline font-black text-sm text-[#121316] mt-1">{ps.title}</h4>
                      <p className="text-xs text-gray-600 font-medium">Bounty Pool: <span className="font-bold text-[#0F534A]">{ps.bountyPool}</span> • Submissions: {ps.solutionsSubmitted}</p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-headline font-black uppercase bg-[#9EFC5F] text-[#0F534A] rounded">
                      {ps.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PROBLEM STATEMENTS */}
        {activeTab === 'problems' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4 flex justify-between items-center">
              <div>
                <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                  National &amp; State Problem Statements
                </h2>
                <p className="text-xs text-gray-500">
                  Publish challenges with dedicated grant pools for academic solving
                </p>
              </div>
              <button
                onClick={() => toast.success('New problem statement drafted')}
                className="bg-[#FE4E1A] text-white px-3.5 py-2 text-xs font-headline font-black uppercase cursor-pointer"
              >
                + Issue New Statement
              </button>
            </div>

            <div className="space-y-4">
              {problemStatements.map((ps) => (
                <div key={ps.id} className="p-4 border-2 border-[#121316] bg-[#FCFBF7] flex justify-between items-center">
                  <div>
                    <h4 className="font-headline font-black text-sm text-[#121316]">{ps.title}</h4>
                    <p className="text-xs text-gray-600">{ps.ministry} • Bounty: {ps.bountyPool}</p>
                  </div>
                  <span className="text-xs font-bold text-gray-700">{ps.solutionsSubmitted} Submissions Received</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: GRANT SCHEMES */}
        {activeTab === 'schemes' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Central &amp; Institutional Grant Schemes
              </h2>
              <p className="text-xs text-gray-500">
                Oversight of public research schemes and fund utilization performance
              </p>
            </div>

            <div className="space-y-3">
              {grantSchemes.map((sch) => (
                <div key={sch.id} className="p-4 border-2 border-[#121316] bg-[#FCFBF7] flex justify-between items-center">
                  <div>
                    <h4 className="font-headline font-black text-sm text-[#121316]">{sch.name}</h4>
                    <p className="text-xs text-gray-600">Active Funded Cohorts: {sch.activeProjects} Research Teams</p>
                  </div>
                  <div className="text-right">
                    <span className="font-headline font-black text-[#0F534A] block">{sch.totalAllocation}</span>
                    <span className="text-[10px] font-bold text-gray-500">Utilization: {sch.utilizationRate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: UC EXPORT */}
        {activeTab === 'uc' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Statutory Utilization Certificates (UC) Registry
              </h2>
              <p className="text-xs text-gray-500">
                Audited GFR-19A forms submitted by participating universities
              </p>
            </div>

            <div className="p-4 border-2 border-[#121316] bg-[#FCFBF7] flex justify-between items-center">
              <div>
                <h4 className="font-headline font-black text-sm text-[#121316]">Consolidated National Research UC 2026</h4>
                <p className="text-xs text-gray-600">Verified by Comptroller &amp; Finance Officers across 48 Campuses</p>
              </div>
              <button
                onClick={() => toast.success('Utilization Certificate dossier downloaded')}
                className="bg-[#0F534A] text-white px-3.5 py-1.5 text-xs font-headline font-black uppercase flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" /> Download UC Dossier
              </button>
            </div>
          </div>
        )}

      </div>
    </UnifiedDashboardLayout>
  );
}
