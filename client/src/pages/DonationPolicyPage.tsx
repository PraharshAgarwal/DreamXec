import React from "react";
import { Link } from "react-router-dom";
import { LEGAL_ENTITIES, getActiveDomainLegalContext } from "../config/legalConfig";

export const DonationPolicyPage: React.FC = () => {
  const { office, grievance } = getActiveDomainLegalContext();

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#121316] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link
            to="/"
            className="text-[#0F534A] hover:text-[#FE4E1A] flex items-center gap-1 font-headline font-bold transition-colors"
          >
            ← Back to Home
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">Philanthropy &amp; Grant Governance</span>
        </div>

        {/* Header Banner */}
        <div className="bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#121316] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-[#18D7E8] text-[#121316] border border-[#121316] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
              DAF Philanthropic Policy
            </span>
            <span className="bg-[#FFDD33] text-[#121316] border border-[#121316] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
              Domain: dreamxec.org
            </span>
            <span className="bg-[#9EFC5F] text-[#121316] border border-[#121316] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
              Maker-Checker Governed
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-headline font-black tracking-tight text-[#121316] mb-2">
            Donation &amp; Research Grant Policy
          </h1>
          <p className="text-base text-gray-700 font-sans leading-relaxed">
            Transparent governance guidelines governing public crowdfunding donations, CSR contributions, 
            and milestone tranche disbursements for verified student innovations.
          </p>
        </div>

        {/* Policy Body */}
        <div className="bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#121316] p-6 sm:p-10 space-y-8 font-sans leading-relaxed">
          
          {/* Section 1: Who Receives the Funds */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#0F534A] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                1
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Fund Custody &amp; Receiving Entity (DAF)
              </h2>
            </div>
            <div className="bg-[#FFFDF8] border-2 border-[#121316] p-4 shadow-[3px_3px_0px_#121316]">
              <p className="font-headline font-black text-[#0F534A] text-sm">
                Recipient: {LEGAL_ENTITIES.FOUNDATION.legalName} ({LEGAL_ENTITIES.FOUNDATION.shortName})
              </p>
              <p className="text-xs text-gray-700 mt-1">
                All donations, public crowdfunding contributions, and Corporate Social Responsibility (CSR) funds 
                raised through <strong>dreamxec.org</strong> are received directly into the dedicated, audited bank accounts 
                of DreamXec Academic Foundation.
              </p>
            </div>
            <p className="text-xs sm:text-sm text-gray-700">
              <strong>Strict Fund Segregation:</strong> FICPL Private Limited (the technology platform operator) does not hold, 
              control, or take title to donor funds. FICPL receives only its arm&apos;s-length technology service fees under the 
              formal inter-entity agreement, and standard SaaS subscription fees from colleges and corporates.
            </p>
          </section>

          <hr className="border-t-2 border-gray-200" />

          {/* Section 2: Milestone Tranche Disbursement (Maker-Checker) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#FE4E1A] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                2
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Maker-Checker Milestone Release Model
              </h2>
            </div>
            <p className="text-gray-700 text-sm">
              Donated funds are never disbursed in a single upfront lump sum. Disbursements occur strictly in 
              verifiable milestone tranches:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="border-2 border-[#121316] p-3.5 bg-gray-50 shadow-[2px_2px_0px_#121316]">
                <h4 className="font-black text-[#FE4E1A] uppercase mb-1">Step 1: Maker Verification</h4>
                <p className="text-gray-600">
                  A platform Grant Officer verifies milestone deliverables, lab logs, geotagged prototype media, and 
                  verified vendor GST invoices.
                </p>
              </div>
              <div className="border-2 border-[#121316] p-3.5 bg-gray-50 shadow-[2px_2px_0px_#121316]">
                <h4 className="font-black text-[#0F534A] uppercase mb-1">Step 2: Checker Authorization</h4>
                <p className="text-gray-600">
                  A Finance Officer verifies bank coordinates, budget ceilings, and authorises release either directly to 
                  the verified vendor or to the institutional project account.
                </p>
              </div>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200" />

          {/* Section 3: Tax Deductions (80G) & Receipts */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#4717AE] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                3
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Tax Exemption Certificates (Section 80G)
              </h2>
            </div>
            <p className="text-gray-700 text-sm">
              Eligible donations made to DAF on <strong>dreamxec.org</strong> qualify for tax deduction benefits under Section 80G 
              of the Indian Income Tax Act, 1961:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
              <li><strong>PAN Requirement:</strong> To claim an 80G tax deduction, Indian tax regulations require donors to provide a valid Permanent Account Number (PAN).</li>
              <li><strong>Form 10BE Filing:</strong> DAF files annual donor contribution returns with the Income Tax Department, enabling automatic pre-fill in the donor&apos;s Annual Information Statement (AIS).</li>
              <li><strong>Receipt Generation:</strong> An instant cryptographic receipt is generated and emailed upon payment capture.</li>
            </ul>
          </section>

          <hr className="border-t-2 border-gray-200" />

          {/* Section 4: Refund Policy */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#F4002C] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                4
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Refund &amp; Cancellation Policy
              </h2>
            </div>
            <p className="text-gray-700 text-sm">
              As philanthropic contributions are allocated immediately towards research budgets and milestone escrows:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
              <li><strong>Finality of Donations:</strong> Once processed, charitable donations are non-refundable.</li>
              <li><strong>Duplicate or Erroneous Transactions:</strong> If a technical error or duplicate payment occurs, donors must notify <a href={`mailto:${grievance.supportEmail}`} className="text-[#0F534A] underline font-bold">{grievance.supportEmail}</a> within 48 hours with the transaction ID. Verified duplicates will be refunded to the original payment method within 5–7 business days.</li>
              <li><strong>Cancelled / Aborted Projects:</strong> If a student research project is formally discontinued before milestone funds are disbursed, remaining unreleased funds are re-allocated to comparable institutional research grants under DAF board oversight.</li>
            </ul>
          </section>

          <hr className="border-t-2 border-gray-200" />

          {/* Section 5: Registered Office */}
          <section className="space-y-2 text-xs text-gray-600 bg-gray-50 border border-gray-200 p-4">
            <p><strong>Custodian Office:</strong> {LEGAL_ENTITIES.FOUNDATION.legalName}, {office.fullAddress}</p>
            <p><strong>Grievance &amp; Compliance Officer:</strong> {grievance.name} | Email: <a href={`mailto:${grievance.email}`} className="text-[#0F534A] underline font-bold">{grievance.email}</a></p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default DonationPolicyPage;
