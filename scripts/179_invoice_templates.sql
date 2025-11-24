-- Invoice Templates System
-- ระบบแม่แบบใบแจ้งหนี้

-- Invoice Templates Table
CREATE TABLE IF NOT EXISTS public.invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  template_name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) DEFAULT 'invoice', -- 'invoice', 'receipt', 'quote'
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  -- Header Settings
  header_logo_url TEXT,
  header_company_name VARCHAR(255),
  header_address TEXT,
  header_phone VARCHAR(50),
  header_email VARCHAR(255),
  header_tax_id VARCHAR(50),
  
  -- Footer Settings
  footer_text TEXT,
  footer_bank_accounts JSONB, -- Array of bank accounts
  
  -- Layout Settings
  layout_settings JSONB, -- Colors, fonts, spacing, etc.
  
  -- Template HTML (optional, for custom templates)
  template_html TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

-- Template Variables (for dynamic content)
CREATE TABLE IF NOT EXISTS public.template_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.invoice_templates(id) ON DELETE CASCADE,
  variable_key VARCHAR(100) NOT NULL,
  variable_value TEXT,
  variable_type VARCHAR(50) DEFAULT 'text', -- 'text', 'image', 'number', 'date'
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoice_templates_project ON public.invoice_templates(project_id);
CREATE INDEX IF NOT EXISTS idx_invoice_templates_active ON public.invoice_templates(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_invoice_templates_default ON public.invoice_templates(is_default) WHERE is_default = true;
CREATE INDEX IF NOT EXISTS idx_template_variables_template ON public.template_variables(template_id);

-- RLS Policies
ALTER TABLE public.invoice_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_variables ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoice_templates
-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "invoice_templates_select_policy" ON public.invoice_templates;
DROP POLICY IF EXISTS "invoice_templates_insert_policy" ON public.invoice_templates;
DROP POLICY IF EXISTS "invoice_templates_update_policy" ON public.invoice_templates;
DROP POLICY IF EXISTS "invoice_templates_delete_policy" ON public.invoice_templates;

-- Create policies
CREATE POLICY "invoice_templates_select_policy" ON public.invoice_templates
  FOR SELECT USING (true);

CREATE POLICY "invoice_templates_insert_policy" ON public.invoice_templates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "invoice_templates_update_policy" ON public.invoice_templates
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "invoice_templates_delete_policy" ON public.invoice_templates
  FOR DELETE USING (true);

-- RLS Policies for template_variables
-- Drop existing policies first (if they exist)
DROP POLICY IF EXISTS "template_variables_select_policy" ON public.template_variables;
DROP POLICY IF EXISTS "template_variables_insert_policy" ON public.template_variables;
DROP POLICY IF EXISTS "template_variables_update_policy" ON public.template_variables;
DROP POLICY IF EXISTS "template_variables_delete_policy" ON public.template_variables;

-- Create policies
CREATE POLICY "template_variables_select_policy" ON public.template_variables
  FOR SELECT USING (true);

CREATE POLICY "template_variables_insert_policy" ON public.template_variables
  FOR INSERT WITH CHECK (true);

CREATE POLICY "template_variables_update_policy" ON public.template_variables
  FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "template_variables_delete_policy" ON public.template_variables
  FOR DELETE USING (true);

-- Functions
CREATE OR REPLACE FUNCTION update_invoice_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_template_variables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_invoice_templates_updated_at ON public.invoice_templates;
CREATE TRIGGER update_invoice_templates_updated_at
  BEFORE UPDATE ON public.invoice_templates
  FOR EACH ROW EXECUTE FUNCTION update_invoice_templates_updated_at();

DROP TRIGGER IF EXISTS update_template_variables_updated_at ON public.template_variables;
CREATE TRIGGER update_template_variables_updated_at
  BEFORE UPDATE ON public.template_variables
  FOR EACH ROW EXECUTE FUNCTION update_template_variables_updated_at();

-- Initial default template
INSERT INTO public.invoice_templates (
  id,
  template_name,
  template_type,
  is_default,
  is_active,
  header_company_name,
  layout_settings
) VALUES (
  gen_random_uuid(),
  'Template เริ่มต้น',
  'invoice',
  true,
  true,
  'บริษัทของคุณ',
  '{
    "primaryColor": "#1e40af",
    "secondaryColor": "#3b82f6",
    "fontFamily": "Sarabun, sans-serif",
    "fontSize": "14px",
    "lineHeight": "1.6"
  }'::jsonb
) ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.invoice_templates IS 'แม่แบบใบแจ้งหนี้';
COMMENT ON TABLE public.template_variables IS 'ตัวแปรสำหรับใช้ใน template';

