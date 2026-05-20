# Career Page Jobs Fetch Bugfix Design

## Overview

The Career page (`client/src/pages/Career.tsx`) renders a hardcoded `openings` array of 4 mock jobs instead of fetching real data from the existing `GET /api/careers` endpoint. The fix replaces the static array with a `useQuery` call — following the exact pattern already used in `AdminCareers.tsx` — and adds loading, error, and empty states. All other page sections (hero, values, benefits, CTA) remain untouched.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug — the Career page is loaded and job data is sourced from the hardcoded `openings` array rather than the API
- **Property (P)**: The desired behavior when the Career page loads — job listings are fetched from `GET /api/careers` and rendered dynamically
- **Preservation**: The hero, values, benefits, and CTA sections, plus the job card structure (title, location, type, department, Apply Now button), that must remain unchanged by the fix
- **`Career`**: The TypeScript type exported from `@shared/schema` representing a job listing row (`id`, `title`, `department`, `location`, `type`, `description`, `requirements`, `isActive`, `createdAt`)
- **`openings`**: The hardcoded static array in `Career.tsx` that is the root cause of the bug
- **`useQuery`**: The TanStack React Query hook used to fetch and cache remote data, already used in `AdminCareers.tsx`
- **`/api/careers`**: The public GET endpoint in `server/routes.ts` that returns all active job listings from Supabase (no auth required)
- **`/api/admin/careers`**: The authenticated admin endpoint — used only in `AdminCareers.tsx`, not relevant to this fix

## Bug Details

### Bug Condition

The bug manifests on every load of the Career page. The component never calls the API; it always renders from the module-level `openings` constant. Any admin changes (create, update, deactivate, delete) are invisible to public visitors.

**Formal Specification:**
```
FUNCTION isBugCondition(X)
  INPUT: X of type PageLoadEvent
  OUTPUT: boolean

  RETURN X.page = "Career"
         AND X.dataSource = "hardcoded"
         AND X.jobListings = ["Senior Medical Illustrator",
                              "Full Stack Developer",
                              "Content Editor - Anatomy",
                              "3D Generalist"]
END FUNCTION
```

### Examples

- **Admin creates "Junior Illustrator" (active)** → Career page still shows the 4 mock jobs; new listing is invisible *(bug)*
- **Admin deactivates "Full Stack Developer"** → Career page still shows "Full Stack Developer" *(bug)*
- **Admin deletes all jobs** → Career page still shows 4 mock jobs instead of an empty state *(bug)*
- **API returns 0 active jobs** → Career page should show an empty state message, not mock data *(expected after fix)*

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- The hero section ("Build the Future of Medical Education") must render exactly as before
- The "Why Join Us" values section (3 cards) must render exactly as before
- The "Employee Benefits" accordion section must render exactly as before
- The "Don't see the right role?" CTA section must render exactly as before
- Each job card must continue to display title, location badge, type badge, department badge, and an "Apply Now" button
- The search input in the "Current Openings" section header must remain present
- The `data-testid` attributes on static sections must remain unchanged

**Scope:**
All inputs that do NOT involve the job listings data source are completely unaffected by this fix. This includes:
- All static section content (hero, values, benefits, CTA)
- Mouse/touch interactions with buttons, accordion, and links
- Page routing and layout behavior
- Animation and motion behavior

## Hypothesized Root Cause

Based on code inspection, the root cause is straightforward and singular:

1. **Hardcoded `openings` array**: `Career.tsx` defines a module-level `const openings = [...]` with 4 static objects and maps over it directly. There is no `useQuery` call, no API fetch, and no dynamic data binding anywhere in the component.
   - The array is defined at lines 62–79 of `Career.tsx`
   - It is consumed at line 218 (`{openings.map((job, index) => (...))}`)

2. **Missing API integration**: The `GET /api/careers` endpoint exists and works correctly (used by `AdminCareers.tsx` via `/api/admin/careers`). The public page simply never calls it.

3. **No loading/error/empty state handling**: Because there is no async data fetch, there are no states for loading, API errors, or an empty job list.

## Correctness Properties

Property 1: Bug Condition - Career Page Fetches Real Jobs from API

_For any_ page load event where the Career page is rendered, the fixed component SHALL fetch job listings from `GET /api/careers` using `useQuery` and render only the jobs returned by the API, never rendering the hardcoded `openings` array.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6**

Property 2: Preservation - Static Page Sections Remain Unchanged

_For any_ page load event where the bug condition does NOT hold (i.e., all non-job-listing sections), the fixed component SHALL produce exactly the same rendered output as the original component, preserving the hero, values, benefits, and CTA sections without modification.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

