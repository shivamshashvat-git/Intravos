import { TaskType, TaskFilters } from '@/features/tasks/types/task';
import { apiClient } from '@/core/lib/apiClient';

export const tasksService = {
  async getTasks(tenantId: string, filters: TaskFilters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.assigned_to) params.append('assigned_to', filters.assigned_to);
    if (filters.search) params.append('search', filters.search);
    if (filters.entity_type) params.append('entity_type', filters.entity_type);
    if (filters.entity_id) params.append('entity_id', filters.entity_id);

    const res = await apiClient(`/api/v1/tasks?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    const result = await res.json();
    return result.data || [];
  },

  async createTask(data: Partial<TaskType>) {
    const res = await apiClient(`/api/v1/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create task');
    }
    const result = await res.json();
    return result.data?.task || result.data;
  },

  async updateTask(id: string, data: Partial<TaskType>) {
    const res = await apiClient(`/api/v1/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update task');
    }
    const result = await res.json();
    return result.data?.task || result.data;
  },

  async completeTask(id: string) {
    const res = await apiClient(`/api/v1/tasks/${id}/complete`, {
      method: 'PATCH'
    });
    if (!res.ok) throw new Error('Failed to complete task');
  },

  async deleteTask(id: string) {
    const res = await apiClient(`/api/v1/tasks/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Failed to delete task');
  },

  async getAnalytics() {
    const res = await apiClient(`/api/v1/tasks/analytics`);
    if (!res.ok) throw new Error('Failed to fetch task analytics');
    const result = await res.json();
    return result.data;
  }
};
