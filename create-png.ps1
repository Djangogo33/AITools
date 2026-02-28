# Script PowerShell pour créer les fichiers PNG du logo AITools

Add-Type -AssemblyName System.Drawing
[System.Drawing.Graphics]::AllowCurrentUserDesktopImages

$sizes = @(16, 48, 128)
$colors = @([System.Drawing.Color]::FromArgb(200, 140, 170), [System.Drawing.Color]::FromArgb(96, 165, 250))

foreach ($size in $sizes) {
    $bitmap = New-Object System.Drawing.Bitmap($size, $size)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    $graphics.Clear([System.Drawing.Color]::White)
    
    # Créer un dégradé
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush(
        [System.Drawing.Point]::new(0, 0),
        [System.Drawing.Point]::new($size, $size),
        [System.Drawing.Color]::FromArgb(167, 139, 250),
        [System.Drawing.Color]::FromArgb(96, 165, 250)
    )
    
    # Dessiner la lettre A stylisée simplifiée
    $pen = New-Object System.Drawing.Pen($brush, [math]::Max(2, $size / 8))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    
    # Points pour former la lettre A
    $x = $size / 2
    $y1 = $size * 0.1
    $y2 = $size * 0.9
    $x1 = $size * 0.2
    $x2 = $size * 0.8
    
    # Triangle A
    $pointLeft = [System.Drawing.PointF]::new($x1, $y2)
    $pointTop = [System.Drawing.PointF]::new($x, $y1)
    $pointRight = [System.Drawing.PointF]::new($x2, $y2)
    
    $graphics.DrawLine($pen, $pointLeft, $pointTop)
    $graphics.DrawLine($pen, $pointTop, $pointRight)
    $graphics.DrawLine($pen, $pointLeft.X + ($x - $x1) * 0.3, $pointLeft.Y - ($y2 - $y1) * 0.5, $pointRight.X - ($x2 - $x) * 0.3, $pointRight.Y - ($y2 - $y1) * 0.5)
    
    # Sauvegarder
    $outputPath = "c:\Users\marie\Desktop\PAUL\AITools\aitools-logo-$size.png"
    $bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Host "OK: aitools-logo-$size.png"
}

Write-Host "PNG files created successfully!"
