# Database Migration Instructions

## Problem
The database has the old schema with `products.category` (string) but the code now expects `products.category_id` (integer foreign key).

## Solution
Run the migration script to update your database schema.

## Steps to Migrate

### Option 1: Automatic Migration (Recommended)
The migration will run automatically when you start the FastAPI server. Just restart your backend:

```bash
cd Backend
python main.py
# or
uvicorn main:app --reload
```

### Option 2: Manual Migration
If automatic migration doesn't work, run it manually:

```bash
cd Backend
python migrate_database.py
```

## What the Migration Does

1. **Creates new tables:**
   - `categories` - For product categories
   - `customers` - For customer management

2. **Updates products table:**
   - Adds `category_id` column (integer, foreign key to categories)
   - Migrates existing category strings to the categories table
   - Links products to their categories
   - Keeps old `category` column temporarily for safety

3. **Updates transactions table:**
   - Adds `customer_id` column
   - Adds `subtotal`, `discount_amount`, `discount_type`, `discount_value` columns
   - Updates existing transactions to have subtotal = total_amount

## After Migration

1. Restart your FastAPI backend
2. The application will work with the new schema
3. All existing data is preserved and migrated

## Troubleshooting

If you get errors:
1. Make sure PostgreSQL is running
2. Check database connection in `database.py`
3. Verify you have proper permissions on the database
4. Check the migration script output for specific errors

## Rollback (if needed)

If something goes wrong, you can manually rollback:
```sql
-- Only if you need to rollback
ALTER TABLE products DROP COLUMN IF EXISTS category_id;
ALTER TABLE transactions DROP COLUMN IF EXISTS customer_id;
ALTER TABLE transactions DROP COLUMN IF EXISTS subtotal;
ALTER TABLE transactions DROP COLUMN IF EXISTS discount_amount;
ALTER TABLE transactions DROP COLUMN IF EXISTS discount_type;
ALTER TABLE transactions DROP COLUMN IF EXISTS discount_value;
```
