# Melissa Inventory System - Setup Guide

Quick reference for setting up the database and running the application.

## 🚀 Quick Start (New Sessions)

**Always run this first to see what's been done:**

```bash
npm run check-db
```

This shows:
- ✅ Migrations status
- ✅ Data import status
- ✅ User profiles
- 💡 Exact next steps

---

## Prerequisites

- ✅ Supabase account created
- ✅ Node.js installed
- ✅ Repository cloned

## Step 1: Environment Setup

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://karwhqspyarzebiwpnrh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Run Database Migrations

⚠️ **These migrations have NOT been run yet!**

Go to: https://supabase.com/dashboard/project/karwhqspyarzebiwpnrh/sql/new

Copy and paste each file from `supabase/migrations/` in order:

### Migration 1: Initial Schema
```bash
cat supabase/migrations/001_initial_schema.sql
```
Copy output → Paste in SQL Editor → Click RUN

### Migration 2: RLS Policies
```bash
cat supabase/migrations/002_rls_policies.sql
```
Copy output → Paste in SQL Editor → Click RUN

### Migration 3: Seed Data
```bash
cat supabase/migrations/003_seed_data.sql
```
Copy output → Paste in SQL Editor → Click RUN

### Migration 4: Profile Creation Fix
```bash
cat supabase/migrations/004_fix_profile_creation.sql
```
Copy output → Paste in SQL Editor → Click RUN

## Step 4: Import Google Sheets Data

After migrations are complete:

```bash
npm run import-data
```

This will import:
- Historical collection data from `old google sheets/Inventory - Melissa Donations - Form Responses.csv`
- Inventory levels from `old google sheets/Inventory - Melissa Donations - Master Inventory.csv`

## Step 5: Run the Application

```bash
npm run dev
```

Open http://localhost:3000

## Step 6: Create Admin User

1. Sign up with your email at `/login`
2. Check your email for the magic link
3. Click the link to create your account
4. In Supabase, go to Table Editor → `profiles`
5. Find your profile and change `role` from `data_entry` to `admin`

## Verification

Check that migrations worked:

```bash
node --env-file=.env.local check_items.mjs
```

Should show: `📋 Items in database (90 total)`

## Troubleshooting

**Problem:** Migrations fail with "already exists" errors
- **Solution:** Some tables may already exist. Skip that migration or drop tables first.

**Problem:** Import shows "Item not found" warnings
- **Solution:** Migrations might not have run. Verify items exist in database first.

**Problem:** Can't log in
- **Solution:** Check that Supabase auth is enabled and email templates are configured.

## Project Structure

```
melissa/
├── .env.local                 # Environment variables (gitignored)
├── supabase/migrations/       # Database migrations
├── scripts/                   # Import scripts
├── src/app/(app)/            # Protected app routes
├── src/app/(auth)/           # Auth routes
├── src/components/           # React components
└── old google sheets/        # CSV data to import
```

## Next Steps After Setup

1. Test authentication (login/logout)
2. Test collection submission
3. Verify inventory calculations
4. Set up admin users
5. Begin Phase 3: Withdrawals & Distribution
