-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('payment_due', 'payment_received', 'maintenance_update', 'announcement', 'bill_generated')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unit_id ON public.notifications(unit_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications" ON public.notifications 
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all notifications" ON public.notifications 
  FOR ALL USING (auth.role() = 'service_role');

-- Create function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for notifications
CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON public.notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to clean up expired notifications
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS void AS $$
BEGIN
    DELETE FROM public.notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to send payment due notifications
CREATE OR REPLACE FUNCTION send_payment_due_notifications()
RETURNS void AS $$
DECLARE
    bill_record RECORD;
    notification_count INTEGER := 0;
BEGIN
    -- Get bills that are due in 3 days and haven't been paid
    FOR bill_record IN 
        SELECT 
            b.id,
            b.unit_id,
            b.month,
            b.due_date,
            b.total,
            u.user_id,
            u.unit_number,
            u.owner_name
        FROM public.bills b
        INNER JOIN public.units u ON b.unit_id = u.id
        WHERE b.status = 'pending'
        AND b.due_date <= (CURRENT_DATE + INTERVAL '3 days')
        AND u.user_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM public.notifications n
            WHERE n.user_id = u.user_id
            AND n.type = 'payment_due'
            AND n.data->>'bill_id' = b.id::text
            AND n.created_at > (NOW() - INTERVAL '1 day')
        )
    LOOP
        -- Insert notification
        INSERT INTO public.notifications (
            user_id,
            unit_id,
            type,
            title,
            message,
            data,
            is_read
        ) VALUES (
            bill_record.user_id,
            bill_record.unit_id,
            'payment_due',
            'แจ้งเตือนการชำระเงิน',
            'บิลสำหรับเดือน ' || bill_record.month || ' ครบกำหนดชำระในวันที่ ' || 
            TO_CHAR(bill_record.due_date, 'DD/MM/YYYY') || ' กรุณาชำระเงินภายในกำหนด',
            jsonb_build_object(
                'bill_id', bill_record.id,
                'amount', bill_record.total,
                'due_date', bill_record.due_date,
                'unit_number', bill_record.unit_number
            ),
            false
        );
        
        notification_count := notification_count + 1;
    END LOOP;
    
    -- Log the result
    RAISE NOTICE 'Created % payment due notifications', notification_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to send payment received notifications
CREATE OR REPLACE FUNCTION send_payment_received_notification(
    p_user_id UUID,
    p_unit_id UUID,
    p_bill_month TEXT,
    p_amount NUMERIC
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.notifications (
        user_id,
        unit_id,
        type,
        title,
        message,
        data,
        is_read
    ) VALUES (
        p_user_id,
        p_unit_id,
        'payment_received',
        'ยืนยันการรับชำระเงิน',
        'ได้รับชำระเงินสำหรับบิลเดือน ' || p_bill_month || ' จำนวน ' || 
        TO_CHAR(p_amount, 'FM999,999,999.00') || ' บาทแล้ว ขอบคุณครับ',
        jsonb_build_object(
            'bill_month', p_bill_month,
            'amount', p_amount
        ),
        false
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to send maintenance update notifications
CREATE OR REPLACE FUNCTION send_maintenance_update_notification(
    p_user_id UUID,
    p_unit_id UUID,
    p_title TEXT,
    p_status TEXT
)
RETURNS void AS $$
BEGIN
    INSERT INTO public.notifications (
        user_id,
        unit_id,
        type,
        title,
        message,
        data,
        is_read
    ) VALUES (
        p_user_id,
        p_unit_id,
        'maintenance_update',
        'อัปเดตสถานะงานซ่อม',
        'งานซ่อมเรื่อง ''' || p_title || ''' มีการอัปเดตสถานะเป็น ''' || p_status || '''',
        jsonb_build_object(
            'title', p_title,
            'status', p_status
        ),
        false
    );
END;
$$ LANGUAGE plpgsql;

-- Create function to send announcement notifications
CREATE OR REPLACE FUNCTION send_announcement_notification(
    p_title TEXT,
    p_content TEXT
)
RETURNS void AS $$
DECLARE
    unit_record RECORD;
BEGIN
    -- Send notification to all units with user_id
    FOR unit_record IN 
        SELECT user_id, id FROM public.units WHERE user_id IS NOT NULL
    LOOP
        INSERT INTO public.notifications (
            user_id,
            unit_id,
            type,
            title,
            message,
            data,
            is_read
        ) VALUES (
            unit_record.user_id,
            unit_record.id,
            'announcement',
            'ประกาศใหม่',
            'มีประกาศใหม่: ' || p_title,
            jsonb_build_object(
                'title', p_title,
                'content', p_content
            ),
            false
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;
