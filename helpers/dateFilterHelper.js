/**
 * dateFilterHelper.js
 * Builds MongoDB date range filter objects for any date field.
 *
 * Usage:
 *   const { buildDateFilter, buildDateMatch } = require('../helpers/dateFilterHelper');
 *
 *   // For a simple field filter:
 *   const filter = buildDateFilter('createdAt', fromDate, toDate);
 *   // → { createdAt: { $gte: Date, $lte: Date } }  (only keys present if dates provided)
 *
 *   // For an aggregate $match stage merged with other conditions:
 *   const match = buildDateMatch({ organizationId: orgId }, 'paidAt', fromDate, toDate);
 *   // → { organizationId: orgId, paidAt: { $gte: ..., $lte: ... } }
 */

/**
 * Returns a MongoDB range condition object for a single date field.
 * If neither fromDate nor toDate is supplied the returned object is empty
 * (i.e. no date filter is applied — "show all till date" behaviour).
 *
 * @param {string} field      - The document field to filter on (e.g. 'createdAt', 'paidAt')
 * @param {string|Date} [from] - Start of range (inclusive). Accepts ISO string or Date.
 * @param {string|Date} [to]   - End of range (inclusive). Accepts ISO string or Date.
 *                               The end date is automatically pushed to 23:59:59.999
 *                               so a single-day selection captures the full day.
 * @returns {Object} Plain object suitable for spreading into a Mongoose query or $match stage.
 *
 * @example
 * // Both dates provided
 * buildDateFilter('createdAt', '2026-01-01', '2026-01-31')
 * // → { createdAt: { $gte: 2026-01-01T00:00:00.000Z, $lte: 2026-01-31T23:59:59.999Z } }
 *
 * @example
 * // Only fromDate
 * buildDateFilter('createdAt', '2026-01-01', null)
 * // → { createdAt: { $gte: 2026-01-01T00:00:00.000Z } }
 *
 * @example
 * // No dates — returns empty object (no restriction)
 * buildDateFilter('createdAt', null, null)
 * // → {}
 */
function buildDateFilter(field, from, to) {
  if (!from && !to) return {};

  const condition = {};

  if (from) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    condition.$gte = start;
  }

  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999); // include the full end day
    condition.$lte = end;
  }

  return { [field]: condition };
}

/**
 * Merges a base query object with a date range filter.
 * Useful for building $match stages in aggregation pipelines or
 * Mongoose find() conditions.
 *
 * @param {Object} baseQuery   - Existing query conditions (e.g. { organizationId: orgId })
 * @param {string} field       - Date field to filter on
 * @param {string|Date} [from] - Start date (inclusive)
 * @param {string|Date} [to]   - End date (inclusive, full day)
 * @returns {Object} Merged query object
 *
 * @example
 * buildDateMatch({ organizationId: orgId, status: 'Active' }, 'createdAt', from, to)
 * // → { organizationId: orgId, status: 'Active', createdAt: { $gte: ..., $lte: ... } }
 */
function buildDateMatch(baseQuery, field, from, to) {
  return {
    ...baseQuery,
    ...buildDateFilter(field, from, to),
  };
}

module.exports = { buildDateFilter, buildDateMatch };