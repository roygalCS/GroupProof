# SendGrid API Key - Quick Setup (No Code!)

## You Don't Need Any Programming Language!

Creating a SendGrid API key is just clicking buttons in a web browser. No coding required!

## Step-by-Step (5 minutes)

### Step 1: Sign Up / Log In
1. Go to **https://sendgrid.com**
2. Click **"Start for Free"** or **"Sign Up"**
3. Complete registration (free tier = 100 emails/day)
4. Verify your email if needed

### Step 2: Navigate to API Keys
1. Once logged in, look at the **left sidebar menu**
2. Click **"Settings"** (gear icon at bottom)
3. Click **"API Keys"** under Settings

### Step 3: Create API Key
1. Click the **"Create API Key"** button (top right)
2. **Name it**: Give it a name like "SmartDeadlines" or "MyApp"
3. **Select permissions**:
   - Choose **"Full Access"** (easiest), OR
   - Choose **"Restricted Access"** → Enable **"Mail Send"** permission
4. Click **"Create & View"**

### Step 4: Copy the Key
1. **IMPORTANT**: Copy the API key immediately!
   - It starts with `SG.` (like `SG.abc123xyz...`)
   - You can only see it once!
   - If you lose it, you'll need to create a new one
2. Copy the entire key (it's long, like 70+ characters)

### Step 5: Verify Sender Email (Required!)
1. Go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in your email address and details
4. Check your email and click the verification link
5. This email will be your `FROM_EMAIL`

## What You'll Get

- **API Key**: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Verified Email**: `your-email@example.com` (for FROM_EMAIL)

## Next Steps

Once you have both:
1. Tell me your API key and verified email
2. I'll add them to your `backend/.env` file
3. Restart your backend server
4. Emails will start sending!

## Visual Guide

```
SendGrid Dashboard
├── Settings (left sidebar)
│   ├── API Keys
│   │   └── Create API Key button
│   └── Sender Authentication
│       └── Verify a Single Sender
```

## Troubleshooting

**"I can't find API Keys"**
- Make sure you're logged in
- Look in Settings menu (gear icon)
- It might be under "Settings" → "API Keys"

**"I lost my API key"**
- You can't recover it
- Just create a new one (old one will still work until you delete it)

**"What permissions do I need?"**
- Minimum: "Mail Send" permission
- Easiest: "Full Access" (for testing)

## That's It!

No programming, no code, just web interface clicks. Takes about 5 minutes!

