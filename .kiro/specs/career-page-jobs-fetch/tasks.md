# Implementation Plan

- [-] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Career Page Always Shows Hardcoded Jobs
  - **CRITICAL**: This test MUST FAIL on unfixed code — failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior — it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to the concrete failing cases — any API response that differs from the hardcoded array should be reflected in the rendered output
  - **Test setup required** (no test framework exists yet):
    - Install vitest, @vitest/coverage-v8, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, fast-check, jsdom, msw as dev dependencies
    - Add `"test": "vitest --run"` script to package.json
    - Create `vitest.config.ts` at project root with jsdom environment and path aliases matching vite config
    - Create `client/src/test/setup.ts` with @testing-library/jest-dom matchers
  - **Test file**: `client/src/pages/__tests__/Career.bug-condition.test.tsx`
  - **Bug Condition**: `isBugCondition(X)` where `X.page = "Career"` AND `X.dataSource = "hardcoded"` — the component always renders from the module-level `openings` constant, never calling `GET /api/careers`
  - **Property**: For all API responses R where R ≠ hardcodedMockOpenings, `renderCareerPage(X).jobListings` MUST equal R, not hardcodedMockOpenings
  - **Test cases to write**:
    1. Mock `GET /api/careers` to return `[{ id: "1", title: "Test Engineer", department: "QA", location: "Remote", type: "Full-time", ... }]`; assert "Test Engineer" appears in the DOM — FAILS on unfixed code (hardcoded array is used instead)
    2. Mock `GET /api/careers` to return `[]`; assert "Senior Medical Illustrator" is NOT in the DOM — FAILS on unfixed code (hardcoded array always renders)
    3. Use fast-check: generate arbitrary arrays of Career objects with titles not in the hardcoded list; assert each generated title appears in the DOM — FAILS on unfixed code
    4. Mock `GET /api/careers` to return a job not in the hardcoded list; assert "Full Stack Developer" is NOT rendered — FAILS on unfixed code
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests FAIL (this is correct — it proves the bug exists)
  - Document counterexamples found (e.g., "Career page renders 'Senior Medical Illustrator' even when API returns 'Test Engineer'")
  - Mark task complete when tests are written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3_

- [ ] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Static Page Sections Remain Unchanged
  - **IMPORTANT**: Follow observation-first methodology
  - **Test file**: `client/src/pages/__tests__/Career.preservation.test.tsx`
  - **Non-bug condition**: All inputs that do NOT involve the job listings data source — hero, values, benefits, and CTA sections are completely unaffected by the fix
  - **Observation step** (run on UNFIXED code first):
    - Observe: `data-testid="text-career-hero-title"` renders "Build the Future of Medical Education"
    - Observe: `data-testid="text-why-join-title"` renders "Why Join Us" with 3 value cards
    - Observe: `data-testid="text-benefits-title"` renders "Employee Benefits" with 3 accordion items (`accordion-benefit-0`, `accordion-benefit-1`, `accordion-benefit-2`)
    - Observe: `data-testid="text-no-right-role-title"` renders "Don't see the right role?"
    - Observe: `data-testid="input-search-roles"` is present in the openings section header
  - **Property-based tests to write** (using fast-check):
    1. Generate arbitrary `Career[]` arrays (including empty, single, and multi-item); for each, assert `data-testid="text-career-hero-title"` contains "Build the Future of Medical Education"
    2. Generate arbitrary `Career[]` arrays; for each, assert all 3 value cards render (Educational Impact, Global Reach, Innovation)
    3. Generate arbitrary `Career[]` arrays; for each, assert all 3 accordion items render (`accordion-benefit-0`, `accordion-benefit-1`, `accordion-benefit-2`)
    4. Generate arbitrary `Career[]` arrays; for each, assert `data-testid="text-no-right-role-title"` renders "Don't see the right role?"
    5. Generate arbitrary `Career[]` arrays; for each, assert `data-testid="input-search-roles"` is present
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3. Fix: Replace hardcoded openings array with useQuery API fetch

  - [ ] 3.1 Implement the fix in `client/src/pages/Career.tsx`
    - Add `import { useQuery } from "@tanstack/react-query"` to the import block
    - Add `import type { Career } from "@shared/schema"` to the import block
    - Remove the module-level `const openings = [...]` array (lines 62–79)
    - Inside the `Career` component, add the query call following the `AdminCareers.tsx` pattern:
      ```ts
      const { data: careers, isLoading, isError } = useQuery<Career[]>({
        queryKey: ["/api/careers"],
      });
      ```
    - In the "Current Openings" section, replace `{openings.map((job, index) => (...))}` with conditional rendering:
      - `isLoading`: render `<div className="text-center py-8 text-muted-foreground">Loading job listings...</div>`
      - `isError`: render `<div className="text-center py-8 text-muted-foreground">Failed to load job listings.</div>`
      - `careers?.length === 0`: render `<div className="text-center py-8 text-muted-foreground">No open positions at this time.</div>`
      - Otherwise: map over `careers` using `career.id` as the key and `career.title`, `career.location`, `career.type`, `career.department` for display
    - Update `data-testid` on job cards from `job.title.toLowerCase().replace(/\s/g, '-')` to `career.id`
    - Update Apply Now button `data-testid` from `button-apply-${job.title...}` to `button-apply-${career.id}`
    - _Bug_Condition: isBugCondition(X) where X.page = "Career" AND X.dataSource = "hardcoded"_
    - _Expected_Behavior: result.jobListings = fetchFromAPI("/api/careers") AND result.jobListings ≠ hardcodedMockOpenings_
    - _Preservation: hero, values, benefits, CTA sections and job card structure (title, location, type, department, Apply Now button) remain unchanged_
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.1, 3.2, 3.3, 3.4_

  - [ ] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Career Page Fetches Real Jobs from API
    - **IMPORTANT**: Re-run the SAME tests from task 1 — do NOT write new tests
    - The tests from task 1 encode the expected behavior: job listings come from `GET /api/careers`, not the hardcoded array
    - Run `npm test` (or `npx vitest --run`) targeting `Career.bug-condition.test.tsx`
    - **EXPECTED OUTCOME**: All 4 test cases PASS (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [ ] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Static Page Sections Remain Unchanged
    - **IMPORTANT**: Re-run the SAME tests from task 2 — do NOT write new tests
    - Run `npm test` (or `npx vitest --run`) targeting `Career.preservation.test.tsx`
    - **EXPECTED OUTCOME**: All 5 property-based tests PASS (confirms no regressions in static sections)
    - Confirm hero, values, benefits, CTA, and search input all render correctly after the fix

- [ ] 4. Checkpoint — Ensure all tests pass
  - Run the full test suite: `npx vitest --run`
  - Confirm `Career.bug-condition.test.tsx` — all tests pass (bug is fixed)
  - Confirm `Career.preservation.test.tsx` — all tests pass (no regressions)
  - Verify the Career page renders correctly in the browser with real API data
  - Ask the user if any questions arise before closing the spec
