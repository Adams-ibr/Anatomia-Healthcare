# Design Document: Career Module Rebuild

## Overview

This document describes the technical design for the Anatomia career module rebuild. The existing module provides a basic job listing page with a search input and an application modal that submits a mock `resumeUrl`. This rebuild adds four major capabilities:

1. **Job detail pages** — a dedicated `/careers/:id` route with full listing content and an apply CTA
2. **Real resume upload** — replace the mock `resumeUrl` with an actual Supabase Storage upload using the existing signed-URL infrastructure
3. **Advanced filtering** — department, location, and type dropdowns derived from live data, combined with the existing free-text search
4. **Admin enhancements** — filtering, sorting, bulk status updates, and real resume download links in `AdminApplications`

The stack is unchanged: React + TypeScript, TanStack Query, Wouter routing, Tailwind CSS, shadcn/ui, Framer Motion, and a Supabase + Express backend.

---

## Architecture

The feature touches three layers:

```
┌─────────────────────────────────────────────────────────────┐
│  Client (React / Wouter)                                    │
│                                                             │
│  /careers          Career.tsx  ──► FilterPanel (new)        │
│  /careers/:id      JobDetail.tsx (new)                      │
│                    └─ ApplicationModal (refactored)         │
│                         └─ ResumeUploader (new)             │
│                                                             │
│  /admin/applications  AdminApplications.tsx (enhanced)      │
│                       └─ BulkActionToolbar (new)            │
└────────────────────────────┬────────────────────────────────┘
                             │ TanStack Query (HTTP)
┌────────────────────────────▼────────────────────────────────┐
│  Express API (server/routes.ts)                             │
│                                                             │
│  GET  /api/careers                  (existing)              │
│  GET  /api/careers/:id              (new)                   │
│  POST /api/applications             (existing)              │
│  POST /api/uploads/request-url      (existing)              │
│                                                             │
│  GET   /api/admin/applications      (enhanced — query params)│
│  PATCH /api/admin/applications/:id/status  (existing)       │
│  PATCH /api/admin/applications/bulk-status (new)            │
└────────────────────────────┬────────────────────────────────┘
                             │ Supabase JS client
┌────────────────────────────▼────────────────────────────────┐
│  Supabase                                                   │
│  • careers table                                            │
│  • job_applications table                                   │
│  • Storage bucket "uploads"                                 │
└─────────────────────────────────────────────────────────────┘
```

All new client state is local (React `useState`) or server-state managed by TanStack Query. No new global state stores are introduced.

---

## Components and Interfaces

### New / Modified Client Components

#### `JobDetail` — `client/src/pages/JobDetail.tsx` (new)

A full-page component rendered at `/careers/:id`.

```
JobDetail
├── Breadcrumb  (/careers → current title)
├── JobHeader   (title, department, location, type badges)
├── JobBody     (description prose, requirements list)
└── ApplyButton → opens ApplicationModal
```

Props: none (reads `:id` from Wouter `useParams`).

Data: `useQuery({ queryKey: ['/api/careers', id] })` — fetches a single career. On 404 or `isActive === false`, redirects to `/careers` via Wouter `useLocation`.

Skeleton: while `isLoading`, renders `<Skeleton>` blocks matching the layout of `JobHeader` and `JobBody`.

#### `FilterPanel` — `client/src/components/career/FilterPanel.tsx` (new)

A controlled component that renders three `<Select>` dropdowns (department, location, type) and a match count badge. It derives its option lists from the full `careers` array passed in as a prop — no extra network call.

```typescript
interface FilterPanelProps {
  careers: Career[];          // full active listing, used to derive options
  filters: CareerFilters;
  onChange: (filters: CareerFilters) => void;
  matchCount: number;
  isLoading: boolean;
}

interface CareerFilters {
  department: string;   // "" = all
  location: string;     // "" = all
  type: string;         // "" = all
  search: string;
}
```

The "Clear filters" button calls `onChange` with all fields reset to `""`.

#### `Career.tsx` — modified

- Adds `FilterPanel` below the section heading.
- Replaces the inline search `<Input>` with the `search` field inside `FilterPanel`.
- Adds a "View Details" link on each job card pointing to `/careers/${job.id}`.
- Applies all four filter conditions client-side before rendering the job list.
- Moves the `<Dialog>` / application form into the new `ApplicationModal` component.

#### `ApplicationModal` — `client/src/components/career/ApplicationModal.tsx` (new)

Extracted from `Career.tsx`. Accepts `jobId` and `onClose` props. Contains the full application form and orchestrates the two-step submit flow:

