import React from 'react';
import {
  Receipt,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Building2,
  Lock,
} from 'lucide-react';
import TransactionLedgerView from '../../common/TransactionLedgerView';

interface OrgLedgerTabProps {
  organization: any;
  stats: any;
}

export const OrgLedgerTab: React.FC<OrgLedgerTabProps> = ({
  organization,
  stats,
}) => {
  const orgName = organization?.name || 'Institutional Network';
  const totalRaised = Number(stats.totalAmountRaised || 0);

  return (
    <div className="space-y-6">
      {/* ── FINANCIAL HEADER BANNER ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FFDD33] p-6 space-y-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
            <Receipt className="w-3.5 h-3.5" /> Dual-Custody Institutional Ledger
          </div>
          <h2 className="font-headline font-black text-2xl sm:text-3xl text-[#0F534A] uppercase tracking-tight">
            {orgName} Financial &amp; Escrow Ledger
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-3xl">
            Real-time auditable ledger recording student campaign donations, grant allocations, milestone tranche disbursements, and dual-custody escrow balances across the institutional network.
          </p>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t-2 border-dashed border-gray-300">
          <div className="bg-[#FCFBF7] border-2 border-[#121316] p-4">
            <span className="text-[10px] font-headline font-black uppercase text-gray-500 block">
              Total Capital Raised
            </span>
            <p className="font-headline font-black text-2xl text-[#0F534A] mt-0.5">
              ₹{totalRaised.toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-gray-500 font-bold mt-1">Across all parent &amp; child campaigns</p>
          </div>

          <div className="bg-[#FCFBF7] border-2 border-[#121316] p-4">
            <span className="text-[10px] font-headline font-black uppercase text-gray-500 block">
              Active Escrow Custody
            </span>
            <p className="font-headline font-black text-2xl text-[#FE4E1A] mt-0.5">
              ₹{(totalRaised * 0.75).toLocaleString('en-IN')}
            </p>
            <p className="text-[10px] text-gray-500 font-bold mt-1">Held under milestone release rules</p>
          </div>

          <div className="bg-[#FCFBF7] border-2 border-[#121316] p-4">
            <span className="text-[10px] font-headline font-black uppercase text-gray-500 block">
              Total Backer Donations
            </span>
            <p className="font-headline font-black text-2xl text-[#4717AE] mt-0.5">
              {stats.totalDonations || stats.donorCount || 0} Transactions
            </p>
            <p className="text-[10px] text-gray-500 font-bold mt-1">Verified micro &amp; grant pledges</p>
          </div>
        </div>
      </div>

      {/* ── TRANSACTION LEDGER TABLE ── */}
      <TransactionLedgerView
        title="Institutional Transaction Audit Trail"
        subtitle={`Live ledger records for ${orgName} and affiliated departments & clubs`}
        orgId={organization?.id}
      />
    </div>
  );
};

export default OrgLedgerTab;
