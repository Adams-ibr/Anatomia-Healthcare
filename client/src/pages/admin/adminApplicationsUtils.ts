/**
 * Pure utility functions for AdminApplications page.
 * Extracted into a separate file so they can be tested without importing
 * the full React component (which has UI dependencies like AdminLayout).
 */

import type { JobApplication, Career } from "@shared/schema";

export type ApplicationWithJob = JobApplication & { careers: Pick<Career, "title"> };

// ---------------------------------------------------------------------------
// Status validation
// ---------------------------------------------------------------------------

const VALID_STATUSES = ["pending", "reviewed", "accepted", "rejected"] as const;
export type ApplicationStatus = (typeof VALID_STATUSES)[number];

/**
 * Returns true if and only if the given string is one of the four valid
 * Application_Status values.
 *
 * Validates: Requirements 5.7
 */
export function isValidStatus(value: string): value is ApplicationStatus {
  return (VALID_STATUSES as readonly string[]).includes(value);
}

// ---------------------------------------------------------------------------
// Resume URL validation
// ---------------------------------------------------------------------------

/**
 * Returns true when resumeUrl is a non-null, non-empty, non-whitespace string.
 * Used to decide whether to render a real <a> link or a disabled button.
 *
 * Validates: Requirements 4.7
 */
export function hasValidResumeUrl(resumeUrl: string | null | undefined): boolean {
  return typeof resumeUrl === "string" && resumeUrl.trim().length > 0;
}

// ---------------------------------------------------------------------------
// Summary stats
// ---------------------------------------------------------------------------

export interface SummaryStats {
  total: number;
  pending: number;
  reviewed: number;
  accepted: number;
  rejected: number;
}

/**
 * Computes per-status counts and total from an array of applications.
 * Null/undefined status is treated as "pending".
 *
 * Validates: Requirements 4.8
 */
export function computeSummaryStats(applications: ApplicationWithJob[]): SummaryStats {
  const total = applications.length;
  const pending = applications.filter((a) => !a.status || a.status === "pending").length;
  const reviewed = applications.filter((a) => a.status === "reviewed").length;
  const accepted = applications.filter((a) => a.status === "accepted").length;
  const rejected = applications.filter((a) => a.status === "rejected").length;
  return { total, pending, reviewed, accepted, rejected };
}

// ---------------------------------------------------------------------------
// Sort helper
// ---------------------------------------------------------------------------

/**
 * Returns a new sorted array of applications without mutating the original.
 * Supports sorting by createdAt or experience in asc/desc order.
 *
 * Validates: Requirements 4.3
 */
export function sortApplications(
  applications: ApplicationWithJob[],
  sortBy: "createdAt" | "experience",
  sortOrder: "asc" | "desc"
): ApplicationWithJob[] {
  return [...applications].sort((a, b) => {
    if (sortBy === "createdAt") {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortOrder === "desc" ? bTime - aTime : aTime - bTime;
    } else {
      const aExp = a.experience ?? 0;
      const bExp = b.experience ?? 0;
      return sortOrder === "desc" ? bExp - aExp : aExp - bExp;
    }
  });
}
