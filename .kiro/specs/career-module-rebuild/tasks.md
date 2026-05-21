# Implementation Plan: Career Module Rebuild

## Overview

Implement the full career module rebuild in five sequential layers: backend API extensions, new frontend components, the new JobDetail page, modifications to existing pages, and routing. Each layer builds on the previous one. Pure filter and validation logic is extracted into standalone functions so property-based tests can exercise them without rendering components.

## Tasks

- [x] 1. Backend API extensions (`server/routes.ts`)
  - [x] 1.1 Add `GET /api/careers/:id` — single active career lookup
    - Register the route immediately after the existing `GET /api/careers` handler
    - Query Supabase `careers` table by `id` with `is_active = true`
    - Return 200 with the full career object on success
    - Return `404 { error: "Career not found" }` when the row is missing or `is_active` is false
    - Use the same camelCase column alias pattern as the existing careers query
    - _Requirements: 5.1_

  - [x] 1.2 Write unit test for `GET /api/careers/:id`
    - Test: active career returns 200 with full object
    - Test: inactive career returns 404
    - Test: non-existent ID returns 404
    - _Requirements: 5.1_

  - [x] 1.3 Enhance `GET /api/admin/applications` with query-param filtering and sorting
    - Accept optional `jobId`, `status`, `sortBy` (`createdAt` | `experience`), `sortOrder` (`asc` | `desc`) query params
    - Validate `status` against `['pending', 'reviewed', 'accepted', 'rejected']`; return 400 for unrecognised values
    - Validate `sortBy` against `['createdAt', 'experience']`; return 400 for unrecognised values
    - Apply `.eq('job_id', jobId)` when `jobId` is provided
    - Apply `.eq('status', status)` when `status` is provided
    - Map `sortBy=createdAt` → `created_at`, `sortBy=experience` → `experience`; default sort is `created_at desc`
    - Keep the existing `*, careers(title)` join
    - _Requirements: 5.4_

  - [x] 1.4 Write unit test for enhanced `GET /api/admin/applications`
    - Test: no params returns all applications sorted by `created_at desc`
    - Test: `status=reviewed` filters correctly
    - Test: `sortBy=experience&sortOrder=asc` sorts correctly
    - Test: invalid `status` value returns 400
    - _Requirements: 5.4_

  - [x] 1.5 Add `PATCH /api/admin/applications/bulk-status` — bulk status update
    - Register this route **before** `PATCH /api/admin/applications/:id/status` to prevent Express treating `bulk-status` as an `:id` value
    - Accept `{ ids: string[], status: string }` in the request body
    - Validate `status` against the four allowed values; return `400 { error: "Invalid status value" }` on failure
    - Query Supabase for all provided `ids`; collect any IDs not found into `invalidIds`
    - If `invalidIds` is non-empty, return `400 { error: "Invalid request", invalidIds }` without updating any rows
    - If all IDs are valid, run a single `UPDATE … WHERE id IN (…)` with `status` and `updated_at = now()`
    - Return `200 { updated: JobApplication[], failed: [] }` on success
    - _Requirements: 5.5, 5.6, 5.7_

  - [x] 1.6 Write unit tests for `PATCH /api/admin/applications/bulk-status`
    - Test: valid IDs and status returns 200 with all records updated
    - Test: invalid status string returns 400
    - Test: one unknown ID returns 400 with `invalidIds` list and no rows updated
    - _Requirements: 5.5, 5.6, 5.7_

