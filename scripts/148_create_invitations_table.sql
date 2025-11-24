-- scripts/148_create_invitations_table.sql
-- Create invitations table for resident account registration

SELECT 
  '===== CREATING INVITATIONS TABLE =====' as debug_info;

-- Create invitations table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  code VARCHAR(16) UNIQUE NOT NULL,
  email VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending', -- pending, used, expired
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_invitations_code ON public.invitations(code);
CREATE INDEX IF NOT EXISTS idx_invitations_unit_id ON public.invitations(unit_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON public.invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON public.invitations(expires_at);

-- Enable Row Level Security
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view invitations for their units" ON public.invitations;
DROP POLICY IF EXISTS "Service role can manage all invitations" ON public.invitations;
DROP POLICY IF EXISTS "Allow all operations on invitations" ON public.invitations;

-- Allow all operations on invitations (controlled by application logic)
CREATE POLICY "Allow all operations on invitations" ON public.invitations
  FOR ALL USING (true) WITH CHECK (true);

-- Verify table creation
SELECT 
  'Table Creation Verification' as check_type,
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'invitations';

SELECT 
  '===== INVITATIONS TABLE CREATED SUCCESSFULLY =====' as debug_info;

