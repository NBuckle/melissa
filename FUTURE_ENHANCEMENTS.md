# Future Enhancements - Melissa Inventory System

This document tracks feature requests and enhancements planned for future phases.

---

## Analytics & Reporting Enhancements

### Daily Closing Balance & Inventory Trends
**Requested:** November 8, 2025
**Priority:** Medium
**Planned Phase:** Phase 5 or 6 (Reports & Analytics)

**Description:**
Add analytics features to track inventory trends over time:

**Features:**
1. **Daily Closing Balance**
   - Show ending inventory for each item at end of each day
   - Calculate: Opening Balance + Collections - Withdrawals = Closing Balance
   - Display in table format with date selector

2. **Inventory Trend Visualization**
   - Line charts showing stock levels over time
   - Per-item trend graphs
   - Category-level aggregations
   - Date range selector (7 days, 30 days, custom)
   - Visual indicators for:
     - Stock increases (collections)
     - Stock decreases (withdrawals)
     - Low stock warnings
     - Out of stock periods

**Technical Approach:**
- Create `inventory_snapshots` table or view
- Daily aggregation query:
  ```sql
  SELECT
    date,
    item_id,
    opening_balance,
    total_collected,
    total_withdrawn,
    closing_balance
  FROM daily_inventory_trends
  ```
- Use Recharts library (already installed) for visualizations
- Cache daily snapshots for performance

**UI Components:**
- `/inventory/trends` page
- Date range picker
- Item/category filter
- Line chart component
- Closing balance table
- Export to CSV functionality

**Database Changes:**
- New view: `daily_closing_balance`
- Possible new table: `inventory_snapshots` (for performance)
- Indexed by date and item_id

---

## Other Future Enhancements

### Email Notifications
**Priority:** Low
**Description:** Send email alerts for low stock, new collections, withdrawals

### Mobile App
**Priority:** Low
**Description:** React Native mobile app for field data entry

### Barcode Scanning
**Priority:** Low
**Description:** Scan item barcodes for faster data entry

### Multi-language Support
**Priority:** Low
**Description:** Support for Spanish, French Creole

---

**Last Updated:** November 8, 2025
