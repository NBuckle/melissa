# Data Import Scripts

This directory contains scripts for importing data from Google Sheets into Supabase.

## Import Google Sheets Data

This script imports historical collection data from your old Google Sheets system.

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
