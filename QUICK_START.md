# Anatomia Healthcare - Quick Start Guide

## 🚀 Getting Started

### Frontend (React + Vite)

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Frontend runs on: http://localhost:5173

### Backend API (Express + TypeScript)

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Configure environment
# Edit server/.env and add your Supabase service role key:
# SUPABASE_SERVICE_ROLE_KEY=your-key-here

# Start development server
npm run dev

# Build for production
npm run build
npm start
```

Backend runs on: http://localhost:8787

## 🔑 Environment Setup

### Frontend (.env)
```env
VITE_SUPABASE_URL=https://evfdnyxrkrkcigkkrhyr.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_URL=http://localhost:8787
```

### Backend (server/.env)
```env
SUPABASE_URL=https://evfdnyxrkrkcigkkrhyr.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
FRONTEND_URL=https://www.anatomia.co
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,https://www.anatomia.co
PORT=8787
```

## 📋 Current Status

### ✅ Working Features
- Authentication (Login, Register, Password Reset)
- Course Catalog with Supabase integration
- Student Dashboard with enrollment sync
- Articles/Blog with smart text formatting
- Email templates (all 6 auth flows)
- Partners slider
- Admin panel structure

### ⚙️ Needs Configuration
- **Admin User Management** - Requires backend setup:
  1. Get service role key from Supabase Dashboard
  2. Add to `server/.env`
  3. Start backend server with `cd server && npm run dev`
  4. See `ADMIN_USER_MANAGEMENT_SETUP.md` for details

## 📚 Documentation

- `ADMIN_USER_MANAGEMENT_SETUP.md` - Complete guide for admin features
- `ADMIN_USER_MANAGEMENT_FIX.md` - Solution options reference
- `TROUBLESHOOTING.md` - Common issues and fixes
- `AUTH_API.md` - Authentication API reference
- `email-templates/SETUP_INSTRUCTIONS.md` - Email template configuration

## 🔐 Making Yourself Admin

Run this SQL in Supabase SQL Editor:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

## 🚢 Deployment

### Frontend (Already deployed)
- Platform: Vercel
- URL: https://www.anatomia.co
- Auto-deploys from `main` branch

### Backend (Needs deployment)
Choose one:
1. **Vercel** - Deploy `server/` as serverless functions
2. **Railway/Render** - Traditional hosting
3. **Supabase Edge Functions** - Convert to Deno functions

Update `VITE_API_URL` in frontend `.env` to point to deployed backend.

## 🐛 Common Issues

### "Unable to reach the server"
- Make sure backend is running: `cd server && npm run dev`
- Check `VITE_API_URL` in frontend `.env`

### "Admin access required"
- Update your profile role to 'admin' (see SQL above)

### Email templates not working
- Configure in Supabase Dashboard → Authentication → Email Templates
- Copy from `email-templates/*.html`

## 📞 Need Help?

Check the documentation files listed above for detailed guides on specific features.
