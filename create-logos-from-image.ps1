Add-Type -AssemblyName System.Drawing

$sourcePath = "c:\Users\marie\Desktop\PAUL\AITools\aitools-logo-new.png"
$outputFolder = "c:\Users\marie\Desktop\PAUL\AITools"

Write-Host "Traitement du logo AITools..." -ForegroundColor Cyan

if (-not (Test-Path $sourcePath)) {
    Write-Host "Erreur: Image non trouvee" -ForegroundColor Red
    Write-Host "Veuillez sauvegarder le logo en PNG avec le nom: aitools-logo-new.png" -ForegroundColor Yellow
    exit 1
}

$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
Write-Host ("Image chargee: " + $sourceImage.Width + "x" + $sourceImage.Height + " px")
Write-Host ""

$sizes = 128, 48, 16

foreach ($size in $sizes) {
    Write-Host ("Creation: aitools-logo-" + $size + ".png") -ForegroundColor Yellow
    
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    
    $graphics.Clear([System.Drawing.Color]::White)
    $graphics.DrawImage($sourceImage, 0, 0, $size, $size)
    
    $outputPath = $outputFolder + "\aitools-logo-" + $size + ".png"
    $bitmap.Save($outputPath)
    
    if (Test-Path $outputPath) {
        $fileSize = [math]::Round((Get-Item $outputPath).Length / 1KB, 2)
        Write-Host ("OK: " + $size + "x" + $size + " - " + $fileSize + " KB") -ForegroundColor Green
    }
    
    $graphics.Dispose()
    $bitmap.Dispose()
}

$sourceImage.Dispose()
Write-Host ""
Write-Host "Logos generes avec succes!" -ForegroundColor Green
