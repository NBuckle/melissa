# Melissa Inventory System - TODO List

**Last Updated:** 2025-11-16
**Session Progress:** Vercel deployment successful ✅

---

## 🚨 CRITICAL - Must Fix Before Production Use

### 1. Run Database Migrations in Supabase Production
**Priority:** URGENT
**Status:** Not Done

The production Supabase database needs migrations 008 and 009:

- **Migration 008 (FIXED version):** Located at `supabase/migrations/008_restructure_withdrawals_FIXED.sql`
  - Renames `withdrawals` → `distributions`
  - Renames `withdrawal_items` → `distribution_items`
  - Creates `actual_withdrawals` and `actual_withdrawal_items` tables
  - Adds `receipt_date` to collections table
  - Updates all foreign keys and constraints

- **Migration 009:** Located at `supabase/migrations/009_add_cbaj_only_flag.sql`
  - Adds `is_cbaj_only` flag to items table
  - Marks CBAJ-specific items (cereal kits, food packages, water cases, etc.)
  - Updates `master_inventory` view to exclude CBAJ items
  - Updates `daily_inventory` view to exclude CBAJ items

**How to Run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy contents of `008_restructure_withdrawals_FIXED.sql`
3. Run it
4. Copy contents of `009_add_cbaj_only_flag.sql`
5. Run it
6. Verify no errors

**Without these migrations, the app will crash in production!**

---

## 🐛 BUGS - Need Investigation & Fix

### 2. Daily Inventory Not Showing Withdrawal Quantities
**Priority:** High
**Status:** Not Done

**Issue:** Daily Inventory page shows "0 items" for withdrawals even when data exists.

**Evidence from dev logs:**
```
[DEBUG] Daily withdrawals for 2025-11-04: 0 items
[DEBUG] Withdrawals by item: 0 items
```
But there should be 64 items on that date.

**Possible Causes:**
- Query in `src/app/actions/inventory.ts` (getDailyInventory function) might have wrong date format
- Relationship between `actual_withdrawal_items` and `actual_withdrawals` might be broken
- Date mismatch (check if using withdrawal_date vs submission_date)

**Files to Check:**
- `src/app/actions/inventory.ts` (lines 48-76)
- `src/app/(app)/inventory/daily/page.tsx`

**Steps to Debug:**
1. Check actual_withdrawals table in Supabase - verify dates are correct
2. Run the query manually in Supabase SQL editor
3. Check the join condition in the query
4. Verify the date format matches exactly

---

### 3. Distributions Form Uses Wrong Items Function
**Priority:** High
**Status:** Not Done

**Issue:** Distributions form should show CBAJ items (cereal kits, food packages, etc.) but currently uses `getActiveItems()` which excludes them.

**Fix Required:**
- Update distributions form/page to use `getAllActiveItems()` instead of `getActiveItems()`
- `getAllActiveItems()` includes CBAJ items
- `getActiveItems()` excludes CBAJ items (for regular inventory only)

**Files to Update:**
- Find the distributions form/page (likely `src/app/(app)/admin/distributions/page.tsx`)
- Change import/call from `getActiveItems()` to `getAllActiveItems()`

**How to Verify:**
- After fix, check distributions form dropdown
- Should see items like "Cereal kits", "Food Packages", "Water - cases", etc.

---

## 🔍 TESTING - Needs Verification

### 4. Test Withdrawals System End-to-End
**Priority:** Medium
**Status:** Not Done

**Test Checklist:**
- [ ] Navigate to `/admin/withdrawals`
- [ ] Create a new withdrawal with 2-3 items
- [ ] Submit the form
- [ ] Verify success message appears
- [ ] Check Total Inventory - stock should decrease
- [ ] Check Daily Inventory for withdrawal date - should show withdrawn quantities
- [ ] Check recent withdrawals list - should show the new withdrawal
- [ ] Expand the withdrawal - verify all details are correct
- [ ] Try creating withdrawal with quantity > available stock - should show error

### 5. Verify CBAJ Items Excluded from Total Inventory
**Priority:** Medium
**Status:** Not Done (depends on Migration 009)

**After running Migration 009, verify:**
- [ ] Navigate to Total Inventory page
- [ ] CBAJ items should NOT appear in the list:
  - Cereal kits
  - Food Packages
  - Water - cases (of 24 bottles)
  - Hygiene kits
  - (Any other items marked as is_cbaj_only = true)
- [ ] These items SHOULD still appear in Distributions page
- [ ] Regular inventory calculations should exclude CBAJ items

