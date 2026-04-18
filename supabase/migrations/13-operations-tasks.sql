-- 13-operations-tasks.sql
-- Sub-system for task management and operational notifications

-- Tasks Table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'in_progress' | 'completed' | 'cancelled'
    priority TEXT NOT NULL DEFAULT 'medium', -- 'low' | 'medium' | 'high' | 'urgent'
    is_done BOOLEAN DEFAULT FALSE,
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Notifications Table (Phase 03)
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notif_type TEXT NOT NULL, -- 'task_assigned'|'task_due'|'lead_assigned'|'payment_received'|'followup_due'|'trial_expiring'
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned ON tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_lead ON tasks(lead_id);
CREATE INDEX IF NOT EXISTS idx_notifs_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifs_unread ON notifications(user_id) WHERE is_read = FALSE;

-- RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_all_tasks ON tasks
    AS PERMISSIVE FOR ALL TO authenticated
    USING (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
    WITH CHECK (tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));

CREATE POLICY user_all_notifications ON notifications
    AS PERMISSIVE FOR ALL TO authenticated
    USING (user_id = auth.uid() AND tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'))
    WITH CHECK (user_id = auth.uid() AND tenant_id::text = (auth.jwt() -> 'app_metadata' ->> 'tenant_id'));
