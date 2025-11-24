-- =====================================================
-- Maintenance Schedule & Email Notifications Setup
-- =====================================================
-- Created: 2025-01-28
-- Purpose: Add appointment scheduling and email notifications to maintenance system
-- =====================================================

-- Step 1: Add schedule fields to maintenance_requests
-- =====================================================
ALTER TABLE maintenance_requests 
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scheduled_duration INTEGER DEFAULT 60, -- minutes
ADD COLUMN IF NOT EXISTS appointment_type TEXT DEFAULT 'normal'; -- normal, urgent, emergency

-- Step 2: Create email_notifications table
-- =====================================================
CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  maintenance_request_id UUID REFERENCES maintenance_requests(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL, -- status_change, appointment_created, appointment_reminder
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create email_preferences table
-- =====================================================
CREATE TABLE IF NOT EXISTS email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  notify_on_status_change BOOLEAN DEFAULT TRUE,
  notify_on_appointment BOOLEAN DEFAULT TRUE,
  notify_on_reminder BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create indexes for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_email_notifications_maintenance_request 
  ON email_notifications(maintenance_request_id);

CREATE INDEX IF NOT EXISTS idx_email_notifications_sent_at 
  ON email_notifications(sent_at);

CREATE INDEX IF NOT EXISTS idx_email_preferences_unit 
  ON email_preferences(unit_number);

CREATE INDEX IF NOT EXISTS idx_maintenance_requests_scheduled_at 
  ON maintenance_requests(scheduled_at);

-- Step 5: Create trigger to update email_preferences.updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_email_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_email_preferences_updated_at ON email_preferences;
CREATE TRIGGER trigger_update_email_preferences_updated_at
  BEFORE UPDATE ON email_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_email_preferences_updated_at();

-- Step 6: Create view for maintenance schedule
-- =====================================================
CREATE OR REPLACE VIEW maintenance_schedule_view AS
SELECT 
  mr.id,
  mr.title,
  mr.status,
  mr.detailed_status,
  mr.priority,
  mr.scheduled_at,
  mr.scheduled_duration,
  mr.appointment_type,
  mr.reported_by,
  mr.created_at,
  u.unit_number,
  u.owner_name,
  u.owner_email,
  CASE 
    WHEN mr.scheduled_at IS NULL THEN 'not_scheduled'
    WHEN mr.scheduled_at > NOW() THEN 'upcoming'
    WHEN mr.scheduled_at <= NOW() AND mr.status != 'completed' THEN 'overdue'
    ELSE 'past'
  END AS schedule_status
FROM maintenance_requests mr
LEFT JOIN units u ON mr.unit_id = u.id
WHERE mr.scheduled_at IS NOT NULL
ORDER BY mr.scheduled_at ASC;

-- Step 7: Add email template records (optional)
-- =====================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO email_templates (template_name, subject, body) VALUES
  ('maintenance_status_change', 
   'การแจ้งซ่อม #{{ID}} - สถานะเปลี่ยนเป็น {{STATUS}}',
   'เรียนคุณ {{NAME}},\n\nการแจ้งซ่อมของคุณ #{{ID}} - {{TITLE}}\nสถานะเปลี่ยนเป็น: {{STATUS}}\n\nรายละเอียด: {{DESCRIPTION}}\n\nขอบคุณค่ะ\n{{PROJECT_NAME}}'),
  ('maintenance_appointment_created',
   'นัดหมายการซ่อม #{{ID}}',
   'เรียนคุณ {{NAME}},\n\nได้นัดหมายการซ่อมเรื่อง #{{ID}} - {{TITLE}}\nวันที่: {{DATE}}\nเวลา: {{TIME}}\n\nขอบคุณค่ะ\n{{PROJECT_NAME}}'),
  ('maintenance_appointment_reminder',
   'เตือนนัดหมายการซ่อม #{{ID}} - วันพรุ่งนี้',
   'เรียนคุณ {{NAME}},\n\nเตือนความจำ:\nมีการนัดหมายการซ่อม #{{ID}} - {{TITLE}}\nพรุ่งนี้: {{DATE}}\nเวลา: {{TIME}}\n\nขอบคุณค่ะ\n{{PROJECT_NAME}}')
ON CONFLICT (template_name) DO NOTHING;

CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_email_templates_updated_at ON email_templates;
CREATE TRIGGER trigger_update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Step 8: Grant permissions (adjust as needed)
-- =====================================================
-- Add RLS policies if needed
-- ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Summary
-- =====================================================
-- ✅ Added scheduled_at, scheduled_duration, appointment_type to maintenance_requests
-- ✅ Created email_notifications table
-- ✅ Created email_preferences table
-- ✅ Created email_templates table
-- ✅ Created indexes for performance
-- ✅ Created maintenance_schedule_view
-- ✅ All tables ready for use

