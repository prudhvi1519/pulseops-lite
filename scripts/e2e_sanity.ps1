$ErrorActionPreference = "Stop"

# Configuration
$ProdUrl = $env:PROD_URL
if (-not $ProdUrl) { $ProdUrl = "https://pulseops-lite.vercel.app" }

# Required Secrets
$CronSecret = $env:INTERNAL_CRON_SECRET
$BypassToken = $env:VERCEL_PROTECTION_BYPASS
$ApiKey = $env:DEMO_API_KEY
$AllowSkip = $env:ALLOW_SKIP_PROTECTED

if (-not $ApiKey) {
    Write-Error "Missing DEMO_API_KEY. Cannot proceed with log ingestion."
}

# Protected Endpoint Logic
$SkipProtected = $false
if (-not $CronSecret -or -not $BypassToken) {
    if ($AllowSkip -eq "true") {
        Write-Warning "Missing secrets. Skipping protected checks (ALLOW_SKIP_PROTECTED=true)."
        $SkipProtected = $true
    }
    else {
        Write-Error "Missing INTERNAL_CRON_SECRET or VERCEL_PROTECTION_BYPASS. Cannot proceed."
    }
}

Write-Host "Starting E2E Sanity Check on $ProdUrl..." -ForegroundColor Cyan

# 1. Health Check
Write-Host "`n[1/4] Checking Health..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "$ProdUrl" -Method Get
    Write-Host " OK (200)" -ForegroundColor Green
}
catch {
    Write-Host " FAILED ($($_))" -ForegroundColor Red
    exit 1
}

# 2. Ingest Logs
Write-Host "[2/4] Ingesting Sample Logs..." -NoNewline
$logs = @()
1..5 | ForEach-Object {
    $logs += @{
        level       = "info"
        message     = "E2E Sanity Log Entry #$_ - $(Get-Date -Format 'HH:mm:ss')"
        service     = "e2e-sanity-service"
        environment = "Production"
        timestamp   = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
        metadata    = @{ source = "e2e-script"; run_id = [Guid]::NewGuid().ToString() }
    }
}
# Add an error log to trigger potential rules
$logs += @{
    level       = "error"
    message     = "E2E Sanity Simulated Error - Database Connection Failed"
    service     = "e2e-sanity-service"
    environment = "Production"
    timestamp   = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
    metadata    = @{ source = "e2e-script"; severity = "high" }
}

$body = $logs | ConvertTo-Json -Depth 5
try {
    $response = Invoke-RestMethod -Uri "$ProdUrl/api/v1/logs/ingest" -Method Post -Body $body -Headers @{
        "Content-Type" = "application/json"
        "X-API-Key"    = $ApiKey
    }
    Write-Host " OK ($($response.processed) logs processed)" -ForegroundColor Green
}
catch {
    # Read error stream properly
    $stream = $_.Exception.Response.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($stream)
    $errorBody = $reader.ReadToEnd()
    Write-Host " Response Body: $errorBody" -ForegroundColor Red
    exit 1
}

# 3. Trigger Rules Evaluation
if (-not $SkipProtected) {
    Write-Host "[3/4] Triggering Rules Evaluation..." -NoNewline
    try {
        $evalUri = "$ProdUrl/api/v1/rules/evaluate?x-vercel-protection-bypass=$BypassToken&x-vercel-set-bypass-cookie=true"
        $response = Invoke-RestMethod -Uri $evalUri -Method Post -Headers @{
            "x-internal-cron-secret" = $CronSecret
        }
        Write-Host " OK (Triggered)" -ForegroundColor Green
    }
    catch {
        Write-Host " FAILED ($($_))" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "[3/4] Triggering Rules Evaluation... SKIPPED" -ForegroundColor Yellow
}

# 4. Trigger Notifications
if (-not $SkipProtected) {
    Write-Host "[4/4] Triggering Notifications..." -NoNewline
    try {
        $notifyUri = "$ProdUrl/api/v1/notifications/process?x-vercel-protection-bypass=$BypassToken&x-vercel-set-bypass-cookie=true"
        $response = Invoke-RestMethod -Uri $notifyUri -Method Post -Headers @{
            "x-internal-cron-secret" = $CronSecret
        }
        Write-Host " OK (Triggered)" -ForegroundColor Green
    }
    catch {
        Write-Host " FAILED ($($_))" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "[4/4] Triggering Notifications... SKIPPED" -ForegroundColor Yellow
}

Write-Host "`nStrict E2E Sanity Check Complete!" -ForegroundColor Cyan
