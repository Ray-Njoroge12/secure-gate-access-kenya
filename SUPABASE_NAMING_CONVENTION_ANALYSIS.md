# Supabase Naming Convention Analysis

## Current State Analysis

The current file structure is already following good Supabase naming conventions with:

### ✅ Good Practices:
- Function directories use kebab-case (e.g., `add-resident`, `verify-access-code`)
- Migration files use timestamp + descriptive name pattern
- Main function entry points are `index.ts`
- Shared utilities are in `_shared/` directory

### 🔧 Areas for Improvement:

1. **Migration File Consistency**:
   - Some files use `YYYYMMDDHHMMSS` format (e.g., `20250122000001_advanced_database_indexing.sql`)
   - Some files use `YYYYMMDD_HHMMSS` format (e.g., `20250708182048_init_visitors.sql`)
   - Some files use UUID format (e.g., `20250708182149-7e6afa85-b98f-4acb-81a8-fe27c22f9c40.sql`)

2. **Function Directory Naming**:
   - Most use kebab-case, but some could be more descriptive
   - Some directories could be consolidated for better organization

## Recommended Renaming Plan

### Migration Files:
Standardize all migration files to use `YYYYMMDDHHMMSS_descriptive_name.sql` format:

- `20250708182048_init_visitors.sql` → ✅ Already good
- `20250708182149-7e6afa85-b98f-4acb-81a8-fe27c22f9c40.sql` → `20250708182149_unknown_migration.sql` (needs descriptive name)
- `20250711093223-628c099d-9de6-46cd-94a6-0b07186ceba7.sql` → `20250711093223_unknown_migration.sql` (needs descriptive name)

### Function Directories:
Consider renaming for better consistency:

- `ai-ml-processing` → ✅ Good
- `ar-interaction-tracking` → ✅ Good  
- `ar-scene-recommendation` → ✅ Good
- `cache-management` → ✅ Good
- `complete-visitor-registration` → ✅ Good
- `create-bulk-invitations` → ✅ Good
- `create-invitation` → ✅ Good
- `decrypt-pii` → ✅ Good
- `decrypt-visitor-data` → ✅ Good
- `encrypt-pii` → ✅ Good
- `generate-access-code` → ✅ Good
- `get-analytics-data` → ✅ Good
- `get-resident-dashboard-stats` → ✅ Good
- `get-resident-invitations` → ✅ Good
- `iot-communication` → ✅ Good
- `manage-2fa` → ✅ Good
- `manage-blacklist` → ✅ Good
- `manage-recurring-visitors` → ✅ Good
- `process-background-jobs` → ✅ Good
- `reset-user-password` → ✅ Good
- `send-invitation-email` → ✅ Good
- `smart-gate-controller` → ✅ Good
- `update-user-status` → ✅ Good
- `verify-access-code` → ✅ Good
- `webhook-processor` → ✅ Good

## Supabase Best Practices Followed:

1. **Kebab-case naming** for directories and files
2. **Descriptive names** that clearly indicate function purpose
3. **Consistent structure** with main entry point as `index.ts`
4. **Shared utilities** in `_shared/` directory
5. **Migration versioning** with timestamps

## Conclusion

The current structure is already well-organized and follows Supabase conventions. The main improvements needed are:

1. Standardize migration file naming format
2. Add descriptive names to UUID-based migration files
3. Ensure all new files follow the established patterns

No major structural changes are needed as the current organization aligns well with Supabase best practices.
