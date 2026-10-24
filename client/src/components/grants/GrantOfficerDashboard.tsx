import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Award,
  DollarSign,
  TrendingUp,
  FileText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  Building2,
  ArrowRight,
  ExternalLink,
  Target,
  BarChart3
} from 'lucide-react';
import UnifiedDashboardLayout from '../layout/UnifiedDashboardLayout';
import { useAuth } from '../../context/AuthContext';

export default function GrantOfficerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  const activeOrgId = (user?.activeProfile as any)?.organizationId || (user as any)?.organizationId;
  const activeOrgName = (user?.activeProfile as any)?.orgName || 'Institutional Grant Administration';

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'overview');
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  // State for posted grants
  const [grants, setGrants] = useState<any[]>([
    {
      id: 'g-2026-01',
      title: 'Clean Energy & Microgrid Innovation Grant 2026',
      scheme: 'Renewable R&D Corpus',
      allocatedBudget: 2500000,
      disbursedBudget: 1200000,
      deadline: '2026-11-15',
      applicationsCount: 14,
      status: 'ACTIVE'
    },
    {
      id: 'g-2026-02',
      title: 'Deeptech & AI Robotics Seed Grant',
      scheme: 'DST Innovation Fund',
      allocatedBudget: 4000000,
      disbursedBudget: 2800000,
      deadline: '2026-10-30',
      applicationsCount: 22,
      status: 'ACTIVE'
    },
    {
      id: 'g-2026-03',
      title: 'Biomedical Diagnostic Device Accelerator Grant',
      scheme: 'BIRAC Institutional Partner Fund',
      allocatedBudget: 3000000,
      disbursedBudget: 3000000,
      deadline: '2026-08-31',
      applicationsCount: 18,
      status: 'CLOSED'
    }
  ]);

  // State for Grant Applications
  const [applications, setApplications] = useState<any[]>([
    {
      id: 'app-901',
      applicantName: 'Vikram Joshi (Team TerraCharge)',
      grantId: 'g-2026-01',
      projectTitle: 'Solid-State Zinc-Air Battery for Rural Microgrids',
      requestedAmount: 500000,
      score: '92/100',
      status: 'RECOMMENDED',
      submittedDate: '2026-09-18'
    },
    {
      id: 'app-902',
      applicantName: 'Sneha Roy (Autonomous Aero Club)',
      grantId: 'g-2026-02',
      projectTitle: 'Sub-Kilogram Disaster Search Drone Swarm',
      requestedAmount: 750000,
      score: '88/100',
      status: 'UNDER_REVIEW',
      submittedDate: '2026-09-21'
    },
    {
      id: 'app-903',
      applicantName: 'Dr. Vivek Menon',
      grantId: 'g-2026-01',
      projectTitle: 'Supercapacitive Nano-Electrodes for Solar Pumping',
      requestedAmount: 600000,
      score: '76/100',
      status: 'ALLOCATED',
      submittedDate: '2026-09-12'
    }
  ]);

  // New Grant Form State
  const [newTitle, setNewTitle] = useState('');
  const [newScheme, setNewScheme] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newDeadline, setNewDeadline] = useState('');

  const handlePostGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newAmount) {
      toast.error('Please enter grant title and budget amount');
      return;
    }
    const created = {
      id: `g-2026-${String(grants.length + 1).padStart(2, '0')}`,
      title: newTitle,
      scheme: newScheme || 'Institutional Research Fund',
      allocatedBudget: Number(newAmount),
      disbursedBudget: 0,
      deadline: newDeadline || '2026-12-31',
      applicationsCount: 0,
      status: 'ACTIVE'
    };
    setGrants([created, ...grants]);
    toast.success('Grant opportunity published successfully');
    setNewTitle('');
    setNewScheme('');
    setNewAmount('');
    setNewDeadline('');
  };

  const handleAllocate = (appId: string) => {
    setApplications(prev =>
      prev.map(a => a.id === appId ? { ...a, status: 'ALLOCATED' } : a)
    );
    toast.success(`Grant fund successfully allocated to application ${appId}`);
  };

  const totalBudget = grants.reduce((sum, g) => sum + g.allocatedBudget, 0);
  const totalDisbursed = grants.reduce((sum, g) => sum + g.disbursedBudget, 0);

  return (
    <UnifiedDashboardLayout
      title={`${activeOrgName} • Grant Officer Console | DreamXec`}
      headerTitle={`${activeOrgName} • Grant Officer Hub`}
      headerSubtitle="Manage institutional research grant calls, allocate capital tranches, and review proposal submissions"
    >
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FFDD33] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-xs font-headline font-black uppercase tracking-wider">
                    <Award className="w-3.5 h-3.5 text-[#FE4E1A]" /> Grant Officer Console
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#0F534A]/10 text-[#0F534A] border-2 border-[#121316] px-2 py-0.5 text-[11px] font-headline font-black uppercase">
                    <Building2 className="w-3 h-3" /> {activeOrgName}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-headline font-black text-[#121316] uppercase tracking-tight">
                  Grant Management &amp; Allocation Command
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-2xl">
                  Administer research calls, manage external and internal endowment schemes, and track milestone disbursements for funded cohorts.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => handleTabChange('post')}
                  className="bg-[#FE4E1A] hover:bg-[#e03d0d] text-white text-xs font-headline font-black uppercase tracking-wider px-3.5 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Post New Grant Call
                </button>
                <button
                  onClick={() => handleTabChange('applications')}
                  className="bg-[#0F534A] hover:bg-[#0b3d36] text-white text-xs font-headline font-black uppercase tracking-wider px-3.5 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4" /> Review Applications ({applications.length})
                </button>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FFDD33] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Total Grant Corpus</span>
                  <Award className="w-4 h-4 text-[#FE4E1A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#0F534A]">
                  ₹{(totalBudget / 100000).toFixed(1)} Lakhs
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Across {grants.length} Active Schemes</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#0F534A] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Disbursed Funds</span>
                  <DollarSign className="w-4 h-4 text-[#0F534A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#121316]">
                  ₹{(totalDisbursed / 100000).toFixed(1)} Lakhs
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Verified Milestone Releases</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#9EFC5F] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Available to Allocate</span>
                  <Target className="w-4 h-4 text-[#0F534A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#FE4E1A]">
                  ₹{((totalBudget - totalDisbursed) / 100000).toFixed(1)} Lakhs
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Ready For Cohort Selection</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#4717AE] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Applications Received</span>
                  <FileText className="w-4 h-4 text-[#4717AE]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#121316]">
                  {applications.length} Submissions
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Researchers &amp; Student Teams</p>
              </div>
            </div>

            {/* Active Grants Portfolio Table */}
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-black text-base uppercase text-[#121316]">
                    Active Grant Opportunities
                  </h3>
                  <p className="text-xs text-gray-500">Currently accepting student &amp; faculty innovation proposals</p>
                </div>
                <button
                  onClick={() => handleTabChange('post')}
                  className="text-xs font-headline font-black uppercase text-[#FE4E1A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Manage All Calls</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {grants.map((g) => (
                  <div key={g.id} className="p-4 border-2 border-[#121316] bg-[#FCFBF7] shadow-[2px_2px_0_#0F534A] space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase bg-[#FFDD33] text-[#121316] px-2 py-0.5 border border-[#121316]">
                          {g.scheme}
                        </span>
                        <h4 className="font-headline font-black text-sm text-[#121316] mt-1.5">{g.title}</h4>
                      </div>
                      <span className={`px-2 py-0.5 text-[10px] font-headline font-black uppercase rounded ${g.status === 'ACTIVE' ? 'bg-[#9EFC5F] text-[#0F534A]' : 'bg-gray-200 text-gray-600'}`}>
                        {g.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block font-bold">Total Budget</span>
                        <span className="font-headline font-black text-[#0F534A]">₹{g.allocatedBudget.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block font-bold">Applications</span>
                        <span className="font-headline font-black text-[#121316]">{g.applicationsCount} Teams</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: POST GRANTS */}
        {activeTab === 'post' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] p-6 space-y-4">
              <h2 className="font-headline font-black text-lg uppercase text-[#121316]">
                Publish Grant Opportunity
              </h2>
              <p className="text-xs text-gray-600">
                Create a competitive call for proposals scoped to your campus innovators
              </p>

              <form onSubmit={handlePostGrant} className="space-y-4 text-xs font-bold">
                <div>
                  <label className="block uppercase text-gray-700 mb-1">Grant Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. AI for Healthcare Call 2026"
                    className="w-full p-2.5 border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block uppercase text-gray-700 mb-1">Funding Scheme / Sponsor</label>
                  <input
                    type="text"
                    value={newScheme}
                    onChange={(e) => setNewScheme(e.target.value)}
                    placeholder="e.g. DST Scheme / Institutional CSR"
                    className="w-full p-2.5 border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block uppercase text-gray-700 mb-1">Total Pool Budget (₹)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="e.g. 1500000"
                    className="w-full p-2.5 border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block uppercase text-gray-700 mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="w-full p-2.5 border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#FE4E1A] hover:bg-[#d83f12] text-white font-headline font-black uppercase tracking-wider text-xs border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
                >
                  Publish Grant Call
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
              <h2 className="font-headline font-black text-lg uppercase text-[#121316]">
                Existing Grant Calls ({grants.length})
              </h2>
              <div className="space-y-3">
                {grants.map((g) => (
                  <div key={g.id} className="p-4 border-2 border-[#121316] bg-[#FCFBF7] flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-gray-500">{g.id}</span>
                      <h4 className="font-headline font-black text-sm text-[#121316]">{g.title}</h4>
                      <p className="text-xs text-gray-600 font-bold">Scheme: {g.scheme} • Deadline: {g.deadline}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-headline font-black text-[#0F534A] block">₹{g.allocatedBudget.toLocaleString('en-IN')}</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase">{g.applicationsCount} Applicants</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: APPLICATIONS & ALLOCATION */}
        {(activeTab === 'applications' || activeTab === 'allocate') && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Grant Applications &amp; Fund Allocation Matrix
              </h2>
              <p className="text-xs text-gray-500">
                Score student proposals, evaluate milestone roadmaps, and approve grant allocations
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FCFBF7] border-b-2 border-[#121316] font-headline font-black uppercase text-gray-700">
                  <tr>
                    <th className="py-3 px-3">Applicant &amp; Project</th>
                    <th className="py-3 px-3">Requested Grant</th>
                    <th className="py-3 px-3">Rubric Score</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">Allocation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="py-3.5 px-3">
                        <p className="font-bold text-[#121316] text-sm">{app.projectTitle}</p>
                        <p className="text-[11px] text-gray-500">{app.applicantName} • {app.submittedDate}</p>
                      </td>
                      <td className="py-3.5 px-3 font-headline font-black text-[#0F534A]">
                        ₹{app.requestedAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold bg-[#4717AE]/15 text-[#4717AE] px-2 py-0.5 rounded">
                          {app.score}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-headline font-black uppercase rounded ${app.status === 'ALLOCATED' ? 'bg-[#9EFC5F] text-[#0F534A]' : app.status === 'RECOMMENDED' ? 'bg-[#FFDD33] text-[#121316]' : 'bg-gray-200 text-gray-700'}`}>
                          {app.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {app.status !== 'ALLOCATED' ? (
                          <button
                            onClick={() => handleAllocate(app.id)}
                            className="bg-[#0F534A] hover:bg-[#0b3d36] text-white px-3 py-1.5 text-xs font-headline font-black uppercase transition-all cursor-pointer"
                          >
                            Allocate Grant
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-[#0F534A] uppercase">Funded ✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: MILESTONE TRACKING */}
        {activeTab === 'milestones' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Funded Project Milestone Releases
              </h2>
              <p className="text-xs text-gray-500">
                Grant tranches held in dual-custody smart escrow pending proof of research deliverables
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-4 border-2 border-[#121316] bg-[#FCFBF7] flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase bg-[#9EFC5F] text-[#0F534A] px-2 py-0.5">
                    Tranche 2 of 3 (₹2,50,000)
                  </span>
                  <h4 className="font-headline font-black text-sm text-[#121316] mt-1">Solid-State Zinc-Air Battery for Rural Microgrids</h4>
                  <p className="text-xs text-gray-600">Deliverable: Anode Cycling Test Report &amp; Third-Party Lab Validation</p>
                </div>
                <button
                  onClick={() => toast.success('Tranche 2 verified for disbursement')}
                  className="bg-[#0F534A] hover:bg-[#0b3d36] text-white text-xs font-headline font-black uppercase px-3 py-1.5 cursor-pointer"
                >
                  Verify Tranche Release
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </UnifiedDashboardLayout>
  );
}
