# Script pour créer les fichiers PNG du logo via conversion du SVG

# Vérifier si magick est disponible (ImageMagick)
$magickPath = Get-Command magick -ErrorAction SilentlyContinue
$convertPath = "C:\Program Files\ImageMagick-7.1.1-Q16-HDRI\convert.exe"

if ($magickPath) {
    Write-Host "ImageMagick trouvé, création des PNG..."
    
    $svgFile = "c:\Users\marie\Desktop\PAUL\AITools\aitools-logo.svg"
    $sizes = @(16, 48, 128)
    
    foreach ($size in $sizes) {
        $outputFile = "c:\Users\marie\Desktop\PAUL\AITools\aitools-logo-$size.png"
        
        # Utiliser ImageMagick pour convertir SVG en PNG
        & magick convert -background none -density 300 -resize "${size}x${size}" "$svgFile" "$outputFile"
        
        if (Test-Path $outputFile) {
            Write-Host "✓ Créé: aitools-logo-$size.png"
        }
    }
} 
elseif (Test-Path $convertPath) {
    Write-Host "ImageMagick trouvé à $convertPath"
    
    $svgFile = "c:\Users\marie\Desktop\PAUL\AITools\aitools-logo.svg"
    $sizes = @(16, 48, 128)
    
    foreach ($size in $sizes) {
        $outputFile = "c:\Users\marie\Desktop\PAUL\AITools\aitools-logo-$size.png"
        
        & $convertPath -background white -density 300 -resize "${size}x${size}" "$svgFile" "$outputFile"
        
        if (Test-Path $outputFile) {
            Write-Host "✓ Créé: aitools-logo-$size.png"
        }
    }
}
else {
    Write-Host "ImageMagick non trouvé. Installation requise."
    Write-Host "Téléchargez ImageMagick depuis: https://imagemagick.org/script/download.php"
}
