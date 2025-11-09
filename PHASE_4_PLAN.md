# Phase 4 Implementation Plan: Withdrawals & User Management

**Created:** November 8, 2025
**Status:** Ready for Implementation
**Estimated Duration:** 4-6 hours

---

## Executive Summary

Phase 4 adds two major feature sets to the Melissa Inventory System:

1. **Withdrawals Management** - Track distributions to churches, kit creation, expired goods removal, and stock corrections
2. **User Management** - Admin interface for managing user accounts, roles, and invitations

Both features follow existing architectural patterns (Server Actions + React Server Components) and maintain consistency with Phase 1 & 2 implementations.

**Key User Benefits:**
- Complete inventory tracking (collections + withdrawals)
- Kit-based distributions for faster data entry
- Full user lifecycle management
- Real-time stock level accuracy

**Technical Approach:**
- Reuse existing database schema (withdrawals, withdrawal_items, kit_templates tables)
- Follow server actions pattern from collections.ts
- Similar UI patterns to collection form
- Admin-only access via middleware + role checks

---

## Architecture Analysis

### Current State
✅ Collections system working (75 imported, 904 items)
✅ Inventory views functional (Total + Daily)
✅ Items management complete
✅ Authentication & authorization working
✅ Database schema includes all withdrawal tables
✅ 5 distribution types seeded
✅ 5 kit templates seeded with items

### Existing Patterns to Follow
1. **Server Actions** (`src/app/actions/`) - Zod validation, user checks, transaction rollback
2. **Client Components** (`src/components/features/`) - useState for forms, toast notifications
3. **Page Structure** (`src/app/(app)/`) - RSC with data fetching, client wrapper when needed
4. **UI Components** (`src/components/ui/`) - Reusable primitives

### File Size Discipline
- All new files will be under 300 lines
- Complex logic split into separate files
- Maintain DRY principles

---

## Phase 1: Withdrawals Server Actions (90 min)

### File: `src/app/actions/withdrawals.ts`

**Purpose:** Server actions for creating, reading withdrawals and managing kit templates

**Functions to Implement:**

#### 1. `getDistributionTypes()`
```typescript
export async function getDistributionTypes() {
  // Fetch all distribution types
  // Returns: { types: [...], error: null }
}
```

#### 2. `getKitTemplates()`
```typescript
export async function getKitTemplates() {
  // Fetch all active kit templates with their items
  // Join with kit_template_items and items tables
  // Returns: { templates: [...], error: null }
}
```

#### 3. `getKitTemplateById(id: string)`
```typescript
export async function getKitTemplateById(id: string) {
  // Fetch single kit template with items
  // Returns: { template: {...}, error: null }
}
```

#### 4. `submitWithdrawal(formData: FormData)`
```typescript
// Validation schema
const withdrawalItemSchema = z.object({
  item_id: z.string().uuid(),
  quantity: z.number().positive(),
})

const withdrawalSchema = z.object({
  distribution_type_id: z.string().uuid(),
  kit_template_id: z.string().uuid().optional(),
  kits_created: z.number().int().positive().optional(),
  recipient: z.string().optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(withdrawalItemSchema).min(1),
})

export async function submitWithdrawal(formData: FormData) {
  // 1. Auth check (must be admin)
  // 2. Validate data with Zod
  // 3. Check stock availability for all items
  // 4. Create withdrawal record
  // 5. Create withdrawal_items
  // 6. Refresh materialized view
  // 7. Revalidate paths
  // 8. Return success with redirect to /admin/withdrawals
}
```

#### 5. `getRecentWithdrawals(limit: number = 10)`
```typescript
export async function getRecentWithdrawals(limit: number = 10) {
  // Fetch recent withdrawals with related data
  // Join: profiles, distribution_types, kit_templates, withdrawal_items
  // Order by withdrawal_timestamp desc
  // Returns: { withdrawals: [...], error: null }
}
```

