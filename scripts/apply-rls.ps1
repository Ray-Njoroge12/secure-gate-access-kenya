<#
.SYNOPSIS
Applies the RLS migrations to the PostgreSQL database.

USAGE
1) Set the environment variable DATABASE_URL to your Postgres connection string (postgresql://user:pass@host:port/db)
   In PowerShell: $env:DATABASE_URL = 'postgresql://postgres:password@localhost:5432/secure_gate'
2) Run: .\scripts\apply-rls.ps1

This script will apply all RLS migrations using psql or provide manual instructions.
#>

Set-StrictMode -Version Latest

# Define all RLS migration files
$MigrationFiles = @(
    '..\supabase\migrations\20250821_update_profiles_rls.sql',
    '..\supabase\migrations\20250822_update_access_codes_rls.sql',
    '..\supabase\migrations\20250823_update_security_tables_rls.sql',
    '..\supabase\migrations\20250824_update_users_rls.sql',
    '..\supabase\migrations\20250825_update_api_keys_rls.sql',
    '..\supabase\migrations\20250826_update_visitor_tables_rls.sql',
    '..\supabase\migrations\20250827_update_remaining_tables_rls.sql'
)

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl -or $dbUrl -eq '') {
    Write-Host "ERROR: DATABASE_URL environment variable is not set."
    Write-Host "Set it first, for example (PowerShell):"
    Write-Host "  $env:DATABASE_URL = 'postgresql://postgres:yourpassword@localhost:5432/secure_gate'"
    Write-Host "Or update your .env file with the correct database connection string."
    exit 1
}

Write-Host "Using DATABASE_URL: $($dbUrl.Substring(0, [Math]::Min($dbUrl.Length, 40)))..."

function Get-PSQLPath {
    try {
        $psql = Get-Command psql -ErrorAction SilentlyContinue
        if ($psql) {
            return "psql"
        }
        # Check common PostgreSQL installation paths
        $commonPaths = @(
            "C:\Program Files\PostgreSQL\17\bin\psql.exe",
            "C:\Program Files\PostgreSQL\16\bin\psql.exe",
            "C:\Program Files\PostgreSQL\15\bin\psql.exe",
            "C:\Program Files\PostgreSQL\14\bin\psql.exe"
        )
        
        foreach ($path in $commonPaths) {
            if (Test-Path $path) {
                return $path
            }
        }
        return $null
    } catch {
        return $null
    }
}

function Test-PSQL {
    return [bool](Get-PSQLPath)
}

function Apply-Migration {
    param($SqlFile)
    
    Write-Host "Applying migration: $(Split-Path $SqlFile -Leaf)"
    
    try {
        $SqlFile = Join-Path $PSScriptRoot $SqlFile | Resolve-Path -ErrorAction Stop
        if (-not (Test-Path $SqlFile)) {
            Write-Warning "Migration file not found: $SqlFile"
            return $false
        }

        $psqlPath = Get-PSQLPath
        if (-not $psqlPath) {
            Write-Warning "psql not found"
            return $false
        }

        $arg = "$dbUrl -f `"$SqlFile`""
        $proc = Start-Process -FilePath $psqlPath -ArgumentList $arg -NoNewWindow -Wait -PassThru -ErrorAction Stop
        
        if ($proc.ExitCode -eq 0) {
            Write-Host "Successfully applied: $(Split-Path $SqlFile -Leaf)"
            return $true
        } else {
            Write-Warning "Failed to apply: $(Split-Path $SqlFile -Leaf) (Exit code: $($proc.ExitCode))"
            return $false
        }
    } catch {
        Write-Warning "Error applying migration: $($_.Exception.Message)"
        return $false
    }
}

# Check if psql is available
if (-not (Test-PSQL)) {
    Write-Host "psql not found in PATH. Please install PostgreSQL client tools."
    Write-Host "You can download PostgreSQL from: https://www.postgresql.org/download/"
    Write-Host "Or use Docker with PostgreSQL client tools."
    exit 1
}

Write-Host "Starting RLS migration process..."
$successCount = 0
$totalMigrations = $MigrationFiles.Count

foreach ($migrationFile in $MigrationFiles) {
    if (Apply-Migration $migrationFile) {
        $successCount++
    } else {
        Write-Warning "Failed to apply migration: $migrationFile"
    }
}

if ($successCount -eq $totalMigrations) {
    Write-Host "All $successCount RLS migrations applied successfully!"
    Write-Host "Next steps:"
    Write-Host "1. Run the tests: npx vitest tests/integration/role_based_access_control.test.ts --run"
    Write-Host "2. Verify all tests pass with RLS enforcement"
    exit 0
} elseif ($successCount -gt 0) {
    Write-Host "$successCount out of $totalMigrations migrations applied successfully."
    Write-Host "Some migrations may have failed. Check the warnings above."
    exit 1
} else {
    Write-Host "All migrations failed. Please apply them manually:"
    Write-Host ""
    Write-Host "Manual Application Instructions:"
    Write-Host "1. Connect to your PostgreSQL database using psql or a GUI tool"
    Write-Host "2. Run each SQL file in the supabase/migrations/ directory"
    Write-Host "3. Files to apply:"
    foreach ($file in $MigrationFiles) {
        Write-Host "   - $file"
    }
    Write-Host ""
    Write-Host "After applying manually run: npx vitest tests/integration/role_based_access_control.test.ts --run"
    exit 1
}
