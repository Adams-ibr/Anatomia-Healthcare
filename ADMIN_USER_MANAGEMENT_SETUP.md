# Admin User Management API Setup Guide

## Overview
The admin user management functionality now works through a secure backend API that uses Supabase's service role key. This prevents exposing sensitive credentials to the browser.

## What's Been Implemented

### Backend API (server/)
- **GET /api/auth/admin/users** - List users with pagination, search, and filtering
- **POST /api/auth/admin/users** - Create new users
- **PATCH /api/auth/admin/users/:id** - Update user details
- **DELETE /api/auth/admin/users/:id** - Delete users

### Features
- ✅ Admin role verification (only admins can access these endpoints)
- ✅ Pagination and search
- ✅ Filter by role (student, instructor, admin, support)
- ✅ Filter by status (active/suspended)
- ✅ Full CRUD operations on users
- ✅ Secure service role key usage (server-side only)
- ✅ CORS protection

### Frontend Updates
- Updated `src/lib/api/auth.ts` to call the real API endpoints
- Removed temporary fallback/mock implementations

## Setup Instructions

### Step 1: Get Your Supabase Service Role Key

1. Go to https://supabase.com/dashboard
2. Select your project (evfdnyxrkrkcigkkrhyr)
3. Go to **Settings** → **API**
4. Copy the **service_role** key (⚠️ Keep this secret!)

### Step 2: Configure the Backend Server

1. Open `server/.env`
2. Replace `your-service-role-key-here` with your actual service role key:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3...your-actual-key-here
```

### Step 3: Install Backend Dependencies

```bash
cd server
npm install
```

### Step 4: Start the Backend Server

**Development:**
```bash
cd server
npm run dev
```

The server will start on http://localhost:8787

**Production:**
```bash
cd server
npm run build
npm start
```

### Step 5: Update Frontend API URL (Production Only)

For production deployment, update the frontend `.env`:

```env
VITE_API_URL=https://your-backend-api-domain.com
```

## Deployment Options

### Option 1: Deploy Backend to Vercel/Netlify
- Deploy the `server/` directory as a serverless function
- Update `VITE_API_URL` in frontend to point to your backend URL

### Option 2: Deploy to Railway/Render
- Connect your GitHub repository
- Set the root directory to `server/`
- Add environment variables
- Get the deployment URL and update frontend

### Option 3: Use Supabase Edge Functions
- Convert the Express routes to Deno Edge Functions
- Deploy to Supabase directly

## Testing

1. Start the backend server: `cd server && npm run dev`
2. Start the frontend: `npm run dev`
3. Login as an admin user
4. Navigate to Admin → User Management
5. You should see the user list and be able to create/edit/delete users

## Security Notes

⚠️ **NEVER expose the service role key to the browser!**

- ✅ Service role key is only used in the backend
- ✅ All admin operations require authentication
- ✅ Only users with `role: 'admin'` can access these endpoints
- ✅ CORS is configured to only allow requests from your frontend domain

## Troubleshooting

### "Unable to reach the server"
- Make sure the backend server is running on port 8787
- Check that `VITE_API_URL` in frontend `.env` is correct

### "Admin access required"
- Your user account needs `role: 'admin'` in the profiles table
- Run this SQL in Supabase to grant admin access:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### "SUPABASE_SERVICE_ROLE_KEY must be set"
- Make sure `server/.env` exists
- Make sure the service role key is correctly copied

### CORS errors
- Add your frontend URL to `ALLOWED_ORIGINS` in `server/.env`
- Restart the backend server after changes

## Files Changed

### New Files
- `server/src/routes/admin-users.ts` - Admin user management endpoints
- `server/src/utils.ts` - Shared utilities
- `server/.env` - Backend environment configuration

### Modified Files
- `server/src/index.ts` - Added admin routes
- `src/lib/api/auth.ts` - Updated to call real API endpoints
- `.env` - Added VITE_API_URL configuration

## Next Steps

1. Get your service role key from Supabase
2. Add it to `server/.env`
3. Run `cd server && npm install && npm run dev`
4. Test the admin user management page

Once everything works locally, deploy the backend to your preferred hosting platform!