#### 6. `getWithdrawalsByDateRange(startDate: string, endDate: string)`
```typescript
export async function getWithdrawalsByDateRange(startDate: string, endDate: string) {
  // Fetch withdrawals within date range
  // Include all related data
  // Returns: { withdrawals: [...], error: null }
}
```

**File Estimate:** ~280 lines

---

## Phase 2: Withdrawals UI Components (120 min)

### 2.1 File: `src/components/features/withdrawals/withdrawal-form.tsx`

**Purpose:** Client component for creating withdrawals

**Features:**
- Distribution type selector
- Optional kit template quick-select
- When kit selected: auto-populate items with template quantities
- Manual item addition (similar to collection form)
- Quantity inputs with real-time stock availability check
- Recipient field (conditional based on distribution type)
- Reason and notes fields
- Submit button with loading state

**State Management:**
```typescript
const [distributionTypeId, setDistributionTypeId] = useState('')
const [selectedKit, setSelectedKit] = useState<string | null>(null)
const [kitsCreated, setKitsCreated] = useState(1)
const [withdrawalItems, setWithdrawalItems] = useState<WithdrawalItem[]>([])
const [recipient, setRecipient] = useState('')
const [reason, setReason] = useState('')
const [notes, setNotes] = useState('')
const [loading, setLoading] = useState(false)
```

**Key Methods:**
- `handleKitSelect()` - Populate items from template
- `handleAddItem()` - Add blank item row
- `handleRemoveItem()` - Remove item row
- `handleSubmit()` - Validate and submit

**File Estimate:** ~280 lines

---

### 2.2 File: `src/components/features/withdrawals/withdrawals-list.tsx`

**Purpose:** Display list of recent withdrawals

**Features:**
- Table view with columns: Date, Type, Recipient, Items Count, Total Quantity, Submitted By
- Click row to expand and show item details
- Filter by distribution type
- Date range picker
- Export button (future enhancement)

**File Estimate:** ~180 lines

---

### 2.3 File: `src/components/features/withdrawals/kit-selector.tsx`

**Purpose:** Reusable kit template selector component

**Features:**
- Dropdown showing kit templates
- Display kit description and item count
- Preview kit items on hover/expand
- "Use Kit" button to populate form

**File Estimate:** ~120 lines

---

## Phase 3: Withdrawals Pages (60 min)

### 3.1 File: `src/app/(app)/admin/withdrawals/page.tsx`

**Purpose:** Main withdrawals management page (RSC)

**Features:**
- Server Component that fetches data
- Shows withdrawal form (collapsed by default, expandable)
- Shows recent withdrawals list
- Admin-only access

**Code Structure:**
```typescript
export default async function WithdrawalsPage() {
  // Fetch distribution types
  const { types } = await getDistributionTypes()

  // Fetch kit templates
  const { templates } = await getKitTemplates()

  // Fetch active items for manual selection
  const { items } = await getActiveItems()

  // Fetch recent withdrawals
  const { withdrawals } = await getRecentWithdrawals(20)

  return (
    <div>
      <h1>Withdrawals & Distributions</h1>

      {/* Create New Withdrawal */}
      <WithdrawalFormCard
        distributionTypes={types}
        kitTemplates={templates}
        items={items}
      />

      {/* Recent Withdrawals */}
      <WithdrawalsList withdrawals={withdrawals} />
    </div>
  )
}
```

**File Estimate:** ~150 lines

---

### 3.2 File: `src/app/(app)/admin/withdrawals/success/page.tsx`

**Purpose:** Success confirmation page after withdrawal submission

**Features:**
- Display confirmation message
- Show withdrawal summary
- Link to view all withdrawals
- Link to create another withdrawal

**File Estimate:** ~80 lines

---

## Phase 4: User Management Server Actions (60 min)

### File: `src/app/actions/users.ts`

**Purpose:** Server actions for user management (admin only)

**Functions:**

#### 1. `getAllUsers()`
```typescript
export async function getAllUsers() {
  // Admin only
  // Fetch all profiles with activity summary
  // Join with collections/withdrawals count
  // Returns: { users: [...], error: null }
}
```

