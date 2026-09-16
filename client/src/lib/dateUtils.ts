/**
 * Centralized date formatting utilities
 * Provides consistent date formatting across the entire codebase
 */

import { formatDistanceToNow, format as dateFnsFormat } from "date-fns";

/**
 * Format a date as "MMM d, yyyy" (e.g., "Jan 15, 2025")
 * Used for absolute dates in tables and lists
 */
export function formatFullDate(date: string | Date): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Invalid Date";
    return dateFnsFormat(d, "MMM d, yyyy");
  } catch {
    return "Invalid Date";
  }
}

/**
 * Format a date as "MMM d" (e.g., "Jan 15")
 * Used for compact display when year is clear from context
 */
export function formatShortDate(date: string | Date): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Invalid Date";
    return dateFnsFormat(d, "MMM d");
  } catch {
    return "Invalid Date";
  }
}

/**
 * Format a date as relative time (e.g., "2 hours ago", "3 days from now")
 * Used for comments, discussions, recent activity
 */
export function formatRelativeDate(date: string | Date): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Invalid Date";
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "Invalid Date";
  }
}

/**
 * Format a date as relative time without suffix (e.g., "2 hours", "3 days")
 * Used in conversation lists, brief displays
 */
export function formatRelativeDateShort(date: string | Date): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Invalid Date";
    return formatDistanceToNow(d, { addSuffix: false });
  } catch {
    return "Invalid Date";
  }
}

/**
 * Format a date as ISO date string (YYYY-MM-DD)
 * Used for form inputs, date fields, data export
 */
export function formatISODate(date: string | Date): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Invalid Date";
    return d.toISOString().split("T")[0];
  } catch {
    return "Invalid Date";
  }
}

/**
 * Format a date as full datetime (e.g., "Jan 15, 2025 at 2:30 PM")
 * Used for detailed timestamps, logs
 */
export function formatFullDateTime(date: string | Date): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return "Invalid Date";
    return dateFnsFormat(d, "MMM d, yyyy 'at' h:mm a");
  } catch {
    return "Invalid Date";
  }
}

/**
 * Check if a date is in the past
 */
export function isPast(date: string | Date): boolean {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d < new Date();
  } catch {
    return false;
  }
}

/**
 * Check if a date is in the future
 */
export function isFuture(date: string | Date): boolean {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d > new Date();
  } catch {
    return false;
  }
}

/**
 * Check if two dates are on the same day
 */
export function isSameDay(date1: string | Date, date2: string | Date): boolean {
  try {
    const d1 = typeof date1 === "string" ? new Date(date1) : date1;
    const d2 = typeof date2 === "string" ? new Date(date2) : date2;
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  } catch {
    return false;
  }
}
