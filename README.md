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

The project previously depended on Supabase for authentication, database, RPC functions, and edge functions. Supabase has been fully removed:

- `@supabase/supabase-js` and CLI dependency removed from `package.json`.
- All Supabase DB scripts in `package.json` replaced with no-op echo commands.
- A lightweight in-memory stub now lives at `src/integrations/supabase/client.ts` exposing minimal `auth`, `from(...)`, `functions.invoke`, and `rpc` APIs used by existing components.
- Environment tests updated to stop requiring Supabase-specific vars.

This allows the React UI to continue working with ephemeral in-memory data while a new backend (Express/other) is introduced. Replace stub calls by introducing an abstraction layer (e.g. `src/services/api`) and migrating components progressively.

Next backend migration steps (suggested):
1. Define REST endpoints contract (OpenAPI or TypeScript types) for auth, invitations, access codes, logs.
2. Implement backend service (e.g. Express + SQLite/Postgres) matching that contract.
3. Swap component data hooks to call the new API instead of the stub.
4. Remove stub file once all usages are migrated.
