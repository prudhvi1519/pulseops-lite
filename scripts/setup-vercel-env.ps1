param (
    [string]$ProdUrl = "https://pulseops-lite-c3ac28din-prudhviakula92gmailcoms-projects.vercel.app"
)

# Use Continue to allow manual LASTEXITCODE checks without crashing on stderr
$ErrorActionPreference = "Continue"

# --- CONFIG ---
$EnvLocalPath = "$PSScriptRoot\..\.env.local"
$SecretsOutPath = "$PSScriptRoot\..\.generated-secrets.local"
$GitIgnorePath = "$PSScriptRoot\..\.gitignore"

# --- HELPERS ---

function Assert-Vercel-Token {
    if (-not $env:VERCEL_TOKEN) {
        Write-Error "Error: VERCEL_TOKEN environment variable is not set."
        Write-Host "Please set it with: `$env:VERCEL_TOKEN = 'your_token'"
        exit 1
    }
    
    # Verify validity
    Write-Host "Verifying VERCEL_TOKEN..."
    $output = & vercel whoami --token $env:VERCEL_TOKEN 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Error: VERCEL_TOKEN is invalid."
        exit 1
    }
    Write-Host "Token OK."
}

function Assert-Project-Link {
    if (-not (Test-Path "$PSScriptRoot\..\.vercel\project.json")) {
        Write-Host "Linking Project..."
        $linkArgs = @("link", "--yes", "--project", "pulseops-lite", "--token", "$env:VERCEL_TOKEN")
        $output = & vercel @linkArgs 2>&1
        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to link project."
            exit 1
        }
        Write-Host "Project linked."
    } else {
        Write-Host "Project already linked."
    }
}

function Generate-HexSecret {
    # 32 bytes -> 64 hex chars
    return -join ((1..32) | ForEach-Object { "{0:x2}" -f (Get-Random -Max 256) })
}

function Set-VercelEnv {
    param($Key, $Value, $Targets)
    
    foreach ($target in $Targets) {
        Write-Host "Setting $Key on $target..."
        
        # Check/Remove existing
        # 'vercel env rm' does not fail if missing? Or fails? 
        # Attempt to remove just in case to allow overwrite.
        # Adding --yes to rm is supported.
        
        $rmArgs = @("env", "rm", $Key, $target, "--yes", "--token", "$env:VERCEL_TOKEN")
        $null = & vercel @rmArgs 2>&1 
        
        # Add Env
        # vercel env add KEY target (value via stdin)
        # NO --yes flag for add command
        
        $addArgs = @("env", "add", $Key, $target, "--token", "$env:VERCEL_TOKEN")
        
        # Pipe value safely
        # Using cmd /c echo | vercel ... to ensure piping works on standard Windows shell
        
        $pinfo = New-Object System.Diagnostics.ProcessStartInfo
        $pinfo.FileName = "cmd.exe"
        # Using explicit token in command string for process start
        $pinfo.Arguments = "/c echo $Value| vercel env add $Key $target --token $($env:VERCEL_TOKEN)"
        
        $pinfo.RedirectStandardOutput = $true
        $pinfo.RedirectStandardError = $true
        $pinfo.UseShellExecute = $false
        $pinfo.CreateNoWindow = $true
        
        $p = New-Object System.Diagnostics.Process
        $p.StartInfo = $pinfo
        $p.Start() | Out-Null
        $p.WaitForExit()
        
        if ($p.ExitCode -eq 0) {
            Write-Host "  Success."
        } else {
            Write-Warning "  Failed to set $Key on $target"
            # Read error but be careful not to log it if it contains sensitive info (unlikely for error msg)
            $err = $p.StandardError.ReadToEnd()
            Write-Host "  StdErr: $err"
            exit 1
        }
    }
}

# --- MAIN FLOW ---

Write-Host "--- Automated Vercel Environment Setup (Token Only) ---"

# 1. Verify Token
Assert-Vercel-Token

# 2. Link Project
Assert-Project-Link

# 3. Read POSTGRES_URL
if (-not (Test-Path $EnvLocalPath)) {
    Write-Error "File not found: $EnvLocalPath. Run 'vercel link' or create it manually to get POSTGRES_URL."
    exit 1
}

