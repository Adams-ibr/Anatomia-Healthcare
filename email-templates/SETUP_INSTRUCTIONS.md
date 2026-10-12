# Email Template Setup Instructions

## Issue
The current verification emails show:
1. Raw Supabase URL instead of your branded domain
2. Default Supabase email template instead of branded design

## Solution

### Step 1: Configure Custom Email Templates in Supabase

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `evfdnyxrkrkcigkkrhyr`

2. **Access Email Templates**
   - Click on `Authentication` in the left sidebar
   - Click on `Email Templates` tab
   - You'll see templates for: Confirm signup, Magic Link, Change Email, Reset Password

3. **Update "Confirm signup" Template**
   - Click on "Confirm signup" template
   - Copy the content from `confirm-signup.html` file
   - Paste it into the HTML template field
   - Click "Save"

### Step 2: Configure Site URL and Redirect URLs

1. **Go to Authentication Settings**
   - In Supabase Dashboard, go to `Authentication` > `URL Configuration`

2. **Set Site URL**
   ```
   https://www.anatomia.co
   ```

3. **Add Redirect URLs** (Allowed redirect URLs after authentication)
   ```
   https://www.anatomia.co/*
   https://www.anatomia.co/dashboard
   https://www.anatomia.co/verify-email
   http://localhost:5173/* (for local development)
   ```

4. **Enable Email Confirmations**
   - Go to `Authentication` > `Providers` > `Email`
   - Ensure "Enable email confirmations" is checked
   - Set "Confirm email" to ON

### Step 3: Update Your Code to Handle Redirects

The verification link will redirect to your site after confirmation. Make sure your app handles the redirect properly.

In your `src/lib/auth.ts`, the registration should already include the redirect URL:

```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/dashboard`,
    data: metadata
  }
})
```

### Step 4: Create a Verify Email Page (Optional)

Create `/verify-email` page to show a success message after email confirmation:

```typescript
// src/pages/VerifyEmail.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function VerifyEmail() {
  const navigate = useNavigate()
  const [verifying, setVerifying] = useState(true)

  useEffect(() => {
    // Handle the email verification callback
    const handleEmailVerification = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Email verified successfully
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      } else {
        setVerifying(false)
      }
    }

    handleEmailVerification()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        {verifying ? (
          <>
            <h1>Verifying your email...</h1>
            <p>Please wait while we confirm your account.</p>
          </>
        ) : (
          <>
            <h1>Email Verified!</h1>
            <p>Redirecting to dashboard...</p>
          </>
        )}
      </div>
    </div>
  )
}
```

### Step 5: Configure Email Provider (Optional - For Production)

For better email delivery in production, configure a custom SMTP provider:

1. **Go to Authentication Settings**
   - Navigate to `Settings` > `Auth` in Supabase Dashboard

2. **SMTP Settings** (scroll down)
   - Enable "Enable Custom SMTP"
   - Configure your SMTP provider (SendGrid, Mailgun, AWS SES, etc.)
   - Example for SendGrid:
     ```
     Host: smtp.sendgrid.net
     Port: 587
     Username: apikey
     Password: YOUR_SENDGRID_API_KEY
     Sender email: noreply@anatomia.co
     Sender name: Anatomia Healthcare
     ```

### Step 6: Test the Email Flow

1. Register a new test account
2. Check your email inbox
3. Verify the email looks branded (Anatomia Healthcare colors/logo)
4. Click the confirmation link
5. Verify it redirects to `https://www.anatomia.co/dashboard` instead of Supabase URL

## Template Variables Available

When creating email templates, you can use these variables:

- `{{ .ConfirmationURL }}` - The verification link
- `{{ .Token }}` - The verification token
- `{{ .TokenHash }}` - Hashed version of the token
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your configured site URL
- `{{ .RedirectTo }}` - The redirect URL

## Troubleshooting

### Issue: Emails still show Supabase URL
**Solution**: Make sure "Site URL" is set to `https://www.anatomia.co` in Authentication settings.

### Issue: Redirect doesn't work
**Solution**: Add your redirect URL to the "Redirect URLs" whitelist in Authentication settings.

### Issue: Email design not updating
**Solution**: 
1. Clear Supabase cache
2. Try with a new email address
3. Check that you clicked "Save" after updating the template

### Issue: Emails going to spam
**Solution**: 
1. Configure custom SMTP with a verified domain
2. Set up SPF, DKIM, and DMARC records for your domain
3. Use a professional email service (SendGrid, AWS SES, Mailgun)

## Alternative: Email Service Integration

If you want more control over emails, you can:

1. Disable Supabase auth emails
2. Use Supabase Auth Hooks to trigger your own email service
3. Send branded emails via SendGrid/Mailgun/Postmark

Example using SendGrid:
```typescript
// In your registration flow
await sendWelcomeEmail(email, verificationToken)

async function sendWelcomeEmail(email: string, token: string) {
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      personalizations: [{
        to: [{ email }],
        subject: 'Welcome to Anatomia Healthcare'
      }],
      from: { 
        email: 'noreply@anatomia.co',
        name: 'Anatomia Healthcare'
      },
      content: [{
        type: 'text/html',
        value: yourBrandedEmailHTML
      }]
    })
  })
}
```

## Resources

- [Supabase Auth Email Templates Docs](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase URL Configuration](https://supabase.com/docs/guides/auth/redirect-urls)
- [Custom SMTP Setup](https://supabase.com/docs/guides/auth/auth-smtp)
