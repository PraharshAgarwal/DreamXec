/**
 * Robust zero-dependency CSV parser for DreamXec bulk imports.
 * Handles quoted fields, escaped quotes, various newline types, and header normalization.
 */
function parseCsv(csvText) {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;

  const normalized = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    const nextChar = normalized[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some((f) => f.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((f) => f.length > 0)) {
      lines.push(currentRow);
    }
  }

  if (lines.length < 2) return [];

  const rawHeaders = lines[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const dataRows = lines.slice(1);

  return dataRows.map((row) => {
    const item = {};
    rawHeaders.forEach((header, idx) => {
      item[header] = row[idx] || '';
    });

    // Normalize canonical keys
    const email = item.email || item.studentemail || item.useremail || '';
    const fullName = item.name || item.fullname || item.studentname || item.membername || '';
    const phone = item.phone || item.phonenumber || item.mobile || item.whatsapp || '';
    const role = (item.role || 'STUDENT').toUpperCase();
    const department = item.department || item.dept || item.branch || '';
    const designation = item.designation || item.title || '';

    return {
      email: email.trim().toLowerCase(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      role,
      department: department.trim(),
      designation: designation.trim(),
      raw: item,
    };
  }).filter((row) => row.email && row.email.includes('@'));
}

module.exports = {
  parseCsv,
};
