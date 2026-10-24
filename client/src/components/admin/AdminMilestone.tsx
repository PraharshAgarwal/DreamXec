import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  ChevronDown,
  Folder,
  Award,
  AlertTriangle,
  DollarSign,
  Search,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import { getAllMilestones, verifyMilestone } from '../../services/adminService';
import SEO from '../SEO';

type FilterStatus = '' | 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

// ─── Milestone Row ────────────────────────────────────────────────────────────
function MilestoneRow({
  m,
  onVerify,
}: {
  m: any;
  onVerify: (id: string, status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED', feedback?: string) => void;
}) {
  const sub = m.submissions?.[0];
  const proofLink =
    m.proofUrl ||
    sub?.evidenceMediaUrls?.[0] ||
    sub?.evidenceDocumentUrls?.[0] ||
    sub?.proofUrl;
  const amount = Number(m.amount ?? m.budget ?? m.targetAmount ?? 0);
  const statusUpper = (m.status || '').toUpperCase();
  const isSubmitted = ['SUBMITTED', 'UNDER_VERIFICATION', 'IN_PROGRESS'].includes(statusUpper);
  const isApproved = statusUpper === 'APPROVED';
  const isSettled = ['FUNDS_RELEASED', 'COMPLETED'].includes(statusUpper);
  const isRejected = ['REJECTED', 'CANCELLED', 'REVISION_REQUIRED'].includes(statusUpper);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-4 items-start p-4 bg-[#FCFBF7] border-b-2 border-[#121316] last:border-0 hover:bg-white transition-colors">
      {/* Title & Metadata */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-headline font-black text-sm text-[#0F534A] uppercase">
            {m.title}
          </span>
          <span
            className={`px-2 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] ${
              isSettled
                ? 'bg-[#9EFC5F] text-[#0F534A]'
                : isApproved
                ? 'bg-[#FFDD33] text-[#121316]'
                : isRejected
                ? 'bg-[#F4002C] text-white'
                : 'bg-white text-[#121316]'
            }`}
          >
            {m.status}
          </span>
        </div>
        {m.description && <p className="text-xs text-gray-600 font-medium line-clamp-2">{m.description}</p>}
        {sub?.narrative && (
          <p className="text-xs text-gray-700 font-medium bg-white p-2 border border-gray-300">
            <strong className="text-[#0F534A]">Proof Submission:</strong> {sub.narrative}
          </p>
        )}
        {m.adminFeedback && (
          <p className="text-xs text-[#F4002C] font-bold">↳ Revision Note: {m.adminFeedback}</p>
        )}
      </div>

      {/* Budget */}
      <div className="text-left md:text-right">
        <span className="text-[10px] text-gray-500 font-bold uppercase block">Escrow Tranche</span>
        <span className="text-sm font-mono font-bold text-[#FE4E1A]">
          ₹{amount.toLocaleString('en-IN')}
        </span>
      </div>

      {/* Proof Link */}
      <div className="flex items-center">
        {proofLink ? (
          <a
            href={proofLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-headline font-black uppercase text-[#121316] bg-[#FFDD33] border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-white"
          >
            Deliverable <ExternalLink className="w-3 h-3" />
          </a>
        ) : (
          <span className="text-xs text-gray-400 font-mono">—</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 justify-start md:justify-end flex-wrap">
        {isSubmitted && (
          <>
            <button
              onClick={() => onVerify(m.id, 'APPROVED')}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-headline font-black uppercase text-white bg-[#0F534A] border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] hover:bg-[#0b3d36] cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" /> Maker Verify ✓
            </button>
            <button
              onClick={() => {
                const notes = prompt('Enter revision instructions for the creator:');
                if (notes) onVerify(m.id, 'REVISION_REQUIRED', notes);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-headline font-black uppercase text-[#121316] bg-[#FFDD33] border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#e6c72b] cursor-pointer"
            >
              Revisions ✍️
            </button>
            <button
              onClick={() => {
                const reason = prompt('Enter rejection reason:');
                if (reason) onVerify(m.id, 'REJECTED', reason);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-headline font-black uppercase text-white bg-[#F4002C] border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#c90024] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> Reject ✗
            </button>
          </>
        )}
        {isApproved && (
          <span className="text-[10px] font-headline font-black text-[#121316] bg-[#FFDD33] px-2 py-0.5 border border-[#121316] uppercase">
            ⏳ Maker Verified • Awaiting Finance Checker
          </span>
        )}
        {isSettled && (
          <span className="text-xs font-headline font-black text-[#0B9C2C] uppercase">
            ✓ Released to Beneficiary
          </span>
        )}
        {isRejected && (
          <span className="text-xs font-headline font-black text-[#F4002C] uppercase">
            ✗ {statusUpper === 'REVISION_REQUIRED' ? 'Revisions Requested' : 'Rejected'}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Campaign Accordion ───────────────────────────────────────────────────────
function CampaignAccordion({
  projectTitle,
  projectOwner,
  milestones,
  onVerify,
  defaultOpen,
}: {
  projectTitle: string;
  projectOwner: string;
  milestones: any[];
  onVerify: (id: string, status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED', feedback?: string) => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  const totalBudget = (milestones || []).reduce(
    (sum, m) => sum + Number(m.amount ?? m.budget ?? m.targetAmount ?? 0),
    0
  );

  return (
    <div className="border-4 border-[#121316] shadow-[6px_6px_0_#4717AE] bg-white overflow-hidden">
      {/* Accordion Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-4 sm:p-5 bg-white hover:bg-[#FCFBF7] transition-colors text-left border-b-3 border-[#121316] cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0_#121316] flex items-center justify-center font-bold flex-shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-headline font-black text-base sm:text-lg text-[#0F534A] uppercase leading-tight">
              {projectTitle}
            </h3>
            <p className="text-xs text-gray-600 font-bold uppercase">Creator: {projectOwner}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <span className="text-[10px] text-gray-500 font-bold uppercase block">Campaign Escrow</span>
            <span className="text-sm font-mono font-bold text-[#0F534A]">
              ₹{totalBudget.toLocaleString('en-IN')}
            </span>
          </div>

          <span className="px-2.5 py-1 bg-[#4717AE] text-white text-[10px] font-headline font-black uppercase border-2 border-[#121316]">
            {milestones.length} Tranches
          </span>

          <ChevronDown
            className={`w-5 h-5 text-[#121316] transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Milestone List */}
      {open && (
        <div className="divide-y-2 divide-[#121316]">
          {milestones.map((m) => (
            <MilestoneRow key={m.id} m={m} onVerify={onVerify} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminMilestones({ embedded = false }: { embedded?: boolean }) {
  const [milestones, setMilestones] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({
    PENDING: 0,
    SUBMITTED: 0,
    APPROVED: 0,
    REJECTED: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('');

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getAllMilestones(filter || undefined);
      const fetchedList = res.data?.milestones || (Array.isArray(res.data) ? res.data : []);
      setMilestones(fetchedList);
      setCounts(
        res.data?.counts || {
          PENDING: 0,
          SUBMITTED: 0,
          APPROVED: 0,
          REJECTED: 0,
          total: fetchedList.length,
        }
      );
    } catch (err) {
      console.error('Fetch error', err);
      setMilestones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (
    id: string,
    status: 'APPROVED' | 'REJECTED' | 'REVISION_REQUIRED',
    feedback?: string
  ) => {
    if (!window.confirm(`Are you sure you want to mark this milestone as ${status}?`)) return;
    const toastId = toast.loading('Updating milestone escrow status...');
    try {
      await verifyMilestone(id, status, feedback || undefined);
      toast.success(
        status === 'APPROVED'
          ? 'Proof verified by Maker! Queued for Finance Checker release.'
          : `Milestone marked as ${status}.`,
        { id: toastId }
      );
      loadData();
    } catch (e: any) {
      toast.error(e?.message || 'Action failed', { id: toastId });
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, { title: string; owner: string; items: any[] }>();
    (milestones || []).forEach((m) => {
      const pid = m.project?.id ?? m.campaignId ?? 'unknown';
      if (!map.has(pid)) {
        map.set(pid, {
          title: m.project?.title ?? m.campaign?.title ?? 'Student Campaign',
          owner: m.project?.user?.name ?? m.campaign?.student?.name ?? 'Lead Creator',
          items: [],
        });
      }
      map.get(pid)!.items.push(m);
    });
    return Array.from(map.entries());
  }, [milestones]);

  const filterTabs: { label: string; value: FilterStatus }[] = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Submitted', value: 'SUBMITTED' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  const content = (
    <div className="space-y-6">
      {/* Header Banner */}
      {!embedded && (
        <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5" /> Milestone Dual-Custody Escrow
            </div>
            <h1 className="text-3xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
              Milestone Escrow Governance
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium">
              Inspect submitted proofs of progress and release milestone tranches to students.
            </p>
          </div>

          <button
            onClick={loadData}
            className="px-5 py-2 bg-[#0F534A] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] hover:bg-[#0b3d36] cursor-pointer"
          >
            🔄 Refresh Escrow
          </button>
        </div>
      )}

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Pending Submission', count: counts?.PENDING ?? 0, color: 'bg-white text-[#121316] border-[#121316]' },
          { label: 'Awaiting Verification', count: counts?.SUBMITTED ?? 0, color: 'bg-[#FFF9F2] text-[#FE4E1A] border-[#FE4E1A]' },
          { label: 'Funds Released', count: counts?.APPROVED ?? 0, color: 'bg-white text-[#0F534A] border-[#0F534A]' },
          { label: 'Revision Required', count: counts?.REJECTED ?? 0, color: 'bg-white text-[#F4002C] border-[#F4002C]' },
        ].map((s) => (
          <div key={s.label} className={`p-4 border-3 shadow-[3px_3px_0_#121316] text-center ${s.color}`}>
            <p className="text-2xl sm:text-3xl font-headline font-black">{s.count}</p>
            <p className="text-[10px] font-headline font-black uppercase tracking-wider mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-white p-1.5 border-3 border-[#121316] shadow-[3px_3px_0_#121316] gap-1 overflow-x-auto">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
              filter === tab.value
                ? 'bg-[#FE4E1A] text-white border-[#121316] shadow-[2px_2px_0_#121316]'
                : 'border-transparent text-gray-700 hover:bg-[#FCFBF7]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Accordion */}
      {loading ? (
        <div className="p-16 text-center text-[#0F534A] font-headline font-black text-xl animate-pulse uppercase bg-white border-4 border-[#121316]">
          Loading milestone disbursements...
        </div>
      ) : grouped.length === 0 ? (
        <div className="p-16 text-center bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] space-y-2">
          <AlertTriangle className="w-8 h-8 text-[#FE4E1A] mx-auto" />
          <h3 className="font-headline font-black text-xl text-[#0F534A] uppercase">
            No milestones found
          </h3>
          <p className="text-xs text-gray-600 font-medium">
            Milestones will appear when campaigns submit deliverables for review.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([pid, { title, owner, items }], idx) => (
            <CampaignAccordion
              key={pid}
              projectTitle={title}
              projectOwner={owner}
              milestones={items}
              onVerify={handleVerify}
              defaultOpen={idx === 0}
            />
          ))}
        </div>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <>
      <SEO
        title="Milestone Escrow Governance | DreamX Admin"
        description="Dual custody milestone release and deliverable verification."
      />
      <div className="flex min-h-screen bg-[#FCFBF7] text-[#121316]">
        <AdminSidebar activeTab="milestones" />
        <main className="flex-1 min-w-0 overflow-y-auto px-6 lg:px-10 py-8">
          {content}
        </main>
      </div>
    </>
  );
}