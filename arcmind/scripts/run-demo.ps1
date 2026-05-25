Write-Host "Starting ArcMind backend on http://localhost:8000"
Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\backend'; python -m uvicorn app.main:app --reload --port 8000"

Write-Host "Starting ArcMind frontend on http://localhost:3000"
Start-Process powershell -WindowStyle Hidden -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\..\frontend'; npm run dev"

Write-Host "ArcMind demo boot requested. Open http://localhost:3000"
