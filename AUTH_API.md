# HamaAcademy Authentication API Contract

The frontend authenticates against a REST API. Set the API base URL in `.env.local`:

```
VITE_API_URL=https://www.hamaacademy.com
```

The app ships with this value configured (the live domain). Auth requests are sent to `${VITE_API_URL}/api/auth/...`, so the backend should expose the endpoints below under `/api` on `www.hamaacademy.com` (directly or via reverse proxy). When `VITE_API_URL` is unset, requests go to the same origin.

All endpoints return JSON. Errors return an appropriate HTTP status with an `{ "error": "human readable message" }` body. Authenticated endpoints require the header:

```
Authorization: Bearer <token>
```

The token is a JWT returned by `register` / `login` and persisted by the client.

## User object

The `user` object returned by the API uses this shape (only `id`, `name`, `email`, `role`, `isActive`, `joinedAt` are required):

```json
{
  "id": "u_123",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "student | instructor | admin | support",
  "avatar": "https://...",
  "title": "Learner",
  "bio": "Short bio",
  "skills": ["Python", "Security"],
  "headline": "Headline",
  "website": "https://...",
  "isActive": true,
  "joinedAt": "2026-01-15T10:00:00.000Z"
}
```

The client merges defaults for missing optional fields, so only the required fields are mandatory.

## Endpoints

### POST /api/auth/register
Creates an account and returns a session.

Request:
```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "secret123", "role": "student" }
```
`role` is optional (`"student"` or `"instructor"`, defaults to `"student"`).

Response `201`:
```json
{ "user": { ...User }, "token": "jwt-token" }
```

Errors: `409` if the email is already registered, `422` on invalid input.

### POST /api/auth/login
Request:
```json
{ "email": "jane@example.com", "password": "secret123" }
```
Response `200`:
```json
{ "user": { ...User }, "token": "jwt-token" }
```
Errors: `401` invalid credentials, `403` if the account is disabled/unverified (with an `error` message the client displays).

### POST /api/auth/logout
Optional — invalidates the session server-side. Client always clears its token regardless of the response. Auth required. Response `204`.

### POST /api/auth/forgot-password
Request:
```json
{ "email": "jane@example.com" }
```
Response `200`:
```json
{ "message": "If that email exists, a reset link has been sent." }
```
Return the same response for unknown emails (do not leak account existence).

### POST /api/auth/reset-password
Request:
```json
{ "token": "reset-token", "password": "new-secret" }
```
The `token` is delivered via the email link to `/reset-password?token=...`. Response `200` `{ "message": "Password updated." }`. Errors: `400` invalid/expired token.

### POST /api/auth/verify-email
Request:
```json
{ "token": "verify-token" }
```
The `token` is delivered via the email link to `/verify-email?token=...`. Response `200`. Errors: `400` invalid/expired token.

### GET /api/auth/me
Auth required. Returns the current user.

Response `200`:
```json
{ "user": { ...User } }
```
Errors: `401` when the token is missing/expired (client logs the user out).

### PATCH /api/auth/profile
Auth required. Updates profile fields. Accepts a partial user object (e.g. `{ "name": "...", "bio": "...", "skills": [...] }`).

Response `200`:
```json
{ "user": { ...User } }
```

### POST /api/auth/change-password
Auth required.

Request:
```json
{ "currentPassword": "old", "newPassword": "new-secret" }
```
Response `200` `{ "message": "Password updated." }`. Errors: `400` if the current password is incorrect or the new one fails validation.

### DELETE /api/auth/account
Auth required. Permanently deletes the account and revokes its sessions. Response `204`.