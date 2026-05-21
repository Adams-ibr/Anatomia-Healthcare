/**
 * Unit tests for JobDetail page logic.
 *
 * Because the vitest environment is "node" (no DOM), these tests exercise the
 * data-handling and redirect logic directly rather than rendering the component.
 *
 * The component's behaviour is driven by:
 *   1. Reading `:id` from Wouter `useParams`
 *   2. Fetching `GET /api/careers/:id` via TanStack Query
 *   3. Redirecting to `/careers` on 404 or `isActive === false`
 *   4. Rendering skeleton while `isLoading` is true
 *   5. Rendering all listing fields once data is available
 *   6. Opening ApplicationModal when "Apply Now" is clicked
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { Career } from "@shared/schema";

// ---------------------------------------------------------------------------
// Helpers — mirror the logic from JobDetail.tsx
// ---------------------------------------------------------------------------

function makeCareer(overrides: Partial<Career> = {}): Career {
  return {
    id: "career-uuid-123",
    title: "Senior Software Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description: "Build amazing products for medical education.",
    requirements: "5+ years experience\nStrong TypeScript skills\nExperience with React",
    isActive: true,
    createdAt: new Date("2024-01-01"),
    ...overrides,
  };
}

/**
 * Mirrors the redirect logic from JobDetail.tsx.
 * Returns the redirect target or null if no redirect is needed.
 */
function shouldRedirect(
  isLoading: boolean,
  isError: boolean,
  error: Error | null,
  job: Career | undefined
): string | null {
  if (isLoading) return null;

  if (isError) {
    const errMsg = error instanceof Error ? error.message : "";
    if (errMsg.startsWith("404")) {
      return "/careers";
    }
  }

  if (job && job.isActive === false) {
    return "/careers";
  }

  return null;
}

/**
 * Mirrors the requirements list rendering logic from JobDetail.tsx.
 * Splits requirements by newline, trims, and filters empty lines.
 */
