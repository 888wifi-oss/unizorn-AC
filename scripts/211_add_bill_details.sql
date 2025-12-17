-- Add description and reference_number columns to bills table
ALTER TABLE public.bills 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS reference_number TEXT;

-- Create index for reference_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_bills_reference_number ON public.bills(reference_number);
