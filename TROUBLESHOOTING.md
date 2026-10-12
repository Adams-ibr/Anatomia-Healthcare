# Troubleshooting Guide

## Login Fails with 400 Error

### Issue
Users see this error in console:
```
Failed to load resource: the server responded with a status of 400
evfdnyxrkrkcigkkrhyr.supabase.co/auth/v1/token?grant_type=password
```

### Root Causes

This error occurs when:

1. **Email Not Confirmed** (Most Common)
   - User registered but hasn't clicked the verification link in their email
   - Supabase requires email confirmation before login

2. **Invalid Credentials**
   - Wrong email or password entered

3. **Email Confirmation Settings**
   - Supabase "Confirm email" setting is ON
   - Users must verify email before first login

### Solutions

#### Option 1: Disable Email Confirmation (Quick Fix - Not Recommended for Production)

1. Go to Supabase Dashboard
2. Navigate to `Authentication` → `Providers` → `Email`
3. Find "Confirm email" toggle
4. Turn it **OFF**
5. Users can now log in immediately after registration

**⚠️ Security Risk**: Users can create accounts with any email address without verification.

#### Option 2: Keep Email Confirmation (Recommended)

1. **Ensure Email Templates are Set Up** (Already done ✅)
   - Use the branded templates we created
   - Configure redirect URLs properly

2. **Update Registration Flow**
   - Show clear message after registration
   - Tell users to check email for verification link
   - Provide "Resend verification" option

3. **Improve Login Error Messages** (Already done ✅)
   - Code now shows: "Please confirm your email address before signing in"
   - Clear instructions for users

#### Option 3: Allow Unconfirmed Email Login (Compromise)

1. Go to Supabase Dashboard
2. Navigate to `Authentication` → `Settings`
3. Look for "Enable email confirmations"
4. You can set it to allow login but mark as unconfirmed
5. Show banner in app: "Please verify your email"

### Implementation

#### Better Registration UI

Update `src/pages/Register.tsx` to show confirmation message:

```typescript
const [registrationSuccess, setRegistrationSuccess] = useState(false)

// After successful registration:
if (result.pendingConfirmation) {
  setRegistrationSuccess(true)
  // Show message instead of auto-login
}

// UI:
{registrationSuccess && (
  <div className="success-message">
    <h3>Registration Successful! 📧</h3>
    <p>We've sent a verification link to your email.</p>
    <p>Please check your inbox and click the link to activate your account.</p>
    <button onClick={resendVerification}>Resend Email</button>
  </div>
)}
```

#### Add Resend Verification Function

```typescript
export async function resendVerification(email: string): Promise<void> {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
  })
  
  if (error) {
    throw new Error('Failed to resend verification email')
  }
}
```

### Current Status

✅ **Fixed**: Added better error messages in `auth.ts`
- Now shows: "Please confirm your email address before signing in"
- Clear feedback for invalid credentials

🔧 **Recommended Next Steps**:
1. Update registration page to show email confirmation message
2. Add "Resend verification" button
3. Consider your security requirements:
   - Production: Keep email confirmation ON
   - Development: Can disable for testing

### Testing

1. **Create Test Account**
   ```
   Email: test@example.com
   Password: TestPassword123
   ```

2. **Check Email**
   - Should receive verification email
   - Click verification link
   - Should redirect to dashboard

3. **Try Login Before Verification**
   - Should show: "Please confirm your email address"
   - Clear error message

4. **After Verification**
   - Login should work normally
   - Redirect to dashboard

### Quick Fix for Development

If you need to test quickly without email verification:

1. **Supabase Dashboard** → `Authentication` → `Providers` → `Email`
2. **Disable** "Confirm email"
3. Restart your dev server
4. Users can now register and login immediately

Remember to **re-enable** for production!

### Checking User Status

You can check if a user confirmed their email in Supabase:

1. Go to `Authentication` → `Users`
2. Look at the user's row
3. Check "Email Confirmed" column
4. If `false`, user needs to verify

### Manual Email Confirmation (For Testing)

If you need to manually confirm a test user:

1. Go to Supabase Dashboard
2. Navigate to `Authentication` → `Users`
3. Click on the user
4. Look for "Email Confirmed" field
5. You can manually mark it as confirmed

OR use SQL:

```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'test@example.com';
```

### Prevention

To prevent this issue:

1. ✅ Clear registration success message
2. ✅ Email instructions
3. ✅ Resend verification option
4. ✅ Better error messages on login
5. ✅ Branded email templates (Already created)
6. Configure proper redirect URLs in Supabase

### Related Files

- `src/lib/auth.ts` - Authentication logic (Updated ✅)
- `src/pages/Register.tsx` - Registration page
- `src/pages/Login.tsx` - Login page
- `email-templates/` - Email templates (Created ✅)

### Support

If users still can't log in:

1. Check Supabase logs: `Logs` → `Auth`
2. Verify email configuration
3. Check redirect URLs are whitelisted
4. Ensure SMTP is configured (for production)
5. Test with a fresh email address
