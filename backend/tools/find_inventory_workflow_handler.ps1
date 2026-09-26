# Run this from: D:\ITM-Data\itm\backend
# It does NOT modify files.

Write-Host "`n=== Files containing inventory-workflow ===" -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Filter *.go |
    Select-String -Pattern 'inventory-workflow' |
    Format-Table Path, LineNumber, Line -AutoSize

Write-Host "`n=== Files containing allocatable-requisitions ===" -ForegroundColor Cyan
Get-ChildItem -Path . -Recurse -Filter *.go |
    Select-String -Pattern 'allocatable-requisitions' |
    Format-Table Path, LineNumber, Line -AutoSize

Write-Host "`n=== FOR UPDATE locations ===" -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -Filter *.go |
    Select-String -Pattern 'FOR UPDATE' |
    Format-Table Path, LineNumber, Line -AutoSize

Write-Host "`n=== LEFT JOIN + asset/stock references ===" -ForegroundColor Yellow
Get-ChildItem -Path . -Recurse -Filter *.go |
    Select-String -Pattern 'LEFT JOIN|stack_inventory|asset_devices' |
    Format-Table Path, LineNumber, Line -AutoSize
