-- scripts/011_create_api_keys_table.sql

-- Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  key VARCHAR(255) NOT NULL UNIQUE,
  permissions TEXT[] NOT NULL DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Create api_usage table for tracking
CREATE TABLE IF NOT EXISTS public.api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  endpoint VARCHAR(255) NOT NULL,
  method VARCHAR(10) NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_keys_key ON public.api_keys(key);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON public.api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_api_keys_expires_at ON public.api_keys(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON public.api_keys(created_at);

CREATE INDEX IF NOT EXISTS idx_api_usage_key_id ON public.api_usage(key_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_endpoint ON public.api_usage(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON public.api_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_status_code ON public.api_usage(status_code);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all operations on api_keys" ON public.api_keys FOR ALL USING (true);
CREATE POLICY "Allow all operations on api_usage" ON public.api_usage FOR ALL USING (true);

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_api_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON public.api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_api_keys_updated_at();

-- Insert default API key for testing
INSERT INTO public.api_keys (name, key, permissions) VALUES
('Test API Key', 'sk_test_1234567890abcdef1234567890abcdef', ARRAY['units:read', 'units:write', 'bills:read', 'bills:write', 'files:read', 'files:write', 'maintenance:read', 'maintenance:write', 'parcels:read', 'parcels:write'])
ON CONFLICT (key) DO NOTHING;

-- Insert admin API key
INSERT INTO public.api_keys (name, key, permissions) VALUES
('Admin API Key', 'sk_admin_abcdef1234567890abcdef1234567890', ARRAY['admin', 'units:read', 'units:write', 'units:delete', 'bills:read', 'bills:write', 'bills:delete', 'files:read', 'files:write', 'files:delete', 'maintenance:read', 'maintenance:write', 'maintenance:delete', 'parcels:read', 'parcels:write', 'parcels:delete'])
ON CONFLICT (key) DO NOTHING;
