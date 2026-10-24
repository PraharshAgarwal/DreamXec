/**
 * Token-based and edit-distance fuzzy matching utility for identity verification.
 * Used for ORCID researcher name matching and student roster verification.
 */
function normalizeName(name) {
  let cleaned = String(name || '').toLowerCase();
  cleaned = cleaned.replace(/\b(dr|mr|mrs|ms|prof|professor|doctor)\b\.?/gi, '');
  return cleaned.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

function calculateTokenSimilarity(str1, str2) {
  const norm1 = normalizeName(str1);
  const norm2 = normalizeName(str2);

  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 1.0;

  const tokens1 = new Set(norm1.split(/\s+/).filter(Boolean));
  const tokens2 = new Set(norm2.split(/\s+/).filter(Boolean));

  let intersection = 0;
  for (const t of tokens1) {
    if (tokens2.has(t)) intersection++;
  }

  const union = new Set([...tokens1, ...tokens2]).size;
  return union === 0 ? 0 : intersection / union;
}

function isFuzzyNameMatch(name1, name2, threshold = 0.4) {
  const sim = calculateTokenSimilarity(name1, name2);
  return {
    matched: sim >= threshold,
    similarityScore: Math.round(sim * 100) / 100,
  };
}

module.exports = {
  normalizeName,
  calculateTokenSimilarity,
  isFuzzyNameMatch,
};
