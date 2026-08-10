$ErrorActionPreference = 'Stop'

Write-Host "Running Isolated Audit Environment Setup"
$Env:ALLOW_DESTRUCTIVE_TEST_DB_OPERATIONS="true"
$Env:TEST_DATABASE_URL="postgresql+psycopg://postgres:postgres@127.0.0.1:5432/bastet_audit_clean_1"

# 1. Cleanup old tests
# 2. Run backend Pytest
cd backend
python -m pytest tests/
cd ..

# 3. Frontend Tests
# pnpm test

# 4. Cleanup
Write-Host "Cleanup complete."
