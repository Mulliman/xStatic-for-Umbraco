param (
    [string]$UmbracoVersion = "17.1.0",
    [string]$XStaticVersion = "17.0.0-beta5",
    [string]$InstanceName,
    [int]$Port = 5000,
    [string]$BaseDir = "..\Instances",
    [switch]$IncludeAllExtensions = $false
)

# Interactive Mode: specific logic if parameters weren't passed
if (-not $PSBoundParameters.ContainsKey('UmbracoVersion')) {
    $userInput = Read-Host "Umbraco Version [$UmbracoVersion]"
    if (-not [string]::IsNullOrWhiteSpace($userInput)) { $UmbracoVersion = $userInput }
}

if (-not $PSBoundParameters.ContainsKey('XStaticVersion')) {
    $userInput = Read-Host "xStatic Version (Leave empty to skip)"
    if (-not [string]::IsNullOrWhiteSpace($userInput)) { $XStaticVersion = $userInput }
}

if (-not $PSBoundParameters.ContainsKey('InstanceName')) {
    $umbracoClean = $UmbracoVersion -replace '[^a-zA-Z0-9]', ''
    $xstaticClean = $XStaticVersion -replace '[^a-zA-Z0-9]', ''
    $defaultInstanceName = "Test-$umbracoClean-$xstaticClean"

    $userInput = Read-Host "Instance Name [$defaultInstanceName]"
    if (-not [string]::IsNullOrWhiteSpace($userInput)) {
        $InstanceName = $userInput
    }
    else {
        $InstanceName = $defaultInstanceName
    }
}

if (-not $PSBoundParameters.ContainsKey('IncludeAllExtensions')) {
    $userInput = Read-Host "Include All Extensions? (y/N)"
    if ($userInput -eq 'y') { $IncludeAllExtensions = $true }
}


$InstanceDir = Join-Path $BaseDir $InstanceName

# Ensure the instances directory exists
if (-not (Test-Path $BaseDir)) {
    New-Item -ItemType Directory -Path $BaseDir | Out-Null
}

# Warn user that the instance already exists and go no further
if (Test-Path $InstanceDir) {
    Write-Host "Instance $InstanceName already exists at $InstanceDir. Please remove it manually if you want to create a new one."
    exit 0
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


if (-not [string]::IsNullOrEmpty($XStaticVersion)) {
    Write-Host "Adding xStatic version $XStaticVersion..."
    dotnet add $InstanceName package xStatic --version $XStaticVersion

    if ($IncludeAllExtensions) {
        Write-Host "Adding xStatic.Netlify version $XStaticVersion..."
        dotnet add $InstanceName package xStatic.Netlify --version $XStaticVersion

        Write-Host "Adding xStatic.Git version $XStaticVersion..."
        dotnet add $InstanceName package xStatic.Git --version $XStaticVersion

        Write-Host "Adding xStatic.Ftp version $XStaticVersion..."
        dotnet add $InstanceName package xStatic.Ftp --version $XStaticVersion

        Write-Host "Adding xStatic.RemoteOperations version $XStaticVersion..."
        dotnet add $InstanceName package xStatic.RemoteOperations --version $XStaticVersion

        Write-Host "Adding xStatic.UmbracoContentApi version $XStaticVersion..."
        dotnet add $InstanceName package xStatic.UmbracoContentApi --version $XStaticVersion
    }
}
else {
    Write-Host "No XStaticVersion provided, skipping package addition."
}

Write-Host "Instance setup complete in $InstanceDir"
Write-Host "To run: dotnet run --project $InstanceName --urls 'https://localhost:$Port'"

# Create Start.bat
$startBatContent = "dotnet run --project ""$InstanceName"" --urls ""https://localhost:$Port"""
Set-Content -Path "Start.bat" -Value $startBatContent
Write-Host "Created Start.bat in $InstanceDir"

# Run Start.bat
Write-Host "Starting site via Start.bat..."
& .\Start.bat