$postgresLine = Get-Content $EnvLocalPath | Where-Object { $_ -match "^POSTGRES_URL=" } | Select-Object -First 1
if (-not $postgresLine) {
    Write-Error "POSTGRES_URL missing in .env.local."
    exit 1
}
$PostgresUrl = $postgresLine -replace "^POSTGRES_URL=", "" -replace "[\`"']", ""

# 4. Generate/Load Secrets
if (Test-Path $SecretsOutPath) {
    Write-Host "Loading existing secrets from .generated-secrets.local..."
    # Simple parse
    $content = Get-Content $SecretsOutPath
    $InternalCronSecret = ($content | Where-Object { $_ -match "^INTERNAL_CRON_SECRET=" } | Select-Object -First 1) -replace "^INTERNAL_CRON_SECRET=", ""
    $GithubWebhookSecret = ($content | Where-Object { $_ -match "^GITHUB_WEBHOOK_SECRET=" } | Select-Object -First 1) -replace "^GITHUB_WEBHOOK_SECRET=", ""
    $AuthSecret = ($content | Where-Object { $_ -match "^AUTH_SECRET=" } | Select-Object -First 1) -replace "^AUTH_SECRET=", ""
    
    if (-not $InternalCronSecret) { $InternalCronSecret = Generate-HexSecret }
    if (-not $GithubWebhookSecret) { $GithubWebhookSecret = Generate-HexSecret }
    if (-not $AuthSecret) { $AuthSecret = Generate-HexSecret }
    
} else {
    Write-Host "Generating new secrets..."
    $InternalCronSecret = Generate-HexSecret
    $GithubWebhookSecret = Generate-HexSecret
    $AuthSecret = Generate-HexSecret
}

$CronBaseUrl = $ProdUrl

# 5. Push Envs
$Targets = @("production", "preview")

Set-VercelEnv -Key "POSTGRES_URL" -Value $PostgresUrl -Targets $Targets
Set-VercelEnv -Key "INTERNAL_CRON_SECRET" -Value $InternalCronSecret -Targets $Targets
Set-VercelEnv -Key "GITHUB_WEBHOOK_SECRET" -Value $GithubWebhookSecret -Targets $Targets
Set-VercelEnv -Key "AUTH_SECRET" -Value $AuthSecret -Targets $Targets
Set-VercelEnv -Key "NEXTAUTH_SECRET" -Value $AuthSecret -Targets $Targets
Set-VercelEnv -Key "CRON_BASE_URL" -Value $CronBaseUrl -Targets $Targets

# 6. Save/Update Secrets File (Exclude POSTGRES_URL)
$SecretsContent = @"
# Generated Secrets ($(Get-Date))
# DO NOT COMMIT THIS FILE

INTERNAL_CRON_SECRET=$InternalCronSecret
GITHUB_WEBHOOK_SECRET=$GithubWebhookSecret
AUTH_SECRET=$AuthSecret
NEXTAUTH_SECRET=$AuthSecret
CRON_BASE_URL=$CronBaseUrl

# Instructions:
# These secrets have been pushed to Vercel (Preview & Production).
"@

Set-Content -Path $SecretsOutPath -Value $SecretsContent
Write-Host "Secrets saved securely to: scripts/.generated-secrets.local"

# 7. Gitignore
$IgnoreLine = ".generated-secrets.local"
if (Test-Path $GitIgnorePath) {
    $content = Get-Content $GitIgnorePath
    if ($content -notcontains $IgnoreLine) {
        Add-Content -Path $GitIgnorePath -Value "`n$IgnoreLine"
        Write-Host "Added .generated-secrets.local to .gitignore"
    }
}

# 8. Deploy
Write-Host "Triggering Deployment..."
& powershell -ExecutionPolicy Bypass -File "$PSScriptRoot\deploy-vercel.ps1" -ProjectName "pulseops-lite" -Prod

Write-Host "`n--- Setup Complete ---"
Write-Host "Env keys set: POSTGRES_URL, INTERNAL_CRON_SECRET, GITHUB_WEBHOOK_SECRET, AUTH_SECRET, NEXTAUTH_SECRET, CRON_BASE_URL"
