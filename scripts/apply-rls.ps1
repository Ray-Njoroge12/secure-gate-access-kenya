<#
.SYNOPSIS
Applies the RLS migration in `supabase/migrations/20250821_update_profiles_rls.sql` to the target database.

USAGE
1) Set the environment variable DATABASE_URL to your Postgres connection string (postgresql://user:pass@host:port/db)
   In PowerShell: $env:DATABASE_URL = 'postgresql://postgres:password@host:6543/postgres'
2) Run: .\scripts\apply-rls.ps1

This script will try, in order:
 - npx supabase db push --db-url $DATABASE_URL (recommended)
 - psql $DATABASE_URL -f <sql-file> (fallback if psql is installed)
If both fail it prints manual instructions to run the SQL in the Supabase dashboard.
#>

Set-StrictMode -Version Latest

$SqlFile = Join-Path $PSScriptRoot '..\supabase\migrations\20250821_update_profiles_rls.sql' | Resolve-Path -ErrorAction SilentlyContinue
if (-not $SqlFile) {
    Write-Error "Migration SQL not found at 'supabase/migrations/20250821_update_profiles_rls.sql'."
    exit 2
}

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl -or $dbUrl -eq '') {
    Write-Host "ERROR: DATABASE_URL environment variable is not set."
    Write-Host "Set it first, for example (PowerShell):"
    Write-Host "  $env:DATABASE_URL = 'postgresql://postgres:yourpassword@aws-0-eu-central-1.pooler.supabase.com:6543/postgres'"
    Write-Host "Or open the Supabase project > Settings > Database > Connection string and copy the connection string into DATABASE_URL."
    exit 1
}

Write-Host "Using DATABASE_URL: $($dbUrl.Substring(0, [Math]::Min($dbUrl.Length, 40)))..."

function Try-SupabasePush {
    Write-Host "Trying: npx supabase db push --db-url <DATABASE_URL>"
    try {
        $proc = Start-Process -FilePath "npx" -ArgumentList "supabase db push --db-url `"$dbUrl`"" -NoNewWindow -Wait -PassThru -ErrorAction Stop
        return $proc.ExitCode -eq 0
    } catch {
        Write-Warning "npx supabase push failed or supabase CLI not available: $($_.Exception.Message)"
        return $false
    }
}

function Try-PSQL {
    Write-Host "Trying: psql <DATABASE_URL> -f <sql-file>"
    try {
        $psql = Get-Command psql -ErrorAction SilentlyContinue
        if (-not $psql) {
            Write-Warning "psql not found in PATH. Skipping psql attempt."
            return $false
        }
        # psql accepts the connection string as the first argument
        $arg = "$dbUrl -f `"$SqlFile`""
        $proc = Start-Process -FilePath "psql" -ArgumentList $arg -NoNewWindow -Wait -PassThru -ErrorAction Stop
        return $proc.ExitCode -eq 0
    } catch {
        Write-Warning "psql execution failed: $($_.Exception.Message)"
        return $false
    }
}

if (Try-SupabasePush) {
    Write-Host "✅ supabase CLI applied migrations successfully."
    Write-Host "Run: npx vitest tests/integration/role_based_access_control.test.ts --run"
    exit 0
}

if (Try-PSQL) {
    Write-Host "✅ psql applied SQL successfully."
    Write-Host "Run: npx vitest tests/integration/role_based_access_control.test.ts --run"
    exit 0
}

Write-Host "\n⚠️  Automatic application failed. Please run the SQL manually in the Supabase SQL editor."
Write-Host "1) Open: https://app.supabase.com/project/<your-project-ref>/sql"
Write-Host "2) Open the file: supabase/migrations/20250821_update_profiles_rls.sql"
Write-Host "3) Paste and execute the SQL."
Write-Host "\nIf you prefer to run locally, set DATABASE_URL and either install the supabase CLI or psql and re-run this script."

exit 1
