# Inventory Snapshot Feature - Implementation Plan

**Created:** November 16, 2025
**Status:** Planning Phase
**Priority:** High

---

## Executive Summary

### Overview
Create a user-friendly "Inventory Snapshot" page that allows users to select any historical date and view complete inventory information for that specific day, including opening balance, collections, withdrawals, and closing balance.

### Key User Benefits
- **Quick Historical Lookup:** Check inventory status for any past date in seconds
- **Complete Daily Picture:** See all inventory movements (in/out) for a single date
- **Simple Interface:** Date picker → instant results (no date range complexity)
- **Audit Capability:** Verify historical inventory levels for reporting/compliance

### Technical Approach
- Reuse existing `get_daily_closing_balance` database function
- Create dedicated single-date view with enhanced UX
- Add quick date navigation (today, yesterday, last week, etc.)
- Group results by category for better organization

### Primary Risks & Mitigation
| Risk | Impact | Mitigation |
|------|--------|------------|
| Performance on old dates | Medium | Add date limit (e.g., last 365 days) |
| Confusion with existing pages | Low | Clear navigation and page descriptions |
| Large result sets | Low | Pagination or collapsible categories |

---

## User Experience Design

### User Flow

```
1. User navigates to "Inventory Snapshot" page
   ↓
2. Page defaults to today's date
   ↓
3. User either:
   a) Uses date picker to select specific date
   b) Clicks quick link (Yesterday, Last Week, etc.)
   ↓
4. Page loads inventory snapshot for that date
   ↓
5. User views:
   - Summary stats (total items, total collected, total withdrawn)
   - Inventory grouped by category
   - Each item shows: Opening Balance → +Collected → -Withdrawn → =Closing Balance
   ↓
6. User can:
   - Export to CSV
   - Navigate to adjacent dates (← Prev Day | Next Day →)
   - Filter by category
   - Search for specific items
```

### Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Inventory Snapshot                                      │
│ Complete inventory view for a specific date             │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Date Selector                                           │
│ [← Prev Day]  [📅 Nov 10, 2025 ▼]  [Next Day →]       │
│ Quick: [Today] [Yesterday] [Last Week] [Export CSV]    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Summary for Nov 10, 2025                                │
│ ┌─────────────┬─────────────┬─────────────┬────────────┐│
│ │ Total Items │  Collected  │  Withdrawn  │ Net Change ││
│ │     247     │    +125     │     -32     │    +93     ││
│ └─────────────┴─────────────┴─────────────┴────────────┘│
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ 🔍 Filter by Category: [All ▼]  Search: [________]     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Pantry (45 items) ───────────────────────── [Collapse ▲]│
│                                                          │
│ Item Name    │ Opening │ Collected │ Withdrawn │ Closing│
│─────────────┼─────────┼───────────┼───────────┼────────│
│ Beans        │   118   │    +24    │     -8    │  134   │
│ Rice (lbs)   │   245   │    +15    │     -5    │  255   │
│ ...          │         │           │           │        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ Bathroom (18 items) ─────────────────────── [Collapse ▲]│
│ ...                                                      │
└─────────────────────────────────────────────────────────┘
```

### Edge Cases & Error Handling

| Scenario | Behavior |
|----------|----------|
| No collections/withdrawals on date | Show "No activity on this date" with opening=closing |
| Date in the future | Show warning: "Future date selected. Showing current inventory." |
| Date before first collection | Show "No data available before [earliest date]" |
| Database connection error | Show friendly error with retry button |
| Slow query (>2 seconds) | Show loading spinner with progress message |

---

## Detailed Technical Implementation Plan

### Phase 1: Foundation (0.5 days)

#### Task 1.1: Create Server Action
**What:** Add new server action for single-date inventory snapshot
**Where:** `src/app/actions/inventory.ts`
**How:**
```typescript
/**
 * Get inventory snapshot for a specific date
 * Returns opening balance, daily changes, and closing balance for all items
 */
