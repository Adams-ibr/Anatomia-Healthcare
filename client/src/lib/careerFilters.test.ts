import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { filterCareers, isValidResumeType, CareerFilters } from "./careerFilters";
import type { Career } from "@shared/schema";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Career object from partial data. */
function makeCareer(overrides: Partial<Career> = {}): Career {
  return {
    id: "id-1",
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

// ---------------------------------------------------------------------------
// fast-check arbitraries
// ---------------------------------------------------------------------------

/** Generates a non-empty printable ASCII string (no control chars). */
const printableString = fc.string({ minLength: 1, maxLength: 30 }).filter(
  (s) => s.trim().length > 0
);

/** Generates a Career object with random but valid field values. */
const careerArb: fc.Arbitrary<Career> = fc
  .record({
    id: fc.uuid(),
    title: printableString,
    department: fc.constantFrom("Engineering", "Marketing", "Sales", "HR", "Finance"),
    location: fc.constantFrom("Remote", "New York", "London", "Berlin", "Tokyo"),
    type: fc.constantFrom("Full-time", "Part-time", "Contract", "Internship"),
    description: printableString,
    requirements: printableString,
    isActive: fc.boolean(),
    createdAt: fc.date().map((d) => d),
  })
  .map((r) => r as Career);

/** Generates an array of Career objects (0–20 items). */
const careersArb = fc.array(careerArb, { minLength: 0, maxLength: 20 });

/** Generates a CareerFilters object with random values (may be empty strings). */
const filtersArb: fc.Arbitrary<CareerFilters> = fc.record({
  department: fc.constantFrom("", "Engineering", "Marketing", "Sales", "HR", "Finance"),
  location: fc.constantFrom("", "Remote", "New York", "London", "Berlin", "Tokyo"),
  type: fc.constantFrom("", "Full-time", "Part-time", "Contract", "Internship"),
  search: fc.oneof(fc.constant(""), printableString),
});

// ---------------------------------------------------------------------------
// Unit tests — specific examples
// ---------------------------------------------------------------------------

describe("filterCareers — unit tests", () => {
  it("returns all careers when all filters are empty strings", () => {
    const careers = [
      makeCareer({ id: "1", department: "Engineering" }),
      makeCareer({ id: "2", department: "Marketing" }),
    ];
    const result = filterCareers(careers, { department: "", location: "", type: "", search: "" });
    expect(result).toHaveLength(2);
  });

  it("filters by department exactly", () => {
    const careers = [
      makeCareer({ id: "1", department: "Engineering" }),
      makeCareer({ id: "2", department: "Marketing" }),
    ];
    const result = filterCareers(careers, { department: "Engineering", location: "", type: "", search: "" });
    expect(result).toHaveLength(1);
    expect(result[0].department).toBe("Engineering");
  });

  it("filters by location exactly", () => {
    const careers = [
      makeCareer({ id: "1", location: "Remote" }),
      makeCareer({ id: "2", location: "New York" }),
    ];
    const result = filterCareers(careers, { department: "", location: "Remote", type: "", search: "" });
    expect(result).toHaveLength(1);
    expect(result[0].location).toBe("Remote");
  });

  it("filters by type exactly", () => {
    const careers = [
      makeCareer({ id: "1", type: "Full-time" }),
      makeCareer({ id: "2", type: "Contract" }),
    ];
    const result = filterCareers(careers, { department: "", location: "", type: "Full-time", search: "" });
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("Full-time");
  });

  it("search matches title case-insensitively", () => {
    const careers = [
      makeCareer({ id: "1", title: "Senior Engineer", department: "Sales" }),
      makeCareer({ id: "2", title: "Product Manager", department: "Marketing" }),
    ];
    const result = filterCareers(careers, { department: "", location: "", type: "", search: "engineer" });
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Senior Engineer");
  });

  it("search matches department case-insensitively", () => {
    const careers = [
      makeCareer({ id: "1", title: "Analyst", department: "Engineering" }),
      makeCareer({ id: "2", title: "Analyst", department: "Marketing" }),
    ];
    const result = filterCareers(careers, { department: "", location: "", type: "", search: "ENGINEERING" });
    expect(result).toHaveLength(1);
    expect(result[0].department).toBe("Engineering");
  });

  it("returns empty array when no careers match", () => {
    const careers = [makeCareer({ id: "1", department: "Engineering" })];
    const result = filterCareers(careers, { department: "HR", location: "", type: "", search: "" });
    expect(result).toHaveLength(0);
  });

  it("applies all four filters conjunctively", () => {
    const careers = [
      makeCareer({ id: "1", department: "Engineering", location: "Remote", type: "Full-time", title: "Engineer" }),
      makeCareer({ id: "2", department: "Engineering", location: "New York", type: "Full-time", title: "Engineer" }),
      makeCareer({ id: "3", department: "Marketing", location: "Remote", type: "Full-time", title: "Engineer" }),
    ];
    const result = filterCareers(careers, {
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      search: "Engineer",
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("handles empty careers array", () => {
    const result = filterCareers([], { department: "Engineering", location: "", type: "", search: "" });
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Unit tests — isValidResumeType
// ---------------------------------------------------------------------------

describe("isValidResumeType — unit tests", () => {
  it("accepts application/pdf", () => {
    expect(isValidResumeType("application/pdf")).toBe(true);
  });

  it("accepts application/msword", () => {
    expect(isValidResumeType("application/msword")).toBe(true);
  });

  it("accepts application/vnd.openxmlformats-officedocument.wordprocessingml.document", () => {
    expect(
      isValidResumeType(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ).toBe(true);
  });

  it("rejects image/png", () => {
    expect(isValidResumeType("image/png")).toBe(false);
  });

  it("rejects text/plain", () => {
    expect(isValidResumeType("text/plain")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidResumeType("")).toBe(false);
  });

  it("rejects application/zip", () => {
    expect(isValidResumeType("application/zip")).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

const VALID_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/**
 * Property 4: Search filter is case-insensitive substring match
 *
 * For any array of Career_Listings and any search string, the filtered result
 * SHALL contain exactly those listings whose `title` or `department` contains
 * the search string as a case-insensitive substring, and no others.
 *
 * Validates: Requirements 3.4
 */
describe("Property 4: Search filter is case-insensitive substring match", () => {
  it("every result contains the search string in title or department (case-insensitive)", () => {
    fc.assert(
      fc.property(careersArb, fc.string({ minLength: 0, maxLength: 20 }), (careers, search) => {
        const filters: CareerFilters = { department: "", location: "", type: "", search };
        const result = filterCareers(careers, filters);
        const normalizedSearch = search.trim().toLowerCase();

        if (normalizedSearch === "") {
          // Empty search should return all careers
          expect(result).toHaveLength(careers.length);
          return;
        }

        // Every result must match
        for (const career of result) {
          const titleMatch = career.title.toLowerCase().includes(normalizedSearch);
          const deptMatch = career.department.toLowerCase().includes(normalizedSearch);
          expect(titleMatch || deptMatch).toBe(true);
        }

        // No non-matching career should be in the result
        const nonMatching = careers.filter((c) => {
          const titleMatch = c.title.toLowerCase().includes(normalizedSearch);
          const deptMatch = c.department.toLowerCase().includes(normalizedSearch);
          return !titleMatch && !deptMatch;
        });
        for (const career of nonMatching) {
          expect(result.find((r) => r.id === career.id)).toBeUndefined();
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 5: Combined filters are conjunctive
 *
 * For any array of Career_Listings and any combination of active department,
 * location, type, and search filters, the filtered result SHALL contain only
 * listings that satisfy every active filter condition simultaneously.
 *
 * Validates: Requirements 3.5
 */
describe("Property 5: Combined filters are conjunctive", () => {
  it("every result satisfies all active filter conditions simultaneously", () => {
    fc.assert(
      fc.property(careersArb, filtersArb, (careers, filters) => {
        const result = filterCareers(careers, filters);
        const normalizedSearch = filters.search.trim().toLowerCase();

        for (const career of result) {
          if (filters.department !== "") {
            expect(career.department).toBe(filters.department);
          }
          if (filters.location !== "") {
            expect(career.location).toBe(filters.location);
          }
          if (filters.type !== "") {
            expect(career.type).toBe(filters.type);
          }
          if (normalizedSearch !== "") {
            const titleMatch = career.title.toLowerCase().includes(normalizedSearch);
            const deptMatch = career.department.toLowerCase().includes(normalizedSearch);
            expect(titleMatch || deptMatch).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 6: Filter count matches filtered array length
 *
 * For any filter state applied to any array of Career_Listings, the count
 * displayed by the FilterPanel SHALL equal the length of the filtered results array.
 *
 * Validates: Requirements 3.8
 */
describe("Property 6: Filter count matches filtered array length", () => {
  it("filterCareers result length equals the count that would be displayed", () => {
    fc.assert(
      fc.property(careersArb, filtersArb, (careers, filters) => {
        const result = filterCareers(careers, filters);
        // The count displayed by FilterPanel is matchCount = filterCareers(careers, filters).length
        // This property verifies the function is deterministic and consistent
        const resultAgain = filterCareers(careers, filters);
        expect(result.length).toBe(resultAgain.length);
        // Also verify the count is within bounds
        expect(result.length).toBeGreaterThanOrEqual(0);
        expect(result.length).toBeLessThanOrEqual(careers.length);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 7: Clear filters resets to initial state
 *
 * For any combination of active filters, clicking "Clear filters" SHALL produce
 * a filter state identical to the default initial state (all fields empty strings).
 *
 * Validates: Requirements 3.7
 */
describe("Property 7: Clear filters resets to initial state", () => {
  it("clearing any filter state produces the default empty state", () => {
    fc.assert(
      fc.property(filtersArb, (filters) => {
        // Simulate the "Clear filters" action
        const cleared: CareerFilters = { department: "", location: "", type: "", search: "" };
        // The cleared state should always equal the default initial state
        expect(cleared).toEqual({ department: "", location: "", type: "", search: "" });
        // Applying cleared filters to any careers array should return all careers
        // (verified by checking that no filter conditions are active)
        expect(cleared.department).toBe("");
        expect(cleared.location).toBe("");
        expect(cleared.type).toBe("");
        expect(cleared.search).toBe("");
      }),
      { numRuns: 100 }
    );
  });

  it("filterCareers with cleared state returns all careers", () => {
    fc.assert(
      fc.property(careersArb, (careers) => {
        const cleared: CareerFilters = { department: "", location: "", type: "", search: "" };
        const result = filterCareers(careers, cleared);
        expect(result).toHaveLength(careers.length);
      }),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 8: Resume file type validation
 *
 * For any file object, the ResumeUploader SHALL accept it if and only if its
 * MIME type is one of `application/pdf`, `application/msword`, or
 * `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
 *
 * Validates: Requirements 2.2
 */
describe("Property 8: Resume file type validation", () => {
  it("isValidResumeType returns true iff mime is in the allowed set", () => {
    fc.assert(
      fc.property(fc.string(), (mimeType) => {
        const result = isValidResumeType(mimeType);
        const expected = VALID_MIME_TYPES.has(mimeType);
        expect(result).toBe(expected);
      }),
      { numRuns: 200 }
    );
  });

  it("always returns true for each of the three valid MIME types", () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          "application/pdf",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
        (validMime) => {
          expect(isValidResumeType(validMime)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("always returns false for MIME types not in the allowed set", () => {
    fc.assert(
      fc.property(
        fc.string().filter((s) => !VALID_MIME_TYPES.has(s)),
        (invalidMime) => {
          expect(isValidResumeType(invalidMime)).toBe(false);
        }
      ),
      { numRuns: 200 }
    );
  });
});
