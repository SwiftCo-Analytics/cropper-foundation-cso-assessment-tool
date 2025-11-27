# Quick Start: PostgreSQL to MySQL Migration

This is a quick reference for migrating your data from PostgreSQL to MySQL.

## Prerequisites

✅ PostgreSQL database with your current data  
✅ MySQL database created and ready  
✅ Both accessible from your machine

## Quick Migration Steps

### 1. Export from PostgreSQL

**Important**: You need to temporarily switch your Prisma schema to PostgreSQL for export.

```bash
# Step 1: Temporarily change schema provider
# Edit prisma/schema.prisma and change:
#   provider = "postgresql"  (instead of "mysql")

# Step 2: Regenerate Prisma client for PostgreSQL
npx prisma generate

# Step 3: Export data
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname" npm run export-postgres

# This creates: postgres-export.json

# Step 4: Switch schema back to MySQL
# Edit prisma/schema.prisma and change:
#   provider = "mysql"

# Step 5: Regenerate Prisma client for MySQL
npx prisma generate
```

### 2. Set Up MySQL Schema

```bash
# Ensure MySQL database exists and schema is migrated
DATABASE_URL="mysql://user:pass@localhost:3306/dbname" npx prisma migrate dev --name init
```

### 3. Import to MySQL

```bash
# Import the exported data
DATABASE_URL="mysql://user:pass@localhost:3306/dbname" npm run import-mysql
```

### 4. Verify

Check that data was imported correctly and test your application.

## Alternative: Using Environment Files

Create `.env.postgres`:
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
```

Create `.env.mysql`:
```env
DATABASE_URL="mysql://user:pass@localhost:3306/dbname"
```

Then:
```bash
# Export
env $(cat .env.postgres | xargs) npm run export-postgres

# Import  
env $(cat .env.mysql | xargs) npm run import-mysql
```

## Troubleshooting

**Can't connect to PostgreSQL during export?**
- Check connection string format
- Ensure schema provider is set to "postgresql"
- Run `npx prisma generate` after changing provider

**Import fails with foreign key errors?**
- The script should handle ordering, but verify all parent records exist
- Check that export file is complete

**Need to force import even if data exists?**
```bash
npm run import-mysql -- --force
```

See `MIGRATION_GUIDE.md` for detailed instructions and troubleshooting.

