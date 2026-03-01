# Script PowerShell pour redimensionner un logo existant en plusieurs résolutions

Add-Type -AssemblyName System.Drawing

# Chemin de l'image source (le nouveau logo)
$sourcePath = "c:\Users\marie\Desktop\PAUL\AITools\aitools-logo-new.png"

# Vérifier si le fichier existe
if (-not (Test-Path $sourcePath)) {
    Write-Host "❌ Erreur: Impossible de trouver $sourcePath"
    Write-Host "Veuillez copier le nouveau logo sous le nom 'aitools-logo-new.png' dans le dossier AITools"
    exit
}

# Tailles à générer
$sizes = @(16, 48, 128)

try {
    # Charger l'image source
    $sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
    Write-Host "✓ Image source chargée: $($sourceImage.Width)x$($sourceImage.Height)"
    
    foreach ($size in $sizes) {
        # Créer une nouvelle image redimensionnée
        $resizedImage = New-Object System.Drawing.Bitmap($size, $size)
        $graphics = [System.Drawing.Graphics]::FromImage($resizedImage)
        
        # Paramètres de haute qualité pour le redimensionnement
        $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
        $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        
        # Dessiner l'image source redimensionnée et centrée
        $graphics.DrawImage($sourceImage, 0, 0, $size, $size)
        
        # Sauvegarder en PNG
        $outputPath = "c:\Users\marie\Desktop\PAUL\AITools\aitools-logo-$size.png"
        $resizedImage.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        
        Write-Host "✓ Créé: aitools-logo-$size.png ($size x $size px)"
        
        $graphics.Dispose()
        $resizedImage.Dispose()
    }
    
    $sourceImage.Dispose()
    Write-Host ""
    Write-Host "✅ Tous les logos ont été générés avec succès!"
    
} catch {
    Write-Host "❌ Erreur lors du traitement: $_"
}
