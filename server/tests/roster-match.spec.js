const { computeRosterMatchStatus } = require('../src/modules/governance/controllers/student-verification.controller');

describe('Student Verification Roster Match Classification (Milestone M1 - D8)', () => {
  it('should classify as AUTO_MATCHED when academic email and roll number are present', () => {
    const item = {
      studentEmail: 'rahul.kumar@nitkkr.ac.in',
      rollNumber: '12114050',
      institution: 'NIT Kurukshetra',
    };
    expect(computeRosterMatchStatus(item)).toBe('AUTO_MATCHED');
  });

  it('should classify as AUTO_MATCHED with institutional doc, roll number, and valid institution', () => {
    const item = {
      studentEmail: 'student@gmail.com',
      rollNumber: '2023CS010',
      institution: 'IIT Delhi',
      collegeIdCardUrl: 'https://cdn.example.com/idcard.png',
    };
    expect(computeRosterMatchStatus(item)).toBe('AUTO_MATCHED');
  });

  it('should classify as NEEDS_REVIEW when roll number is missing or placeholder', () => {
    const item = {
      studentEmail: 'student@gmail.com',
      rollNumber: '—',
      institution: 'Unknown College',
    };
    expect(computeRosterMatchStatus(item)).toBe('NEEDS_REVIEW');
  });

  it('should classify as NEEDS_REVIEW when evidence doc is missing and email is non-academic', () => {
    const item = {
      studentEmail: 'student@gmail.com',
      rollNumber: '12345',
      institution: 'Delhi University',
      collegeIdCardUrl: null,
      govtDocUrl: null,
    };
    expect(computeRosterMatchStatus(item)).toBe('NEEDS_REVIEW');
  });

  it('should classify as AUTO_MATCHED when sha256 of (rollNumber + name) matches institutional roster (Milestone M2 - X3)', () => {
    const crypto = require('crypto');
    const roll = '2024CS101';
    const name = 'Aarav Sharma';
    const expectedHash = crypto.createHash('sha256').update((roll + name).toLowerCase().trim()).digest('hex');
    const knownHashes = new Set([expectedHash]);

    const item = {
      studentEmail: 'aarav@gmail.com', // non-academic email
      rollNumber: roll,
      user: { name },
      institution: 'Delhi Technological University',
    };

    const status = computeRosterMatchStatus(item, knownHashes);
    expect(status).toBe('AUTO_MATCHED');
    expect(item.rosterMatchSource).toBe('ROSTER_SHA256_MATCH');
    expect(item.rosterHash).toBe(expectedHash);
  });
});