export async function getInventorySnapshot(date: string) {
  const supabase = await createClient()

  // Validate date format
  const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
  const validation = dateSchema.safeParse(date)

  if (!validation.success) {
    return { data: [], error: 'Invalid date format' }
  }

  // Use existing get_daily_closing_balance function with single date
  const { data, error } = await supabase.rpc('get_daily_closing_balance', {
    start_date: date,
    end_date: date,
    p_item_id: null
  })

  if (error) {
    console.error('Error fetching inventory snapshot:', error)
    return { data: [], error: error.message }
  }

  // Calculate summary statistics
  const summary = calculateSummary(data)

  return { data, summary, error: null }
}

function calculateSummary(data: any[]) {
  return {
    totalItems: data.length,
    totalCollected: data.reduce((sum, item) => sum + (item.daily_collected || 0), 0),
    totalWithdrawn: data.reduce((sum, item) => sum + (item.daily_withdrawn || 0), 0),
    netChange: data.reduce((sum, item) => sum + (item.daily_collected || 0) - (item.daily_withdrawn || 0), 0)
  }
}
```

**Tests:** Add unit tests for getInventorySnapshot in `__tests__/actions/inventory.test.ts`
**Dependencies:** None
**Success Criteria:** Function returns correct data for any valid date

---

#### Task 1.2: Create Page Component
**What:** Build main Inventory Snapshot page component
**Where:** `src/app/(app)/inventory/snapshot/page.tsx`
**How:**
```typescript
/**
 * Inventory Snapshot Page
 * Shows complete inventory state for a specific date
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getInventorySnapshot } from '@/app/actions/inventory'
import { SnapshotSummary } from '@/components/features/inventory/snapshot-summary'
import { SnapshotTable } from '@/components/features/inventory/snapshot-table'
import { DateNavigator } from '@/components/features/inventory/date-navigator'

export default function InventorySnapshotPage() {
  const searchParams = useSearchParams()
  const router = useRouter()

  // Get date from URL or default to today
  const [selectedDate, setSelectedDate] = useState(() => {
    return searchParams.get('date') || new Date().toISOString().split('T')[0]
  })

  const [data, setData] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSnapshot()
  }, [selectedDate])

  const loadSnapshot = async () => {
    setLoading(true)
    const { data, summary, error } = await getInventorySnapshot(selectedDate)

    if (!error) {
      setData(data)
      setSummary(summary)
    }

    setLoading(false)
  }

  const handleDateChange = (newDate: string) => {
    setSelectedDate(newDate)
    router.push(`/inventory/snapshot?date=${newDate}`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Inventory Snapshot</h1>
        <p className="text-gray-600 mt-2">
          Complete inventory view for {format(new Date(selectedDate), 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Date Navigator */}
      <DateNavigator
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
      />

      {/* Summary */}
      {summary && <SnapshotSummary summary={summary} />}

      {/* Data Table */}
      <SnapshotTable data={data} loading={loading} />
    </div>
  )
}
```

**Tests:** E2E test for page load and date navigation
**Dependencies:** Task 1.1 must be complete
**Success Criteria:** Page loads and displays data for selected date

---

### Phase 2: UI Components (0.5 days)

#### Task 2.1: Create Date Navigator Component
**What:** Build date selection and navigation component
**Where:** `src/components/features/inventory/date-navigator.tsx`
**How:** Create component with date picker, prev/next buttons, and quick date links

**Code Example:**
```typescript
export function DateNavigator({ selectedDate, onDateChange }) {
  const goToPrevDay = () => {
    const prev = new Date(selectedDate)
    prev.setDate(prev.getDate() - 1)
    onDateChange(prev.toISOString().split('T')[0])
  }

  const goToNextDay = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 1)
    onDateChange(next.toISOString().split('T')[0])
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-4">
          <Button onClick={goToPrevDay}>← Previous Day</Button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="px-4 py-2 border rounded-md"
          />
          <Button onClick={goToNextDay}>Next Day →</Button>
        </div>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => onDateChange(getTodayString())}>
            Today
          </Button>
          <Button variant="outline" onClick={() => onDateChange(getYesterdayString())}>
            Yesterday
          </Button>
          <Button variant="outline" onClick={() => onDateChange(getLastWeekString())}>
            Last Week
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Tests:** Component renders and navigation works
**Dependencies:** None
**Success Criteria:** Date navigation functions correctly