**File**: `client/src/pages/Career.tsx`

**Specific Changes**:

1. **Add imports**: Import `useQuery` from `@tanstack/react-query` and `type Career` from `@shared/schema`

2. **Remove hardcoded array**: Delete the `const openings = [...]` array (lines 62–79)

3. **Add `useQuery` call** inside the `Career` component, following the `AdminCareers.tsx` pattern:
   ```ts
   const { data: careers, isLoading, isError } = useQuery<Career[]>({
     queryKey: ["/api/careers"],
   });
   ```

4. **Replace `openings.map(...)` with `careers` data**: In the "Current Openings" section, replace the static map with conditional rendering:
   - While loading: render a skeleton or loading message
   - On error: render an error message
   - When `careers` is empty: render an empty state message
   - Otherwise: map over `careers` and render each job card using `career.id` as the key and `career.title`, `career.location`, `career.type`, `career.department` for display

5. **Update `data-testid` on job cards**: Change from `job.title.toLowerCase().replace(/\s/g, '-')` to `career.id` (or keep title-based if preferred) to reflect real data

No other files require changes. The API endpoint, schema, and query client configuration are already correct.

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm the root cause (hardcoded array, no API call).

**Test Plan**: Mock the `GET /api/careers` endpoint to return a known set of jobs (different from the hardcoded mock data), render `Career.tsx`, and assert that the rendered output matches the API response — not the hardcoded array. Run these tests on the UNFIXED code to observe failures.

**Test Cases**:
1. **API jobs not rendered**: Mock API returns `[{ title: "Test Engineer", ... }]`; assert "Test Engineer" appears in the DOM — will fail on unfixed code because the hardcoded array is used instead
2. **Hardcoded jobs always shown**: Assert "Senior Medical Illustrator" is NOT in the DOM when the API returns an empty array — will fail on unfixed code
3. **New admin job visible**: Mock API returns a job not in the hardcoded list; assert it renders — will fail on unfixed code
4. **Deactivated job hidden**: Mock API returns empty list (admin deactivated all jobs); assert no job cards render — will fail on unfixed code

**Expected Counterexamples**:
- The hardcoded mock jobs render regardless of API response
- Possible causes: `openings` array is never replaced with API data, `useQuery` is never called

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed component fetches and renders real API data.

**Pseudocode:**
```
FOR ALL X WHERE isBugCondition(X) DO
  result := renderCareerPage_fixed(X)
  ASSERT result.jobListings = fetchFromAPI("/api/careers")
  ASSERT result.jobListings ≠ hardcodedMockOpenings
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed component produces the same rendered output as the original.

**Pseudocode:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT renderCareerPage_original(X).staticSections
       = renderCareerPage_fixed(X).staticSections
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain (varying API responses, loading states)
- It catches edge cases that manual unit tests might miss (e.g., jobs with special characters in titles)
- It provides strong guarantees that static sections are unchanged for all possible API responses

**Test Plan**: Observe that static sections render correctly on unfixed code, then write property-based tests asserting those sections are invariant across all API response shapes.

**Test Cases**:
1. **Hero section preservation**: Verify `data-testid="text-career-hero-title"` renders "Build the Future of Medical Education" regardless of API response
2. **Values section preservation**: Verify all 3 value cards render regardless of API response
3. **Benefits section preservation**: Verify all 3 accordion items render regardless of API response
4. **CTA section preservation**: Verify `data-testid="text-no-right-role-title"` renders regardless of API response
5. **Search input preservation**: Verify `data-testid="input-search-roles"` is present regardless of API response

### Unit Tests

- Test that `useQuery` is called with `queryKey: ["/api/careers"]`
- Test loading state renders a loading indicator (not job cards)
- Test error state renders an error message (not job cards)
- Test empty state renders an empty message when API returns `[]`
- Test that job cards render with correct title, location, type, and department from API data
- Test that the hardcoded mock job titles ("Senior Medical Illustrator", etc.) do NOT appear when API returns different data

### Property-Based Tests

- Generate random arrays of `Career` objects and verify each one renders a card with the correct title, location, type, and department
- Generate random `Career` arrays and verify static sections (hero, values, benefits, CTA) are always present regardless of the array contents
- Generate random API error scenarios and verify the page does not crash and renders an appropriate message

### Integration Tests

- Test full page render with a mocked API returning multiple active jobs — verify all jobs appear
- Test full page render with a mocked API returning an empty array — verify empty state message appears
- Test full page render with a mocked API error — verify error state appears without crashing
- Test that switching between loading → loaded states renders correctly
