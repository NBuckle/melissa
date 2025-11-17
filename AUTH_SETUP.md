# Authentication Setup Guide

## Fix Email Magic Link Redirect Issue

The magic link in emails was redirecting to `localhost` instead of your production URL. This has been fixed, but requires configuration in both Vercel and Supabase.

---

## Step 1: Set Environment Variable in Vercel

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your `melissa` project
3. Click **Settings** → **Environment Variables**
4. Add a new environment variable:
   - **Name:** `NEXT_PUBLIC_SITE_URL`
   - **Value:** Your production URL (e.g., `https://melissa-inventory.vercel.app`)
   - **Environments:** Check **Production**, **Preview**, and **Development**
5. Click **Save**

> **Important:** After adding the environment variable, you need to redeploy for it to take effect.

---

## Step 2: Configure Supabase Site URL

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Set the **Site URL** to your production URL:
   - Example: `https://melissa-inventory.vercel.app`
5. In **Redirect URLs**, add:
   - `https://melissa-inventory.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local development)
6. Click **Save**

---

## Step 3: Redeploy on Vercel

After setting the environment variable:

1. Go to **Deployments** in your Vercel dashboard
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Or push a new commit to trigger automatic deployment

---

## Step 4: Test the Magic Link

1. Go to your production site login page
2. Enter your email address
3. Click "Send Magic Link"
4. Check your email
5. Click the magic link
6. **You should now be redirected to your production site, not localhost!**

---

## How It Works

### Before Fix:
- Magic link form used `window.location.origin`
- If you tested locally, it would generate links with `localhost`
- Links sent from emails would redirect to `localhost`

### After Fix:
- Magic link form now uses `NEXT_PUBLIC_SITE_URL` environment variable
- In production, this will be your Vercel URL
- In local development, it falls back to `window.location.origin`
- Links always redirect to the correct environment

---

## Troubleshooting

### Still redirecting to localhost?
1. Verify `NEXT_PUBLIC_SITE_URL` is set in Vercel
2. Make sure you redeployed after adding the environment variable
3. Clear your browser cache and cookies
4. Try requesting a new magic link (old links may still use old URL)

### Email not arriving?
1. Check your spam/junk folder
2. Verify the email is correct in Supabase **Authentication** → **Users**
3. Check Supabase **Authentication** → **Email Templates** settings

### "Invalid redirect URL" error?
1. Ensure the redirect URL is added in Supabase **Authentication** → **URL Configuration** → **Redirect URLs**
2. URL must match exactly (including https:// and no trailing slash)

---

## Environment Variables Reference

Your app needs these environment variables set in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)
- `NEXT_PUBLIC_SITE_URL` - Your production URL (e.g., `https://melissa-inventory.vercel.app`)

---

**Note:** The code fix has been committed. You just need to configure the environment variables and Supabase settings as described above.