---

#### Task 2.2: Create Snapshot Summary Component
**What:** Display summary statistics
**Where:** `src/components/features/inventory/snapshot-summary.tsx`
**How:** Show total items, collected, withdrawn, net change in cards

**Tests:** Component displays correct summary data
**Dependencies:** None
**Success Criteria:** Summary calculations are accurate

---

#### Task 2.3: Create Snapshot Table Component
**What:** Display inventory data grouped by category
**Where:** `src/components/features/inventory/snapshot-table.tsx`
**How:**
- Group items by category
- Collapsible category sections
- Show opening → collected → withdrawn → closing for each item
- Color coding for positive/negative changes

**Tests:** Table renders correctly with grouped data
**Dependencies:** None
**Success Criteria:** Data displays clearly with proper grouping

---

### Phase 3: Navigation & Integration (0.25 days)

#### Task 3.1: Update Main Navigation
**What:** Add "Inventory Snapshot" link to navigation
**Where:** `src/components/layout/navigation.tsx`
**How:** Add new menu item under "Inventory" section

**Tests:** Navigation link appears and works
**Dependencies:** Task 1.2
**Success Criteria:** Users can navigate to snapshot page

---

#### Task 3.2: Add Cross-Links
**What:** Add helpful links between related pages
**Where:**
- `/inventory/daily` → Link to snapshot view
- `/reports/closing-balance` → Link to snapshot for today
**How:** Add "View as Snapshot" buttons/links

**Tests:** Cross-links work correctly
**Dependencies:** Task 1.2
**Success Criteria:** Easy navigation between related views

---

### Phase 4: Polish & Testing (0.25 days)

#### Task 4.1: Add CSV Export
**What:** Enable CSV export of snapshot data
**Where:** Snapshot page
**How:** Reuse existing CSV export utility

**Tests:** CSV exports correctly
**Dependencies:** Phase 2 complete
**Success Criteria:** Downloaded CSV matches displayed data

---

#### Task 4.2: Performance Testing
**What:** Test with large datasets and old dates
**Where:** Test environment
**How:**
- Test with 365 day old date
- Test with 100+ items
- Measure query time

**Tests:** Performance benchmarks met (<2 seconds)
**Dependencies:** All implementation complete
**Success Criteria:** Page loads quickly for any date

---

## Directory Structure

```
src/
├── app/
│   ├── actions/
│   │   └── inventory.ts (updated with getInventorySnapshot)
│   └── (app)/inventory/
│       └── snapshot/
│           └── page.tsx (new - 180 lines)
│
├── components/
│   └── features/inventory/
│       ├── date-navigator.tsx (new - 120 lines)
│       ├── snapshot-summary.tsx (new - 80 lines)
│       └── snapshot-table.tsx (new - 200 lines)
│
└── __tests__/
    ├── actions/
    │   └── inventory.test.ts (updated)
    └── components/
        └── inventory/ (new tests)
```

**Total New Files:** 4
**Total New Lines:** ~580 lines
**Files Modified:** 2 (navigation.tsx, inventory.ts)

---

## Key Technical Decisions

### Database Query Strategy
**Decision:** Reuse existing `get_daily_closing_balance` function with single date
**Rationale:**
- Already tested and working
- Handles all edge cases
- No additional database changes needed
**Tradeoff:** Slight overhead for single-date queries, but negligible

### Page Type (Client vs Server)
**Decision:** Use client component with real-time data fetching
**Rationale:**
- Enables smooth date navigation without page reloads
- Better UX with instant feedback
- Supports future enhancements (auto-refresh, etc.)
**Tradeoff:** Slightly larger JS bundle, but worth it for UX

### Data Grouping
**Decision:** Group by category with collapsible sections
**Rationale:**
- Matches existing inventory pages (consistency)
- Reduces visual clutter
- Makes specific items easier to find
**Tradeoff:** Extra code for collapse logic, but minimal

