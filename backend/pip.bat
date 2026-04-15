@echo off
setlocal
set "HERE=%~dp0"
"%HERE%venv\python.exe" -m pip %*
