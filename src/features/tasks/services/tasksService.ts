import { supabase } from '@/core/lib/supabase';
import { TaskType, TaskFilters } from '@/features/tasks/types/task';

export const tasksService = {
  async getTasks(tenantId: string, filters: TaskFilters = {}) {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        assigned:users!tasks_assigned_to_fkey(name, avatar_url),
        lead:leads!tasks_lead_id_fkey(customer_name, destination),
        booking:bookings!tasks_booking_id_fkey(booking_number, title),
        customer:customers!tasks_customer_id_fkey(name)
      `)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null);

    if (filters.status && filters.status !== 'all') query = query.eq('status', filters.status);
    if (filters.priority && filters.priority !== 'all') query = query.eq('priority', filters.priority);
    if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to);
    if (filters.lead_id) query = query.eq('lead_id', filters.lead_id);
    if (filters.booking_id) query = query.eq('booking_id', filters.booking_id);
    if (filters.customer_id) query = query.eq('customer_id', filters.customer_id);
    if (filters.is_done !== undefined) query = query.eq('is_done', filters.is_done);
    if (filters.search) query = query.ilike('title', `%${filters.search}%`);

    if (filters.overdue) {
      query = query.lt('due_date', new Date().toISOString()).eq('is_done', false);
    }

    const { data, error } = await query
      .order('is_done', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false });

    if (error) throw error;
    
    return data.map(t => ({
      ...t,
      assigned_to_name: t.assigned?.name,
      lead_name: t.lead?.customer_name,
      lead_destination: t.lead?.destination,
      booking_number: t.booking?.booking_number,
      booking_title: t.booking?.title,
      customer_name: t.customer?.name
    })) as TaskType[];
  },

  async createTask(data: Partial<TaskType>) {
    const { data: task, error } = await supabase.from('tasks').insert(data).select().single();
    if (error) throw error;
    
    // Fire-and-forget notification if assigned to another user
    if (data.assigned_to && data.assigned_to !== (await supabase.auth.getUser()).data.user?.id) {
       supabase.from('notifications').insert({
         tenant_id: data.tenant_id,
         user_id: data.assigned_to,
         notif_type: 'task_assigned',
         title: 'New task assigned to you',
         message: data.title,
         task_id: task.id,
         lead_id: data.lead_id
       }).then();
    }
    return task as TaskType;
  },

  async updateTask(id: string, data: Partial<TaskType>) {
    const { error } = await supabase.from('tasks').update({ ...data, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },

  async completeTask(id: string) {
    const { error } = await supabase.from('tasks').update({ 
      is_done: true, 
      status: 'completed',
      updated_at: new Date().toISOString() 
    }).eq('id', id);
    if (error) throw error;
  },

  async deleteTask(id: string) {
    const { error } = await supabase.from('tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  }
};
