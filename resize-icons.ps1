Add-Type -AssemblyName System.Drawing

$sourcePath = "C:\Users\ff0594\.gemini\antigravity\brain\66ed4bfe-cfac-456a-9d65-19d851bce4a6\.user_uploaded\media_1786543216091.jpg"
$destBase = "C:\Users\ff0594\Documents\LA ESQUINA 51\la-esquina-51\android\app\src\main\res"

$sizes = @{
    "mipmap-mdpi"    = @{ launcher = 48; foreground = 108 }
    "mipmap-hdpi"    = @{ launcher = 72; foreground = 162 }
    "mipmap-xhdpi"   = @{ launcher = 96; foreground = 216 }
    "mipmap-xxhdpi"  = @{ launcher = 144; foreground = 324 }
    "mipmap-xxxhdpi" = @{ launcher = 192; foreground = 432 }
}

$img = [System.Drawing.Image]::FromFile($sourcePath)

foreach ($folder in $sizes.Keys) {
    $folderPath = Join-Path $destBase $folder
    if (!(Test-Path $folderPath)) {
        New-Item -ItemType Directory -Force -Path $folderPath | Out-Null
    }

    # Sizes
    $launcherSize = $sizes[$folder].launcher
    $foregroundSize = $sizes[$folder].foreground

    # 1. ic_launcher.png (legacy square)
    $bmpLauncher = New-Object System.Drawing.Bitmap($launcherSize, $launcherSize)
    $g = [System.Drawing.Graphics]::FromImage($bmpLauncher)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($img, 0, 0, $launcherSize, $launcherSize)
    $g.Dispose()
    $bmpLauncher.Save((Join-Path $folderPath "ic_launcher.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpLauncher.Dispose()

    # 2. ic_launcher_round.png (legacy round)
    # We can just copy the square one for now, or apply a circular clip. Let's just resize it to square.
    $bmpRound = New-Object System.Drawing.Bitmap($launcherSize, $launcherSize)
    $gRound = [System.Drawing.Graphics]::FromImage($bmpRound)
    $gRound.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gRound.DrawImage($img, 0, 0, $launcherSize, $launcherSize)
    $gRound.Dispose()
    $bmpRound.Save((Join-Path $folderPath "ic_launcher_round.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpRound.Dispose()

    # 3. ic_launcher_foreground.png (Adaptive icon foreground)
    # Adaptive icons expect the visual content in the center 66%. Since the provided logo has a circle, 
    # and the background is cream, it will fit perfectly as a foreground layer on a cream background.
    $bmpForeground = New-Object System.Drawing.Bitmap($foregroundSize, $foregroundSize)
    $gFg = [System.Drawing.Graphics]::FromImage($bmpForeground)
    $gFg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $gFg.DrawImage($img, 0, 0, $foregroundSize, $foregroundSize)
    $gFg.Dispose()
    $bmpForeground.Save((Join-Path $folderPath "ic_launcher_foreground.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $bmpForeground.Dispose()
}

$img.Dispose()
Write-Output "Image resizing complete."
