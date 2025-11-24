# PowerShell script to run SQL debug scripts
Write-Host "Running SQL scripts to check table structure..." -ForegroundColor Green

# Run the first script
Write-Host "Step 1: Checking permissions table structure..." -ForegroundColor Yellow
& psql -h localhost -U postgres -d condo_pro_dashboard -f scripts/031_check_permissions_table_structure.sql

Write-Host "Step 2: Running permission discrepancy check..." -ForegroundColor Yellow
& psql -h localhost -U postgres -d condo_pro_dashboard -f scripts/030_debug_permission_discrepancy.sql

Write-Host "Scripts completed!" -ForegroundColor Green
