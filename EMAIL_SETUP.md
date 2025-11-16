# Email Setup Guide - SendGrid Configuration

This guide will help you set up SendGrid to send real invitation emails.

## Step 1: Create a SendGrid Account

1. Go to https://sendgrid.com
2. Click "Start for Free" or "Sign Up"
3. Complete the registration (free tier allows 100 emails/day)

## Step 2: Get Your SendGrid API Key

1. After logging in, go to **Settings** → **API Keys** (or visit https://app.sendgrid.com/settings/api_keys)
2. Click **"Create API Key"**
3. Give it a name (e.g., "SmartDeadlines")
4. Select **"Full Access"** or **"Restricted Access"** with Mail Send permissions
5. Click **"Create & View"**
6. **IMPORTANT**: Copy the API key immediately - you won't be able to see it again!

## Step 3: Verify Your Sender Email

1. Go to **Settings** → **Sender Authentication** (or https://app.sendgrid.com/settings/sender_auth)
2. Click **"Verify a Single Sender"** (for testing) or **"Authenticate Your Domain"** (for production)
3. For **Single Sender**:
   - Enter your email address
   - Fill in the required information
   - Check your email and click the verification link
4. This email will be used as the `FROM_EMAIL` in your `.env` file

## Step 4: Configure Backend Environment

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create or edit the `.env` file:
   ```bash
   # If .env doesn't exist, copy from .env.example
   cp .env.example .env
   
   # Or create it manually
   nano .env  # or use your preferred editor
   ```

3. Add these lines to `.env`:
   ```env
   SENDGRID_API_KEY=SG.your_actual_api_key_here
   FROM_EMAIL=your-verified-email@example.com
   JWT_SECRET=your-random-secret-key-here
   FRONTEND_URL=http://localhost:5173
   PORT=3001
   ```

   **Replace:**
   - `SG.your_actual_api_key_here` with the API key you copied from SendGrid
   - `your-verified-email@example.com` with the email you verified in SendGrid
   - `your-random-secret-key-here` with a random string (for JWT token signing)

## Step 5: Restart Backend Server

1. Stop the current backend server (Ctrl+C if running)
2. Restart it:
   ```bash
   cd backend
   npm start
   # or
   node src/server.js
   ```

## Step 6: Test Email Sending

1. Create a new task in the frontend
2. Add your own email address to the member emails list
3. Submit the form
4. Check your email inbox (and spam folder)
5. You should receive the invitation email!

## Troubleshooting

### Emails still not sending?

1. **Check backend logs** - Look for error messages in the terminal where the backend is running

2. **Verify API key** - Make sure:
   - The API key starts with `SG.`
   - There are no extra spaces or quotes in `.env`
   - The API key has "Mail Send" permissions

3. **Check sender email**:
   - Must be verified in SendGrid
   - Must match the `FROM_EMAIL` in `.env`

4. **Check SendGrid Activity**:
   - Go to https://app.sendgrid.com/activity
   - Look for your email sends and any error messages

5. **Free tier limits**:
   - SendGrid free tier: 100 emails/day
   - If you hit the limit, wait 24 hours or upgrade

### Common Errors

- **"Forbidden"**: API key doesn't have Mail Send permissions
- **"Unauthorized"**: Invalid API key
- **"Sender not verified"**: FROM_EMAIL not verified in SendGrid
- **"Rate limit exceeded"**: Hit the 100 emails/day limit

## Alternative: Use a Different Email Service

If you prefer a different email service, you can modify `backend/src/utils/email.js` to use:
- AWS SES
- Mailgun
- Postmark
- Nodemailer with SMTP

But SendGrid is the easiest to set up and has a generous free tier.

