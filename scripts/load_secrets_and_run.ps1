$ErrorActionPreference = "Stop"

# 1. Load from scripts/.env.local if present
$ScriptEnvFile = Join-Path $PSScriptRoot ".env.local"
if (Test-Path $ScriptEnvFile) {
    Get-Content $ScriptEnvFile | ForEach-Object {
        if ($_ -match "^\s*([^#=]+)=(.*)$") {
            $Key = $matches[1].Trim()
            $Value = $matches[2].Trim()
            if ($Value -match "^['`"](.*)['`"]$") { $Value = $matches[1] }
            [Environment]::SetEnvironmentVariable($Key, $Value, "Process")
        }
    }
    Write-Host "Loaded secrets from $ScriptEnvFile" -ForegroundColor Cyan
}

# 2. Strict Validation
$RequiredVars = @("DEMO_API_KEY", "INTERNAL_CRON_SECRET", "VERCEL_PROTECTION_BYPASS")
$Missing = @()

foreach ($Var in $RequiredVars) {
    if (-not [Environment]::GetEnvironmentVariable($Var, "Process")) {
        $Missing += $Var
    }
}

if ($Missing.Count -gt 0) {
    Write-Error "Missing required environment variables: $($Missing -join ', ')"
    Write-Host "Please create '$ScriptEnvFile' with these keys." -ForegroundColor Yellow
    exit 1
}

# 3. Run the sanity check
& "$PSScriptRoot/e2e_sanity.ps1"
