/**
 * @fileoverview Date Formatting Utilities
 *
 * Provides consistent date formatting across the Notes Wiki application.
 * Centralizing date formatting ensures:
 * - Consistent user experience
 * - Easy localization changes
 * - Single point of maintenance
 *
 * @example
 * import { formatDate, formatDateTime } from "../utils/date-formatter.js";
 *
 * const date = formatDate("2024-01-15T10:30:00Z");
 * // Returns: "Jan 15, 2024"
 *
 * const dateTime = formatDateTime("2024-01-15T10:30:00Z");
 * // Returns: "Jan 15, 2024 at 10:30 AM"
 *
 * Skills demonstrated: Code organization, utility patterns
 */

/**
 * Default locale for date formatting.
 *
 * Using a constant makes it easy to change the locale
 * application-wide or make it configurable.
 *
 * @constant {string}
 */
const DEFAULT_LOCALE = "en-US";

/**
 * Formats an ISO date string for display.
 *
 * Converts an ISO 8601 date string (e.g., from API responses)
 * into a human-readable format suitable for display in the UI.
 *
 * @param {string | undefined} dateString - ISO date string (e.g., "2024-01-15T10:30:00Z")
 * @returns {string} Formatted date (e.g., "Jan 15, 2024") or "-" if invalid
 *
 * @example
 * // Valid date
 * formatDate("2024-01-15T10:30:00Z"); // "Jan 15, 2024"
 *
 * // Undefined input
 * formatDate(undefined); // "-"
 *
 * // Empty string
 * formatDate(""); // "-"
 */
export function formatDate(dateString?: string): string {
  if (!dateString) {
    return "-";
  }

  try {
    const date = new Date(dateString);

    // Check for invalid date
    if (isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString(DEFAULT_LOCALE, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "-";
  }
}

/**
 * Formats an ISO date string with time for display.
 *
 * Similar to {@link formatDate} but includes the time component.
 * Useful for showing when items were last modified.
 *
 * @param {string | undefined} dateString - ISO date string
 * @returns {string} Formatted date and time (e.g., "Jan 15, 2024 at 10:30 AM") or "-" if invalid
 *
 * @example
 * formatDateTime("2024-01-15T10:30:00Z"); // "Jan 15, 2024 at 10:30 AM"
 */
export function formatDateTime(dateString?: string): string {
  if (!dateString) {
    return "-";
  }

  try {
    const date = new Date(dateString);

    // Check for invalid date
    if (isNaN(date.getTime())) {
      return "-";
    }

    return date.toLocaleDateString(DEFAULT_LOCALE, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "-";
  }
}

/**
 * Formats a date as a relative time string.
 *
 * Converts a date to a human-friendly relative time
 * (e.g., "2 hours ago", "yesterday", "3 days ago").
 *
 * @param {string | undefined} dateString - ISO date string
 * @returns {string} Relative time string or "-" if invalid
 *
 * @example
 * // Assuming current time is Jan 15, 2024 12:00 PM
 * formatRelativeTime("2024-01-15T10:00:00Z"); // "2 hours ago"
 * formatRelativeTime("2024-01-14T12:00:00Z"); // "yesterday"
 * formatRelativeTime("2024-01-12T12:00:00Z"); // "3 days ago"
 */
export function formatRelativeTime(dateString?: string): string {
  if (!dateString) {
    return "-";
  }

  try {
    const date = new Date(dateString);

    // Check for invalid date
    if (isNaN(date.getTime())) {
      return "-";
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return "just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    } else if (diffDays === 1) {
      return "yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      // Fall back to formatted date for older items
      return formatDate(dateString);
    }
  } catch {
    return "-";
  }
}
