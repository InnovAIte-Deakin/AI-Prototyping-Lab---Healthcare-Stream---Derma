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
    $env:DATABASE_URL = "sqlite:///./derma.db"
    $env:MOCK_AI = "true"
    python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
}
Start-Sleep -Seconds 5
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

# 9. Restart backend for development (real AI)
Write-Host " [INFO] Restarting backend for development (real AI)..." -ForegroundColor Gray
Remove-Item Env:MOCK_AI -ErrorAction SilentlyContinue
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$OriginalDir\backend'; `$env:DATABASE_URL='sqlite:///./derma.db'; python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
Write-Host " [INFO] Dev backend started in new window (real AI mode)!" -ForegroundColor Green

# 10. Final result
Set-Location $OriginalDir
if ($e2eResult -ne 0) {
    Write-Host "`n [ERROR] E2E tests failed." -ForegroundColor Red
    exit 1
}

Write-Host "`n ================================================= " -ForegroundColor Cyan
Write-Host "      ALL TESTS PASSED SUCCESSFULLY! 🚀            " -ForegroundColor Green
Write-Host " ================================================= " -ForegroundColor Cyan
Write-Host " [NOTE] Backend is now running with REAL AI mode." -ForegroundColor Yellow
