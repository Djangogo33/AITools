Add-Type -AssemblyName System.Drawing

# Données SVG en base64 (SVG du logo)
$svgContent = @"
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="softGradient" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#a78bfa;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#60a5fa;stop-opacity:1" />
    </linearGradient>
    <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="15" result="blur"/>
      <feOffset in="blur" dx="0" dy="10" result="offsetBlur"/>
      <feComponentTransfer>
        <feFuncA type="linear" slope="0.3"/>
      </feComponentTransfer>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" rx="110" ry="110" fill="#ffffff"/>
  <g filter="url(#softShadow)" transform="translate(0, 20)">
    <path d="M160 380 L256 130 L352 380" stroke="url(#softGradient)" stroke-width="50" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <path d="M190 280 L322 280" stroke="url(#softGradient)" stroke-width="50" stroke-linecap="round" fill="none"/>
    <circle cx="256" cy="90" r="25" fill="url(#softGradient)"/>
    <circle cx="380" cy="180" r="10" fill="#a78bfa" opacity="0.4"/>
    <circle cx="130" cy="220" r="15" fill="#60a5fa" opacity="0.3"/>
  </g>
</svg>
"@

# Créer les PNG depuis le SVG
$tempSvgPath = "$PSScriptRoot\temp.svg"
$svgContent | Out-File -FilePath $tempSvgPath -Encoding UTF8

# Créer les trois tailles
$sizes = @(16, 48, 128)

foreach ($size in $sizes) {
    $outputPath = "$PSScriptRoot\aitools-logo-$size.png"
    
    # Utiliser Inkscape ou autre outil si disponible
    # Pour maintenant, créer des images PNG simples avec .NET
    
    try {
        # Essayer avec Inkscape
        $inkscapePath = "C:\Program Files\Inkscape\bin\inkscape.com"
        if (Test-Path $inkscapePath) {
            & $inkscapePath -w $size -h $size -o $outputPath $tempSvgPath
            Write-Host "✓ Créé: $outputPath"
        }
    }
    catch {
        Write-Host "Inkscape non disponible"
    }
}

# Nettoyer le fichier temporaire
Remove-Item $tempSvgPath -Force -ErrorAction SilentlyContinue
