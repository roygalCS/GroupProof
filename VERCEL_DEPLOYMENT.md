# Deploy Frontend to Vercel

## Quick Steps

### 1. Push Code to GitHub
```bash
cd /Users/roygal/GroupProof
git add .
git commit -m "Prepare for Vercel deployment"
git push
```

### 2. Deploy to Vercel

1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your `GroupProof` repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `app` (IMPORTANT!)
   - **Build Command**: `pnpm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

### 3. Set Environment Variables in Vercel

In Vercel project settings → Environment Variables, add:

```
VITE_BACKEND_URL=https://your-backend-url.com
VITE_PROGRAM_ID=Ev7PUfQR6BJEYL7UzmA61dkYzkRmw9iVGespX9cc852j
VITE_USDC_MINT=4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU
```

**Note**: For now, you can use your local backend URL or deploy backend separately.

### 4. Deploy

Click "Deploy" and wait for it to finish.

### 5. Get Your Vercel URL

After deployment, you'll get a URL like:
- `https://group-proof.vercel.app`
- Or a custom domain if you set one up

### 6. Update Backend FRONTEND_URL

1. Copy your Vercel URL
2. Update `backend/.env`:
   ```
   FRONTEND_URL=https://your-vercel-url.vercel.app
   ```
3. Restart backend

### 7. Test

1. Create a new task
2. Check the invite link in the email - it should use your Vercel URL
3. Click the link - it should work from anywhere!

## Troubleshooting

### Build Fails
- Make sure `Root Directory` is set to `app`
- Check that `pnpm` is available (Vercel should install it)

### Environment Variables Not Working
- Make sure they start with `VITE_` for Vite to expose them
- Redeploy after adding environment variables

### Links Still Use Localhost
- Make sure you updated `FRONTEND_URL` in `backend/.env`
- Restart backend after updating
- Create a NEW task (old tasks have old links)

## Next Steps

After frontend is deployed, you might also want to:
- Deploy backend to Railway/Render/Heroku
- Set up a custom domain
- Configure production environment variables