1. Call `ResumeUploader` to get a `resumeUrl`.
2. POST `/api/applications` with the form data + `resumeUrl`.

```typescript
interface ApplicationModalProps {
  jobId: string;
  jobTitle: string;
  open: boolean;
  onClose: () => void;
}
```

#### `ResumeUploader` — `client/src/components/career/ResumeUploader.tsx` (new)

Handles the file-pick → signed-URL → PUT upload flow. Renders a file input, a progress bar (`<Progress>` from shadcn/ui), and error/success states.

```typescript
interface ResumeUploaderProps {
  onUploadComplete: (publicUrl: string) => void;
  onUploadError: (message: string) => void;
  disabled?: boolean;
}
```

Internal state: `{ file, progress, status: 'idle' | 'uploading' | 'done' | 'error' }`.

Upload flow:
1. User picks a file → validate MIME type and size client-side.
2. POST `/api/uploads/request-url` with `{ name, size, contentType }`.
3. PUT the file to the returned `uploadURL` using `fetch` with `onUploadProgress` via `XMLHttpRequest` (to track progress).
4. On success, call `onUploadComplete(objectPath)` where `objectPath` is the public URL returned by the server.

#### `AdminApplications.tsx` — modified

Enhanced with:
- Three filter controls at the top: job dropdown (populated from `/api/admin/careers`), status dropdown, sort dropdown.
- Checkbox column on each row.
- `BulkActionToolbar` that appears when ≥1 checkbox is selected.
- Summary stats bar (total, pending, reviewed, accepted, rejected counts).
- "Download Resume" button that is an `<a href={resumeUrl} target="_blank">` when `resumeUrl` is non-null, or a disabled button otherwise.

Query key changes to include filter params: `['/api/admin/applications', { jobId, status, sortBy, sortOrder }]`.

#### `BulkActionToolbar` — `client/src/components/admin/BulkActionToolbar.tsx` (new)

```typescript
interface BulkActionToolbarProps {
  selectedIds: string[];
  onBulkStatusUpdate: (status: string) => void;
  isPending: boolean;
}
```

Renders a sticky bar with a count badge, a status `<Select>`, and an "Apply" button.

---

## Data Models

No schema changes are required. All new behaviour uses the existing `careers` and `job_applications` tables.

### Derived types used on the client

```typescript
// Filters state (Career page)
interface CareerFilters {
  department: string;
  location: string;
  type: string;
  search: string;
}

// Admin applications query params
interface ApplicationsQueryParams {
  jobId?: string;
  status?: string;
  sortBy?: 'createdAt' | 'experience';
  sortOrder?: 'asc' | 'desc';
}

// Bulk status update request body
interface BulkStatusUpdateBody {
  ids: string[];
  status: 'pending' | 'reviewed' | 'accepted' | 'rejected';
}

// Bulk status update response
interface BulkStatusUpdateResponse {
  updated: JobApplication[];
  failed: string[];   // IDs that could not be updated
}
```

---

## API Contracts

### `GET /api/careers/:id`

Returns a single active career listing.

**Response 200**
```json
{
  "id": "uuid",
  "title": "string",
  "department": "string",
  "location": "string",
  "type": "string",
  "description": "string",
  "requirements": "string",
  "isActive": true,
  "createdAt": "ISO8601"
}
```

**Response 404**
```json
{ "error": "Career not found" }
```

Conditions for 404: no row with that `id`, or `is_active = false`.

---

### `GET /api/admin/applications` (enhanced)

Accepts optional query parameters. All are optional; omitting them returns all applications sorted by `created_at DESC`.

| Param | Type | Description |
|---|---|---|
| `jobId` | `string` | Filter to a specific career listing |
| `status` | `string` | One of `pending`, `reviewed`, `accepted`, `rejected` |
| `sortBy` | `string` | `createdAt` (default) or `experience` |
| `sortOrder` | `string` | `asc` or `desc` (default `desc`) |

**Response 200** — array of `JobApplication & { careers: { title: string } }`, same shape as current endpoint.

**Response 400** — if `status` or `sortBy` contains an unrecognised value.

---

### `PATCH /api/admin/applications/bulk-status`

> **Route ordering note**: This route must be registered in `server/routes.ts` *before* `PATCH /api/admin/applications/:id/status` so Express does not interpret `bulk-status` as an `:id` parameter.

**Request body**
```json
{
  "ids": ["uuid1", "uuid2"],
  "status": "reviewed"
}
```

**Response 200**
```json
{
  "updated": [ /* array of updated JobApplication records */ ],
  "failed": []
}
```

