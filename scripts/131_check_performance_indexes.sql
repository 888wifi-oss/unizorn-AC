-- Check Performance Indexes
-- This script will show all created indexes

SELECT 
  '===== PERFORMANCE INDEXES STATUS =====' as debug_info;

-- Show all indexes created for performance
SELECT 
  'Created Indexes' as check_type,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Count indexes by table
SELECT 
  'Index Count by Table' as check_type,
  tablename,
  COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
GROUP BY tablename
ORDER BY index_count DESC;

-- Show index sizes
SELECT 
  'Index Sizes' as check_type,
  schemaname,
  tablename,
  indexname,
  pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;
