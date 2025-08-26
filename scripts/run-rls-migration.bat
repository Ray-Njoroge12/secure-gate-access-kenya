@echo off
set DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/secure_gate
powershell -ExecutionPolicy Bypass -File scripts\apply-rls.ps1