**Response 400** — invalid `status` value, or one or more `ids` do not exist:
```json
{
  "error": "Invalid request",
  "invalidIds": ["uuid-that-does-not-exist"]
}
```

Implementation: validate `status` against the allowed enum, then query Supabase for all provided `ids`. Any ID not found is collected into `invalidIds` and a 400 is returned immediately (no partial update). If all IDs are valid, run a single `UPDATE … WHERE id IN (…)`.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Job card links match listing IDs

*For any* array of active Career_Listings rendered on the Career page, every job card SHALL contain a "View Details" link whose `href` is exactly `/careers/${career.id}`.

**Validates: Requirements 1.5**

---

### Property 2: Job detail page renders all listing fields

*For any* Career_Listing object, the JobDetail component SHALL render the listing's `title`, `department`, `location`, `type`, `description`, and `requirements` in its output.

**Validates: Requirements 1.2**

---

### Property 3: Filter options equal distinct field values

*For any* array of active Career_Listings, the FilterPanel's department, location, and type dropdown options SHALL each be exactly the set of distinct values for that field present in the array — no more, no fewer.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 4: Search filter is case-insensitive substring match

*For any* array of Career_Listings and any search string, the filtered result SHALL contain exactly those listings whose `title` or `department` contains the search string as a case-insensitive substring, and no others.

**Validates: Requirements 3.4**

---

### Property 5: Combined filters are conjunctive

*For any* array of Career_Listings and any combination of active department, location, type, and search filters, the filtered result SHALL contain only listings that satisfy every active filter condition simultaneously.

**Validates: Requirements 3.5**

---

### Property 6: Filter count matches filtered array length

*For any* filter state applied to any array of Career_Listings, the count displayed by the FilterPanel SHALL equal the length of the filtered results array.

**Validates: Requirements 3.8**

---

### Property 7: Clear filters is a reset to initial state

*For any* combination of active filters, clicking "Clear filters" SHALL produce a filter state identical to the default initial state (all fields empty strings), regardless of what was previously selected.

**Validates: Requirements 3.7**

---

### Property 8: Resume file type validation

