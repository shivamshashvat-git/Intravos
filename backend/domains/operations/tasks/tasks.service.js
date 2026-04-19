import { supabaseAdmin } from '../../../providers/database/supabase.js';
import { softDeleteDirect } from '../../../core/utils/softDelete.js';

class TaskService {
  async listTasks(tenantId, filters) {
    const { status, priority, assigned_to, entity_type, entity_id, search } = filters;

    let query = supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('due_date', { ascending: true, nullsFirst: false });

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (entity_type) query = query.eq('entity_type', entity_type);
    if (entity_id) query = query.eq('entity_id', entity_id);
    if (search) query = query.ilike('title', `%${search}%`);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async createTask(tenantId, userId, payload) {
    // Resolve actual user ID if auth_id provided
    const { data: userRec } = await supabaseAdmin.from('users').select('id').eq('auth_id', userId).single();
    const actualCreatedBy = userRec?.id || userId;

    const { data, error } = await supabaseAdmin
      .from('tasks')
      .insert({
        ...payload,
        tenant_id: tenantId,
        created_by: actualCreatedBy,
        status: payload.status || 'pending',
        priority: payload.priority || 'medium'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTask(tenantId, taskId, payload) {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update(payload)
      .eq('id', taskId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTask(tenantId, taskId, user = null) {
    return await softDeleteDirect({
      table: 'tasks',
      id: taskId,
      tenantId,
      user,
      moduleLabel: 'Task'
    });
  }

  async completeTask(tenantId, taskId) {
    const { data, error } = await supabaseAdmin
      .from('tasks')
      .update({ 
        status: 'completed', 
        completed_at: new Date().toISOString(),
        is_done: true // sync with legacy column if it exists
      })
      .eq('id', taskId)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getAnalytics(tenantId) {
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: tasks, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (error) throw error;

    const total = tasks.length;
    const completedToday = tasks.filter(t => t.status === 'completed' && t.completed_at?.startsWith(today)).length;
    const overdueCount = tasks.filter(t => 
      !['completed', 'cancelled'].includes(t.status) && 
      t.due_date && t.due_date < today
    ).length;

    const pendingByPriority = {
      low: tasks.filter(t => t.status === 'pending' && t.priority === 'low').length,
      medium: tasks.filter(t => t.status === 'pending' && t.priority === 'medium').length,
      high: tasks.filter(t => t.status === 'pending' && t.priority === 'high').length,
      urgent: tasks.filter(t => t.status === 'pending' && t.priority === 'urgent').length
    };

    const last7DaysTasks = tasks.filter(t => new Date(t.created_at) >= sevenDaysAgo);
    const last7DaysCompleted = last7DaysTasks.filter(t => t.status === 'completed').length;
    const completionRate7d = last7DaysTasks.length > 0 ? (last7DaysCompleted / last7DaysTasks.length) * 100 : 0;

    return {
      total_tasks: total,
      completed_today: completedToday,
      overdue_count: overdueCount,
      pending_by_priority: pendingByPriority,
      completion_rate_7d: completionRate7d
    };
  }

  /**
   * IvoBot worker: Find overdue tasks and notify
   */
  async checkOverdueTasks() {
    const todayStr = new Date().toISOString().split('T')[0];

    // Find overdue tasks (due_date < today)
    const { data: overdueTasks, error } = await supabaseAdmin
      .from('tasks')
      .select('*')
      .lt('due_date', todayStr)
      .not('status', 'in', '("completed","cancelled")')
      .or('notified_overdue.is.null,notified_overdue.eq.false');

    if (error) throw error;

    let processedCount = 0;
    for (const task of (overdueTasks || [])) {
      if (task.assigned_to) {
        // Write notification
        await supabaseAdmin.from('notifications').insert({
          tenant_id: task.tenant_id,
          user_id: task.assigned_to,
          notif_type: 'followup_overdue',
          title: 'Operation Node Overdue',
          message: `The task "${task.title}" is overdue since ${task.due_date}. Priority: ${task.priority}.`,
          task_id: task.id
        });

        // Mark as notified
        await supabaseAdmin.from('tasks').update({ notified_overdue: true }).eq('id', task.id);
        processedCount++;
      }
    }

    return processedCount;
  }
}

export default new TaskService();
