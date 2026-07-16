# Genera los iconos PNG de la PWA (rayo amarillo sobre fondo oscuro redondeado)
# usando System.Drawing de Windows PowerShell 5.1. Salida: client/public/.
# Uso: powershell -ExecutionPolicy Bypass -File generar-iconos.ps1

Add-Type -AssemblyName System.Drawing

$publicDir = Join-Path $PSScriptRoot '..\public'
if (-not (Test-Path $publicDir)) { New-Item -ItemType Directory -Path $publicDir | Out-Null }

function New-Icono {
    param([int]$Tamano, [string]$Destino)

    $bmp = New-Object System.Drawing.Bitmap($Tamano, $Tamano)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.Clear([System.Drawing.Color]::Transparent)

    # Fondo: rectangulo redondeado oscuro (#0f172a), radio ~22% del lado
    $oscuro = [System.Drawing.ColorTranslator]::FromHtml('#0f172a')
    $fondo = New-Object System.Drawing.SolidBrush($oscuro)
    $r = [int]($Tamano * 0.22)
    $d = $r * 2
    $trazado = New-Object System.Drawing.Drawing2D.GraphicsPath
    $trazado.AddArc(0, 0, $d, $d, 180, 90)
    $trazado.AddArc($Tamano - $d, 0, $d, $d, 270, 90)
    $trazado.AddArc($Tamano - $d, $Tamano - $d, $d, $d, 0, 90)
    $trazado.AddArc(0, $Tamano - $d, $d, $d, 90, 90)
    $trazado.CloseFigure()
    $g.FillPath($fondo, $trazado)

    # Rayo amarillo (#facc15): mismo poligono que favicon.svg, escalado desde 64x64
    $amarillo = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml('#facc15'))
    $base = @(
        @(36, 8), @(18, 36), @(29, 36), @(26, 56), @(46, 26), @(34, 26)
    )
    $escala = $Tamano / 64.0
    $puntos = foreach ($p in $base) {
        New-Object System.Drawing.PointF(($p[0] * $escala), ($p[1] * $escala))
    }
    $g.FillPolygon($amarillo, $puntos)

    $g.Dispose()
    $bmp.Save($Destino, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    $trazado.Dispose()
    Write-Host "Generado $Destino ($Tamano x $Tamano)"
}

New-Icono -Tamano 192 -Destino (Join-Path $publicDir 'icon-192.png')
New-Icono -Tamano 512 -Destino (Join-Path $publicDir 'icon-512.png')
New-Icono -Tamano 180 -Destino (Join-Path $publicDir 'apple-touch-icon.png')
