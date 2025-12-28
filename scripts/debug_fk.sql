-- Check the foreign key definition for units.user_id
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    a.attname AS column_name,
    confrelid::regclass AS foreign_table_name,
    af.attname AS foreign_column_name
FROM
    pg_constraint AS c
JOIN
    pg_attribute AS a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN
    pg_attribute AS af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE
    c.conrelid = 'units'::regclass
    AND a.attname = 'user_id';

-- Check if the user really exists in auth.users AND public.users
SELECT id, email FROM auth.users WHERE id = '62d40c1a-9960-47d4-8ab8-f6a92b5fa4c0';
SELECT id, email FROM public.users WHERE id = '62d40c1a-9960-47d4-8ab8-f6a92b5fa4c0';
