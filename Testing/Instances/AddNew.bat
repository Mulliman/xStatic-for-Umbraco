@echo off
set "UseLocal="
set /p UseLocal="Do you want to use local project references? (Y/N): "
if /I "%UseLocal%"=="Y" (
    powershell -ExecutionPolicy Bypass -File "..\Scripts\setup-local-instance.ps1"
) else (
    powershell -ExecutionPolicy Bypass -File "..\Scripts\setup-instance.ps1"
)
pause
