# Script PowerShell avancé pour redimensionner le logo AITools avec optimisation des détails

Add-Type -AssemblyName System.Drawing

# Configuration
$sourcePath = "c:\Users\marie\Desktop\PAUL\AITools\aitools-logo-new.png"
$outputFolder = "c:\Users\marie\Desktop\PAUL\AITools"

# Vérifier si le fichier source existe
if (-not (Test-Path $sourcePath)) {
    Write-Host "❌ Erreur: Image source non trouvée à: $sourcePath"
    exit 1
}

Write-Host "🎨 Traitement du logo AITools avec optimisation des détails..." -ForegroundColor Cyan
Write-Host ""

try {
    # Charger l'image source
    $sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
    $sourceWidth = $sourceImage.Width
    $sourceHeight = $sourceImage.Height
    Write-Host "✓ Image source chargée: $sourceWidth x $sourceHeight px"
    Write-Host ""

    # Configuration par taille pour optimiser les détails
    $sizeConfigs = @(
        @{
            Size = 128
            InterpolationMode = "HighQualityBicubic"
            Smoothing = "AntiAlias"
            Quality = 95
        },
        @{
            Size = 48
            InterpolationMode = "HighQualityBicubic"
            Smoothing = "AntiAlias"
            Quality = 90
        },
        @{
            Size = 16
            InterpolationMode = "HighQualityBicubic"
            Smoothing = "AntiAlias"
            Quality = 80
        }
    )

    foreach ($config in $sizeConfigs) {
        $size = $config.Size
        $interpMode = $config.InterpolationMode
        $smoothing = $config.Smoothing
        $quality = $config.Quality

        Write-Host "📐 Génération: aitools-logo-$size.png" -ForegroundColor Yellow

        # Créer une bitmap avec la nouvelle taille
        $resizedImage = New-Object System.Drawing.Bitmap($size, $size)
        $resizedImage.SetResolution(96, 96)
        
        $graphics = [System.Drawing.Graphics]::FromImage($resizedImage)
        
        # Configuration haute qualité pour l'interpolation
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::$interpMode
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::$smoothing
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
        $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAlias

        # Remplir avec fond blanc
        $graphics.Clear([System.Drawing.Color]::White)

        # Dessiner l'image source redimensionnée avec centrage optimal
        $graphics.DrawImage(
            $sourceImage, 
            [System.Drawing.Rectangle]::new(0, 0, $size, $size),
            [System.Drawing.Rectangle]::new(0, 0, $sourceWidth, $sourceHeight),
            [System.Drawing.GraphicsUnit]::Pixel
        )

        # Sauvegarder en PNG avec compression optimale
        $outputPath = Join-Path $outputFolder "aitools-logo-$size.png"
        
        # Configuration d'encodage PNG pour meilleure qualité
        $pngEncoder = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | 
                      Where-Object { $_.MimeType -eq 'image/png' } | 
                      Select-Object -First 1
        
        $encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
        $encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter(
            [System.Drawing.Imaging.Encoder]::Quality, 
            $quality
        )

        $resizedImage.Save($outputPath, $pngEncoder, $encoderParams)
        
        # Afficher les infos du fichier créé
        if (Test-Path $outputPath) {
            $fileSize = (Get-Item $outputPath).Length
            Write-Host "  ✅ Créé: $size x $size px - $([math]::Round($fileSize/1KB, 2)) KB" -ForegroundColor Green
        }

        $graphics.Dispose()
        $resizedImage.Dispose()
        Write-Host ""
    }

    $sourceImage.Dispose()
    
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "✅ Logos générés avec optimisation des détails!" -ForegroundColor Green
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Erreur lors du traitement: $_" -ForegroundColor Red
    exit 1
}
