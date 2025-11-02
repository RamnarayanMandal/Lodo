# Build Check Script
# This script checks if frontend and backend builds are successful
# Run this before pushing to ensure code compiles

Write-Host "🔍 Running build checks..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the project root
if (-not (Test-Path "frontend") -or -not (Test-Path "backend")) {
    Write-Host "❌ Error: frontend or backend directory not found" -ForegroundColor Red
    Write-Host "Please run this script from the project root directory." -ForegroundColor Red
    exit 1
}

$buildFailed = $false

# Build frontend
Write-Host "📦 Building frontend..." -ForegroundColor Yellow
Set-Location frontend
try {
    npm run build
    if ($LASTEXITCODE -ne 0) {
        $buildFailed = $true
        Write-Host ""
        Write-Host "❌ Frontend build failed!" -ForegroundColor Red
        Write-Host "Fix the errors above before pushing." -ForegroundColor Red
    } else {
        Write-Host "✅ Frontend build successful!" -ForegroundColor Green
    }
} catch {
    $buildFailed = $true
    Write-Host "❌ Frontend build error: $_" -ForegroundColor Red
}
Set-Location ..

# Build backend (only if frontend succeeded)
if (-not $buildFailed) {
    Write-Host ""
    Write-Host "📦 Building backend..." -ForegroundColor Yellow
    Set-Location backend
    try {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            $buildFailed = $true
            Write-Host ""
            Write-Host "❌ Backend build failed!" -ForegroundColor Red
            Write-Host "Fix the errors above before pushing." -ForegroundColor Red
        } else {
            Write-Host "✅ Backend build successful!" -ForegroundColor Green
        }
    } catch {
        $buildFailed = $true
        Write-Host "❌ Backend build error: $_" -ForegroundColor Red
    }
    Set-Location ..
}

Write-Host ""

if ($buildFailed) {
    Write-Host "❌ Build check failed! Do not push code yet." -ForegroundColor Red
    Write-Host "Please fix all build errors before pushing." -ForegroundColor Red
    exit 1
} else {
    Write-Host "✅ All builds successful! Safe to push code." -ForegroundColor Green
    exit 0
}

