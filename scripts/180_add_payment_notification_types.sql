-- Add new notification types for payment system
-- This script updates the notifications table to support new payment-related notification types

-- First, drop the constraint if it exists
DO $$ 
BEGIN
    -- Remove the old constraint
    ALTER TABLE public.notifications 
    DROP CONSTRAINT IF EXISTS notifications_type_check;
END $$;

-- Add new constraint with all notification types
ALTER TABLE public.notifications 
ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
    'payment_due',
    'payment_received',
    'payment_uploaded',
    'payment_confirmed',
    'payment_rejected',
    'payment_pending_review',
    'maintenance_update',
    'announcement',
    'bill_generated'
));

-- Add project_id column for admin notifications (optional, can be null)
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- Create index for project_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_notifications_project_id ON public.notifications(project_id);

