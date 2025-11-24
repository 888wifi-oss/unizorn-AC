@echo off
echo Running SQL scripts to check table structure...
psql -h localhost -U postgres -d condo_pro_dashboard -f scripts/031_check_permissions_table_structure.sql
echo.
echo Running permission discrepancy check...
psql -h localhost -U postgres -d condo_pro_dashboard -f scripts/030_debug_permission_discrepancy.sql
pause
