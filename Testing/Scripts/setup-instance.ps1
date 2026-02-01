param (
    [string]$UmbracoVersion = "17.1.0",
    [string]$XStaticVersion = "17.0.0-beta6",
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

# Resolve BaseDir to absolute path to avoid issues if CWD changes
if (Test-Path $BaseDir) {
    $BaseDir = Resolve-Path $BaseDir
}
else {
    # If it doesn't exist yet, resolve parent and join
    $parent = Resolve-Path ".."
    $BaseDir = Join-Path $parent "Instances"
}

# Run common setup
$commonScript = Join-Path $PSScriptRoot "setup-common.ps1"
& $commonScript -UmbracoVersion $UmbracoVersion -InstanceName $InstanceName -Port $Port -BaseDir $BaseDir

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

# Ensure we are in the instance directory (Common script changes location but we need to be sure if called via &)
$InstanceDir = Join-Path $BaseDir $InstanceName
Set-Location $InstanceDir

if (-not [string]::IsNullOrEmpty($XStaticVersion)) {
    Write-Host "Adding xStatic version $XStaticVersion..."
    dotnet add $InstanceName package xStatic --version $XStaticVersion
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to add xStatic package"; exit $LASTEXITCODE }

    if ($IncludeAllExtensions) {
        Write-Host "Adding xStatic.Netlify version $XStaticVersion..."
        dotnet add $InstanceName package xStatic.Netlify --version $XStaticVersion
        if ($LASTEXITCODE -ne 0) { Write-Error "Failed to add xStatic.Netlify"; exit $LASTEXITCODE }

        Write-Host "Adding xStatic.Git version $XStaticVersion..."
        dotnet add $InstanceName package xStatic.Git --version $XStaticVersion
        if ($LASTEXITCODE -ne 0) { Write-Error "Failed to add xStatic.Git"; exit $LASTEXITCODE }

        Write-Host "Adding xStatic.Ftp version $XStaticVersion..."
        dotnet add $InstanceName package xStatic.Ftp --version $XStaticVersion
        if ($LASTEXITCODE -ne 0) { Write-Error "Failed to add xStatic.Ftp"; exit $LASTEXITCODE }

        Write-Host "Adding xStatic.RemoteOperations version $XStaticVersion..."
        dotnet add $InstanceName package xStatic.RemoteOperations --version $XStaticVersion
        if ($LASTEXITCODE -ne 0) { Write-Error "Failed to add xStatic.RemoteOperations"; exit $LASTEXITCODE }

        Write-Host "Adding xStatic.UmbracoContentApi version $XStaticVersion..."
        dotnet add $InstanceName package xStatic.UmbracoContentApi --version $XStaticVersion
        if ($LASTEXITCODE -ne 0) { Write-Error "Failed to add xStatic.UmbracoContentApi"; exit $LASTEXITCODE }
    }
}
else {
    Write-Host "No XStaticVersion provided, skipping package addition."
}

Write-Host "Instance setup complete in $InstanceDir"
Write-Host "To run: dotnet run --project $InstanceName --urls 'https://localhost:$Port'"

# Run Start.bat
Write-Host "Starting site via Start.bat..."
& .\Start.bat
