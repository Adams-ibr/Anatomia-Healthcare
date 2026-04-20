# Bugfix Requirements Document

## Introduction

Multiple bugs have been identified in the admin dashboard affecting authentication, the Partners module API, and the Partners UI. The primary issues are:

1. **401 errors** on `/api/auth/user` and `/api/admin/stats` — the admin session is not being recognized, causing authentication failures on page load.
2. **500 error** on `/api/admin/partners` — the partners endpoint crashes on the server, preventing the admin Partners page from loading data.
3. **Partners UI mismatch** — the admin Partners module (`/admin/partners`) does not match the expected UI design (layout, columns, or interactive elements are incorrect).
4. **Minor: Missing `autocomplete` attribute** on the password input in the admin Login form.
5. **Minor: Missing `aria-describedby` or `Description`** on `DialogContent` in the admin Partners add/edit dialog.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN an admin navigates to any protected admin page (e.g., `/admin`, `/admin/partners`) THEN the system returns a 401 error on `/api/auth/user`, causing the admin layout to show the "Please log in" screen even when the user has previously authenticated.

1.2 WHEN an authenticated admin loads the Dashboard page THEN the system returns a 401 error on `/api/admin/stats`, causing stats to fail to load.

1.3 WHEN an authenticated admin navigates to `/admin/partners` THEN the system returns a 500 error on `GET /api/admin/partners`, preventing the partners list from loading.

1.4 WHEN an authenticated admin views the Partners module at `/admin/partners` THEN the system renders a UI that does not match the expected design (e.g., incorrect table columns, missing fields, or layout inconsistencies).

1.5 WHEN a user views the admin Login page THEN the password input field does not have an `autocomplete` attribute, causing browser autofill warnings and accessibility issues.

1.6 WHEN an admin opens the Add/Edit Partner dialog THEN the `DialogContent` component does not have a `Description` or `aria-describedby` attribute, causing an accessibility warning.

---

### Expected Behavior (Correct)

2.1 WHEN an admin navigates to any protected admin page after a valid login THEN the system SHALL successfully authenticate the session via `/api/auth/user` and render the admin layout with the user's content.

2.2 WHEN an authenticated admin loads the Dashboard page THEN the system SHALL successfully return stats from `/api/admin/stats` and display them in the dashboard cards.

2.3 WHEN an authenticated admin navigates to `/admin/partners` THEN the system SHALL return a 200 response from `GET /api/admin/partners` with the list of partners from the database.

2.4 WHEN an authenticated admin views the Partners module at `/admin/partners` THEN the system SHALL render the UI matching the expected design, including correct table columns (Logo, Name, Website, Status, Order, Actions), the Add Partner button, and the edit/delete actions per row.

2.5 WHEN a user views the admin Login page THEN the password input field SHALL include `autocomplete="current-password"` to support browser autofill and meet accessibility standards.

2.6 WHEN an admin opens the Add/Edit Partner dialog THEN the `DialogContent` SHALL include a `DialogDescription` or `aria-describedby` attribute to satisfy accessibility requirements.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN an unauthenticated user accesses a protected admin route THEN the system SHALL CONTINUE TO return a 401 response and show the login prompt.

3.2 WHEN an authenticated admin performs CRUD operations on partners (create, update, delete) THEN the system SHALL CONTINUE TO persist changes to the database and invalidate the relevant query caches.

3.3 WHEN the public homepage loads THEN the system SHALL CONTINUE TO fetch active partners from `/api/partners` and display them in the marquee section.

3.4 WHEN an admin logs in with valid credentials THEN the system SHALL CONTINUE TO create a session and redirect to the admin dashboard.

3.5 WHEN an admin logs out THEN the system SHALL CONTINUE TO destroy the session and clear the session cookie.

3.6 WHEN other admin modules (Articles, Team, FAQ, etc.) are accessed by an authenticated admin THEN the system SHALL CONTINUE TO load and function correctly without regression.
