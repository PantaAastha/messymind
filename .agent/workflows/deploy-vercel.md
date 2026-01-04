---
description: Deploy MessyMind to Vercel
---

# Deploy MessyMind to Vercel

This workflow guides you through deploying the MessyMind application to Vercel.

## Prerequisites

- Ensure your code is committed and pushed to GitHub
- Have your Supabase credentials ready (URL and Anon Key)

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended for first deployment)

1. **Sign in to Vercel**
   - Visit https://vercel.com
   - Sign in with your GitHub account

2. **Import Project**
   - Click "Add New Project"
   - Select "Import Git Repository"
   - Choose `PantaAastha/messymind` from your repositories
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Next.js (auto-detected)
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

4. **Add Environment Variables**
   Click "Environment Variables" and add:
   - `NEXT_PUBLIC_SUPABASE_URL` = your-supabase-project-url
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your-supabase-anon-key

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (2-3 minutes)
   - Visit your deployed URL

### Option 2: Deploy via Vercel CLI (Faster for subsequent deployments)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? Yes
   - Which scope? (Select your account)
   - Link to existing project? No
   - What's your project's name? messymind
   - In which directory is your code located? ./
   - Want to override settings? No

4. **Add Environment Variables**
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
   
   For each variable:
   - Select all environments (Production, Preview, Development)
   - Paste the value when prompted

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Post-Deployment Verification

1. **Test Homepage**
   - Visit your Vercel URL
   - Confirm the landing page loads correctly

2. **Test Authentication**
   - Sign up with a test account
   - Verify email/password login works

3. **Test Core Functionality**
   - Upload a sample GA4 CSV file
   - Verify diagnostic analysis completes
   - Check that results display correctly

4. **Test Supabase Integration**
   - Save a diagnostic report (requires auth)
   - Navigate to Dashboard
   - Confirm saved reports appear

5. **Test PDF Export**
   - Open a diagnostic result
   - Click "Export to PDF"
   - Verify PDF downloads correctly

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Verify all dependencies are in package.json
- Run `npm run build` locally to debug

### Environment Variables Not Working
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/updating variables
- Check variables are set for correct environment (Production/Preview/Development)

### Database Connection Fails
- Verify Supabase URL and Anon Key are correct
- Check Supabase project is active
- Confirm RLS policies allow public access where needed

## Continuous Deployment

Once set up, Vercel automatically deploys:
- **Production**: When you push to `main` branch
- **Preview**: When you push to other branches or open PRs

To disable auto-deployment:
1. Go to Project Settings in Vercel
2. Navigate to Git
3. Adjust branch deployment settings
