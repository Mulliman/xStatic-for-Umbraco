param (
    [string]$UmbracoVersion,
    [string]$InstanceName,
    [int]$Port,
    [string]$BaseDir
)

$InstanceDir = Join-Path $BaseDir $InstanceName

# Ensure the instances directory exists
if (-not (Test-Path $BaseDir)) {
    New-Item -ItemType Directory -Path $BaseDir | Out-Null
}

# Warn user that the instance already exists and go no further
if (Test-Path $InstanceDir) {
    Write-Host "Instance $InstanceName already exists at $InstanceDir. Please remove it manually if you want to create a new one."
    exit 1
}

New-Item -ItemType Directory -Path $InstanceDir | Out-Null
Set-Location $InstanceDir

Write-Host "Installing Umbraco Templates version $UmbracoVersion..."
dotnet new install Umbraco.Templates::$UmbracoVersion --force

Write-Host "Creating Solution..."
dotnet new sln --name $InstanceName

Write-Host "Creating Umbraco Project..."
dotnet new umbraco --force -n $InstanceName -da --friendly-name "Administrator" --email "admin@admin.com" --password "1234567890" --development-database-type SQLite

Write-Host "Adding Project to Solution..."
dotnet sln add $InstanceName

Write-Host "Adding clean starter kit..."
dotnet add $InstanceName package clean

Write-Host "Enabling AllowConcurrentLogins..."
$appSettingsPath = Join-Path $InstanceDir "appsettings.Development.json"
if (Test-Path $appSettingsPath) {
    $json = Get-Content $appSettingsPath -Raw | ConvertFrom-Json
    if (-not $json.Umbraco) { $json | Add-Member -NotePropertyName "Umbraco" -NotePropertyValue @{} }
    if (-not $json.Umbraco.CMS) { $json.Umbraco | Add-Member -NotePropertyName "CMS" -NotePropertyValue @{} }
    if (-not $json.Umbraco.CMS.Security) { $json.Umbraco.CMS | Add-Member -NotePropertyName "Security" -NotePropertyValue @{} }
    $json.Umbraco.CMS.Security | Add-Member -NotePropertyName "AllowConcurrentLogins" -NotePropertyValue $true -Force
    $json | ConvertTo-Json -Depth 10 | Set-Content $appSettingsPath
}

# Create Start.bat
$startBatContent = "dotnet run --project ""$InstanceName"" --urls ""https://localhost:$Port"""
Set-Content -Path "Start.bat" -Value $startBatContent
Write-Host "Created Start.bat in $InstanceDir"
