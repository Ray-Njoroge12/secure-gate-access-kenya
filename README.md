# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/1a2bb7cb-0f2f-488a-b3f9-1df593db03dd

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/1a2bb7cb-0f2f-488a-b3f9-1df593db03dd) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/1a2bb7cb-0f2f-488a-b3f9-1df593db03dd) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Supabase Removal (Local Stub Mode)

The project previously depended on Supabase for authentication, database, RPC functions, and edge functions. Supabase has been fully removed from runtime and tests:

What changed:
- Removed `@supabase/supabase-js` (no live network calls remain)
- Replaced Supabase scripts in `package.json` with no-op placeholders
- Introduced a minimal in-memory Supabase-like stub inside `vitest.setup.ts` (not a production client)
- Deleted all Supabase edge function tests (e.g. `supabase/functions/create-invitation/index.test.ts`)
- Truncated former Supabase‑dependent integration & security suites to `describe.skip` placeholders (RBAC, visitor flows, visitor management, compliance, etc.)
- Relaxed environment configuration tests so Supabase env vars are optional

Current test posture:
- Green baseline: all active tests pass; deprecated suites are explicitly skipped
- No database, rate limiting, RLS, or edge function behavior is simulated beyond trivial stubs

Architecture now:
- UI: React + Vite + Tailwind + shadcn-ui
- Data layer (temporary): In-memory objects via the stub, providing only: `auth.signIn / signOut / getSession`, `from(table).select|insert|update|delete|eq`, and dummy `functions.invoke` / `rpc`
- Persistence: None (state resets each test run / reload)

Recommended next backend migration steps:
1. Define a clear domain contract (TypeScript interfaces + optional OpenAPI) for: users/auth sessions, invitations, access codes, analytics.
2. Implement a real backend (Express/Fastify/Nest or serverless) plus a persistence store (SQLite/Postgres). Provide REST or tRPC endpoints matching the contract.
3. Create an adapter module (e.g. `src/services/api`) that replaces direct stub usage. Components import only this adapter.
4. Incrementally swap each component from stub calls to API adapter; keep the stub as a fallback for stories or offline dev.
5. Rebuild meaningful integration tests targeting the adapter using test doubles (or spin up the real backend in CI) before removing the stub entirely.

Re‑introducing richer tests (future):
- Replace skipped suites with new scenarios anchored on API responses instead of Supabase features (RLS/edge functions). Focus on permission logic in pure TypeScript or backend unit tests.

Until that migration is complete, the stub plus skipped suites provide a stable, fast feedback loop without incurring legacy Supabase complexity.
