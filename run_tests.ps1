Write-Host " ================================================= " -ForegroundColor Cyan
Write-Host "         DermaAI: All-In-One Test Runner           " -ForegroundColor Cyan
Write-Host " ================================================= " -ForegroundColor Cyan

# 1. Config
$env:DATABASE_URL = "sqlite:///./derma.db"
$env:MOCK_AI = "true"
Write-Host " [INFO] Environment set: MOCK_AI=true, DATABASE=sqlite" -ForegroundColor Gray

# 2. Backend Tests
Write-Host "`n [1/4] Running Backend Unit Tests (pytest)..." -ForegroundColor Yellow
Set-Location backend
python -m pytest
if ($LASTEXITCODE -ne 0) {
    Write-Host " [ERROR] Backend tests failed. Stopping." -ForegroundColor Red
    exit 1
}
Write-Host " [PASS] Backend tests passed." -ForegroundColor Green
Set-Location ..

# 3. Frontend Tests
Write-Host "`n [2/4] Running Frontend Unit Tests (vitest)..." -ForegroundColor Yellow
Set-Location frontend
# Use 'npx vitest run' to strictly force single-run mode (no watch)
npx vitest run
if ($LASTEXITCODE -ne 0) {
    Write-Host " [ERROR] Frontend tests failed. Stopping." -ForegroundColor Red
    exit 1
}
Write-Host " [PASS] Frontend tests passed." -ForegroundColor Green
Set-Location ..

# 4. Seeding E2E
Write-Host "`n [3/4] Seeding Data for E2E Tests..." -ForegroundColor Yellow
Set-Location backend
# We reuse the same env vars
python -m app.seed_e2e_fixtures
if ($LASTEXITCODE -ne 0) {
    Write-Host " [ERROR] Seeding failed. Stopping." -ForegroundColor Red
    exit 1
}
Write-Host " [PASS] Data seeded." -ForegroundColor Green
Set-Location ..

# 5. E2E Tests
Write-Host "`n [4/4] Running E2E Tests (Playwright)..." -ForegroundColor Yellow
Set-Location frontend
npx playwright test
if ($LASTEXITCODE -ne 0) {
    Write-Host " [ERROR] E2E tests failed." -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "`n ================================================= " -ForegroundColor Cyan
Write-Host "      ALL TESTS PASSED SUCCESSFULLY! 🚀            " -ForegroundColor Green
Write-Host " ================================================= " -ForegroundColor Cyan
