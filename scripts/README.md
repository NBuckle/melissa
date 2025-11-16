# Data Import Scripts

This directory contains scripts for importing data from Google Sheets into Supabase.

## 📦 Import from Dated Subfolders (Recommended)

**Script:** `import-from-dated-folder.mjs`
**Command:** `npm run import-dated <subfolder>`

This is the recommended script for ongoing imports. It handles incremental updates and prevents duplicates.

### Features:

✅ **No Duplicates** - Checks timestamps before importing
✅ **Safe Re-runs** - Can be run multiple times safely
✅ **Dated Organization** - Works with subfolders like `nov16`, `dec01`, etc.
✅ **Progress Tracking** - Shows what's new vs. skipped

### Usage:

```bash
# Import from a specific dated subfolder
npm run import-dated nov16

# For future imports
npm run import-dated dec01
npm run import-dated dec15
```

### Folder Structure:

```
old google sheets/
├── nov16/
│   ├── Inventory - Melissa Donations - Form Responses.csv
│   └── Inventory - Melissa Donations - Master Inventory.csv
├── dec01/
│   └── ...
└── dec15/
    └── ...
```

### Example Output:

```
🚀 Starting Google Sheets Data Import
📁 Subfolder: nov16
============================================================
✅ Connected to Supabase

📊 Current Database Status:
   - Total collections: 75
   - Total collection items: 904
   - Date range: 2025-11-01 to 2025-11-07

📥 Importing collections from Form Responses...
Found 123 form responses in CSV

✅ Import Summary:
   - New collections: 29
   - Duplicates (skipped): 75
   - Invalid/Empty (skipped): 19

🔄 Refreshing master inventory view...
✅ Inventory view refreshed

📊 Current Database Status:
   - Total collections: 104
   - Total collection items: 1374
   - Date range: 2025-11-01 to 2025-11-15
```

### Workflow for Regular Updates:

1. Download Google Sheets as CSV
2. Create new dated folder: `old google sheets/nov30/`
3. Place CSV files in the folder
4. Run: `npm run import-dated nov30`
5. Check results and verify in app

---

## 📥 Initial Import (Legacy)

**Script:** `import-google-sheets-data.mjs`
**Command:** `npm run import-data`

This script imports historical collection data from your old Google Sheets system.

⚠️ **Warning:** This script does NOT check for duplicates. Use `import-dated` instead for ongoing imports.

### What it does:

1. **Imports Collections** - All historical form responses with timestamps and quantities
2. **Updates Inventory** - Refreshes the master inventory view
3. **Handles Item Matching** - Intelligently matches Google Sheets column names to database items

### Prerequisites:

- ✅ Supabase project set up
- ✅ `.env.local` configured with credentials
- ✅ Database migrations run (items table populated)
- ✅ Google Sheets CSV files in `old google sheets/` directory

### Running the Import:

```bash
npm run import-data
```

### What to expect:

The script will:
- Connect to your Supabase database
- Read the Form Responses CSV
- Parse each submission (row)
- Create collection records with associated items
- Refresh the master inventory view
- Show progress and statistics

### Output:

```
🚀 Starting Google Sheets Data Import
==================================================
✅ Connected to Supabase (90 items in database)

📥 Importing collections from Form Responses...
Found 150 form responses
  Imported 10 collections...
  Imported 20 collections...
  ...
✅ Imported 145 collections (5 skipped)
🔄 Refreshing master inventory view...
✅ Inventory view refreshed

==================================================
✅ Import completed successfully!
```

### After Import:

1. **Verify Data** - Go to Supabase → Table Editor → `collections`
2. **Check Inventory** - View `/inventory/total` in the app
3. **Review Stats** - Check dashboard for collection counts

### Troubleshooting:

**Problem:** "Item not found" warnings
- **Cause:** Column name in CSV doesn't match item name in database
- **Solution:** Check spelling/capitalization, or add item manually first

**Problem:** Invalid quantity errors
- **Cause:** Non-numeric data in quantity columns
- **Solution:** Review the CSV file, clean up any text in number fields

**Problem:** Collections skipped
- **Cause:** Missing timestamp or date, or no items with quantities
- **Solution:** Check CSV data quality

### Re-running the Import:

**Warning:** Running this script multiple times will create duplicate collections!

To re-import:
1. Delete existing collections:
   ```sql
   DELETE FROM collection_items;
   DELETE FROM collections WHERE notes = 'Imported from Google Sheets';
   ```
2. Run `npm run import-data` again

### Customization:

The script can be modified to:
- Import withdrawal/distribution records
- Handle different CSV formats
- Skip certain date ranges
- Add custom notes to collections

Edit `scripts/import-google-sheets-data.mjs` to customize behavior.
