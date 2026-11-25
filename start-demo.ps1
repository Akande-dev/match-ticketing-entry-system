$root = $PSScriptRoot
Set-Location $root
$Host.UI.RawUI.WindowTitle = 'MTSES demo launcher'

function Free-Ports {
  foreach ($p in 4000,4400,4500,5000,5001,5173,8080,8085,9099,9150) {
    Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
      $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
      if ($proc -and ($proc.ProcessName -eq 'node' -or $proc.ProcessName -eq 'java')) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
      }
    }
  }
}

function Test-Port($port) {
  $l = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  return [bool]$l
}

function Wait-Port($port, $label, $seconds) {
  $end = (Get-Date).AddSeconds($seconds)
  while ((Get-Date) -lt $end) {
    if (Test-Port $port) { Write-Host "  $label is up" -ForegroundColor Green; return $true }
    Start-Sleep -Seconds 2
  }
  Write-Host "  $label did not start in time" -ForegroundColor Red
  return $false
}

function Wait-Functions($seconds) {
  $url = 'http://127.0.0.1:5001/demo-mtses/us-central1/holdSeats'
  $end = (Get-Date).AddSeconds($seconds)
  while ((Get-Date) -lt $end) {
    try { Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 | Out-Null; return $true }
    catch {
      $resp = $_.Exception.Response
      if ($resp -and [int]$resp.StatusCode -ne 404) { return $true }
    }
    Start-Sleep -Seconds 2
  }
  return $false
}

Write-Host ''
Write-Host '=== Match Ticketing demo ===' -ForegroundColor Cyan
Write-Host '1. Clearing anything left running from before...'
Free-Ports
Start-Sleep -Seconds 2

Write-Host '2. Starting the Firebase emulators (about 30-60 seconds)...'
Start-Process powershell -WindowStyle Minimized -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-Command',"Set-Location '$root'; npm run emulators"
if (-not (Wait-Port 8080 'Database' 240)) { Read-Host 'Press Enter to close'; exit 1 }
if (-not (Wait-Port 9099 'Sign-in service' 120)) { Read-Host 'Press Enter to close'; exit 1 }
Write-Host '  Waiting for the backend functions to load...'
if (-not (Wait-Functions 180)) { Write-Host '  Functions are slow; continuing anyway.' -ForegroundColor Yellow }

Write-Host '3. Loading demo data...'
node functions/scripts/demo-setup.js
if ($LASTEXITCODE -ne 0) { Write-Host 'Demo setup failed. See the message above.' -ForegroundColor Red; Read-Host 'Press Enter to close'; exit 1 }

Write-Host '4. Starting the website...'
Start-Process powershell -WindowStyle Minimized -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-Command',"Set-Location '$root'; npm run web"
if (-not (Wait-Port 5173 'Website' 90)) { Read-Host 'Press Enter to close'; exit 1 }

Start-Process 'http://localhost:5173'

Write-Host ''
Write-Host '=== READY. The demo is open in your browser at http://localhost:5173 ===' -ForegroundColor Green
Write-Host ''
Write-Host 'Demo accounts (password for all: Demo1234!)'
Write-Host '  fan@demo.com      buys tickets, already owns 2 tickets for Arsenal vs Chelsea'
Write-Host '  steward@demo.com  scans tickets at the gate'
Write-Host '  admin@demo.com    everything, plus the audit log'
Write-Host ''
Write-Host 'To paste a ticket into the scanner, run in another window:'
Write-Host '  node functions/scripts/user-tools.js ticket fan@demo.com'
Write-Host ''
Read-Host 'Leave this window open. Press Enter here when you have finished to STOP the demo'
Free-Ports
Write-Host 'Demo stopped.'
