-- Optimize notifications table with composite indexes for unread counts

-- Index for getUnreadUnitNotificationCount: WHERE unit_id = ? AND is_read = false
CREATE INDEX IF NOT EXISTS idx_notifications_unit_id_is_read 
ON public.notifications(unit_id, is_read);

-- Index for getUnreadAdminNotificationCount: WHERE unit_id IS NULL AND is_read = false AND project_id = ?
-- Note: unit_id IS NULL is a partial index condition usually, but here we can just index project_id and is_read
CREATE INDEX IF NOT EXISTS idx_notifications_project_id_is_read 
ON public.notifications(project_id, is_read)
WHERE unit_id IS NULL;

-- Index for getUserNotifications unread count (if needed later): WHERE user_id = ? AND is_read = false
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_is_read 
ON public.notifications(user_id, is_read);

-- Ensure project_id index exists (it should, but just in case)
CREATE INDEX IF NOT EXISTS idx_notifications_project_id 
ON public.notifications(project_id);

-- Analyze table to update statistics
ANALYZE public.notifications;
