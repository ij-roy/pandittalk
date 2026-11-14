$ErrorActionPreference = 'Stop'
$bin = Join-Path $env:LOCALAPPDATA 'Android\Sdk\cmake\3.22.1\bin'
$backup = Join-Path $bin 'ninja-1.10.2.exe.bak'
if (-not (Test-Path $backup)) {
    Copy-Item (Join-Path $bin 'ninja.exe') $backup -Force
}
Copy-Item (Join-Path $env:TEMP 'ninja-new\ninja.exe') (Join-Path $bin 'ninja.exe') -Force
& (Join-Path $bin 'ninja.exe') --version
