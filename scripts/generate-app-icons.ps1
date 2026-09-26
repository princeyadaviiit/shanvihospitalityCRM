Add-Type -AssemblyName System.Drawing

$sourcePath = 'C:\Users\forwe\.gemini\antigravity-ide\brain\5ea29c4e-8b6f-4b4f-a958-6cce2d0ff724\crm_app_icon_1790423178635.jpg'
$sourceImg = [System.Drawing.Bitmap]::FromFile($sourcePath)

function Resize-And-Save($img, $width, $height, $destPath) {
    $destDir = [System.IO.Path]::GetDirectoryName($destPath)
    if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
    $destBmp = New-Object System.Drawing.Bitmap($width, $height)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.DrawImage($img, 0, 0, $width, $height)
    $g.Dispose()
    $destBmp.Save($destPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $destBmp.Dispose()
}

# Android mipmap icons
$sizes = @{
    'mipmap-mdpi' = 48
    'mipmap-hdpi' = 72
    'mipmap-xhdpi' = 96
    'mipmap-xxhdpi' = 144
    'mipmap-xxxhdpi' = 192
}

foreach ($entry in $sizes.GetEnumerator()) {
    $dir = Join-Path 'd:\projects\CRM\android\app\src\main\res' $entry.Key
    Resize-And-Save $sourceImg $entry.Value $entry.Value (Join-Path $dir 'ic_launcher.png')
    Resize-And-Save $sourceImg $entry.Value $entry.Value (Join-Path $dir 'ic_launcher_round.png')
    Resize-And-Save $sourceImg $entry.Value $entry.Value (Join-Path $dir 'ic_launcher_foreground.png')
}

# Public web icons
Resize-And-Save $sourceImg 512 512 'd:\projects\CRM\public\icons\icon-512x512.png'
Resize-And-Save $sourceImg 192 192 'd:\projects\CRM\public\icons\icon-192x192.png'
Resize-And-Save $sourceImg 512 512 'd:\projects\CRM\public\icons\crm-logo.png'

# Android splash screen
Resize-And-Save $sourceImg 480 480 'd:\projects\CRM\android\app\src\main\res\drawable\splash.png'

$sourceImg.Dispose()
Write-Output 'App icons and splash generated successfully!'
