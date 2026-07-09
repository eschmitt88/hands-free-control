# Native-Windows setup for the head-mouse app, using uv.
# Run this in PowerShell (Windows PowerShell or PowerShell 7) — NOT in WSL.
# WSL2 can neither reach the USB webcam nor move the Windows cursor, which are
# exactly the two things this app does, so it must run on native Windows Python.
#
#   PS> cd app
#   PS> ./setup.ps1
#   PS> uv run python headmouse.py
#
# If PowerShell blocks the script, allow it for this session:
#   PS> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

$ErrorActionPreference = "Stop"

# 1. uv — install if missing (native Windows installer).
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Host "uv not found — installing..." -ForegroundColor Yellow
    irm https://astral.sh/uv/install.ps1 | iex
    $env:Path = "$env:USERPROFILE\.local\bin;$env:Path"
}

# 2. A native Windows CPython 3.12 (MediaPipe has wheels for it).
uv python install 3.12

# 3. Project venv + deps.
uv venv --python 3.12
uv pip install -r requirements.txt

Write-Host ""
Write-Host "Done. Run the app with:" -ForegroundColor Green
Write-Host "  uv run python headmouse.py" -ForegroundColor Green
Write-Host ""
Write-Host "It STARTS PAUSED. Press Ctrl+Alt+P to take control of the cursor," -ForegroundColor Cyan
Write-Host "Ctrl+Alt+R to recenter your neutral head pose, Ctrl+Alt+Q to quit." -ForegroundColor Cyan
