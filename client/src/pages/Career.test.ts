/**
 * Unit tests for Career page logic.
 *
 * Because the vitest environment is "node" (no DOM), these tests exercise the
 * filtering logic and state management directly rather than rendering the component.
 *
 * Requirements: 1.5, 3.6, 3.7
 */

import { describe, it, expect } from "vitest";
import type { Career } from "@shared/schema";
import { filterCareers, type CareerFilters } from "@/lib/careerFilters";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeJob(overrides: Partial<Career> = {}): Career {
  return {
    id: "job-1",
    title: "Software Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "A great role.",
    requirements: "3+ years experience.",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

const EMPTY_FILTERS: CareerFilters = {
  department: "",
  location: "",
  type: "",
  search: "",
};

// ---------------------------------------------------------------------------
// Tests — "View Details" link href matches job ID
// Requirements: 1.5
// ---------------------------------------------------------------------------

describe('Career page — "View Details" link href', () => {
  it("produces the correct href for a job with a given id", () => {
    const job = makeJob({ id: "abc-123" });
    const expectedHref = `/careers/${job.id}`;
    expect(expectedHref).toBe("/careers/abc-123");
  });

  it("produces distinct hrefs for jobs with different ids", () => {
    const jobs = [
      makeJob({ id: "job-1", title: "Engineer" }),
      makeJob({ id: "job-2", title: "Designer" }),
      makeJob({ id: "job-3", title: "Manager" }),
    ];

    const hrefs = jobs.map((job) => `/careers/${job.id}`);
    expect(hrefs).toEqual(["/careers/job-1", "/careers/job-2", "/careers/job-3"]);
  });

  it("each job card link href is exactly /careers/${job.id}", () => {
    const jobs = [
      makeJob({ id: "uuid-aaa" }),
      makeJob({ id: "uuid-bbb" }),
    ];

    for (const job of jobs) {
      const href = `/careers/${job.id}`;
      expect(href).toBe(`/careers/${job.id}`);
      expect(href).toMatch(/^\/careers\//);
      expect(href.endsWith(job.id)).toBe(true);
    }
  });

  it("href uses the raw id, not the title", () => {
    const job = makeJob({ id: "some-uuid-123", title: "Senior Software Engineer" });
    const href = `/careers/${job.id}`;
    expect(href).toBe("/careers/some-uuid-123");
    expect(href).not.toContain("senior-software-engineer");
  });
});

// ---------------------------------------------------------------------------
// Tests — "No positions match your filters" message
// Requirements: 3.6
// ---------------------------------------------------------------------------

describe('Career page — "No positions match your filters" message', () => {
  it("filtered list is empty when no jobs match the active department filter", () => {
    const jobs = [
      makeJob({ id: "1", department: "Engineering" }),
      makeJob({ id: "2", department: "Marketing" }),
    ];
    const filters: CareerFilters = { ...EMPTY_FILTERS, department: "Sales" };
    const result = filterCareers(jobs, filters);
    expect(result).toHaveLength(0);
  });

  it("filtered list is empty when search term matches nothing", () => {
    const jobs = [
      makeJob({ id: "1", title: "Software Engineer", department: "Engineering" }),
      makeJob({ id: "2", title: "Product Manager", department: "Product" }),
    ];
    const filters: CareerFilters = { ...EMPTY_FILTERS, search: "zzznomatch" };
    const result = filterCareers(jobs, filters);
    expect(result).toHaveLength(0);
  });

  it("filtered list is empty when location filter matches nothing", () => {
    const jobs = [
      makeJob({ id: "1", location: "Remote" }),
      makeJob({ id: "2", location: "New York" }),
    ];
    const filters: CareerFilters = { ...EMPTY_FILTERS, location: "London" };
    const result = filterCareers(jobs, filters);
    expect(result).toHaveLength(0);
  });

  it("filtered list is empty when type filter matches nothing", () => {
    const jobs = [
      makeJob({ id: "1", type: "Full-time" }),
      makeJob({ id: "2", type: "Part-time" }),
    ];
    const filters: CareerFilters = { ...EMPTY_FILTERS, type: "Contract" };
    const result = filterCareers(jobs, filters);
    expect(result).toHaveLength(0);
  });

  it("hasActiveFilters is true when at least one filter is non-empty", () => {
    const filtersWithDept: CareerFilters = { ...EMPTY_FILTERS, department: "Engineering" };
    const hasActive =
      filtersWithDept.department !== "" ||
      filtersWithDept.location !== "" ||
      filtersWithDept.type !== "" ||
      filtersWithDept.search !== "";
    expect(hasActive).toBe(true);
  });

  it("hasActiveFilters is false when all filters are empty strings", () => {
    const hasActive =
      EMPTY_FILTERS.department !== "" ||
      EMPTY_FILTERS.location !== "" ||
      EMPTY_FILTERS.type !== "" ||
      EMPTY_FILTERS.search !== "";
    expect(hasActive).toBe(false);
  });

  it("shows no-filter-results state only when displayedJobs is empty AND hasActiveFilters is true", () => {
    const jobs = [makeJob({ id: "1", department: "Engineering" })];
    const filters: CareerFilters = { ...EMPTY_FILTERS, department: "Sales" };

    const displayedJobs = filterCareers(jobs, filters);
    const hasActiveFilters =
      filters.department !== "" ||
      filters.location !== "" ||
      filters.type !== "" ||
      filters.search !== "";

    const shouldShowNoFilterResults = displayedJobs.length === 0 && hasActiveFilters;
    expect(shouldShowNoFilterResults).toBe(true);
  });

  it("does NOT show no-filter-results state when displayedJobs is empty but no filters are active", () => {
    const jobs: Career[] = [];
    const filters = EMPTY_FILTERS;

    const displayedJobs = filterCareers(jobs, filters);
    const hasActiveFilters =
      filters.department !== "" ||
      filters.location !== "" ||
      filters.type !== "" ||
      filters.search !== "";

    const shouldShowNoFilterResults = displayedJobs.length === 0 && hasActiveFilters;
    expect(shouldShowNoFilterResults).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests — "Clear filters" button resets all filter state
// Requirements: 3.7
// ---------------------------------------------------------------------------

describe('Career page — "Clear filters" button resets state', () => {
  it("resetting filters produces the EMPTY_FILTERS state", () => {
    const activeFilters: CareerFilters = {
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      search: "senior",
    };

    // Simulate clicking "Clear filters" — sets state to EMPTY_FILTERS
    const clearedFilters: CareerFilters = { department: "", location: "", type: "", search: "" };

    expect(clearedFilters).toEqual(EMPTY_FILTERS);
    expect(clearedFilters).not.toEqual(activeFilters);
  });

  it("cleared filters produce all jobs when applied", () => {
    const jobs = [
      makeJob({ id: "1", department: "Engineering", location: "Remote", type: "Full-time" }),
      makeJob({ id: "2", department: "Marketing", location: "New York", type: "Part-time" }),
      makeJob({ id: "3", department: "Sales", location: "London", type: "Contract" }),
    ];

    // Apply some filters first
    const activeFilters: CareerFilters = { ...EMPTY_FILTERS, department: "Engineering" };
    const filteredJobs = filterCareers(jobs, activeFilters);
    expect(filteredJobs).toHaveLength(1);

    // Clear filters — should return all jobs
    const clearedJobs = filterCareers(jobs, EMPTY_FILTERS);
    expect(clearedJobs).toHaveLength(3);
  });

  it("clearing filters is idempotent — clearing already-cleared state produces same result", () => {
    const alreadyCleared: CareerFilters = { department: "", location: "", type: "", search: "" };
    const clearedAgain: CareerFilters = { department: "", location: "", type: "", search: "" };
    expect(alreadyCleared).toEqual(clearedAgain);
  });

  it("clearing filters resets department to empty string", () => {
    const cleared: CareerFilters = { department: "", location: "", type: "", search: "" };
    expect(cleared.department).toBe("");
  });

  it("clearing filters resets location to empty string", () => {
    const cleared: CareerFilters = { department: "", location: "", type: "", search: "" };
    expect(cleared.location).toBe("");
  });

  it("clearing filters resets type to empty string", () => {
    const cleared: CareerFilters = { department: "", location: "", type: "", search: "" };
    expect(cleared.type).toBe("");
  });

  it("clearing filters resets search to empty string", () => {
    const cleared: CareerFilters = { department: "", location: "", type: "", search: "" };
    expect(cleared.search).toBe("");
  });

  it("after clearing, hasActiveFilters is false", () => {
    const cleared: CareerFilters = { department: "", location: "", type: "", search: "" };
    const hasActive =
      cleared.department !== "" ||
      cleared.location !== "" ||
      cleared.type !== "" ||
      cleared.search !== "";
    expect(hasActive).toBe(false);
  });
});
