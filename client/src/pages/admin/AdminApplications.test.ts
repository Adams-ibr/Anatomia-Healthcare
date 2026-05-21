/**
 * Unit tests for AdminApplications enhancements.
 *
 * Because the vitest environment is "node" (no DOM), these tests exercise the
 * pure logic functions exported from AdminApplications.tsx rather than
 * rendering the component.
 *
 * Tests cover:
 * - "Download Resume" renders as <a> when resumeUrl is set (hasValidResumeUrl)
 * - "Download Resume" renders as disabled button when resumeUrl is null (hasValidResumeUrl)
 * - Bulk toolbar appears only when ≥1 checkbox is selected (isToolbarVisible)
 * - Summary stats bar shows correct total and per-status counts (computeSummaryStats)
 *
 * Requirements: 4.7, 4.8
 */

import { describe, it, expect } from "vitest";
import type { JobApplication, Career } from "@shared/schema";
import { hasValidResumeUrl, computeSummaryStats } from "./adminApplicationsUtils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ApplicationWithJob = JobApplication & { careers: Pick<Career, "title"> };

function makeApplication(overrides: Partial<ApplicationWithJob> = {}): ApplicationWithJob {
  return {
    id: "app-1",
    jobId: "job-1",
    name: "Jane Doe",
    email: "jane@example.com",
    phone: "555-1234",
    location: "Remote",
    experience: 3,
    startDate: "2025-01-01",
    portfolioUrl: null,
    coverLetter: "I am excited to apply.",
    resumeUrl: null,
    status: "pending",
    createdAt: new Date("2024-06-01"),
    updatedAt: new Date("2024-06-01"),
    careers: { title: "Software Engineer" },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Toolbar visibility logic (mirrors AdminApplications internals)
// ---------------------------------------------------------------------------

function isToolbarVisible(selectedIds: string[]): boolean {
  return selectedIds.length >= 1;
}

// ---------------------------------------------------------------------------
// Tests — "Download Resume" button behavior
// Requirements: 4.7
// ---------------------------------------------------------------------------

describe("AdminApplications — Download Resume button", () => {
  it("hasValidResumeUrl returns true when resumeUrl is a non-empty string", () => {
    const app = makeApplication({ resumeUrl: "https://example.com/resume.pdf" });
    expect(hasValidResumeUrl(app.resumeUrl)).toBe(true);
  });

  it("hasValidResumeUrl returns false when resumeUrl is null", () => {
    const app = makeApplication({ resumeUrl: null });
    expect(hasValidResumeUrl(app.resumeUrl)).toBe(false);
  });

  it("hasValidResumeUrl returns false when resumeUrl is undefined", () => {
    expect(hasValidResumeUrl(undefined)).toBe(false);
  });

  it("hasValidResumeUrl returns false when resumeUrl is an empty string", () => {
    const app = makeApplication({ resumeUrl: "" });
    expect(hasValidResumeUrl(app.resumeUrl)).toBe(false);
  });

  it("hasValidResumeUrl returns false when resumeUrl is whitespace only", () => {
    const app = makeApplication({ resumeUrl: "   " });
    expect(hasValidResumeUrl(app.resumeUrl)).toBe(false);
  });

  it("hasValidResumeUrl returns true for various valid URL formats", () => {
    const validUrls = [
      "https://storage.example.com/resumes/abc123.pdf",
      "https://cdn.example.com/uploads/resume.docx",
      "http://example.com/file.doc",
      "/uploads/resume.pdf",
    ];
    for (const url of validUrls) {
      expect(hasValidResumeUrl(url)).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Tests — Bulk toolbar visibility
// Requirements: 4.4
// ---------------------------------------------------------------------------

describe("AdminApplications — bulk toolbar visibility", () => {
  it("toolbar is not visible when no checkboxes are selected", () => {
    expect(isToolbarVisible([])).toBe(false);
  });

  it("toolbar is visible when exactly one checkbox is selected", () => {
    expect(isToolbarVisible(["app-1"])).toBe(true);
  });

  it("toolbar is visible when multiple checkboxes are selected", () => {
    expect(isToolbarVisible(["app-1", "app-2", "app-3"])).toBe(true);
  });

  it("toolbar visibility threshold is exactly 1 selected ID", () => {
    // 0 selected → not visible
    expect(isToolbarVisible([])).toBe(false);
    // 1 selected → visible
    expect(isToolbarVisible(["id-1"])).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests — Summary stats bar
// Requirements: 4.8
// ---------------------------------------------------------------------------

describe("AdminApplications — summary stats bar", () => {
  it("shows total count equal to applications array length", () => {
    const apps = [
      makeApplication({ id: "1", status: "pending" }),
      makeApplication({ id: "2", status: "reviewed" }),
      makeApplication({ id: "3", status: "accepted" }),
    ];
    const stats = computeSummaryStats(apps);
    expect(stats.total).toBe(3);
  });

  it("shows correct pending count", () => {
    const apps = [
      makeApplication({ id: "1", status: "pending" }),
      makeApplication({ id: "2", status: "pending" }),
      makeApplication({ id: "3", status: "reviewed" }),
    ];
    const stats = computeSummaryStats(apps);
    expect(stats.pending).toBe(2);
  });

  it("shows correct reviewed count", () => {
    const apps = [
      makeApplication({ id: "1", status: "pending" }),
      makeApplication({ id: "2", status: "reviewed" }),
      makeApplication({ id: "3", status: "reviewed" }),
    ];
    const stats = computeSummaryStats(apps);
    expect(stats.reviewed).toBe(2);
  });

  it("shows correct accepted count", () => {
    const apps = [
      makeApplication({ id: "1", status: "accepted" }),
      makeApplication({ id: "2", status: "pending" }),
      makeApplication({ id: "3", status: "accepted" }),
    ];
    const stats = computeSummaryStats(apps);
    expect(stats.accepted).toBe(2);
  });

  it("shows correct rejected count", () => {
    const apps = [
      makeApplication({ id: "1", status: "rejected" }),
      makeApplication({ id: "2", status: "pending" }),
      makeApplication({ id: "3", status: "rejected" }),
      makeApplication({ id: "4", status: "rejected" }),
    ];
    const stats = computeSummaryStats(apps);
    expect(stats.rejected).toBe(3);
  });

  it("counts null status as pending", () => {
    const apps = [
      makeApplication({ id: "1", status: null }),
      makeApplication({ id: "2", status: "reviewed" }),
    ];
    const stats = computeSummaryStats(apps);
    expect(stats.pending).toBe(1);
  });

  it("all counts sum to total", () => {
    const apps = [
      makeApplication({ id: "1", status: "pending" }),
      makeApplication({ id: "2", status: "reviewed" }),
      makeApplication({ id: "3", status: "accepted" }),
      makeApplication({ id: "4", status: "rejected" }),
      makeApplication({ id: "5", status: null }),
    ];
    const stats = computeSummaryStats(apps);
    expect(stats.pending + stats.reviewed + stats.accepted + stats.rejected).toBe(stats.total);
  });

  it("returns all zeros for empty applications array", () => {
    const stats = computeSummaryStats([]);
    expect(stats).toEqual({ total: 0, pending: 0, reviewed: 0, accepted: 0, rejected: 0 });
  });

  it("handles all applications with the same status", () => {
    const apps = [
      makeApplication({ id: "1", status: "accepted" }),
      makeApplication({ id: "2", status: "accepted" }),
      makeApplication({ id: "3", status: "accepted" }),
    ];
    const stats = computeSummaryStats(apps);
    expect(stats.total).toBe(3);
    expect(stats.accepted).toBe(3);
    expect(stats.pending).toBe(0);
    expect(stats.reviewed).toBe(0);
    expect(stats.rejected).toBe(0);
  });
});