---

## Testing Strategy

### Unit Tests
- `getInventorySnapshot` function with various dates
- Summary calculation accuracy
- Date navigation helper functions
- CSV export functionality

### Integration Tests
- Server action returns correct data format
- Components receive and display data correctly
- Date changes trigger data refresh

### E2E Tests
```typescript
describe('Inventory Snapshot Page', () => {
  it('loads today\'s snapshot by default', () => {
    visit('/inventory/snapshot')
    expect(page).toContain(format(new Date(), 'MMMM d, yyyy'))
  })

  it('navigates to previous day', () => {
    visit('/inventory/snapshot')
    click('Previous Day')
    // verify URL and content changed
  })

  it('allows date selection via picker', () => {
    visit('/inventory/snapshot')
    selectDate('2025-11-10')
    expect(page).toContain('November 10, 2025')
  })

  it('exports data to CSV', () => {
    visit('/inventory/snapshot?date=2025-11-10')
    click('Export CSV')
    // verify download triggered
  })
})
```

### Performance Tests
- Query time for various dates (today, 30 days ago, 365 days ago)
- Page load time with 50, 100, 200 items
- Memory usage during navigation

---

## Security Implementation

### Authentication
- ✅ Page requires authentication (handled by layout)
- ✅ Server action uses authenticated Supabase client
- ✅ RLS policies apply to all queries

### Authorization
- ✅ Both admin and data_entry roles can view snapshots
- ✅ No special permissions needed (read-only view)

### Input Validation
- ✅ Date format validation (YYYY-MM-DD)
- ✅ SQL injection prevention (parameterized queries)
- ✅ Date range limits (optional: only allow last 365 days)

### Data Protection
- ✅ No sensitive data exposure
- ✅ Audit logging not required (read operation)

---

## Rollout Strategy

### Phase 1: Soft Launch
1. Deploy to production
2. Add link in navigation
3. Internal testing with actual users
4. Collect feedback

### Phase 2: Full Rollout
1. Address any feedback
2. Add to onboarding/help docs
3. Announce to all users
4. Monitor usage analytics

### Rollback Procedure
If issues arise:
1. Remove navigation link (hides feature)
2. Add "Coming Soon" message to direct URL access
3. Fix issues in development
4. Re-deploy when ready

### Monitoring
- Track page load times
- Monitor query performance
- Track error rates
- Measure user engagement (page views, export usage)

---

## Success Metrics

### User Adoption
- **Target:** 50% of active users try feature within 2 weeks
- **Metric:** Unique page views / Total active users

### Performance
- **Target:** Page loads in < 2 seconds for 95% of requests
- **Metric:** Average page load time

### User Satisfaction
- **Target:** < 5 support requests related to historical inventory in first month
- **Metric:** Support ticket count

### Usage Patterns
- **Track:** Most common dates accessed
- **Track:** Export usage rate
- **Track:** Navigation pattern (date picker vs quick links)

---

## Future Enhancements (Not in Scope)

1. **Comparison Mode:** Compare two dates side-by-side
2. **Alerts:** Set up alerts for inventory changes on specific dates
3. **Notes:** Add user notes for specific dates
4. **Item History:** Click item to see full history
5. **Advanced Filters:** Filter by stock level ranges, category, etc.
6. **Mobile App:** Native mobile snapshot view
7. **Scheduled Reports:** Email daily snapshots automatically

---

## Questions for Stakeholder

Before proceeding with implementation:

1. **Date Range Limit:** Should we limit how far back users can view? (e.g., last 365 days only)
2. **Default Behavior:** Should page default to "today" or "yesterday"?
3. **Export Format:** CSV only, or also PDF/Excel?
4. **User Roles:** Should both admin and data_entry see this, or admin only?
5. **Navigation:** Where in the menu should this appear? Under "Inventory" or "Reports"?
6. **Mobile Priority:** Is mobile responsiveness critical for v1?

---

**End of Plan Document**
