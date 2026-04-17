import { supabaseAdmin } from '../../../providers/database/supabase.js';
import logger from '../../../core/utils/logger.js';

/**
 * TaskAutomation
 * Handles the materialization of recurring tasks.
 */
class TaskAutomation {
  /**
   * Scans and generates tasks from recurring blueprints for all tenants.
   * Called by cronService.runDailyMaintenance().
   */
  async materializeTasks() {
    try {
      const { data: recurring, error } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('is_recurring', true)
        .is('deleted_at', null);

      if (error) throw error;

      let count = 0;
      const today = new Date().toISOString().split('T')[0];

      for (const task of recurring || []) {
        // Check if task for today already exists
        const { data: existing } = await supabaseAdmin
          .from('tasks')
          .select('id', { count: 'exact', head: true })
          .eq('parent_task_id', task.id)
          .gte('created_at', `${today}T00:00:00`);

        if (!existing || existing.length === 0) {
          const { error: insertErr } = await supabaseAdmin
            .from('tasks')
            .insert({
              tenant_id: task.tenant_id,
              title: task.title,
              description: task.description,
              assigned_to: task.assigned_to,
              priority: task.priority,
              status: 'pending',
              due_date: today,
              parent_task_id: task.id,
            });

          if (!insertErr) count++;
        }
      }

      logger.info({ count }, '[TaskAutomation] Materialized recurring tasks');
      return { count };
    } catch (err) {
      logger.error({ err: err.message }, '[TaskAutomation] Failed');
      return { count: 0 };
    }
  }
}

export default new TaskAutomation();
