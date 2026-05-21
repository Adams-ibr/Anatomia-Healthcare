/**
 * Property-based tests for AdminApplications enhancements.
 *
 * Property 11: Applications sort order is correct
 * Property 16: Status validation rejects non-enum values
 *
 * Uses fast-check for property-based testing.
 */

import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import type { JobApplication, Career } from "@shared/schema";
import { sortApplications, isValidStatus } from "./adminApplicationsUtils";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type ApplicationWithJob = JobApplication & { careers: Pick<Career, "title"> };

/**
 * Arbitrary for generating a single ApplicationWithJob object.
 * Uses realistic but varied test data.
 */
const applicationArbitrary = fc.record<ApplicationWithJob>({
  id: fc.uuid(),
  jobId: fc.uuid(),
  name: fc.string({ minLength: 1, maxLength: 50 }),
  email: fc.emailAddress(),
  phone: fc.string({ minLength: 7, maxLength: 15 }),
  location: fc.string({ minLength: 1, maxLength: 50 }),
  experience: fc.integer({ min: 0, max: 40 }),
  startDate: fc.string({ minLength: 1, maxLength: 20 }),
  portfolioUrl: fc.option(fc.webUrl(), { nil: null }),
  coverLetter: fc.string({ minLength: 1, maxLength: 500 }),
  resumeUrl: fc.option(fc.webUrl(), { nil: null }),
  status: fc.option(
    fc.constantFrom("pending", "reviewed", "accepted", "rejected"),
    { nil: null }
  ),
  createdAt: fc.option(fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") }), { nil: null }),
  updatedAt: fc.option(fc.date({ min: new Date("2020-01-01"), max: new Date("2030-01-01") }), { nil: null }),
  careers: fc.record({
    title: fc.string({ minLength: 1, maxLength: 100 }),
  }),
});

// ---------------------------------------------------------------------------
// Property 11: Applications sort order is correct
// Validates: Requirements 4.3
// ---------------------------------------------------------------------------

/**
 * **Property 11: Applications sort order is correct**
 *
 * For any array of Job_Applications, sorting by `createdAt desc` SHALL produce
 * a list where each element's `createdAt` is >= the next element's `createdAt`;
 * sorting by `experience desc` SHALL produce a list where each element's
 * `experience` is >= the next element's `experience`.
 *
 * Validates: Requirements 4.3
 */
describe("AdminApplications — Property 11: applications sort order is correct", () => {
  it("sort by createdAt desc: each element's createdAt >= next element's createdAt", () => {
    fc.assert(
      fc.property(fc.array(applicationArbitrary, { minLength: 0, maxLength: 20 }), (applications) => {
        const sorted = sortApplications(applications, "createdAt", "desc");
        for (let i = 0; i < sorted.length - 1; i++) {
          const aTime = sorted[i].createdAt ? new Date(sorted[i].createdAt!).getTime() : 0;
          const bTime = sorted[i + 1].createdAt ? new Date(sorted[i + 1].createdAt!).getTime() : 0;
          expect(aTime).toBeGreaterThanOrEqual(bTime);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("sort by createdAt asc: each element's createdAt <= next element's createdAt", () => {
    fc.assert(
      fc.property(fc.array(applicationArbitrary, { minLength: 0, maxLength: 20 }), (applications) => {
        const sorted = sortApplications(applications, "createdAt", "asc");
        for (let i = 0; i < sorted.length - 1; i++) {
          const aTime = sorted[i].createdAt ? new Date(sorted[i].createdAt!).getTime() : 0;
          const bTime = sorted[i + 1].createdAt ? new Date(sorted[i + 1].createdAt!).getTime() : 0;
          expect(aTime).toBeLessThanOrEqual(bTime);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("sort by experience desc: each element's experience >= next element's experience", () => {
    fc.assert(
      fc.property(fc.array(applicationArbitrary, { minLength: 0, maxLength: 20 }), (applications) => {
        const sorted = sortApplications(applications, "experience", "desc");
        for (let i = 0; i < sorted.length - 1; i++) {
          const aExp = sorted[i].experience ?? 0;
          const bExp = sorted[i + 1].experience ?? 0;
          expect(aExp).toBeGreaterThanOrEqual(bExp);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("sort by experience asc: each element's experience <= next element's experience", () => {
    fc.assert(
      fc.property(fc.array(applicationArbitrary, { minLength: 0, maxLength: 20 }), (applications) => {
        const sorted = sortApplications(applications, "experience", "asc");
        for (let i = 0; i < sorted.length - 1; i++) {
          const aExp = sorted[i].experience ?? 0;
          const bExp = sorted[i + 1].experience ?? 0;
          expect(aExp).toBeLessThanOrEqual(bExp);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("sort does not change the length of the array", () => {
    fc.assert(
      fc.property(
        fc.array(applicationArbitrary, { minLength: 0, maxLength: 20 }),
        fc.constantFrom<"createdAt" | "experience">("createdAt", "experience"),
        fc.constantFrom<"asc" | "desc">("asc", "desc"),
        (applications, sortBy, sortOrder) => {
          const sorted = sortApplications(applications, sortBy, sortOrder);
          expect(sorted).toHaveLength(applications.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sort does not mutate the original array", () => {
    fc.assert(
      fc.property(fc.array(applicationArbitrary, { minLength: 1, maxLength: 10 }), (applications) => {
        const originalIds = applications.map((a) => a.id);
        sortApplications(applications, "createdAt", "desc");
        const afterIds = applications.map((a) => a.id);
        expect(afterIds).toEqual(originalIds);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 16: Status validation rejects non-enum values
// Validates: Requirements 5.7
// ---------------------------------------------------------------------------

const VALID_STATUSES = ["pending", "reviewed", "accepted", "rejected"];

/**
 * **Property 16: Status validation rejects non-enum values**
 *
 * For any string that is not one of `pending`, `reviewed`, `accepted`, `rejected`,
 * the status validator SHALL return false. For the four valid values, it SHALL
 * return true.
 *
 * Validates: Requirements 5.7
 */
describe("AdminApplications — Property 16: status validation rejects non-enum values", () => {
  it("isValidStatus returns true for all four valid status values", () => {
    for (const status of VALID_STATUSES) {
      expect(isValidStatus(status)).toBe(true);
    }
  });

  it("isValidStatus returns false for any random string not in the valid set", () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 50 }).filter((s) => !VALID_STATUSES.includes(s)),
        (randomString) => {
          expect(isValidStatus(randomString)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });

  it("isValidStatus returns false for empty string", () => {
    expect(isValidStatus("")).toBe(false);
  });

  it("isValidStatus returns false for uppercase variants of valid statuses", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...VALID_STATUSES).map((s) => s.toUpperCase()),
        (uppercased) => {
          expect(isValidStatus(uppercased)).toBe(false);
        }
      ),
      { numRuns: 20 }
    );
  });

  it("isValidStatus returns false for mixed-case variants", () => {
    const mixedCaseVariants = ["Pending", "REVIEWED", "Accepted", "REJECTED", "pEnDiNg"];
    for (const variant of mixedCaseVariants) {
      expect(isValidStatus(variant)).toBe(false);
    }
  });

  it("isValidStatus returns false for strings with extra whitespace", () => {
    const withWhitespace = [" pending", "reviewed ", " accepted ", "\trejected"];
    for (const s of withWhitespace) {
      expect(isValidStatus(s)).toBe(false);
    }
  });
});
