// Date formatting utilities for the application

/**
 * Format an ISO date string to a user-friendly format (e.g., "Jan 13, 2026")
 * @param {string} isoDateString - ISO 8601 date string
 * @returns {string|null} - Formatted date string or null if invalid
 */
const formatLastBoughtDate = (isoDateString) => {
  if (!isoDateString) return null;
  try {
    const date = new Date(isoDateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return null;
  }
};

export { formatLastBoughtDate };
