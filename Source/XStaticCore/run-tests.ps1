<#
.SYNOPSIS
    Runs the xStatic unit and integration tests.

.DESCRIPTION
    The integration tests (XStatic.IntegrationTests) spin up Umbraco 17 against a real database,
    recreate the schema xStatic 13.1.0 leaves behind, seed v13 sites, then run the v17 migration plan.

    SQLite is used by default and needs no setup. Use -Database LocalDb or -Database SqlServer to
    exercise the SQL Server-only path (widening MediaRootNodes).

.EXAMPLE
    ./run-tests.ps1

.EXAMPLE
    ./run-tests.ps1 -Database LocalDb

.EXAMPLE
    ./run-tests.ps1 -Database SqlServer -SqlServerMasterConnectionString "Server=.;Database=master;Integrated Security=true;TrustServerCertificate=true"

.EXAMPLE
    ./run-tests.ps1 -IntegrationOnly -Filter "FullyQualifiedName~V13Upgrade"
#>
param(
    [ValidateSet('SQLite', 'LocalDb', 'SqlServer')]
    [string] $Database = 'SQLite',

    [string] $SqlServerMasterConnectionString,

    [switch] $IntegrationOnly,

    [string] $Filter
)

$ErrorActionPreference = 'Stop'
Push-Location $PSScriptRoot

try {
    $env:Tests__Database__DatabaseType = $Database
    if ($SqlServerMasterConnectionString) {
        $env:Tests__Database__SQLServerMasterConnectionString = $SqlServerMasterConnectionString
    }

    $projects = @()
    if (-not $IntegrationOnly) { $projects += 'XStatic.Core.Tests/XStatic.Core.Tests.csproj' }
    $projects += 'XStatic.IntegrationTests/XStatic.IntegrationTests.csproj'

    $failed = $false
    foreach ($project in $projects) {
        Write-Host "`n==> $project ($Database)" -ForegroundColor Cyan
        $testArgs = @('test', $project)
        if ($Filter) { $testArgs += @('--filter', $Filter) }

        & dotnet @testArgs
        if ($LASTEXITCODE -ne 0) { $failed = $true }
    }

    if ($failed) { throw 'One or more test projects failed.' }
}
finally {
    Remove-Item Env:Tests__Database__DatabaseType -ErrorAction SilentlyContinue
    Remove-Item Env:Tests__Database__SQLServerMasterConnectionString -ErrorAction SilentlyContinue
    Pop-Location
}