- [x] 2. Checkpoint — backend complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. Pure logic utilities (`client/src/lib/careerFilters.ts`)
  - Create a new file exporting two pure functions:
    - `filterCareers(careers: Career[], filters: CareerFilters): Career[]` — applies department, location, type, and search conditions conjunctively; search is case-insensitive substring match on `title` and `department`
    - `isValidResumeType(mimeType: string): boolean` — returns true iff `mimeType` is one of `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - Export the `CareerFilters` interface from this file
  - _Requirements: 3.4, 3.5, 2.2_

  - [x] 3.1 Write property test — Property 3: filter options equal distinct field values
    - Use fast-check to generate random `Career[]` arrays
    - Render `FilterPanel` with the generated array and assert that each dropdown's option list equals `[...new Set(careers.map(c => c.field))]`
    - **Property 3: Filter options equal distinct field values**
    - **Validates: Requirements 3.1, 3.2, 3.3**

  - [x] 3.2 Write property test — Property 4: search filter is case-insensitive substring match
    - Use fast-check to generate random `Career[]` arrays and random search strings
    - Call `filterCareers(careers, { search, department: '', location: '', type: '' })`
    - Assert every result contains the search string in `title` or `department` (case-insensitive) and no non-matching result is included
    - **Property 4: Search filter is case-insensitive substring match**
    - **Validates: Requirements 3.4**

  - [x] 3.3 Write property test — Property 5: combined filters are conjunctive
    - Use fast-check to generate random `Career[]` arrays and random `CareerFilters` objects
    - Call `filterCareers(careers, filters)` and assert every result satisfies all active conditions simultaneously
    - **Property 5: Combined filters are conjunctive**
    - **Validates: Requirements 3.5**

  - [x] 3.4 Write property test — Property 6: filter count matches filtered array length
    - Use fast-check to generate random `Career[]` arrays and random `CareerFilters` objects
    - Assert `filterCareers(careers, filters).length` equals the count that would be displayed by `FilterPanel`
    - **Property 6: Filter count matches filtered array length**
    - **Validates: Requirements 3.8**

  - [x] 3.5 Write property test — Property 7: clear filters resets to initial state
    - Use fast-check to generate random `CareerFilters` objects
    - Simulate clicking "Clear filters" (i.e., call `onChange({ department: '', location: '', type: '', search: '' })`)
    - Assert the resulting state equals `{ department: '', location: '', type: '', search: '' }`
    - **Property 7: Clear filters is a reset to initial state**
    - **Validates: Requirements 3.7**

  - [x] 3.6 Write property test — Property 8: resume file type validation
    - Use fast-check to generate random MIME type strings
    - Call `isValidResumeType(mime)` and assert it returns true iff the value is in the allowed set
    - **Property 8: Resume file type validation**
    - **Validates: Requirements 2.2**

- [x] 4. `FilterPanel` component (`client/src/components/career/FilterPanel.tsx`)
  - Create the component with props: `careers`, `filters`, `onChange`, `matchCount`, `isLoading`
  - Derive department, location, and type option lists from the `careers` prop using `[...new Set(careers.map(c => c.field))]`
  - Render three shadcn/ui `<Select>` dropdowns (department, location, type) and a search `<Input>`
  - Display a match count badge showing `matchCount` active listings
  - Render a "Clear filters" button that calls `onChange({ department: '', location: '', type: '', search: '' })`
  - While `isLoading` is true, render `<Skeleton>` placeholders in place of the dropdowns
  - _Requirements: 3.1, 3.2, 3.3, 3.7, 3.8, 3.9_

  - [x] 4.1 Write unit tests for `FilterPanel`
    - Test: renders correct option lists from a given careers array
    - Test: "Clear filters" button calls `onChange` with all-empty filter state
    - Test: match count badge shows the value of `matchCount` prop
    - Test: skeleton is shown when `isLoading` is true
    - _Requirements: 3.1, 3.7, 3.8, 3.9_

- [x] 5. `ResumeUploader` component (`client/src/components/career/ResumeUploader.tsx`)
  - Create the component with props: `onUploadComplete`, `onUploadError`, `disabled`
  - Render a file `<Input>` accepting `.pdf,.doc,.docx`
  - On file selection, validate MIME type using `isValidResumeType` from `careerFilters.ts`; show inline error and abort if invalid
  - Validate file size ≤ 5 MB; show inline error and abort if exceeded
  - On valid file: POST `/api/uploads/request-url` with `{ name, size, contentType }`
  - PUT the file to the returned `uploadURL` using `XMLHttpRequest` to track upload progress
  - Display a shadcn/ui `<Progress>` bar while uploading; disable the file input during upload
  - On XHR success, call `onUploadComplete(objectPath)` with the public URL from the server response
  - On any failure (POST or PUT), call `onUploadError(message)` with a descriptive message
  - _Requirements: 2.2, 2.3, 2.6_

  - [x] 5.1 Write unit tests for `ResumeUploader`
    - Test: rejects file with wrong MIME type and shows inline error
    - Test: rejects file > 5 MB and shows inline error
    - Test: calls `onUploadComplete` with the correct URL on successful upload
    - Test: calls `onUploadError` when the signed-URL request fails
    - _Requirements: 2.2, 2.3_

- [x] 6. `ApplicationModal` component (`client/src/components/career/ApplicationModal.tsx`)
  - Extract the `<Dialog>` and application form from `Career.tsx` into this new component
  - Accept props: `jobId`, `jobTitle`, `open`, `onClose`
  - Embed `ResumeUploader` in the form; store the returned public URL in local state
  - Disable the submit button until all required fields (name, email, phone, location, experience, startDate, coverLetter) are non-empty and a resume URL has been obtained
  - On submit: POST `/api/applications` with form data + `resumeUrl`
  - On success: show confirmation toast and call `onClose()`
  - On upload failure: show error toast; keep form open; do not POST `/api/applications`
  - On submission failure: show error toast; keep form open
  - _Requirements: 2.1, 2.4, 2.5, 2.7, 2.8_

  - [x] 6.1 Write unit tests for `ApplicationModal`
    - Test: submit button is disabled when required fields are empty
    - Test: submit button is disabled before a resume URL is obtained
    - Test: does not call POST `/api/applications` if upload fails
    - Test: calls `onClose` and shows toast on successful submission
    - _Requirements: 2.5, 2.7, 2.8_

- [x] 7. Checkpoint — new components complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. `JobDetail` page (`client/src/pages/JobDetail.tsx`)
  - Create the page component; read `:id` from Wouter `useParams`
  - Fetch `GET /api/careers/:id` via `useQuery({ queryKey: ['/api/careers', id] })`
  - On 404 response or `isActive === false`, redirect to `/careers` using Wouter `useLocation`
  - While `isLoading`, render `<Skeleton>` blocks matching the layout of the job header and body sections
  - Render a shadcn/ui `<Breadcrumb>` with a link back to `/careers` and the current job title
  - Render the job header: `title`, `department`, `location`, `type` as badges
  - Render the job body: `description` as prose, `requirements` as a list
  - Render an "Apply Now" `<Button>` that opens `ApplicationModal` with the current `jobId` and `jobTitle`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.6, 1.7_

  - [x] 8.1 Write unit tests for `JobDetail`
    - Test: redirects to `/careers` when API returns 404
    - Test: renders skeleton while `isLoading` is true
    - Test: renders all listing fields (title, department, location, type, description, requirements)
    - Test: "Apply Now" button opens `ApplicationModal`
    - _Requirements: 1.2, 1.4, 1.7_

- [x] 9. `BulkActionToolbar` component (`client/src/components/admin/BulkActionToolbar.tsx`)
  - Create the component with props: `selectedIds`, `onBulkStatusUpdate`, `isPending`
  - Render a sticky bar (only visible when `selectedIds.length >= 1`) showing the count of selected applications
  - Render a status `<Select>` with options: Pending, Reviewed, Accepted, Rejected
  - Render an "Apply" `<Button>` that calls `onBulkStatusUpdate(selectedStatus)` with the chosen status
  - Disable the "Apply" button while `isPending` is true or no status is selected
  - _Requirements: 4.4_

  - [x] 9.1 Write unit tests for `BulkActionToolbar`
    - Test: toolbar is not rendered when `selectedIds` is empty
    - Test: toolbar shows correct count when IDs are selected
    - Test: "Apply" button calls `onBulkStatusUpdate` with the selected status
    - Test: "Apply" button is disabled while `isPending` is true
    - _Requirements: 4.4_

- [x] 10. Enhance `AdminApplications.tsx` (`client/src/pages/admin/AdminApplications.tsx`)
  - Add three filter controls at the top of the page:
    - Job dropdown: populated from `GET /api/admin/careers`; filters by `jobId`
    - Status dropdown: options Pending / Reviewed / Accepted / Rejected; filters by `status`
    - Sort dropdown: Newest first / Oldest first / Most experience / Least experience; maps to `sortBy` + `sortOrder`
  - Update the TanStack Query key to `['/api/admin/applications', { jobId, status, sortBy, sortOrder }]` so filters trigger re-fetches
  - Add a checkbox `<input>` column to each application row; track selected IDs in local state
  - Render `BulkActionToolbar` when ≥1 checkbox is selected; wire `onBulkStatusUpdate` to `PATCH /api/admin/applications/bulk-status`
  - On bulk update success: invalidate the applications query and clear selected IDs
  - On bulk update failure: show a toast listing the failed IDs from the response's `failed` array
  - Add a summary stats bar below the page heading showing total count and per-status counts derived from the current `applications` array
  - Replace the placeholder "View Resume" button with a real `<a href={app.resumeUrl} target="_blank" rel="noreferrer">` when `resumeUrl` is non-null and non-empty; render a disabled `<Button>` otherwise
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9_

  - [x] 10.1 Write property test — Property 11: applications sort order is correct
    - Use fast-check to generate random `JobApplication[]` arrays
    - Sort by `createdAt desc` and assert each element's `createdAt` ≥ the next element's `createdAt`
    - Sort by `experience desc` and assert each element's `experience` ≥ the next element's `experience`
    - **Property 11: Applications sort order is correct**
    - **Validates: Requirements 4.3**

  - [x] 10.2 Write property test — Property 16: status validation rejects non-enum values
    - Use fast-check to generate random strings
    - Call the status validator (extracted from the bulk-status route handler) and assert only `pending`, `reviewed`, `accepted`, `rejected` pass
    - **Property 16: Status validation rejects non-enum values**
    - **Validates: Requirements 5.7**

  - [x] 10.3 Write unit tests for `AdminApplications` enhancements
    - Test: "Download Resume" renders as `<a>` when `resumeUrl` is set
    - Test: "Download Resume" renders as disabled button when `resumeUrl` is null
    - Test: bulk toolbar appears only when ≥1 checkbox is selected
    - Test: summary stats bar shows correct total and per-status counts
    - _Requirements: 4.7, 4.8_

- [x] 11. Enhance `Career.tsx` (`client/src/pages/Career.tsx`)
  - Import and render `FilterPanel` below the "Current Openings" section heading, passing the full `activeJobs` array, current `filters` state, `onChange`, `matchCount`, and `isLoading`
  - Replace the standalone `searchQuery` state with a `CareerFilters` state object (`{ department: '', location: '', type: '', search: '' }`)
  - Replace the inline search `<Input>` with the `search` field inside `FilterPanel`
  - Apply `filterCareers(activeJobs, filters)` from `careerFilters.ts` to produce `displayedJobs`
  - Add a "View Details" `<Link href={/careers/${job.id}}>` button on each job card alongside the existing "Apply Now" button
  - Replace the inline `<Dialog>` / application form with `<ApplicationModal>`, passing `jobId`, `jobTitle`, `open`, and `onClose`
  - When `displayedJobs` is empty and at least one filter is active, show "No positions match your filters" message and a "Clear filters" button
  - _Requirements: 1.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 11.1 Write unit tests for updated `Career.tsx`
    - Test: "View Details" link on each card points to `/careers/${job.id}`
    - Test: "No positions match your filters" message appears when filtered list is empty
    - Test: "Clear filters" button resets all filter state
    - _Requirements: 1.5, 3.6, 3.7_

- [x] 12. Add `/careers/:id` route in `App.tsx`
  - Import `JobDetail` from `@/pages/JobDetail`
  - Add `<Route path="/careers/:id" component={JobDetail} />` immediately after the existing `<Route path="/careers" component={Career} />` line
  - _Requirements: 1.1_

- [x] 13. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- `bulk-status` route (task 1.5) must be registered before `/:id/status` in `server/routes.ts` — Express matches routes in registration order
- `filterCareers` and `isValidResumeType` are extracted as pure functions in `client/src/lib/careerFilters.ts` so property tests can run without a DOM
- Property tests use fast-check; run with `vitest --run` for single-pass execution
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each major layer