*For any* file object, the ResumeUploader SHALL accept it if and only if its MIME type is one of `application/pdf`, `application/msword`, or `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.

**Validates: Requirements 2.2**

---

### Property 9: Upload URL is stored as resumeUrl

*For any* valid resume file, when the upload succeeds and returns a public URL, the Application_Form SHALL include that exact URL as the `resumeUrl` field in the POST body sent to `/api/applications`.

**Validates: Requirements 2.4**

---

### Property 10: Form validation blocks submission on empty required fields

*For any* application form state where at least one required field (name, email, phone, location, experience, startDate, coverLetter, resume) is empty or whitespace-only, the submit button SHALL be disabled and no POST request SHALL be made.

**Validates: Requirements 2.7**

---

### Property 11: Applications sort order is correct

*For any* array of Job_Applications, sorting by `createdAt desc` SHALL produce a list where each element's `createdAt` is ≥ the next element's `createdAt`; sorting by `experience desc` SHALL produce a list where each element's `experience` is ≥ the next element's `experience`.

**Validates: Requirements 4.3**

---

### Property 12: Bulk status update covers all selected IDs

*For any* set of valid Job_Application IDs and any valid target status, after a successful bulk status update, every application in that set SHALL have its `status` field equal to the target status.

**Validates: Requirements 4.5**

---

### Property 13: Resume download button reflects resumeUrl presence

*For any* Job_Application, the Admin_Applications_Page SHALL render a functional `<a>` download link when `resumeUrl` is non-null and non-empty, and SHALL render a disabled button when `resumeUrl` is null or empty.

**Validates: Requirements 4.7**

---

### Property 14: Summary counts match application data

*For any* array of Job_Applications, the summary statistics displayed on the Admin_Applications_Page SHALL show a total count equal to the array length, and per-status counts equal to the number of applications with each status value.

**Validates: Requirements 4.8**

---

### Property 15: GET /api/careers/:id returns active listings and 404 for others

*For any* career ID that exists in the database with `is_active = true`, `GET /api/careers/:id` SHALL return 200 with the full listing. *For any* ID that does not exist or has `is_active = false`, it SHALL return 404.

**Validates: Requirements 5.1**

---

### Property 16: Status validation rejects non-enum values

*For any* string that is not one of `pending`, `reviewed`, `accepted`, `rejected`, any status update endpoint (single or bulk) SHALL return a 400 response.

**Validates: Requirements 5.7**

---

### Property 17: Bulk update rejects requests containing unknown IDs

*For any* bulk status update request that includes at least one ID not present in the `job_applications` table, the API SHALL return 400 and list the unrecognised IDs, and SHALL NOT update any records.

**Validates: Requirements 5.6**

---

### Property 18: Admin applications query params filter correctly

*For any* combination of `jobId`, `status`, `sortBy`, and `sortOrder` query parameters, `GET /api/admin/applications` SHALL return only applications that match all provided filter values, in the order specified by the sort parameters.

**Validates: Requirements 5.4**

---

## Error Handling

### Client-side

| Scenario | Handling |
|---|---|
| `GET /api/careers/:id` returns 404 | Redirect to `/careers` via Wouter |
| `GET /api/careers/:id` network error | Show error toast; display retry button |
| Resume file wrong type | Inline validation error below file input; no upload attempted |
| Resume file > 5 MB | Inline validation error below file input; no upload attempted |
| `POST /api/uploads/request-url` fails | Show error toast; keep form open; re-enable submit |
| PUT to signed URL fails | Show error toast; keep form open; re-enable submit |
| `POST /api/applications` fails | Show error toast; keep form open |
| Bulk status update partial failure | Toast listing failed IDs; refresh query to show current state |

### Server-side

| Scenario | Response |
|---|---|
| `GET /api/careers/:id` — not found or inactive | `404 { error: "Career not found" }` |
| `PATCH /api/admin/applications/bulk-status` — invalid status | `400 { error: "Invalid status value" }` |
| `PATCH /api/admin/applications/bulk-status` — unknown IDs | `400 { error: "Invalid request", invalidIds: [...] }` |
| `GET /api/admin/applications` — invalid `status` query param | `400 { error: "Invalid status filter" }` |
| Any Supabase error | `500 { error: "...", details: "..." }` |

---

## Testing Strategy

### Unit tests (Vitest + React Testing Library)

Focus on specific examples, edge cases, and pure logic:

- `FilterPanel`: renders correct option lists from a given careers array; "Clear filters" resets state; match count badge shows correct number.
- `ResumeUploader`: rejects files with wrong MIME type; rejects files > 5 MB; calls `onUploadComplete` with the correct URL on success; calls `onUploadError` on failure.
- `ApplicationModal`: submit button is disabled when required fields are empty; does not call POST if upload fails.
- `JobDetail`: redirects to `/careers` when API returns 404; renders skeleton while loading.
- `AdminApplications`: "Download Resume" renders as `<a>` when `resumeUrl` is set, disabled button when null; bulk toolbar appears only when ≥1 checkbox is selected.
- API route handlers: `GET /api/careers/:id` returns 404 for inactive listings; `PATCH /api/admin/applications/bulk-status` returns 400 for invalid status strings and for unknown IDs.

### Property-based tests (fast-check, minimum 100 iterations each)

Each property test is tagged with the design property it validates.

- **Feature: career-module-rebuild, Property 3**: Generate random Career arrays → render FilterPanel → assert dropdown options equal `[...new Set(careers.map(c => c.department))]` (and same for location, type).
- **Feature: career-module-rebuild, Property 4**: Generate random Career arrays and random search strings → apply `filterCareers(careers, { search })` → assert every result contains the search string in title or department (case-insensitive) and no non-matching result is included.
- **Feature: career-module-rebuild, Property 5**: Generate random Career arrays and random filter combinations → apply `filterCareers` → assert every result satisfies all active conditions.
- **Feature: career-module-rebuild, Property 6**: Generate random Career arrays and random filter states → assert `filterCareers(careers, filters).length === displayedCount`.
- **Feature: career-module-rebuild, Property 7**: Generate random filter states → simulate clear → assert resulting state equals `{ department: '', location: '', type: '', search: '' }`.
- **Feature: career-module-rebuild, Property 8**: Generate random file MIME types → assert `isValidResumeType(mime)` returns true iff mime is in the allowed set.
- **Feature: career-module-rebuild, Property 11**: Generate random application arrays → sort by each key/direction → assert pairwise ordering invariant holds.
- **Feature: career-module-rebuild, Property 16**: Generate random strings → call status validator → assert only the four valid values pass.

### Integration tests

- `GET /api/careers/:id` against a real (test) Supabase instance: active listing returns 200, inactive returns 404.
- `GET /api/admin/applications` with each query param combination: verify Supabase query is constructed correctly (can be tested with a mock Supabase client).
- `PATCH /api/admin/applications/bulk-status`: verify all rows are updated in a single Supabase call.
- Resume upload end-to-end: POST `/api/uploads/request-url` → PUT to signed URL → verify public URL is accessible.