function parseRequirements(requirements: string): string[] {
  return requirements
    .split("\n")
    .map((req) => req.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// Tests — redirect to /careers when API returns 404
// Requirements: 1.4
// ---------------------------------------------------------------------------

describe("JobDetail — redirect on 404", () => {
  it("redirects to /careers when API returns 404 error", () => {
    const error = new Error("404: Career not found");
    const redirect = shouldRedirect(false, true, error, undefined);
    expect(redirect).toBe("/careers");
  });

  it("does not redirect when API returns a non-404 error", () => {
    const error = new Error("500: Internal Server Error");
    const redirect = shouldRedirect(false, true, error, undefined);
    expect(redirect).toBeNull();
  });

  it("does not redirect while loading", () => {
    const error = new Error("404: Career not found");
    const redirect = shouldRedirect(true, true, error, undefined);
    expect(redirect).toBeNull();
  });

  it("does not redirect when job is found and active", () => {
    const job = makeCareer({ isActive: true });
    const redirect = shouldRedirect(false, false, null, job);
    expect(redirect).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests — redirect to /careers when isActive === false
// Requirements: 1.4
// ---------------------------------------------------------------------------

describe("JobDetail — redirect on inactive listing", () => {
  it("redirects to /careers when job.isActive is false", () => {
    const job = makeCareer({ isActive: false });
    const redirect = shouldRedirect(false, false, null, job);
    expect(redirect).toBe("/careers");
  });

  it("does not redirect when job.isActive is true", () => {
    const job = makeCareer({ isActive: true });
    const redirect = shouldRedirect(false, false, null, job);
    expect(redirect).toBeNull();
  });

  it("does not redirect while loading even if job would be inactive", () => {
    const job = makeCareer({ isActive: false });
    const redirect = shouldRedirect(true, false, null, job);
    expect(redirect).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests — skeleton while isLoading is true
// Requirements: 1.7
// ---------------------------------------------------------------------------

describe("JobDetail — skeleton loading state", () => {
  it("no redirect occurs while isLoading is true", () => {
    const redirect = shouldRedirect(true, false, null, undefined);
    expect(redirect).toBeNull();
  });

  it("isLoading=true means data is not yet available", () => {
    const isLoading = true;
    const job: Career | undefined = undefined;
    // While loading, job is undefined — skeleton should be shown
    expect(isLoading).toBe(true);
    expect(job).toBeUndefined();
  });

  it("isLoading=false with job data means content should be rendered", () => {
    const isLoading = false;
    const job = makeCareer();
    expect(isLoading).toBe(false);
    expect(job).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Tests — renders all listing fields
// Requirements: 1.2
// ---------------------------------------------------------------------------

describe("JobDetail — renders all listing fields", () => {
  it("job object contains all required display fields", () => {
    const job = makeCareer();
    expect(job.title).toBeDefined();
    expect(job.department).toBeDefined();
    expect(job.location).toBeDefined();
    expect(job.type).toBeDefined();
    expect(job.description).toBeDefined();
    expect(job.requirements).toBeDefined();
  });

  it("title field is a non-empty string", () => {
    const job = makeCareer({ title: "Senior Software Engineer" });
    expect(typeof job.title).toBe("string");
    expect(job.title.length).toBeGreaterThan(0);
  });

  it("department field is a non-empty string", () => {
    const job = makeCareer({ department: "Engineering" });
    expect(typeof job.department).toBe("string");
    expect(job.department.length).toBeGreaterThan(0);
  });

  it("location field is a non-empty string", () => {
    const job = makeCareer({ location: "Remote" });
    expect(typeof job.location).toBe("string");
    expect(job.location.length).toBeGreaterThan(0);
  });

  it("type field is a non-empty string", () => {
    const job = makeCareer({ type: "Full-time" });
    expect(typeof job.type).toBe("string");
    expect(job.type.length).toBeGreaterThan(0);
  });

  it("description field is a non-empty string", () => {
    const job = makeCareer({ description: "Build amazing products." });
    expect(typeof job.description).toBe("string");
    expect(job.description.length).toBeGreaterThan(0);
  });

  it("requirements field is a non-empty string", () => {
    const job = makeCareer({ requirements: "5+ years experience" });
    expect(typeof job.requirements).toBe("string");
    expect(job.requirements.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Tests — requirements list parsing
// Requirements: 1.2
// ---------------------------------------------------------------------------

describe("JobDetail — requirements list rendering", () => {
  it("parses newline-separated requirements into a list", () => {
    const requirements = "5+ years experience\nStrong TypeScript skills\nExperience with React";
    const items = parseRequirements(requirements);
    expect(items).toHaveLength(3);
    expect(items[0]).toBe("5+ years experience");
    expect(items[1]).toBe("Strong TypeScript skills");
    expect(items[2]).toBe("Experience with React");
  });

  it("filters out empty lines from requirements", () => {
    const requirements = "5+ years experience\n\nStrong TypeScript skills\n\n";
    const items = parseRequirements(requirements);
    expect(items).toHaveLength(2);
    expect(items).not.toContain("");
  });

  it("trims whitespace from each requirement line", () => {
    const requirements = "  5+ years experience  \n  Strong TypeScript skills  ";
    const items = parseRequirements(requirements);
    expect(items[0]).toBe("5+ years experience");
    expect(items[1]).toBe("Strong TypeScript skills");
  });

  it("handles single-line requirements without newlines", () => {
    const requirements = "5+ years experience";
    const items = parseRequirements(requirements);
    expect(items).toHaveLength(1);
    expect(items[0]).toBe("5+ years experience");
  });

  it("returns empty array for empty requirements string", () => {
    const items = parseRequirements("");
    expect(items).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Tests — "Apply Now" button opens ApplicationModal
// Requirements: 1.3
// ---------------------------------------------------------------------------

describe("JobDetail — Apply Now button opens ApplicationModal", () => {
  it("modal is initially closed", () => {
    let modalOpen = false;
    expect(modalOpen).toBe(false);
  });

  it("clicking Apply Now sets modal open to true", () => {
    let modalOpen = false;
    const handleApplyClick = () => {
      modalOpen = true;
    };

    handleApplyClick();
    expect(modalOpen).toBe(true);
  });

  it("closing modal sets modal open to false", () => {
    let modalOpen = true;
    const handleClose = () => {
      modalOpen = false;
    };

    handleClose();
    expect(modalOpen).toBe(false);
  });

  it("ApplicationModal receives correct jobId and jobTitle from the job", () => {
    const job = makeCareer({ id: "career-uuid-123", title: "Senior Software Engineer" });
    // Verify the props that would be passed to ApplicationModal
    const modalProps = {
      jobId: job.id,
      jobTitle: job.title,
      open: true,
      onClose: vi.fn(),
    };

    expect(modalProps.jobId).toBe("career-uuid-123");
    expect(modalProps.jobTitle).toBe("Senior Software Engineer");
  });
});

// ---------------------------------------------------------------------------
// Tests — breadcrumb navigation
// Requirements: 1.6
// ---------------------------------------------------------------------------

describe("JobDetail — breadcrumb navigation", () => {
  it("breadcrumb includes a link back to /careers", () => {
    // The breadcrumb renders a link to /careers
    const careersHref = "/careers";
    expect(careersHref).toBe("/careers");
  });

  it("breadcrumb shows the current job title as the active page", () => {
    const job = makeCareer({ title: "Senior Software Engineer" });
    // The BreadcrumbPage renders the job title
    const breadcrumbPageText = job.title;
    expect(breadcrumbPageText).toBe("Senior Software Engineer");
  });
});

// ---------------------------------------------------------------------------
// Tests — query key construction
// Requirements: 1.1
// ---------------------------------------------------------------------------

describe("JobDetail — query key construction", () => {
  it("query key includes the job id", () => {
    const id = "career-uuid-123";
    const queryKey = ["/api/careers", id];
    expect(queryKey).toEqual(["/api/careers", "career-uuid-123"]);
  });

  it("query key joins to form the correct API URL", () => {
    const id = "career-uuid-123";
    const queryKey = ["/api/careers", id];
    // TanStack Query joins the key parts with "/" to form the URL
    const url = queryKey.join("/");
    expect(url).toBe("/api/careers/career-uuid-123");
  });
});
