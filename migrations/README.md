# Database Migrations

## Soft Delete Migration

To add soft delete functionality to projects and expenses:

1. Run the SQL script `add_soft_delete.sql` on your database
2. This will add the `deletedAt` column to both `projects` and `expenses` tables
3. The column is nullable and defaults to NULL (meaning not deleted)

### Manual SQL Execution

If you're using MySQL/MariaDB, you can run:

```bash
mysql -u your_username -p your_database < migrations/add_soft_delete.sql
```

Or execute the SQL directly in your database management tool.

### What This Does

- Adds `deletedAt` column to `projects` table
- Adds `deletedAt` column to `expenses` table
- Creates indexes on `deletedAt` for better query performance
- Existing records will have `deletedAt = NULL` (not deleted)

### After Migration

The application will now:
- Mark records as deleted by setting `deletedAt` timestamp instead of removing them
- Exclude soft-deleted records from all queries automatically
- Allow recovery of deleted records if needed

