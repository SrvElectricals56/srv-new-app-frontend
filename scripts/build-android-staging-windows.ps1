param(
  [ValidateNotNullOrEmpty()]
  [string]$ApiUrl = 'https://staging.srvelectricals.in/api/v1'
)

$ErrorActionPreference = 'Stop'

$projectRoot = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$workspaceRoot = Split-Path $projectRoot -Parent
$shortDrive = 'S:'
$existingMapping = (& subst) | Where-Object { $_ -match '^S:\\: => ' } | Select-Object -First 1
$createdMapping = $false

if ($existingMapping) {
  $mappedRoot = ($existingMapping -replace '^S:\\: => ', '').TrimEnd('\')
  if (-not $mappedRoot.Equals($workspaceRoot.TrimEnd('\'), [StringComparison]::OrdinalIgnoreCase)) {
    throw "S: is already mapped to $mappedRoot. Free it before running this build."
  }
} elseif (Test-Path 'S:\') {
  throw 'S: is already in use. Free it before running this build.'
} else {
  & subst $shortDrive $workspaceRoot
  if ($LASTEXITCODE -ne 0) { throw 'Could not create the short S: drive mapping.' }
  $createdMapping = $true
}

try {
  if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
  }
  if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
  }
  $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
  $env:APP_VARIANT = 'staging'
  $env:EXPO_PUBLIC_API_URL = $ApiUrl
  $env:SRV_ANDROID_CMAKE_STAGING_DIR = 'S:\c'
  $env:CI = '1'

  # Gradle does not track EXPO_PUBLIC_API_URL as an input to the JS bundle.
  # Removing this generated output makes a changed API URL reach the APK.
  $releaseBundle = Join-Path $projectRoot 'android\app\build\generated\assets\react\release\index.android.bundle'
  if (Test-Path -LiteralPath $releaseBundle) {
    Remove-Item -LiteralPath $releaseBundle
  }

  $shortProject = Join-Path 'S:\' (Split-Path $projectRoot -Leaf)
  Push-Location (Join-Path $shortProject 'android')
  try {
    & .\gradlew.bat :app:assembleRelease '-Pkotlin.incremental=false' --no-daemon --console=plain
    if ($LASTEXITCODE -ne 0) { throw "Android build failed with exit code $LASTEXITCODE." }
  } finally {
    Pop-Location
  }

  Write-Output (Join-Path $projectRoot 'android\app\build\outputs\apk\release\app-release.apk')
} finally {
  if ($createdMapping) { & subst $shortDrive /D }
}
