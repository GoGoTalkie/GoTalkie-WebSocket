# Build and run script for GoTalkie WebSocket Chat

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "GoTalkie WebSocket Chat - Build & Run" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists
function Test-Command($command) {
    try {
        if (Get-Command $command -ErrorAction Stop) {
            return $true
        }
    }
    catch {
        return $false
    }
}

# Check prerequisites
Write-Host "Checking prerequisites..." -ForegroundColor Yellow

if (-not (Test-Command "go")) {
    Write-Host "❌ Go is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "❌ npm is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

Write-Host "✅ All prerequisites found" -ForegroundColor Green
Write-Host ""

# Ask user for mode
Write-Host "Select run mode:" -ForegroundColor Cyan
Write-Host "1. Development (Go backend + React dev server with hot reload)" -ForegroundColor White
Write-Host "2. Production (Build everything and run from Go backend)" -ForegroundColor White
Write-Host ""
$mode = Read-Host "Enter 1 or 2"

if ($mode -eq "1") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Development Mode" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Install dependencies
    Write-Host "Installing Go dependencies..." -ForegroundColor Yellow
    go mod download
    
    Write-Host "Installing React dependencies..." -ForegroundColor Yellow
    Push-Location client
    npm install
    Pop-Location
    
    Write-Host ""
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
    Write-Host ""
    Write-Host "Building Go backend..." -ForegroundColor Yellow
    go build -o .\bin\server.exe .\cmd\server\main.go
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Go backend built successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "Starting servers..." -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "Go Backend: http://localhost:8080" -ForegroundColor Cyan
        Write-Host "React Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Opening Go backend in this window..." -ForegroundColor Yellow
        Write-Host "Opening React dev server in new window..." -ForegroundColor Yellow
        Write-Host ""
        
        # Start React dev server in new window
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd client; npm run dev"
        
        # Start Go backend in current window
        .\bin\server.exe
    }
    else {
        Write-Host "❌ Failed to build Go backend" -ForegroundColor Red
        exit 1
    }
}
elseif ($mode -eq "2") {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Production Mode" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    # Install dependencies
    Write-Host "Installing Go dependencies..." -ForegroundColor Yellow
    go mod download
    
    Write-Host "Installing React dependencies..." -ForegroundColor Yellow
    Push-Location client
    npm install
    Pop-Location
    
    Write-Host ""
    Write-Host "Building React frontend..." -ForegroundColor Yellow
    Push-Location client
    npm run build
    Pop-Location
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ React frontend built successfully" -ForegroundColor Green
        Write-Host ""
        Write-Host "Building Go backend..." -ForegroundColor Yellow
        go build -o .\bin\server.exe .\cmd\server\main.go
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Go backend built successfully" -ForegroundColor Green
            Write-Host ""
            Write-Host "========================================" -ForegroundColor Green
            Write-Host "Starting production server..." -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Green
            Write-Host ""
            Write-Host "Server: http://localhost:8080" -ForegroundColor Cyan
            Write-Host ""
            
            .\bin\server.exe
        }
        else {
            Write-Host "❌ Failed to build Go backend" -ForegroundColor Red
            exit 1
        }
    }
    else {
        Write-Host "❌ Failed to build React frontend" -ForegroundColor Red
        exit 1
    }
}
else {
    Write-Host "Invalid option. Please run the script again and select 1 or 2." -ForegroundColor Red
    exit 1
}
