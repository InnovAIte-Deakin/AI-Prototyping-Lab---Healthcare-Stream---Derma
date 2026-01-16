Write-Host " ================================================= " -ForegroundColor Cyan
Write-Host "         DermaAI: All-In-One Test Runner           " -ForegroundColor Cyan
Write-Host " ================================================= " -ForegroundColor Cyan

# Save original directory
$OriginalDir = Get-Location

# 1. Config
$env:DATABASE_URL = "sqlite:///./derma.db"
$env:MOCK_AI = "true"
Write-Host " [INFO] Environment set: MOCK_AI=true, DATABASE=sqlite" -ForegroundColor Gray

# 2. Stop any existing backend
Write-Host " [INFO] Stopping any existing backend..." -ForegroundColor Gray
$existingBackend = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($existingBackend) {
    Stop-Process -Id $existingBackend -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

# 3. Backend Tests
Write-Host "`n [1/5] Running Backend Unit Tests (pytest)..." -ForegroundColor Yellow
Set-Location backend
python -m pytest
if ($LASTEXITCODE -ne 0) {
    Write-Host " [ERROR] Backend tests failed. Stopping." -ForegroundColor Red
    Set-Location $OriginalDir
    exit 1
}
Write-Host " [PASS] Backend tests passed." -ForegroundColor Green
Set-Location ..

# 4. Frontend Tests
Write-Host "`n [2/5] Running Frontend Unit Tests (vitest)..." -ForegroundColor Yellow
Set-Location frontend
npx vitest run
if ($LASTEXITCODE -ne 0) {
    Write-Host " [ERROR] Frontend tests failed. Stopping." -ForegroundColor Red
    Set-Location $OriginalDir
    exit 1
}
Write-Host " [PASS] Frontend tests passed." -ForegroundColor Green
Set-Location ..

# 5. Seeding E2E
Write-Host "`n [3/5] Seeding Data for E2E Tests..." -ForegroundColor Yellow
Set-Location backend
# Ensure schema is fresh and doctors are seeded
python -m app.reset_db
if ($LASTEXITCODE -ne 0) {
    Write-Host " [ERROR] Database reset failed. Stopping." -ForegroundColor Red
    Set-Location $OriginalDir
    exit 1
}

# Seed E2E specific fixtures
python -m app.seed_e2e_fixtures
if ($LASTEXITCODE -ne 0) {
    Write-Host " [ERROR] Seeding failed. Stopping." -ForegroundColor Red
    Set-Location $OriginalDir
    exit 1
}
Write-Host " [PASS] Data seeded." -ForegroundColor Green
Set-Location ..

# 6. Start mocked backend for E2E
Write-Host "`n [4/5] Starting Backend (MOCK_AI=true)..." -ForegroundColor Yellow
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:OriginalDir\backend
    # Rename .env to prevent interference
    if (Test-Path .env) { Rename-Item .env .env.bak -Force }
    $env:DATABASE_URL = "sqlite:///./derma.db"
    $env:MOCK_AI = "true"
    try {
        python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
    }
    finally {
        # Restore .env
        if (Test-Path .env.bak) { Rename-Item .env.bak .env -Force }
    }
}
# Wait for backend to be ready
Write-Host " [INFO] Waiting for backend to be ready..." -ForegroundColor Gray
$maxRetries = 30
$retryCount = 0
$backendReady = $false

while (-not $backendReady -and $retryCount -lt $maxRetries) {
    try {
        $response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/health" -Method Get -ErrorAction Stop
        if ($response.status -eq "ok") {
            $backendReady = $true
            Write-Host " [INFO] Backend is ready!" -ForegroundColor Green
        }
    }
    catch {
        Start-Sleep -Seconds 1
        $retryCount++
        Write-Host " [INFO] Waiting for backend... ($retryCount/$maxRetries)" -ForegroundColor Gray
    }
}

if (-not $backendReady) {
    Write-Host " [ERROR] Backend failed to start within timeout. Stopping." -ForegroundColor Red
    Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
    Remove-Job -Job $backendJob -Force -ErrorAction SilentlyContinue
    Set-Location $OriginalDir
    exit 1
}

Write-Host " [INFO] Backend started with MOCK_AI=true" -ForegroundColor Gray

# 7. E2E Tests
Write-Host "`n [5/5] Running E2E Tests (Playwright)..." -ForegroundColor Yellow
Set-Location frontend
npx playwright test
$e2eResult = $LASTEXITCODE
Set-Location ..

# 8. Stop mocked backend
Write-Host "`n [INFO] Stopping mocked backend..." -ForegroundColor Gray
Stop-Job -Job $backendJob -ErrorAction SilentlyContinue
Remove-Job -Job $backendJob -Force -ErrorAction SilentlyContinue
$existingBackend = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($existingBackend) {
    Stop-Process -Id $existingBackend -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2

# 9. Final Reporting
Set-Location $OriginalDir
if ($e2eResult -ne 0) {
    Write-Host "`n [ERROR] E2E tests failed." -ForegroundColor Red
} else {
    Write-Host "`n ================================================= " -ForegroundColor Cyan
    Write-Host "      ALL TESTS PASSED SUCCESSFULLY!                 " -ForegroundColor Green
    Write-Host " ================================================= " -ForegroundColor Cyan
}

# Optional early exit for CI or non-interactive runs
if ($env:DERMA_SKIP_DEV_SERVER -ieq "1" -or $env:DERMA_SKIP_DEV_SERVER -ieq "true") {
    if ($e2eResult -ne 0) { exit 1 }
    exit 0
}

# 10. Restart backend for development (real AI)
Write-Host " [INFO] Restarting backend for development (real AI)..." -ForegroundColor Gray
Write-Host " [INFO] Server running in THIS terminal. Press Ctrl+C to stop." -ForegroundColor Yellow

Remove-Item Env:MOCK_AI -ErrorAction SilentlyContinue
Set-Location "$OriginalDir\backend"
$env:DATABASE_URL = "sqlite:///./derma.db"

# Run directly in this console (Blocking)
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload

# Exit with test result code after server stops
if ($e2eResult -ne 0) { exit 1 }
