# Anatomia mobile app

Expo / React Native app for Anatomia learners and instructors. The website remains the source of truth for Supabase authentication, course records, and access policies.

## Run locally

1. Install Node.js 22.13 or newer.
2. Copy `.env.example` to `.env` and set the Supabase project URL and publishable/anon key. These are public client values; never put a Supabase service-role key or Paystack secret in this file.
3. From this folder run `npm install`, then `npm start`.
4. Scan the Expo QR code with Expo Go, or press `i` / `a` in the terminal for an available simulator/emulator.

The starter uses the existing project at `evfdnyxrkrkcigkkrhyr`. Supabase Auth must have the mobile redirect URL `anatomia://auth/callback` in its allowed redirect URLs for Google OAuth. The mobile Google flow also requires Google sign-in to be enabled for the Supabase provider.

## Included in this first slice

- Email/password sign-in and student self-registration through Supabase Auth.
- Google OAuth started in the system browser and returned through the `anatomia` app link.
- Role-aware student and instructor landing experiences. Privileged roles must come from server-controlled Supabase `app_metadata`; client `user_metadata` is not trusted for access decisions.
- Published course browsing for learners, and a course list filtered to the signed-in instructor's `created_by` ID.
- Course information view backed by the canonical course-content endpoint, profile, sign-out, pull-to-refresh, and encrypted session persistence.
- Free-course enrollment, a server-backed learning library, lesson study/progress updates, protected assessment taking with server-side grading, and certificate status from the existing API.
- Paystack-only paid course checkout opened in the system browser, with order verification through the authenticated backend before access is granted.
- Instructor draft course creation with course category, price, sections, and text/video lessons.

## Remaining mobile product work

This is the foundation, not a complete mobile release. Editing existing course content, publishing and review workflows, lesson media/offline downloads, flashcards, messaging, and notifications still need implementation. The initial mobile instructor workflow creates new drafts and their outline. Paid checkout uses Paystack only: the secret remains server-side, and course access is granted only after the backend verifies the transaction. Before release, validate the production Paystack callback/webhook and Supabase row-level security for both roles.

## Account roles

The client defaults to the student experience when the signed-in user's server-owned `app_metadata.role` / `app_metadata.account_type` is absent or unknown. This is only a navigation choice; every protected data operation still requires server/database authorization. If the current web admin role is resolved only by `/api/auth/me/access` and is not present in signed server claims, add a compact, server-signed role claim or a mobile-compatible role endpoint before exposing instructor/admin capabilities in production.
