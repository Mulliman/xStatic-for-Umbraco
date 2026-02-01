param (
    [string]$UmbracoVersion = "17.1.0",
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

if (-not $PSBoundParameters.ContainsKey('InstanceName')) {
    $umbracoClean = $UmbracoVersion -replace '[^a-zA-Z0-9]', ''
    $defaultInstanceName = "Test-$umbracoClean-Local"

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

$ScriptRoot = $PSScriptRoot
$SourceRoot = Resolve-Path (Join-Path $ScriptRoot "..\..\Source\XStaticCore")

# Run common setup
$commonScript = Join-Path $PSScriptRoot "setup-common.ps1"
& $commonScript -UmbracoVersion $UmbracoVersion -InstanceName $InstanceName -Port $Port -BaseDir $BaseDir

if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

# Ensure we are in the instance directory
$InstanceDir = Join-Path $BaseDir $InstanceName
Set-Location $InstanceDir


# Define project paths
$xStaticProject = Join-Path $SourceRoot "XStatic\XStatic.csproj"
$xStaticNetlify = Join-Path $SourceRoot "XStatic.Netlify\XStatic.Netlify.csproj"
$xStaticGit = Join-Path $SourceRoot "XStatic.Git\XStatic.Git.csproj"
$xStaticFtp = Join-Path $SourceRoot "XStatic.Ftp\XStatic.Ftp.csproj"
$xStaticRemote = Join-Path $SourceRoot "XStatic.RemoteOperations\XStatic.RemoteOperations.csproj"
$xStaticContentApi = Join-Path $SourceRoot "XStatic.UmbracoContentApi\XStatic.UmbracoContentApi.csproj"

Write-Host "Adding Local xStatic Reference..."
dotnet add $InstanceName reference $xStaticProject
if ($LASTEXITCODE -ne 0) { Write-Error "Failed to add xStatic project reference"; exit $LASTEXITCODE }

if ($IncludeAllExtensions) {
    Write-Host "Adding Local xStatic.Netlify Reference..."
    dotnet add $InstanceName reference $xStaticNetlify
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to add xStatic.Netlify reference"; exit $LASTEXITCODE }

    Write-Host "Adding Local xStatic.Git Reference..."
    dotnet add $InstanceName reference $xStaticGit
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to add xStatic.Git reference"; exit $LASTEXITCODE }

    Write-Host "Adding Local xStatic.Ftp Reference..."
    dotnet add $InstanceName reference $xStaticFtp
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to add xStatic.Ftp reference"; exit $LASTEXITCODE }

    Write-Host "Adding Local xStatic.RemoteOperations Reference..."
    dotnet add $InstanceName reference $xStaticRemote
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to add xStatic.RemoteOperations reference"; exit $LASTEXITCODE }

    Write-Host "Adding Local xStatic.UmbracoContentApi Reference..."
    dotnet add $InstanceName reference $xStaticContentApi
    if ($LASTEXITCODE -ne 0) { Write-Error "Failed to add xStatic.UmbracoContentApi reference"; exit $LASTEXITCODE }
}

Write-Host "Instance setup complete in $InstanceDir"
Write-Host "To run: dotnet run --project $InstanceName --urls 'https://localhost:$Port'"

# Create Start-Watcher.bat
$assetsDir = Join-Path $SourceRoot "XStatic14\XStatic14.Client\assets"
$watcherBatContent = @"
@echo off
cd /d "$assetsDir"
npm run watch
"@
Set-Content -Path "Start-Watcher.bat" -Value $watcherBatContent
Write-Host "Created Start-Watcher.bat in $InstanceDir"

# Run Start.bat
Write-Host "Starting site via Start.bat..."
& .\Start.bat
