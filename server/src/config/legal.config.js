/**
 * Centralized Legal & Statutory Configuration for DreamXec Server
 * Defines operating entities, registered address, and statutory grievance details.
 */

const LEGAL_ENTITIES = {
  TECH_OPERATOR: {
    legalName: 'FICPL Private Limited',
    shortName: 'FICPL',
    entityType: 'Private Limited Company',
    registeredOffice: 'AR-101, Eldeco Accolade, Sohna, Gurgaon, Haryana 122103, India',
    domain: 'https://www.dreamxec.com',
  },
  FOUNDATION: {
    legalName: 'DreamXec Academic Foundation',
    shortName: 'DAF',
    entityType: 'Section 8 Not-for-Profit Company / Charitable Trust',
    registeredOffice: 'AR-101, Eldeco Accolade, Sohna, Gurgaon, Haryana 122103, India',
    domain: 'https://www.dreamxec.org',
  },
  TRADEMARK: {
    owner: 'Founder (Individual)',
    notice: 'DreamXec is a trademark owned by the Founder and licensed to operating entities.',
  },
  GRIEVANCE_OFFICER: {
    title: 'Grievance Officer, DreamXec',
    email: 'grievance@dreamxec.com',
    supportEmail: 'support@dreamxec.com',
    address: 'AR-101, Eldeco Accolade, Sohna, Gurgaon, Haryana 122103, India',
    acknowledgmentWindowHours: 24,
    resolutionWindowDays: 15,
  },
};

function getLegalEntityForDomain(reqOrDomain) {
  const { extractDomainFromRequest } = require('./razorpay.config');
  const domain = extractDomainFromRequest(reqOrDomain);

  if (domain && domain.endsWith('dreamxec.org')) {
    return LEGAL_ENTITIES.FOUNDATION;
  }
  return LEGAL_ENTITIES.TECH_OPERATOR;
}

module.exports = {
  LEGAL_ENTITIES,
  getLegalEntityForDomain,
};
