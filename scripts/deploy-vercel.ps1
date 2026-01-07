param (
    [string]$ProjectName = "pulseops-lite",
    [string]$Scope = "",
    [switch]$Prod
)

# Use Continue to allow checking LASTEXITCODE manually without crashing on benign stderr output from CLI
$ErrorActionPreference = "Continue"

# 1. Setup Global Vercel Args
$VercelArgs = @()
if ($env:VERCEL_TOKEN) {
    Write-Host "Using VERCEL_TOKEN from environment."
    $VercelArgs += "--token", "$env:VERCEL_TOKEN"
}

# Scope Args
$ScopeArgs = @()
if (-not [string]::IsNullOrWhiteSpace($Scope)) {
    $ScopeArgs += "--scope", "$Scope"
}

function Assert-Vercel-CLI {
    Write-Host "Checking Vercel CLI..."
    if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
        Write-Host "Vercel CLI not found. Installing global vercel..."
        npm install -g vercel
    } else {
        Write-Host "Vercel CLI is installed."
    }
}

function Assert-Login {
    # If using token, verify validity strictly. No fallback to interactive if token is provided.
    if ($env:VERCEL_TOKEN) {
        Write-Host "Verifying token..."
        # Capture all output (stdout and stderr)
        $output = & vercel whoami @VercelArgs 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            # Success - print user (usually 2nd line or found in output)
            # Filter for non-empty lines that assume user string
            $user = $output | Where-Object { $_ -match "\w+" } | Select-Object -Last 1
            Write-Host "Token Valid. Logged in as: $user"
            return
        } else {
            Write-Error "VERCEL_TOKEN provided but invalid (whoami failed)."
            Write-Host "Output:`n$($output -join "`n")"
            exit 1
        }
    }

    # No Token - Browser Flow
    Write-Host "Checking Interactive Login Status..."
    $output = & vercel whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Logged in."
        return
    }

    Write-Host "Not logged in. Initiating login..."
    & vercel login
    
    # Retry loop: 45 attempts * 2 seconds = 90 seconds
    for ($i = 0; $i -lt 45; $i++) {
        Start-Sleep -Seconds 2
        $output = & vercel whoami 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Login confirmed!"
            return
        }
        Write-Host "Waiting for login... ($($i+1)/45)"
    }

    throw "Login did not complete successfully after retries."
}

function Link-Project {
    if (Test-Path ".vercel/project.json") {
        Write-Host "Project already linked (.vercel/project.json exists)."
        return
    }

    Write-Host "Linking project '$ProjectName'..."
    
    # Arg array for link
    # Flattening args into one array for the call operator
    $linkCmdArgs = @("link", "--yes", "--project", "$ProjectName") + $VercelArgs + $ScopeArgs

    $output = & vercel @linkCmdArgs 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Project linked successfully."
    } else {
        # Fallback for interactive scope prompt (Only if no token and no scope provided)
        if (-not $env:VERCEL_TOKEN -and [string]::IsNullOrWhiteSpace($Scope)) {
            Write-Host "Direct link failed. Assuming scope is required."
            Write-Host "Please enter your Vercel Team Scope (or username): "
            $userScope = Read-Host
            if (-not [string]::IsNullOrWhiteSpace($userScope)) {
                 $retryArgs = @("link", "--yes", "--project", "$ProjectName", "--scope", "$userScope")
                 $retryOut = & vercel @retryArgs 2>&1
                 if ($LASTEXITCODE -eq 0) {
                    Write-Host "Project linked successfully with scope."
                    return
                 }
            }
        }
        Write-Error "Failed to link project. Output:`n$($output -join "`n")"
        exit 1
    }
}

function Deploy-Production {
    if (-not $Prod) {
        Write-Host "Skipping production deployment (use -Prod to deploy)."
        return
    }

    Write-Host "Deploying to Production..."
    
    $deployArgs = @("--prod") + $VercelArgs
    
    # Run and capture output
    $outputLines = & vercel @deployArgs 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Deployment failed. Output:`n$($outputLines -join "`n")"
        exit 1
    }

    # Clean Output to String
    $fullOutput = $outputLines -join "`n"

    # Regex to find last https://*.vercel.app URL
    # Matches typical URLs. 
    $matches = [regex]::Matches($fullOutput, "https?://\S+")
    
    if ($matches.Count -gt 0) {
        # Use the last match found
        $deploymentUrl = $matches[$matches.Count - 1].Value
        # Sanitize url (remove trailing brackets etc if captured)
        $deploymentUrl = $deploymentUrl -replace "[\[\]]", "" 
        Write-Host "PROD_URL=$deploymentUrl"
    } else {
        Write-Host "Raw Output:`n$fullOutput"
        Write-Warning "Could not strictly parse URL. Check output above."
    }
}

try {
    Assert-Vercel-CLI
    Assert-Login
    Link-Project
    Deploy-Production
} catch {
    Write-Error "Script Failed: $_"
    exit 1
}
