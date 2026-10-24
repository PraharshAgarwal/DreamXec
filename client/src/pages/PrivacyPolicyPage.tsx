import React from "react";
import { Link } from "react-router-dom";
import { LEGAL_ENTITIES, getActiveDomainLegalContext } from "../config/legalConfig";

export const PrivacyPolicyPage: React.FC = () => {
  const { isOrg, office, grievance } = getActiveDomainLegalContext();

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
          <span className="text-gray-600">Privacy &amp; Data Protection</span>
        </div>

        {/* Header Banner */}
        <div className="bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#121316] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-[#9EFC5F] text-[#121316] border border-[#121316] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
              DPDP Act, 2023 Compliant
            </span>
            <span className="bg-[#FFDD33] text-[#121316] border border-[#121316] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
              Version: DPDP-2023-v1.2
            </span>
            {isOrg ? (
              <span className="bg-[#18D7E8] text-[#121316] border border-[#121316] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
                DAF Philanthropy Portal
              </span>
            ) : (
              <span className="bg-[#FEB3FC] text-[#121316] border border-[#121316] px-2.5 py-0.5 text-xs font-black uppercase tracking-wider">
                FICPL Platform Services
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-headline font-black tracking-tight text-[#121316] mb-2">
            Privacy Policy &amp; Data Governance
          </h1>
          <p className="text-base text-gray-700 font-sans leading-relaxed">
            DreamXec is committed to protecting your personal data in strict compliance with the 
            <strong> Digital Personal Data Protection (DPDP) Act, 2023</strong> and the 
            <strong> Information Technology Act, 2000</strong>.
          </p>
        </div>

        {/* Policy Body */}
        <div className="bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#121316] p-6 sm:p-10 space-y-8 font-sans leading-relaxed">
          
          {/* Section 1: Data Fiduciary Identity */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#FE4E1A] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                1
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Data Fiduciary Identity &amp; Contact Information
              </h2>
            </div>
            <p className="text-gray-700 text-sm">
              Your personal data is managed by <strong>{LEGAL_ENTITIES.TECH_OPERATOR.legalName}</strong> (as the Platform Technology Provider and primary Data Fiduciary for dreamxec.com) 
              and <strong>{LEGAL_ENTITIES.FOUNDATION.legalName}</strong> (as the Data Fiduciary for grant administration and donor processing on dreamxec.org).
            </p>
            <p className="text-xs text-gray-600 bg-gray-50 border border-gray-200 p-3">
              <strong>Registered Office:</strong> {office.fullAddress}. 
              For queries related to your personal data or privacy rights, contact: <a href={`mailto:${grievance.email}`} className="text-[#0F534A] underline font-bold">{grievance.email}</a>.
            </p>
          </section>

          <hr className="border-t-2 border-gray-200" />

          {/* Section 2: What Data We Collect & Why */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#0F534A] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                2
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Categories of Personal Data Collected
              </h2>
            </div>
            <p className="text-gray-700 text-sm">
              In accordance with the DPDP principle of <em>Data Minimization</em>, we collect only information necessary to deliver research verification and grant services:
            </p>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1.5">
              <li><strong>Student &amp; Researcher Identity:</strong> Full name, institutional email address, phone number, college ID card copy, and academic program.</li>
              <li><strong>Government Identity &amp; DigiLocker Data:</strong> Where opted-in, consented APAAR ID (Automated Permanent Academic Account Registry), ABC ID, and verified degree records fetched cryptographically via DigiLocker APIs.</li>
              <li><strong>Project Evidence:</strong> Project proposals, lab logs, demo videos, and vendor GST invoices uploaded for milestone tranche disbursements.</li>
              <li><strong>Donor &amp; CSR Records:</strong> Donor name, email, PAN card number (required for issuing Form 10BE / 80G tax exemption certificates under the Indian Income Tax Act), and transaction amounts.</li>
            </ul>
          </section>

          <hr className="border-t-2 border-gray-200" />

          {/* Section 3: Protection of Minors / Children (Section 9 DPDP Act) */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#4717AE] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                3
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Protection of Minor Students (Ages 16–17)
              </h2>
            </div>
            <div className="bg-[#18D7E8]/10 border-2 border-[#121316] p-4 shadow-[3px_3px_0px_#121316]">
              <p className="font-headline font-black text-[#0F534A] text-sm">
                Special Protections for Children under Section 9 of the DPDP Act, 2023
              </p>
              <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-800 mt-2 space-y-1">
                <li><strong>No Behavioral Tracking:</strong> DreamXec does not track online behavior or engage in behavioral monitoring of users under 18.</li>
                <li><strong>No Targeted Advertising:</strong> No targeted advertisements or promotional commercial marketing are directed at minor students.</li>
                <li><strong>No Detrimental Processing:</strong> No data processing that could cause physical, psychological, or academic harm to a child is permitted.</li>
                <li><strong>Academic &amp; Guardian Consent:</strong> Minor student participation requires endorsement by a verified Faculty Guide / Institution and confirmed parent/guardian consent.</li>
              </ul>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200" />

          {/* Section 4: Your Rights as a Data Principal */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#F4002C] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                4
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Your Rights under the DPDP Act, 2023
              </h2>
            </div>
            <p className="text-gray-700 text-sm">
              As a Data Principal, you possess statutory rights enforceable directly through your profile settings or by contacting our Grievance Officer:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="border border-gray-300 p-3 bg-gray-50">
                <strong>Right to Access (Section 11):</strong> Request a structured summary of your personal data, processing activities, and identities of data fiduciaries with whom it was shared.
              </div>
              <div className="border border-gray-300 p-3 bg-gray-50">
                <strong>Right to Correction &amp; Erasure (Section 12):</strong> Correct inaccurate data or request complete deletion of personal records upon completion of active project milestones.
              </div>
              <div className="border border-gray-300 p-3 bg-gray-50">
                <strong>Right of Grievance Redressal (Section 13):</strong> File a grievance regarding data misuse, with guaranteed resolution within 15 days before escalating to the Data Protection Board of India.
              </div>
              <div className="border border-gray-300 p-3 bg-gray-50">
                <strong>Right to Nominate (Section 14):</strong> Nominate an individual to exercise your privacy rights in the event of death or incapacity.
              </div>
            </div>
          </section>

          <hr className="border-t-2 border-gray-200" />

          {/* Section 5: Statutory Grievance Redressal */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 bg-[#FE4E1A] text-white flex items-center justify-center font-black text-xs border border-[#121316]">
                5
              </span>
              <h2 className="text-xl font-headline font-black text-[#121316]">
                Grievance Redressal Mechanism &amp; Timelines
              </h2>
            </div>
            <p className="text-gray-700 text-sm">
              If you have any privacy concerns, complaints regarding consent revocation, or unauthorized data sharing, you may lodge a formal complaint:
            </p>
            <div className="bg-[#FFFDF8] border-2 border-[#121316] p-4 text-xs space-y-1.5 shadow-[2px_2px_0px_#121316]">
              <p><strong>Designated Officer:</strong> {grievance.name} ({grievance.designation})</p>
              <p><strong>Email Address:</strong> <a href={`mailto:${grievance.email}`} className="text-[#0F534A] underline font-bold">{grievance.email}</a></p>
              <p><strong>Registered Office:</strong> {grievance.address}</p>
              <p><strong>Statutory SLA:</strong> Acknowledgment within <strong>{grievance.acknowledgmentWindow}</strong>; full investigation and resolution within <strong>{grievance.resolutionWindow}</strong>.</p>
              <p className="text-gray-500 pt-1">
                If unresolved within 15 days, you have the right to register a complaint with the <strong>Data Protection Board of India</strong>.
              </p>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
