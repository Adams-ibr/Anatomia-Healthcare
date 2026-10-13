# Dashboard Stats Fix

## Problem
The admin dashboard was showing all zeros for statistics because:
1. Backend API endpoints were missing
2. Database tables for enrollments, orders, and certificates didn't exist

## Solution Implemented

### 1. Created New API Endpoints

**File: `server/src/routes/admin-stats.ts`**
- `GET /api/auth/admin/payments` - Returns revenue stats, order count, and monthly revenue data
- `GET /api/auth/admin/certificates` - Returns all issued certificates with student/course details
- `GET /api/auth/admin/enrollments` - Returns all enrollments with progress and student info

**File: `server/src/routes/courses.ts`**
- `GET /api/courses` - List all courses with pagination and filtering
- `GET /api/courses/:id` - Get single course with instructor, module count, enrollment count

### 2. Updated Server Configuration

**File: `server/src/index.ts`**
- Imported and registered the new route modules
- Routes are now available at:
  - `/api/auth/admin/payments`
  - `/api/auth/admin/certificates`
  - `/api/auth/admin/enrollments`
  - `/api/courses`

### 3. Added Missing Database Tables

**File: `supabase_schema.sql`**
Added three new tables with proper RLS policies:

#### `enrollments` Table
- Tracks student course enrollments
- Includes: progress, status, completion data, quiz scores
- Automatically generates enrollment records when students purchase courses

#### `orders` Table
- Tracks all purchases and transactions
- Includes: subtotal, tax, discount, total, payment info
- Auto-generates order numbers (format: ORD-YYYYMMDD-0001)

#### `certificates` Table  
- Stores issued completion certificates
- Includes: certificate number, completion date, score, grade
- Auto-generates certificate numbers (format: CERT-YYYY-000001)

## What You Need to Do

### Step 1: Run the Database Migration

Go to your Supabase Dashboard:
1. Open https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy the contents of `supabase_schema.sql` (specifically the enrollments, orders, and certificates sections at the bottom)
5. Click **Run** to create the tables

### Step 2: Verify Backend is Running

The backend server should be running on `http://localhost:8787`

If not running:
```bash
cd server
npm run dev
```

### Step 3: Test the Dashboard

1. Open your admin dashboard at `https://www.anatomia.co/admin`
2. Log in with your admin account
3. The stats should now load (showing 0 if no data exists yet)

## Dashboard Stats Explained

The dashboard now shows:

### Row 1 - User Stats
- **Total Users**: Count of all registered users
- **Students**: Count of users with role 'student'
- **Instructors**: Count of users with role 'instructor'  
- **Revenue**: Total from completed orders (sum of `total` column)

### Row 2 - Content Stats
- **Courses**: Count of published courses
- **Enrollments**: Count of all enrollments (platform-wide)
- **Certificates Issued**: Count of all certificates
- **Completion Rate**: Percentage of enrollments marked as 'completed'

### Chart
- **User Growth**: Monthly revenue over the last 6 months

## Why Stats Show Zero

If your dashboard still shows zeros, it's because:
1. No users have enrolled in courses yet
2. No orders have been completed
3. No certificates have been issued

This is normal for a new platform! As users sign up, enroll, and complete courses, these numbers will update automatically.

## Creating Test Data (Optional)

If you want to see the dashboard with data, you can create test records:

```sql
-- Create a test enrollment
INSERT INTO enrollments (user_id, course_id, status, progress, price_paid)
VALUES ('your-user-id', 'course-id', 'active', 45, 99.00);

-- Create a test order
INSERT INTO orders (user_id, total, status, items)
VALUES ('your-user-id', 99.00, 'completed', '[{"courseId": "course-id", "price": 99.00}]'::jsonb);

-- Create a test certificate
INSERT INTO certificates (student_id, course_id, completion_date)
VALUES ('your-user-id', 'course-id', NOW());
```

## API Testing

You can test the endpoints directly:

```bash
# Get payment stats (requires admin token)
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:8787/api/auth/admin/payments

# Get enrollments
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:8787/api/auth/admin/enrollments

# Get certificates
curl -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  http://localhost:8787/api/auth/admin/certificates

# Get courses
curl http://localhost:8787/api/courses
```

## Next Steps

1. ✅ Backend API endpoints created
2. ✅ Database schema updated
3. ⏳ Run database migration (you need to do this)
4. ⏳ Test dashboard with real or test data

Once you run the SQL migration, your dashboard will be fully functional!
