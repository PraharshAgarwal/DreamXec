/**
 * Centralized Legal & Governance Configuration for DreamXec (.com & .org)
 * Houses official corporate entities, registered address, IP notices,
 * and DPDP Act 2023 / IT Rules 2021 statutory contact details.
 */

export interface LegalEntityConfig {
  legalName: string;
  entityType: string;
  registrationNumber?: string;
  role: string;
  domain: string;
  primaryPurpose: string;
}

export const LEGAL_ENTITIES = {
  // Technology Owner & SaaS Operator (.com)
  TECH_OPERATOR: {
    legalName: "FICPL Private Limited",
    shortName: "FICPL",
    entityType: "Private Limited Company (Registered under Companies Act, 2013)",
    role: "Technology Platform Owner & Commercial SaaS Operator",
    domain: "https://www.dreamxec.com",
    primaryPurpose:
      "Owns and operates platform source code, cloud infrastructure, AI models, college SaaS dashboards, and commercial partner services.",
  },

  // Foundation & Grant Custodian (.org)
  FOUNDATION: {
    legalName: "DreamXec Academic Foundation",
    shortName: "DAF",
    entityType: "Section 8 Not-for-Profit Company / Charitable Trust",
    role: "Public Grants & Philanthropic Custodian",
    domain: "https://www.dreamxec.org",
    primaryPurpose:
      "Administers philanthropic donations, CSR contributions, institutional research grants, and milestone-tranche maker-checker disbursements.",
  },

  // Trademark & Brand Ownership
  TRADEMARK_NOTICE: {
    owner: "Founder (Individual)",
    notice:
      "The 'DreamXec' trademark, wordmark, logo, and associated brand identity are owned by the Founder individually and licensed non-exclusively to FICPL and DreamXec Academic Foundation.",
  },

  // Registered Office Address
  REGISTERED_OFFICE: {
    addressLine1: "AR-101, Eldeco Accolade",
    area: "Sohna",
    city: "Gurgaon",
    state: "Haryana",
    country: "India",
    postalCode: "122103",
    fullAddress: "AR-101, Eldeco Accolade, Sohna, Gurgaon, Haryana 122103, India",
  },

  // Statutory Grievance Redressal (Mandated under IT Rules 2021 & DPDP Act 2023 Section 13)
  GRIEVANCE_OFFICER: {
    name: "Grievance Officer, DreamXec",
    designation: "Data Protection & Grievance Officer",
    email: "grievance@dreamxec.com",
    supportEmail: "support@dreamxec.com",
    phone: "+91 99999 99999", // Update with official phone number when available
    address: "AR-101, Eldeco Accolade, Sohna, Gurgaon, Haryana 122103, India",
    acknowledgmentWindow: "Within 24 hours of receipt",
    resolutionWindow: "Within 15 days of receipt",
  },

  // Platform Minimum Age Policy
  AGE_POLICY: {
    minimumAge: 16,
    childDefinitionAge: 18,
    policySummary:
      "Eligible for enrolled students aged 16 and above. Students aged 16–17 must have institutional / Faculty Guide sponsorship and parent/guardian consent under the DPDP Act, 2023.",
  },

  // Project Intellectual Property (IP) Policy
  IP_POLICY: {
    studentOwnershipPercentage: 100,
    platformEquityClaim: 0,
    policySummary:
      "Student innovators and research teams retain 100% ownership of their project research, inventions, designs, and code, subject to their educational institution's IP regulations. DreamXec claims 0% equity and 0% patent rights.",
  },
};

/**
 * Returns active entity context based on current browser hostname
 */
export function getActiveDomainLegalContext() {
  const hostname =
    typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";

  const isOrg = hostname.endsWith("dreamxec.org");

  return {
    isOrg,
    primaryEntity: isOrg
      ? LEGAL_ENTITIES.FOUNDATION
      : LEGAL_ENTITIES.TECH_OPERATOR,
    secondaryEntity: isOrg
      ? LEGAL_ENTITIES.TECH_OPERATOR
      : LEGAL_ENTITIES.FOUNDATION,
    office: LEGAL_ENTITIES.REGISTERED_OFFICE,
    grievance: LEGAL_ENTITIES.GRIEVANCE_OFFICER,
    ipPolicy: LEGAL_ENTITIES.IP_POLICY,
    agePolicy: LEGAL_ENTITIES.AGE_POLICY,
    trademark: LEGAL_ENTITIES.TRADEMARK_NOTICE,
  };
}
