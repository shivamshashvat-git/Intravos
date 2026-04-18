export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface TaskType {
  id: string;
  tenant_id: string;
  assigned_to: string | null;
  lead_id: string | null;
  booking_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  is_done: boolean;
  due_date: string | null;
  due_time: string | null;
  customer_id: string | null;
  created_at: string;
  updated_at: string;
  
  // Joins
  assigned_to_name?: string;
  lead_name?: string;
  lead_destination?: string;
  booking_number?: string;
  booking_title?: string;
  customer_name?: string;
}

export interface TaskFilters {
  status?: string;
  priority?: string;
  assigned_to?: string;
  lead_id?: string;
  booking_id?: string;
  overdue?: boolean;
  search?: string;
  is_done?: boolean;
  customer_id?: string;
}

export interface TaskGrouped {
  overdue: TaskType[];
  today: TaskType[];
  upcoming: TaskType[];
  completed: TaskType[];
}
