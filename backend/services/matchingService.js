/**
 * Smart Matching Engine for Lost2Found
 * Uses a 6-factor weighted scoring model to match Lost and Found items.
 */

function calculateMatchingScore(lostItem, foundItem) {
  let score = 0;
  const factors = [];

  // 1. Category Match (25 Points)
  if (lostItem.category && foundItem.category) {
    if (lostItem.category.trim().toLowerCase() === foundItem.category.trim().toLowerCase()) {
      score += 25;
      factors.push('Same category match (+25%)');
    }
  }

  // 2. Location Similarity (25 Points)
  if (lostItem.location && foundItem.location) {
    const locLost = lostItem.location.trim().toLowerCase();
    const locFound = foundItem.location.trim().toLowerCase();

    if (locLost === locFound) {
      score += 25;
      factors.push('Identical location (+25%)');
    } else if (locLost.includes(locFound) || locFound.includes(locLost)) {
      score += 18;
      factors.push('Nearby campus zone (+18%)');
    }
  }

  // 3. Color Match (15 Points)
  if (lostItem.color && foundItem.color) {
    const colLost = lostItem.color.trim().toLowerCase();
    const colFound = foundItem.color.trim().toLowerCase();

    if (colLost === colFound || colLost.includes(colFound) || colFound.includes(colLost)) {
      score += 15;
      factors.push('Matching color (+15%)');
    }
  }

  // 4. Brand Match (10 Points)
  if (lostItem.brand && foundItem.brand) {
    const brandLost = lostItem.brand.trim().toLowerCase();
    const brandFound = foundItem.brand.trim().toLowerCase();

    if (brandLost && brandFound && (brandLost === brandFound || brandLost.includes(brandFound))) {
      score += 10;
      factors.push('Matching brand name (+10%)');
    }
  }

  // 5. Date Similarity (15 Points)
  const lostDate = new Date(lostItem.dateLost || lostItem.createdAt);
  const foundDate = new Date(foundItem.dateFound || foundItem.createdAt);

  if (!isNaN(lostDate.getTime()) && !isNaN(foundDate.getTime())) {
    const diffTime = Math.abs(foundDate.getTime() - lostDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) {
      score += 15;
      factors.push('Reported on same day / within 24 hours (+15%)');
    } else if (diffDays <= 3) {
      score += 10;
      factors.push('Reported within 3 days (+10%)');
    } else if (diffDays <= 7) {
      score += 5;
      factors.push('Reported within 1 week (+5%)');
    }
  }

  // 6. Description Token Keyword Similarity (10 Points)
  const extractTokens = (text) => {
    if (!text) return new Set();
    return new Set(
      text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 2)
    );
  };

  const tokensLost = extractTokens(`${lostItem.title} ${lostItem.description}`);
  const tokensFound = extractTokens(`${foundItem.title} ${foundItem.description}`);

  let matchCount = 0;
  tokensLost.forEach((token) => {
    if (tokensFound.has(token)) matchCount++;
  });

  if (tokensLost.size > 0 && matchCount > 0) {
    const ratio = matchCount / Math.min(tokensLost.size, 5);
    const tokenScore = Math.min(10, Math.round(ratio * 10));
    if (tokenScore > 0) {
      score += tokenScore;
      factors.push(`Keyword & text description overlap (+${tokenScore}%)`);
    }
  }

  const finalScore = Math.min(100, score);

  return {
    matchScore: finalScore,
    matchingFactors: factors,
  };
}

module.exports = { calculateMatchingScore };