#### 2. `updateUserRole(userId: string, role: 'admin' | 'data_entry')`
```typescript
export async function updateUserRole(userId: string, role: string) {
  // Admin only
  // Validate role
  // Update profiles table
  // Audit log the change
  // Returns: { success: boolean, error: string | null }
}
```

#### 3. `deactivateUser(userId: string)`
```typescript
export async function deactivateUser(userId: string) {
  // Admin only
  // Prevent self-deactivation
  // Update is_active flag (need to add this column)
  // Returns: { success: boolean, error: string | null }
}
```

#### 4. `inviteUser(email: string, role: 'admin' | 'data_entry')`
```typescript
export async function inviteUser(email: string, role: string) {
  // Admin only
  // Use Supabase auth.admin.inviteUserByEmail()
  // Create profile with specified role
  // Send invitation email
  // Returns: { success: boolean, error: string | null }
}
```

#### 5. `getUserActivity(userId: string, days: number = 30)`
```typescript
export async function getUserActivity(userId: string, days: number) {
  // Fetch user's recent collections and withdrawals
  // Calculate stats: total collections, total withdrawals, items handled
  // Returns: { activity: {...}, error: null }
}
```

**File Estimate:** ~220 lines

---

## Phase 5: User Management UI (90 min)

### 5.1 File: `src/components/features/users/users-table.tsx`

**Purpose:** Display all users with management actions

**Features:**
- Table columns: Name, Email, Role, Last Active, Collections Count, Actions
- Role badge (color-coded: admin = blue, data_entry = green)
- Action buttons: Change Role, View Activity, Deactivate
- Inline role change dropdown
- Confirmation modal for deactivation
- Cannot deactivate self

**File Estimate:** ~240 lines

---

### 5.2 File: `src/components/features/users/invite-user-modal.tsx`

**Purpose:** Modal for inviting new users

**Features:**
- Email input
- Role selector (Admin/Data Entry)
- Submit button
- Validation (email format)
- Success/error toast

**File Estimate:** ~140 lines

---

### 5.3 File: `src/components/features/users/user-activity-modal.tsx`

**Purpose:** Modal showing user activity details

**Features:**
- Summary stats (collections, withdrawals, total items)
- Recent activity timeline
- Charts showing activity over time
- Date range filter

**File Estimate:** ~180 lines

---

## Phase 6: User Management Page (30 min)

### File: `src/app/(app)/admin/users/page.tsx`

**Purpose:** Main user management page (RSC, admin-only)

**Code Structure:**
```typescript
export default async function UsersPage() {
  const { users } = await getAllUsers()

  return (
    <div>
      <div className="flex justify-between">
        <h1>User Management</h1>
        <InviteUserButton />
      </div>

      <UsersTable users={users} />
    </div>
  )
}
```

**File Estimate:** ~100 lines

---

## Database Amendments

### Migration: `004_user_management_additions.sql`

