const { parseCsv } = require('../src/utils/csvParser');

describe('Bulk Membership CSV Parsing (Milestone M1 - C4)', () => {
  it('should parse standard CSV with headers correctly', () => {
    const csvData = `email,name,phone,role,department
rahul@example.com,Rahul Sharma,9876543210,STUDENT,Computer Science
priya@example.com,Priya Patel,+91 9123456789,RESEARCHER,Robotics Lab`;

    const result = parseCsv(csvData);

    expect(result.length).toBe(2);
    expect(result[0].email).toBe('rahul@example.com');
    expect(result[0].fullName).toBe('Rahul Sharma');
    expect(result[0].phone).toBe('9876543210');
    expect(result[0].role).toBe('STUDENT');
    expect(result[0].department).toBe('Computer Science');

    expect(result[1].email).toBe('priya@example.com');
    expect(result[1].fullName).toBe('Priya Patel');
    expect(result[1].role).toBe('RESEARCHER');
  });

  it('should handle quoted fields containing commas', () => {
    const csvData = `email,name,designation
"dr.smith@example.com","Smith, John","Associate Dean, Research"`;

    const result = parseCsv(csvData);

    expect(result.length).toBe(1);
    expect(result[0].email).toBe('dr.smith@example.com');
    expect(result[0].fullName).toBe('Smith, John');
    expect(result[0].designation).toBe('Associate Dean, Research');
  });

  it('should filter out invalid rows without an email', () => {
    const csvData = `email,name
valid@example.com,Valid User
invalid_row_without_at,No Email User
,Empty Email`;

    const result = parseCsv(csvData);
    expect(result.length).toBe(1);
    expect(result[0].email).toBe('valid@example.com');
  });
});