### 6. Test Reports Page
**Priority:** Medium
**Status:** Not Done

**Test Checklist:**
- [ ] Navigate to `/reports`
- [ ] Verify summary stats load without errors
- [ ] Click "Inventory Snapshot" - should work
- [ ] Click "Daily Closing Balance" - should work
- [ ] Click "Inventory Trends" - should work
- [ ] No "relation 'withdrawals' does not exist" errors

---

## 📚 DOCUMENTATION - Must Create

### 7. System Architecture Documentation
**Priority:** High
**Status:** Not Done

**Document to Create:** `ARCHITECTURE.md`

**Should Include:**
- **System Overview:**
  - Collections: Items coming IN (imports + user submissions)
  - Distributions: CBAJ deliveries (record-keeping only, doesn't affect inventory)
  - Withdrawals: YOUR inventory going OUT (affects stock levels)

- **Table Structure:**
  - `collections` / `collection_items` - Incoming inventory
  - `distributions` / `distribution_items` - CBAJ distributions (renamed from withdrawals)
  - `actual_withdrawals` / `actual_withdrawal_items` - Real withdrawals that affect inventory
  - `items` - Master items list with is_cbaj_only flag
  - `master_inventory` - Materialized view (calculated stock levels)
  - `daily_inventory` - View for daily breakdowns

- **Key Concepts:**
  - Receipt date vs Submission date
  - CBAJ-only items flag
  - Materialized views and when to refresh
  - Inventory calculation formula: `current_stock = total_collected - total_withdrawn`

### 8. Migration & Deployment Guide
**Priority:** High
**Status:** Not Done

**Document to Create:** `DEPLOYMENT.md`

**Should Include:**
- How to run migrations in Supabase
- Environment variables needed (NEXT_PUBLIC_SUPABASE_URL, etc.)
- Vercel deployment steps
- How to verify deployment success
- Rollback procedures

### 9. Troubleshooting Guide
**Priority:** Medium
**Status:** Not Done

**Document to Create:** `TROUBLESHOOTING.md`

**Should Include:**
- Common errors and solutions
- "relation does not exist" errors
- TypeScript type errors
- Date format issues
- Authentication redirect issues

---

## 💡 IMPROVEMENTS - Nice to Have

### 10. Improve Type Safety
**Priority:** Low
**Status:** Not Done

**Current Issue:** Using `as any` in several places bypasses TypeScript safety.

**Files Using `as any`:**
- `src/app/(app)/collect/page.tsx:33` - `<CollectionForm items={items as any} />`
- `src/app/(app)/admin/withdrawals/page.tsx:66` - `<WithdrawalForm items={items as any} />`
- `src/app/(app)/admin/withdrawals/page.tsx:74` - `<WithdrawalsList withdrawals={withdrawals as any} />`
- And likely more in server actions

**Better Approach:**
- Create proper TypeScript interfaces
- Export types from server actions
- Use proper type guards

### 11. Add Loading States
**Priority:** Low
**Status:** Not Done

**Missing Loading States:**
- Collection form while submitting
- Withdrawal form while submitting
- Reports while generating
- Inventory pages while loading data

**Implementation:**
- Add Suspense boundaries
- Create skeleton screens
- Add spinner components

### 12. Add Success/Error Toast Notifications
**Priority:** Low
**Status:** Not Done (partially done)

**Current State:**
- Some forms use `react-hot-toast`
- Not consistent across all pages

**Improvements:**
- Add toasts to all form submissions
- Add toasts for successful operations
- Better error messages with actionable steps

### 13. Audit All Table References
**Priority:** Low
**Status:** Not Done

**Action Required:**
- Search entire codebase for "withdrawals" and "withdrawal_items"
- Ensure all references use correct new table names:
  - `distributions` / `distribution_items` for CBAJ distributions
  - `actual_withdrawals` / `actual_withdrawal_items` for real withdrawals
- Update any missed references

**Search Commands:**
```bash
# Search for old table names
grep -r "from('withdrawals')" src/
grep -r "from('withdrawal_items')" src/
grep -r "withdrawal_date" src/
```

---

## 📊 CODE QUALITY

### 14. Add Comprehensive Error Handling
**Priority:** Medium
**Status:** Partial

**Current Issues:**
- Some server actions don't handle all error cases
- Some pages don't show user-friendly error messages
- Console errors not always logged properly

**Improvements Needed:**
- Wrap all database queries in try-catch
- Return user-friendly error messages
- Log errors to monitoring service (future)

### 15. Add Input Validation
**Priority:** Medium
**Status:** Partial

**Current State:**
- Server-side validation exists (Zod schemas)
- Client-side validation limited

**Improvements:**
- Add client-side validation before submission
- Show validation errors inline on forms
- Prevent invalid submissions

### 16. Optimize Database Queries
**Priority:** Low
**Status:** Not Done

**Potential Optimizations:**
- Add indexes on frequently queried columns
- Review N+1 query issues
- Consider pagination for large result sets
- Cache frequently accessed data

---

## 🔐 SECURITY

### 17. Review RLS Policies
**Priority:** Medium
**Status:** Not Done

**Action Required:**
- Review all Row Level Security policies in Supabase
- Ensure admin-only operations are properly protected
- Verify data_entry users have correct permissions
- Test with different user roles

### 18. Validate Environment Variables
**Priority:** Low
**Status:** Not Done

**Improvements:**
- Add startup check to verify all required env vars exist
- Provide helpful error messages if missing
- Document all required environment variables

---

## 🎨 USER EXPERIENCE

### 19. Improve Mobile Responsiveness
**Priority:** Low
**Status:** Partial

**Areas to Test:**
- Forms on mobile devices
- Tables on small screens
- Navigation on mobile
- Reports/charts on mobile

### 20. Add Keyboard Shortcuts
**Priority:** Low
**Status:** Not Done

**Potential Shortcuts:**
- `C` - New Collection
- `W` - New Withdrawal
- `D` - New Distribution
- `/` - Search/Filter
- `?` - Show help

---

## 📦 FEATURES - Future Enhancements

### 21. Export Reports to Excel/CSV
**Priority:** Low
**Status:** Not Done

**Implementation:**
- Add export buttons to reports
- Generate CSV/Excel files
- Include all data with proper formatting

### 22. Email Notifications
**Priority:** Low
**Status:** Not Done

**Use Cases:**
- Low stock alerts
- Weekly/monthly inventory summaries
- When withdrawals are created

### 23. Barcode Scanning
**Priority:** Low
**Status:** Not Done

**Implementation:**
- Add barcode field to items
- Integrate barcode scanner
- Quick item lookup during collection/withdrawal

---

## 🏁 COMPLETED TASKS

### ✅ Database Restructuring
- Renamed withdrawals → distributions
- Created actual_withdrawals system
- Added receipt_date to collections
- Created migration files

### ✅ CBAJ Items Separation
- Added is_cbaj_only flag
- Updated views to exclude CBAJ items from inventory
- Marked all CBAJ items in database

### ✅ Withdrawals Page
- Created withdrawal form component
- Created withdrawals list component
- Added server actions for actual_withdrawals
- Added to navigation
- Deployed to production

### ✅ Bug Fixes
- Fixed distributions-list component table references
- Fixed reports action to use actual_withdrawals
- Fixed TypeScript errors in withdrawals page
- Updated all server actions to use correct table names

### ✅ Deployment
- Successfully deployed to Vercel
- All builds passing
- Production site accessible

---

## 📝 NOTES

### Date Format Standards
- Always use ISO 8601 format: `YYYY-MM-DD`
- Store dates as DATE type in database
- Store timestamps as TIMESTAMPTZ in database

### Inventory Calculation Formula
```
current_stock = total_collected - total_withdrawn

Where:
- total_collected = SUM(collection_items.quantity) for the item
- total_withdrawn = SUM(actual_withdrawal_items.quantity) for the item
- Does NOT include distribution_items (CBAJ distributions)
```

### Table Naming Convention
- `distributions` = CBAJ distributions (record-keeping only)
- `actual_withdrawals` = Real inventory withdrawals (affects stock)
- Keep this distinction clear in code and documentation

### Scripts Available
- `scripts/check-withdrawal-dates.mjs` - Check withdrawal dates in database
- `scripts/fix-withdrawal-dates.mjs` - Fix date mismatches (2024 → 2025)
- `scripts/import-backdated-withdrawals.mjs` - Import historical withdrawals from CSV

---

## 🔗 HELPFUL LINKS

- **Production Site:** [Your Vercel URL]
- **Supabase Dashboard:** https://supabase.com/dashboard
- **GitHub Repo:** https://github.com/NBuckle/melissa
- **Next.js Docs:** https://nextjs.org/docs

---

## 📞 GETTING HELP

If you encounter issues:
1. Check TROUBLESHOOTING.md (once created)
2. Review error logs in Vercel dashboard
3. Check Supabase logs for database errors
4. Review recent git commits for changes

---

**End of TODO List**
