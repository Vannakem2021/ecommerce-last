# Fix image filenames - Remove spaces
$imagesPath = "public\images"

# Files to rename (spaces cause issues on Linux/Vercel)
$renames = @{
    "iPhone16pro max.png" = "iPhone16ProMax.png"
    "iPhone15Pro Max.png" = "iPhone15ProMax.png"
    "iPhone14ProMax.png" = "iPhone14ProMax.png"  # Already correct
    "iPhone13ProMax.png" = "iPhone13ProMax.png"  # Already correct
    "iPhone12Pro max.png" = "iPhone12ProMax.png"
    "OppoReno13 Pro5G.png" = "OppoReno13Pro5G.png"
    "OppoFindX3 Pro.png" = "OppoFindX3Pro.png"  # Already has no-space version
}

Write-Host "Renaming image files to remove spaces..." -ForegroundColor Cyan

foreach ($oldName in $renames.Keys) {
    $newName = $renames[$oldName]
    $oldPath = Join-Path $imagesPath $oldName
    $newPath = Join-Path $imagesPath $newName
    
    if (Test-Path $oldPath) {
        if (Test-Path $newPath) {
            Write-Host "  ⚠️  $newName already exists, skipping $oldName" -ForegroundColor Yellow
        } else {
            Rename-Item -Path $oldPath -NewName $newName
            Write-Host "  ✓ Renamed: $oldName → $newName" -ForegroundColor Green
        }
    } else {
        Write-Host "  ⚠️  $oldName not found" -ForegroundColor Yellow
    }
}

Write-Host "`nDone! Now update data.ts with new filenames." -ForegroundColor Green
