import React from "react";
import { Link } from "react-router-dom";
import { LEGAL_ENTITIES, getActiveDomainLegalContext } from "../config/legalConfig";

export const TermsAndConditionsPage: React.FC = () => {
  const { isOrg, office, ipPolicy, agePolicy } = getActiveDomainLegalContext();

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#121316] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Back Link & Breadcrumb */}
        <div className="flex items-center gap-2 text-sm font-medium">
          <Link
            to="/"
            className="text-[#0F534A] hover:text-[#FE4E1A] flex items-center gap-1 font-headline font-bold transition-colors"
          >
            ← Back to Home
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-600">Legal Documentation</span>
        </div>

        {/* Header Banner */}
        <div className="bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#121316] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-[#FFDD33] text-[#121316] border border-[#121316] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
              Legal Agreement
            </span>
            <span className="bg-[#9EFC5F] text-[#121316] border border-[#121316] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
              Last Updated: October 2026
            </span>
            {isOrg ? (
              <span className="bg-[#18D7E8] text-[#121316] border border-[#121316] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
                Public Programmes &amp; DAF Terms
              </span>
            ) : (
              <span className="bg-[#FEB3FC] text-[#121316] border border-[#121316] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
                Technology Platform &amp; FICPL Terms
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-headline font-black tracking-tight text-[#121316] mb-2">
            Terms &amp; Conditions
          </h1>
          <p className="text-base text-gray-700 font-sans leading-relaxed">
            Please read these terms carefully before accessing or using DreamXec.
            By creating an account, browsing proposals, donating, or submitting research, you enter into a legally binding agreement.
          </p>
        </div>

        {/* Document Content */}
        <div className="bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#121316] p-6 sm:p-10 space-y-8 font-sans leading-relaxed">
          
          {/* Section 1: Entities & Operating Structure */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#FE4E1A] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                1
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Operating Entities &amp; Dual-Domain Governance
              </h2>
            </div>
            <p className="text-gray-700 text-sm sm:text-base">
              The DreamXec ecosystem operates under a collaborative dual-entity architecture designed to strictly segregate commercial technology operations from philanthropic and educational grant administration:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="bg-[#FFFDF8] border-2 border-[#121316] p-4 shadow-[3px_3px_0px_#121316]">
                <h3 className="font-headline font-black text-[#4717AE] text-sm uppercase mb-1">
                  Technology Platform Operator (.com)
                </h3>
                <p className="text-xs font-bold text-gray-800">{LEGAL_ENTITIES.TECH_OPERATOR.legalName}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Owns and operates platform code, cloud infrastructure, AI models, and commercial institutional SaaS dashboards.
                </p>
              </div>
              <div className="bg-[#FFFDF8] border-2 border-[#121316] p-4 shadow-[3px_3px_0px_#121316]">
                <h3 className="font-headline font-black text-[#0F534A] text-sm uppercase mb-1">
                  Grant &amp; Philanthropic Custodian (.org)
                </h3>
                <p className="text-xs font-bold text-gray-800">{LEGAL_ENTITIES.FOUNDATION.legalName}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Non-profit entity administering public donations, CSR contributions, institutional research grants, and milestone disbursements.
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 italic pt-1">
              <strong>Registered Office:</strong> {office.fullAddress}. 
              The trademark and brand identity &quot;DreamXec&quot; are owned by the Founder individually and licensed non-exclusively to the operating entities.
            </p>
          </section>

          <hr className="border-t-2 border-gray-200" />

          {/* Section 2: Intellectual Property (IP) Ownership */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#0F534A] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                2
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Student &amp; Researcher Intellectual Property Ownership
              </h2>
            </div>
            <div className="bg-[#9EFC5F]/20 border-2 border-[#121316] p-4 shadow-[3px_3px_0px_#121316] rounded-none">
              <p className="font-headline font-black text-[#0F534A] text-sm sm:text-base">
                ★ 100% Student Project Ownership — Zero Platform Equity Grab
              </p>
              <p className="text-xs sm:text-sm text-gray-800 mt-1">
                The student innovator, project team, or primary researcher retains complete ({ipPolicy.studentOwnershipPercentage}%) 
                ownership of all research, algorithms, software code, circuit designs, and physical inventions created through DreamXec.
              </p>
            </div>
            <p className="text-gray-700 text-sm">
              Neither FICPL nor DreamXec Academic Foundation claims any equity, patent ownership, or intellectual property rights 
              in student projects. Student ownership is subject only to the pre-existing intellectual property regulations of the 
              student&apos;s own affiliated educational institution.
            </p>
            <p className="text-gray-700 text-sm">
              <strong>Limited Platform License:</strong> By posting project abstracts, updates, lab logs, and demo videos, users grant 
              DreamXec a limited, worldwide, non-exclusive, royalty-free license solely to host, index, display, and share progress 
              with verified donors, mentors, and corporate funders for academic reporting, transparency, and audit verification.
            </p>
          </section>

          <hr className="border-t-2 border-gray-200" />

          {/* Section 3: Eligibility, Minors & Academic Guardians */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#4717AE] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                3
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Eligibility, Minors (Ages 16–17) &amp; Academic Guardians
              </h2>
            </div>
            <p className="text-gray-700 text-sm sm:text-base">
              DreamXec is built to support higher-education innovators, including 1st-year university, engineering, polytechnic, 
              and diploma students.
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
              <li>
                <strong>Minimum Age:</strong> Users must be at least <strong>{agePolicy.minimumAge} years of age</strong> to create an account.
              </li>
              <li>
                <strong>Minor Participation (Ages 16–17):</strong> Under the Indian Majority Act (1875) and Digital Personal Data Protection (DPDP) Act (2023), 
                students aged 16–17 are eligible to participate with mandatory <strong>Institutional Affiliation &amp; Faculty Guide sponsorship</strong> (acting <em>in loco parentis</em>) 
                and parent/guardian consent.
              </li>
              <li>
                <strong>Zero Debt Liability for Minors:</strong> Grants and milestone disbursements are never structured as personal loans or debt. 
                Disbursements are routed directly to verified GST vendors (materials/equipment) or institutional project accounts to shield minors from financial liabilities.
              </li>
            </ul>
          </section>

          <hr className="border-t-2 border-gray-200" />

          {/* Section 4: Types of Users & Code of Conduct */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#F4002C] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                4
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Authorized Users &amp; Platform Conduct
              </h2>
            </div>
            <p className="text-gray-700 text-sm">
              The platform facilitates structured collaboration between the following distinct user roles:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="border border-gray-300 p-2.5 bg-gray-50">
                <strong>Student / Researcher:</strong> Submit verified proposals, log milestone evidence, publish research outputs, and manage team updates.
              </div>
              <div className="border border-gray-300 p-2.5 bg-gray-50">
                <strong>Faculty / Guide:</strong> Review project proposals, provide academic supervision, and endorse milestone submissions.
              </div>
              <div className="border border-gray-300 p-2.5 bg-gray-50">
                <strong>Institution / College Admin:</strong> Verify student institutional rosters, oversee departmental campaigns, and govern campus innovation labs.
              </div>
              <div className="border border-gray-300 p-2.5 bg-gray-50">
                <strong>Mentor / Juror:</strong> Evaluate milestones, conduct technical assessments, and provide guidance under non-disclosure obligations.
              </div>
              <div className="border border-gray-300 p-2.5 bg-gray-50">
                <strong>Corporate / CSR Funder:</strong> Fund research programmes, monitor milestone completion, and evaluate researcher talent cards.
              </div>
              <div className="border border-gray-300 p-2.5 bg-gray-50">
                <strong>Individual Donor:</strong> Make direct non-profit contributions on dreamxec.org to support specific student research projects.
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Users agree not to upload fraudulent milestone proof, fabricate invoices, infringe third-party patents, or submit academic work authored by unauthorized third parties.
            </p>
          </section>

          <hr className="border-t-2 border-gray-200" />

          {/* Section 5: Maker-Checker Milestone Disbursement */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#FE4E1A] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                5
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Milestone-Tranche Disbursement (Maker-Checker)
              </h2>
            </div>
            <p className="text-gray-700 text-sm">
              To safeguard public and CSR funds, DreamXec operates an immutable dual-authorization model:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
              <li><strong>Tranche Releases Only:</strong> Project funds are released strictly against approved milestones (e.g., proof of concept, prototyping, testing). 100% upfront disbursements are prohibited.</li>
              <li><strong>Maker Verification:</strong> A designated Grant Officer reviews geotagged prototype images, demo videos, and verified GST vendor invoices.</li>
              <li><strong>Checker Authorization:</strong> A Finance Officer verifies compliance, bank coordinates, and authorizes settlement through DAF&apos;s escrow/gateway account.</li>
            </ul>
          </section>

          <hr className="border-t-2 border-gray-200" />

          {/* Section 6: Grievance Redressal */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#0F534A] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                6
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Grievance Officer &amp; Dispute Resolution
              </h2>
            </div>
            <p className="text-gray-700 text-sm">
              In compliance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 
              and the Digital Personal Data Protection Act, 2023, you may contact our Grievance Officer:
            </p>
            <div className="bg-[#FFFDF8] border-2 border-[#121316] p-4 text-xs space-y-1">
              <p><strong>Officer:</strong> {LEGAL_ENTITIES.GRIEVANCE_OFFICER.name}</p>
              <p><strong>Designation:</strong> {LEGAL_ENTITIES.GRIEVANCE_OFFICER.designation}</p>
              <p><strong>Email:</strong> <a href={`mailto:${LEGAL_ENTITIES.GRIEVANCE_OFFICER.email}`} className="text-[#0F534A] underline font-bold">{LEGAL_ENTITIES.GRIEVANCE_OFFICER.email}</a></p>
              <p><strong>Address:</strong> {LEGAL_ENTITIES.GRIEVANCE_OFFICER.address}</p>
              <p><strong>Response Timeline:</strong> Acknowledged within 24 hours; resolved within 15 days.</p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsPage;
