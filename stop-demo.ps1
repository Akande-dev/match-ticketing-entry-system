foreach ($p in 4000,4400,4500,5000,5001,5173,8080,8085,9099,9150) {
  Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object {
    $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
    if ($proc -and ($proc.ProcessName -eq 'node' -or $proc.ProcessName -eq 'java')) {
      Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
  }
}
Write-Host 'Demo stopped.'
