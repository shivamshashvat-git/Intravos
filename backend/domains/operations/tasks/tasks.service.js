import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';
import { pushTaskReminder } from '../../../providers/communication/pushService.js';

/**
 * TaskService — Productivity & Internal Workflow Orchestrator
 */
class TaskService {
  /**
   * List tasks for a tenant with rich filtering
   */
  async listTasks(tenantId, filters = {}) {
    const { lead_id, assigned_to, is_done, page = 1, limit = 50 } = filters;
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let query = supabaseAdmin
      .from('tasks')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('due_date', { ascending: true })
      .range(offset, offset + parseInt(limit, 10) - 1);

    if (lead_id) query = query.eq('lead_id', lead_id);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (is_done !== undefined) query = query.eq('is_done', is_done === 'true');

    const { data, error, count } = await query;
    if (error) throw error;

    return { tasks: data || [], total: count, page: parseInt(page, 10) };
  }

  /**
   * Register a new actionable task record
   */
  async createTask(tenantId, userId, payload) {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        ...payload,
        tenant_id: tenantId
      })
      .select()
      .single();

    if (error) throw error;

    // Async push notification for collaborative tasks
    if (data.assigned_to && data.assigned_to !== userId) {
      pushTaskReminder(tenantId, data.assigned_to, data).catch(() => {});
    }

    return data;
  }

  /**
   * Modify task state or content
   */
  async updateTask(tenantId, taskId, updates) {
    const patch = { ...updates };
    delete patch.id;
    delete patch.tenant_id;
    delete patch.deleted_at;
    delete patch.deleted_by;

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(patch)
      .eq('id', taskId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Soft-delete a task record
   */
  async deleteTask(tenantId, userId, taskId) {
    return await softDeleteDirect({
      table: 'tasks',
      id: taskId,
      tenantId,
      user: { id: userId },
      moduleLabel: 'Task'
    });
  }
}

export default new TaskService();
