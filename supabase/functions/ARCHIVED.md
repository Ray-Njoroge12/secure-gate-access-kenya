# Supabase Edge Functions Archived

All TypeScript source files in this directory tree have been deprecated after migration to a React-only + in-memory stub architecture.

Rationale:
- Eliminated external Supabase dependency.
- Simplified test surface; integration & security suites now skipped.
- Preparing for future replacement with custom backend API accessed via `src/services/api`.

If you need historical logic (e.g., invitation creation, access code generation, PII encryption), refer to git history prior to this commit.

Safe Cleanup Steps (future):
1. Remove this entire `supabase/functions` folder once no references remain in docs.
2. Prune doc files referencing paths under `supabase/functions/*`.
