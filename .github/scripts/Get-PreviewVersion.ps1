<#
.SYNOPSIS
    Works out a prerelease package version for a CI build from the nearest v* tag.

.DESCRIPTION
    - Nearest tag is a prerelease (v18.0.0-beta) -> builds are previews of that version: 18.0.0-<suffix>
    - Nearest tag is a release (v17.2.1)          -> builds are previews of the next patch: 17.2.2-<suffix>
    - No v* tag at all                            -> 0.0.1-<suffix>

    SemVer orders prerelease labels alphabetically, so with the suffixes CI uses:
    18.0.0-beta < 18.0.0-pr.82.7 < 18.0.0-preview.41 < 18.0.0-rc < 18.0.0

.EXAMPLE
    ./Get-PreviewVersion.ps1 -Suffix "preview.42"
#>
param(
    [Parameter(Mandatory)]
    [ValidatePattern('^[0-9A-Za-z.-]+$')]
    [string] $Suffix
)

$ErrorActionPreference = 'Stop'

$tag = git describe --tags --abbrev=0 --match 'v[0-9]*' 2>$null
if ($LASTEXITCODE -ne 0 -or -not $tag) {
    $base = '0.0.1'
}
elseif ($tag -match '^v(\d+)\.(\d+)\.(\d+)(-.+)?$') {
    $major, $minor, $patch, $pre = [int]$Matches[1], [int]$Matches[2], [int]$Matches[3], $Matches[4]
    if (-not $pre) { $patch++ }
    $base = "$major.$minor.$patch"
}
else {
    throw "Nearest tag '$tag' is not in the form vMAJOR.MINOR.PATCH[-prerelease]."
}

"$base-$Suffix"
