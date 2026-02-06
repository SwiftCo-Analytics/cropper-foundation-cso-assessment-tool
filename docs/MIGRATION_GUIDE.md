# PostgreSQL to MySQL Migration Guide

This guide will help you migrate your data from PostgreSQL to MySQL.

## Prerequisites

1. **PostgreSQL Database**: Your existing PostgreSQL database with data
2. **MySQL Database**: A new/empty MySQL database (MySQL 8.0+ or MariaDB 10.3+)
3. **Both databases accessible** from your local machine

## Migration Steps

### Step 1: Prepare Your Environment

1. **Backup your PostgreSQL database** (recommended):
   ```bash
   pg_dump -U username -d database_name > postgres_backup.sql
   ```

2. **Ensure MySQL database is created**:
   ```bash
   mysql -u root -p
   CREATE DATABASE your_mysql_database;
   ```

3. **Update your `.env.local`** with both database URLs:
   ```env
   # PostgreSQL (source)
   POSTGRES_DATABASE_URL="postgresql://username:password@localhost:5432/postgres_dbname"
   
   # MySQL (target)
   MYSQL_DATABASE_URL="mysql://username:password@localhost:3306/mysql_dbname"
   ```

### Step 2: Export Data from PostgreSQL

The export script will temporarily switch your Prisma schema to PostgreSQL, export the data, then switch back to MySQL.

**Option A: Using the automated export script** (recommended)

1. Make sure your schema is currently set to MySQL (it should be after the conversion)
2. Run the export:
   ```bash
   POSTGRES_DATABASE_URL="postgresql://user:pass@localhost:5432/dbname" npm run export-postgres
   ```

**Option B: Manual export using psql** (alternative)

If the script doesn't work, you can export directly:

```bash
# Export to JSON using psql
psql -U username -d database_name -t -A -F"," -c "SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM \"Organization\") t;" > organizations.json
# Repeat for each table...
```

### Step 3: Set Up MySQL Database Schema

Before importing, ensure your MySQL database has the schema:

```bash
# Switch to MySQL schema (should already be set)
# Generate Prisma client for MySQL
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# Or if you've already run migrations:
npx prisma migrate deploy
```

### Step 4: Import Data to MySQL

Import the exported data:

```bash
MYSQL_DATABASE_URL="mysql://user:pass@localhost:3306/dbname" npm run import-mysql
```

Or if you're using the default `DATABASE_URL`:

```bash
DATABASE_URL="mysql://user:pass@localhost:3306/dbname" npm run import-mysql
```

**Note:** The import script will warn if there's existing data. Use `--force` flag to proceed anyway:
```bash
npm run import-mysql -- --force
```

### Step 5: Verify Migration

1. **Check record counts**:
   ```bash
   # In MySQL
   mysql -u username -p database_name
   SELECT COUNT(*) FROM Organization;
   SELECT COUNT(*) FROM Assessment;
   SELECT COUNT(*) FROM Response;
   # ... etc
   ```

2. **Test the application**:
   ```bash
   npm run dev
   ```
   - Log in as an organization
   - Log in as an admin
   - Check that data displays correctly

3. **Compare data**:
   - Compare record counts between PostgreSQL and MySQL
   - Spot-check a few records manually

## Troubleshooting

### Export Issues

**Problem**: Can't connect to PostgreSQL
- **Solution**: Check `POSTGRES_DATABASE_URL` format and credentials
- Ensure PostgreSQL is running and accessible

**Problem**: Prisma client errors during export
- **Solution**: Make sure the schema temporarily switches to PostgreSQL
- Try regenerating Prisma client: `npx prisma generate`

### Import Issues

**Problem**: Foreign key constraint errors
- **Solution**: The import script should handle ordering, but if errors occur:
  - Check that parent records exist (e.g., Organizations before Assessments)
  - Verify all IDs from export file match

**Problem**: JSON field errors
- **Solution**: MySQL JSON support requires MySQL 5.7.8+ or MariaDB 10.2.7+
- Ensure your MySQL version supports JSON columns

**Problem**: Duplicate key errors
- **Solution**: The import uses `upsert` to handle duplicates
- Check if data already exists - use `--force` flag or clear database first

**Problem**: Timeout during import
- **Solution**: Large datasets may take time
- Increase transaction timeout in import script if needed
- Consider importing in batches for very large datasets

## Manual Migration (Alternative)

If the scripts don't work for your use case, you can manually export/import:

### 1. Export from PostgreSQL

```bash
# Export each table as JSON
psql -U username -d database_name -c "COPY (SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM \"Organization\") t) TO STDOUT;" > orgs.json
```

### 2. Transform Data (if needed)

PostgreSQL and MySQL handle some data types differently:
- **JSONB** (PostgreSQL) → **JSON** (MySQL) - Usually works directly
- **Timestamps** - Should be compatible
- **Enums** - Should work with Prisma

### 3. Import to MySQL

Use MySQL's JSON functions or import via Prisma client manually.

## Data Verification Checklist

After migration, verify:

- [ ] All Organizations imported
- [ ] All Assessments imported
- [ ] All Responses imported
- [ ] All Reports imported
- [ ] All Admins imported
- [ ] All Suggestions imported
- [ ] Foreign key relationships intact
- [ ] JSON fields parse correctly
- [ ] Timestamps are correct
- [ ] Unique constraints satisfied
- [ ] Email addresses preserved
- [ ] Passwords (hashed) preserved

## Rollback Plan

If migration fails:

1. **Keep PostgreSQL database** - Don't delete until migration is verified
2. **Restore from backup** if needed
3. **Switch Prisma schema back to PostgreSQL** if necessary:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. **Regenerate Prisma client**: `npx prisma generate`

## Post-Migration

After successful migration:

1. **Remove PostgreSQL connection** from environment variables
2. **Update all documentation** to reflect MySQL
3. **Monitor application** for any issues
4. **Keep backup** of exported JSON file for safety
5. **Test all features** thoroughly

## Support

If you encounter issues:
1. Check the error messages carefully
2. Verify database credentials and connectivity
3. Check MySQL version compatibility
4. Review Prisma migration logs

## Scripts Reference

- `npm run export-postgres` - Export data from PostgreSQL to JSON
- `npm run import-mysql` - Import data from JSON to MySQL
- `npm run migrate-postgres-to-mysql` - Full automated migration (if implemented)

