-- scripts/009_create_parcels_table.sql

-- Create parcels table
CREATE TABLE IF NOT EXISTS public.parcels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number VARCHAR(20) NOT NULL REFERENCES public.units(unit_number) ON DELETE CASCADE,
  recipient_name VARCHAR(255) NOT NULL,
  courier_company VARCHAR(100) NOT NULL,
  tracking_number VARCHAR(100),
  parcel_image_url TEXT,
  parcel_description TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'picked_up', 'expired')),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  picked_up_at TIMESTAMPTZ,
  picked_up_by VARCHAR(255),
  picked_up_method VARCHAR(50) CHECK (picked_up_method IN ('qr_code', 'id_card', 'phone', 'unit_code')),
  staff_received_by VARCHAR(255) NOT NULL,
  staff_delivered_by VARCHAR(255),
  digital_signature TEXT,
  delivery_photo_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_parcels_unit_number ON public.parcels(unit_number);
CREATE INDEX IF NOT EXISTS idx_parcels_status ON public.parcels(status);
CREATE INDEX IF NOT EXISTS idx_parcels_received_at ON public.parcels(received_at);
CREATE INDEX IF NOT EXISTS idx_parcels_expires_at ON public.parcels(expires_at);
CREATE INDEX IF NOT EXISTS idx_parcels_courier_company ON public.parcels(courier_company);
CREATE INDEX IF NOT EXISTS idx_parcels_tracking_number ON public.parcels(tracking_number);

-- Enable RLS
ALTER TABLE public.parcels ENABLE ROW LEVEL SECURITY;

-- Create policies for parcels
CREATE POLICY "Allow all operations on parcels" ON public.parcels FOR ALL USING (true);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_parcels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for parcels
CREATE TRIGGER update_parcels_updated_at 
  BEFORE UPDATE ON public.parcels 
  FOR EACH ROW 
  EXECUTE FUNCTION update_parcels_updated_at();

-- Grant permissions
GRANT ALL ON public.parcels TO authenticated;
GRANT ALL ON public.parcels TO anon;
GRANT ALL ON public.parcels TO service_role;

-- Create parcel_authorizations table for proxy pickup
CREATE TABLE IF NOT EXISTS public.parcel_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcel_id UUID NOT NULL REFERENCES public.parcels(id) ON DELETE CASCADE,
  authorized_by_unit_number VARCHAR(20) NOT NULL REFERENCES public.units(unit_number) ON DELETE CASCADE,
  authorized_person_name VARCHAR(255) NOT NULL,
  authorized_person_phone VARCHAR(20),
  authorized_person_id_card VARCHAR(20),
  authorization_code VARCHAR(10) NOT NULL,
  is_used BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '3 days')
);

-- Create indexes for parcel_authorizations
CREATE INDEX IF NOT EXISTS idx_parcel_auth_parcel_id ON public.parcel_authorizations(parcel_id);
CREATE INDEX IF NOT EXISTS idx_parcel_auth_unit_number ON public.parcel_authorizations(authorized_by_unit_number);
CREATE INDEX IF NOT EXISTS idx_parcel_auth_code ON public.parcel_authorizations(authorization_code);
CREATE INDEX IF NOT EXISTS idx_parcel_auth_is_used ON public.parcel_authorizations(is_used);

-- Enable RLS for parcel_authorizations
ALTER TABLE public.parcel_authorizations ENABLE ROW LEVEL SECURITY;

-- Create policies for parcel_authorizations
CREATE POLICY "Allow all operations on parcel_authorizations" ON public.parcel_authorizations FOR ALL USING (true);

-- Grant permissions for parcel_authorizations
GRANT ALL ON public.parcel_authorizations TO authenticated;
GRANT ALL ON public.parcel_authorizations TO anon;
GRANT ALL ON public.parcel_authorizations TO service_role;
