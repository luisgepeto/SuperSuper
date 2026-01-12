// String similarity utility for fuzzy search using Levenshtein distance
// This enables finding similar items even when search terms don't exactly match

/**
 * Calculate the Levenshtein distance between two strings
 * This measures the minimum number of single-character edits (insertions, deletions, or substitutions)
 * needed to change one word into the other
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - The edit distance between the two strings
 */
const levenshteinDistance = (str1, str2) => {
  const len1 = str1.length;
  const len2 = str2.length;
  
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  
  const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
  
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return matrix[len1][len2];
};

/**
 * Calculate similarity score between two strings (0-1, where 1 is identical)
 * Uses normalized Levenshtein distance
 * 
 * @param {string} str1 - First string
 * @param {string} str2 - Second string
 * @returns {number} - Similarity score between 0 and 1
 */
const calculateSimilarity = (str1, str2) => {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  
  if (s1 === s2) return 1.0;
  
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1.0;
  
  const distance = levenshteinDistance(s1, s2);
  return 1 - (distance / maxLength);
};

/**
 * Check if a search term is similar enough to a target word
 * Uses multiple strategies to determine similarity
 * 
 * @param {string} searchTerm - The term the user is searching for
 * @param {string} targetWord - The word to compare against
 * @param {number} threshold - Minimum similarity score (0-1) to consider a match
 * @returns {number|null} - Similarity score if above threshold, null otherwise
 */
const isSimilar = (searchTerm, targetWord, threshold = 0.6) => {
  const search = searchTerm.toLowerCase();
  const target = targetWord.toLowerCase();
  
  // Exact substring match
  if (target.includes(search) || search.includes(target)) {
    return 1.0;
  }
  
  // Use Levenshtein distance-based similarity
  const similarity = calculateSimilarity(search, target);
  
  // Return the similarity score if it meets the threshold
  return similarity >= threshold ? similarity : null;
};

/**
 * Find the best matching word from a list of words for a given search term
 * 
 * @param {string} searchTerm - The term to search for
 * @param {string[]} words - Array of words to search in
 * @param {number} threshold - Minimum similarity threshold
 * @returns {Object|null} - Object with {word, score} or null if no match
 */
const findBestMatch = (searchTerm, words, threshold = 0.6) => {
  let bestMatch = null;
  let bestScore = 0;
  
  for (const word of words) {
    const score = isSimilar(searchTerm, word, threshold);
    if (score !== null && score > bestScore) {
      bestScore = score;
      bestMatch = { word, score };
    }
  }
  
  return bestMatch;
};

export {
  levenshteinDistance,
  calculateSimilarity,
  isSimilar,
  findBestMatch
};
