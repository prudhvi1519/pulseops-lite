$ErrorActionPreference = "Stop"

function Assert-Gh-Cli {
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        Write-Error "GitHub CLI (gh) not found. Please install it."
        exit 1
    }
}

function Assert-Gh-Auth {
    Write-Host "Verifying GitHub Auth..."
    gh auth status 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Not logged in to GitHub."
        Write-Host "Attempting login (Web flow)..."
        # Try to use --web to minimize interactive prompts if possible, or fallback to interactive
        # Note: 'gh auth login' is highly interactive.
        # We will suggest user to run it if it fails here or try basic invocation.
        try {
            # On some systems, just running 'gh auth login' allows device flow
             & gh auth login --web
        } catch {
             Write-Error "Could not automate login. Please run 'gh auth login' manually."
             exit 1
        }
    } else {
        Write-Host "GitHub Auth Check: OK"
    }
}

function Set-Gh-Secret {
    param($Key, $Value)
    Write-Host "Setting GitHub Secret: $Key"
    
    # Use cmd /c echo piping to pass value to stdin safely on Windows
    $pinfo = New-Object System.Diagnostics.ProcessStartInfo
    $pinfo.FileName = "cmd.exe"
    $pinfo.Arguments = "/c echo $Value| gh secret set $Key"
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
        Write-Warning "  Failed."
        Write-Host $p.StandardError.ReadToEnd()
    }
}

# --- Main ---

$SecretsPath = "$PSScriptRoot\..\.generated-secrets.local"
if (-not (Test-Path $SecretsPath)) {
    Write-Error "Secrets file not found: $SecretsPath. Please run setup-vercel-env.ps1 first."
    exit 1
}

Write-Host "Reading secrets from $SecretsPath..."
$content = Get-Content $SecretsPath

$InternalCronSecret = ($content | Where-Object { $_ -match "^INTERNAL_CRON_SECRET=" } | Select-Object -First 1) -replace "^INTERNAL_CRON_SECRET=", ""
$CronBaseUrl = ($content | Where-Object { $_ -match "^CRON_BASE_URL=" } | Select-Object -First 1) -replace "^CRON_BASE_URL=", ""
$WebhookSecret = ($content | Where-Object { $_ -match "^GITHUB_WEBHOOK_SECRET=" } | Select-Object -First 1) -replace "^GITHUB_WEBHOOK_SECRET=", ""

if (-not $InternalCronSecret) { Write-Warning "INTERNAL_CRON_SECRET missing." }
if (-not $CronBaseUrl) { Write-Warning "CRON_BASE_URL missing." }

Assert-Gh-Cli
Assert-Gh-Auth

if ($InternalCronSecret) { Set-Gh-Secret -Key "INTERNAL_CRON_SECRET" -Value $InternalCronSecret }
if ($CronBaseUrl) { Set-Gh-Secret -Key "CRON_BASE_URL" -Value $CronBaseUrl }
if ($WebhookSecret) { Set-Gh-Secret -Key "GITHUB_WEBHOOK_SECRET" -Value $WebhookSecret }

Write-Host "GitHub Secrets Setup Complete."
