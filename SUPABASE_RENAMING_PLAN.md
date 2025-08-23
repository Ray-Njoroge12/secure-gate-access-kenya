# Supabase File Renaming Plan

## Current Analysis

The current file structure is already following good Supabase naming conventions. However, there are some migration files with UUID-based names that need descriptive names for better maintainability.

## Files to Rename

### Migration Files with UUID Format:

1. **`20250708182149-7e6afa85-b98f-4acb-81a8-fe27c22f9c40.sql`**
   - Content: Creates core tables (communities, residents, visitors, visit_invitations, access_codes, audit_logs)
   - **New Name**: `20250708182149_create_core_tables.sql`

2. **`20250711093223-628c099d-9de6-46cd-94a6-0b07186ceba7.sql`**
   - Content: Storage bucket setup and RLS policies for core tables
   - **New Name**: `20250711093223_storage_and_rls_setup.sql`

3. **`20250714051008-c1e6db17-f7dd-4af1-a32f-c7338e00739e.sql`**
   - Content: Inserts default community with fixed UUID
   - **New Name**: `20250714051008_insert_default_community.sql`

4. **`20250714051018-c6f098db-57bf-4103-9b66-1a2db40218dd.sql`**
   - Content: Inserts default community with random UUID
   - **New Name**: `20250714051018_insert_default_community_random_id.sql`

## Migration File Naming Standard

All migration files should follow the pattern:
```
YYYYMMDDHHMMSS_descriptive_name.sql
```

Where:
- `YYYYMMDDHHMMSS` - Timestamp (year, month, day, hour, minute, second)
- `descriptive_name` - Lowercase, underscores for spaces, descriptive of the migration content

## Function Directory Structure

The current function directory structure is excellent and follows Supabase best practices:

- ✅ Kebab-case naming (e.g., `verify-access-code`)
- ✅ Descriptive names that indicate function purpose
- ✅ Main entry point as `index.ts`
- ✅ Shared utilities in `_shared/` directory
- ✅ Consistent structure across all functions

## Implementation Steps

1. **Rename migration files** to use descriptive names
2. **Update any references** to these files in documentation or scripts
3. **Verify deployment** to ensure the renamed files work correctly
4. **Document the new naming conventions** for future development

## Risk Assessment

- **Low risk**: Migration files are typically referenced by timestamp, not by name
- **No breaking changes**: The content remains the same, only filenames change
- **Backward compatibility**: Supabase migration system uses timestamps for ordering

## Verification

After renaming, verify that:
1. All migrations can be applied successfully
2. The database schema remains consistent
3. No functionality is broken
4. Deployment scripts still work correctly

## Conclusion

The current structure is well-organized and follows Supabase conventions. The main improvement is standardizing migration file names for better maintainability and clarity.
