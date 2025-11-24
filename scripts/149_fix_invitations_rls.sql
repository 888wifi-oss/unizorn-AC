-- scripts/149_fix_invitations_rls.sql
-- Fix RLS policies for invitations table

SELECT 
  '===== FIXING INVITATIONS RLS POLICIES =====' as debug_info;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view invitations for their units" ON public.invitations;
DROP POLICY IF EXISTS "Service role can manage all invitations" ON public.invitations;
DROP POLICY IF EXISTS "Allow all operations on invitations" ON public.invitations;

-- Create new policy that allows all operations
CREATE POLICY "Allow all operations on invitations" ON public.invitations
  FOR ALL USING (true) WITH CHECK (true);

-- Verify policies
SELECT 
  'Policy Verification' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'invitations';

SELECT 
  '===== INVITATIONS RLS POLICIES FIXED SUCCESSFULLY =====' as debug_info;

