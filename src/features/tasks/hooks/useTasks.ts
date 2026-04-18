import { useState, useEffect, useCallback, useMemo } from 'react';
import { TaskType, TaskFilters, TaskGrouped } from '@/features/tasks/types/task';
import { tasksService } from '@/features/tasks/services/tasksService';
import { useAuth } from '@/core/hooks/useAuth';
import { toast } from 'sonner';

export function useTasks(initialFilters: TaskFilters = {}) {
  const { tenant, user } = useAuth();
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>(initialFilters);
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list');

  const fetchTasks = useCallback(async () => {
    if (!tenant?.id) return;
    setIsLoading(true);
    try {
      // Handle My Tasks filter logic
      const activeFilters = { ...filters };
      if (filters.assigned_to === 'mine') {
        activeFilters.assigned_to = user?.id;
      } else if (filters.assigned_to === 'unassigned') {
        activeFilters.assigned_to = undefined; // Handled by service if needed or select null
      }

      const data = await tasksService.getTasks(tenant.id, activeFilters);
      
      // Auto-flag overdue client-side
      const today = new Date().toISOString().split('T')[0];
      const processed = data.map(t => {
        const isOverdue = t.due_date && t.due_date < today && !t.is_done && t.status !== 'cancelled';
        return isOverdue ? { ...t, is_overdue: true } : t;
      });

      setTasks(processed as any);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [tenant?.id, user?.id, filters]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const groupedTasks = useMemo((): TaskGrouped => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      overdue: tasks.filter(t => (t as any).is_overdue),
      today: tasks.filter(t => !t.is_done && t.due_date === today),
      upcoming: tasks.filter(t => !t.is_done && !(t as any).is_overdue && t.due_date !== today),
      completed: tasks.filter(t => t.is_done)
    };
  }, [tasks]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      dueToday: tasks.filter(t => !t.is_done && t.due_date === today).length,
      overdue: tasks.filter(t => (t as any).is_overdue).length,
      completedToday: tasks.filter(t => t.is_done && t.updated_at?.startsWith(today)).length,
      totalPending: tasks.filter(t => !t.is_done).length,
      myTasksCount: tasks.filter(t => t.assigned_to === user?.id && !t.is_done).length
    };
  }, [tasks, user?.id]);

  const toggleComplete = async (task: TaskType) => {
    const newIsDone = !task.is_done;
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, is_done: newIsDone, status: newIsDone ? 'completed' : 'pending' } : t));
    
    if (newIsDone) {
       toast.success('Task marked done. Undo?', {
         action: {
           label: 'Undo',
           onClick: () => toggleComplete({ ...task, is_done: true } as any) // Toggle back
         },
         duration: 5000
       });
    }

    try {
      if (newIsDone) {
        await tasksService.completeTask(task.id);
      } else {
        await tasksService.updateTask(task.id, { is_done: false, status: 'pending' });
      }
      // Re-fetch to ensure sync after 5s or just trust optimistic
    } catch (e) {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
      toast.error('Failed to update task');
    }
  };

  const quickAdd = async (title: string) => {
     if (!tenant?.id || !user?.id) return;
     const newTask: Partial<TaskType> = {
       tenant_id: tenant.id,
       assigned_to: user.id,
       title,
       status: 'pending',
       priority: 'medium',
       is_done: false
     };
     
     // Optimistic add
     const tempId = Math.random().toString();
     setTasks(prev => [{ ...newTask, id: tempId, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as TaskType, ...prev]);
     
     try {
       await tasksService.createTask(newTask);
       fetchTasks();
     } catch (e) {
       setTasks(prev => prev.filter(t => t.id !== tempId));
     }
  };

  return {
    tasks,
    groupedTasks,
    stats,
    isLoading,
    filters,
    setFilters,
    viewMode,
    setViewMode,
    toggleComplete,
    quickAdd,
    refresh: fetchTasks
  };
}