```sql
-- Add is_active flag to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add index for active users query
CREATE INDEX IF NOT EXISTS idx_profiles_is_active
ON public.profiles(is_active);

-- Add updated_at trigger for profiles
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Security Checklist

✅ **Admin-Only Operations:**
- All withdrawal submissions require admin role
- All user management actions require admin role
- Middleware checks admin routes
- Server actions validate user.role === 'admin'

✅ **Input Validation:**
- Zod schemas for all form inputs
- Stock availability check before withdrawal
- Email validation for user invites
- Role enum validation

✅ **Authorization:**
- RLS policies on withdrawals table
- RLS policies on withdrawal_items table
- Profiles table policies (read-all, update-admin-only)

✅ **Audit Trail:**
- withdrawn_by field on withdrawals
- Audit logs via trigger (already exists)

---

## Testing Strategy

### Unit Tests (Future)
- Validation schemas
- Stock availability calculations
- Role checking logic

### Integration Tests
1. Create withdrawal with kit template
2. Create manual withdrawal
3. Verify stock reduction after withdrawal
4. Invite new user and verify profile creation
5. Change user role and verify access changes
6. Deactivate user and verify cannot login

### Manual Testing Checklist
- [ ] Submit withdrawal with kit template
- [ ] Submit manual withdrawal
- [ ] Verify master_inventory updated correctly
- [ ] Verify cannot withdraw more than current stock
- [ ] Invite new user via email
- [ ] Change user role from data_entry to admin
- [ ] Verify admin sees admin menu items
- [ ] Deactivate user and verify they cannot login
- [ ] Verify cannot deactivate self
- [ ] View user activity details

---

## Implementation Order

**Recommended Sequence:**

1. **Day 1: Withdrawals Foundation**
   - Create `src/app/actions/withdrawals.ts`
   - Test server actions manually
   - Create database migration (if needed)

2. **Day 1-2: Withdrawals UI**
   - Build `withdrawal-form.tsx`
   - Build `kit-selector.tsx`
   - Build `withdrawals-list.tsx`
   - Create `/admin/withdrawals/page.tsx`

3. **Day 2: User Management**
   - Create `src/app/actions/users.ts`
   - Add database migration for is_active field
   - Test user actions

4. **Day 2-3: User Management UI**
   - Build `users-table.tsx`
   - Build `invite-user-modal.tsx`
   - Build `user-activity-modal.tsx`
   - Create `/admin/users/page.tsx`

5. **Day 3: Testing & Polish**
   - Manual testing of all workflows
   - Fix bugs
   - Update CHANGELOG
   - Create documentation

---

## Success Criteria

✅ Admin can create withdrawals with distribution types
✅ Kit templates can be used to quickly create withdrawals
✅ Manual item selection works for withdrawals
✅ Stock levels decrease correctly after withdrawals
✅ Master inventory view refreshes after withdrawals
✅ Admin can view withdrawal history
✅ Admin can invite new users
✅ Admin can change user roles
✅ Admin can deactivate users
✅ Admin can view user activity
✅ All admin actions are protected by role checks
✅ No file exceeds 300 lines

---

## Rollout Strategy

1. **Feature Flag:** None needed (admin-only features)
2. **Rollback:** Git revert if critical issues
3. **Monitoring:** Watch for withdrawal submission errors
4. **User Training:** Brief guide for admin on using withdrawals

---

## File Structure Summary

```
src/
├── app/
│   ├── actions/
│   │   ├── withdrawals.ts          # NEW - 280 lines
│   │   └── users.ts                # NEW - 220 lines
│   └── (app)/
│       └── admin/
│           ├── withdrawals/
│           │   ├── page.tsx        # NEW - 150 lines
│           │   └── success/
│           │       └── page.tsx    # NEW - 80 lines
│           └── users/
│               └── page.tsx        # REPLACE - 100 lines
│
└── components/
    └── features/
        ├── withdrawals/
        │   ├── withdrawal-form.tsx # NEW - 280 lines
        │   ├── kit-selector.tsx    # NEW - 120 lines
        │   └── withdrawals-list.tsx # NEW - 180 lines
        └── users/
            ├── users-table.tsx     # NEW - 240 lines
            ├── invite-user-modal.tsx # NEW - 140 lines
            └── user-activity-modal.tsx # NEW - 180 lines

supabase/
└── migrations/
    └── 005_user_is_active.sql     # NEW - 30 lines

Total New Files: 13
Total New Lines: ~2000
Estimated Time: 4-6 hours
```

---

## Notes for Implementation

- Follow existing patterns from `collections.ts` and `collection-form.tsx`
- Reuse UI components from `src/components/ui/`
- Maintain consistent error handling with toast notifications
- All dates use ISO format (YYYY-MM-DD)
- All currency/quantities use DECIMAL(10,2)
- Use optimistic UI updates where appropriate

---

**Ready to Proceed?** This plan provides detailed specifications for implementing Phase 4. Each task is independently testable and follows established patterns.
