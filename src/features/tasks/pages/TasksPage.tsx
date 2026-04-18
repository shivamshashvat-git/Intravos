import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  CheckSquare, Plus, Search, Filter, Layout, List as ListIcon, 
  Calendar, Clock, AlertTriangle, CheckCircle, MoreVertical,
  User, Briefcase, ChevronDown, ChevronRight, History, Trash2, Edit3, Rocket, Users
} from 'lucide-react';
import { useTasks } from '@/features/tasks/hooks/useTasks';
import { TaskType, TaskStatus } from '@/features/tasks/types/task';
import { CreateTaskDrawer } from '@/features/tasks/components/CreateTaskDrawer';
import { clsx } from 'clsx';
import { timeAgo } from '@/utils/time';

export const TasksPage: React.FC = () => {
  const { 
    tasks, groupedTasks, stats, isLoading, filters, setFilters, 
    viewMode, setViewMode, toggleComplete, quickAdd, refresh 
  } = useTasks();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [quickAddVal, setQuickAddVal] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickAddVal.trim()) return;
    quickAdd(quickAddVal);
    setQuickAddVal('');
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('taskId', id);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    const id = e.dataTransfer.getData('taskId');
    // Actual update logic would be here
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight uppercase italic flex items-center gap-3">
               <CheckSquare className="w-8 h-8 text-indigo-600" /> Operational Board
            </h1>
            <p className="text-slate-500 font-medium italic">Executing high-velocity travel operations nodes</p>
         </div>
         <button 
           onClick={() => { setEditingTask(null); setIsDrawerOpen(true); }}
           className="px-8 py-3 bg-slate-900 text-white font-black rounded-xl text-xs uppercase italic shadow-xl shadow-slate-100 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
         >
           <Plus className="w-4 h-4 text-indigo-400" /> Deploy Task Node
         </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
           { label: 'Due Today', value: stats.dueToday, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
           { label: 'Overdue Nodes', value: stats.overdue, color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle },
           { label: 'Completed Today', value: stats.completedToday, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle },
           { label: 'Pending Stack', value: stats.totalPending, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: History }
         ].map((s, i) => (
           <div key={i} className="bg-white p-5 rounded-3xl border border-slate-200 flex items-center gap-4 hover:shadow-lg transition-all">
              <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center", s.bg)}><s.icon className={clsx("w-6 h-6", s.color)} /></div>
              <div>
                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">{s.label}</p>
                 <h3 className="text-2xl font-black text-slate-900">{s.value}</h3>
              </div>
           </div>
         ))}
      </div>

      {/* View Toggle & Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
         <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0 overflow-x-auto no-scrollbar">
            {(['all', 'mine', 'unassigned'] as const).map(f => (
              <button 
                key={f}
                onClick={() => setFilters({...filters, assigned_to: f === 'all' ? undefined : f})}
                className={clsx(
                  "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  (filters.assigned_to === f || (f === 'all' && !filters.assigned_to)) ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400"
                )}
              >
                {f === 'mine' ? `My Tasks (${stats.myTasksCount})` : f}
              </button>
            ))}
         </div>
         <div className="flex-1 relative w-full group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input 
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-50 font-medium text-sm italic" 
              placeholder="Search tasks or project references..." 
              value={filters.search || ''}
              onChange={e => setFilters({...filters, search: e.target.value})}
            />
         </div>
         <div className="flex bg-slate-100 p-1.5 rounded-2xl shrink-0">
            <button 
              onClick={() => setViewMode('list')}
              className={clsx("p-2 rounded-xl transition-all", viewMode === 'list' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
            ><ListIcon className="w-5 h-5" /></button>
            <button 
              onClick={() => setViewMode('board')}
              className={clsx("p-2 rounded-xl transition-all", viewMode === 'board' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
            ><Layout className="w-5 h-5" /></button>
         </div>
      </div>

      {viewMode === 'list' ? (
        <div className="space-y-10">
           {/* Quick Add */}
           <form onSubmit={handleQuickAdd} className="flex gap-2">
              <input 
                className="flex-1 px-6 py-4 bg-indigo-50/30 border border-indigo-100 rounded-[1.5rem] text-sm font-bold italic focus:bg-white focus:ring-4 focus:ring-indigo-50 outline-none transition-all"
                placeholder="➕ Quick Add Operation Node... (Press Enter)" 
                value={quickAddVal}
                onChange={e => setQuickAddVal(e.target.value)}
              />
              <button type="submit" className="px-8 bg-slate-900 text-white font-black rounded-2xl text-[10px] uppercase italic">Add Node</button>
           </form>

           {/* Overdue Section */}
           {groupedTasks.overdue.length > 0 && <TaskSection title="Overdue Blockers" tasks={groupedTasks.overdue} color="text-red-500" decorate="decoration-red-200" onToggle={toggleComplete} onEdit={setEditingTask} />}
           
           {/* Today Section */}
           {groupedTasks.today.length > 0 && <TaskSection title="Operational Today" tasks={groupedTasks.today} color="text-amber-600" decorate="decoration-amber-200" onToggle={toggleComplete} onEdit={setEditingTask} />}
           
           {/* Upcoming Section */}
           <TaskSection title="Upcoming Sequence" tasks={groupedTasks.upcoming} color="text-slate-900" onToggle={toggleComplete} onEdit={setEditingTask} />

           {/* Completed Section */}
           <div>
              <button onClick={() => setShowCompleted(!showCompleted)} className="px-6 py-2 bg-slate-50 text-slate-400 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-100">
                 {showCompleted ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                 {showCompleted ? 'Hide Archive' : 'Show Archive'}
              </button>
              {showCompleted && (
                 <div className="mt-8">
                    <TaskSection title="Archive Ledger" tasks={groupedTasks.completed} color="text-slate-300" onToggle={toggleComplete} onEdit={setEditingTask} />
                 </div>
              )}
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[600px] overflow-x-auto pb-10">
           {(['pending', 'in_progress', 'completed', 'cancelled'] as TaskStatus[]).map(status => (
             <div key={status} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, status)} className="space-y-6 min-w-[300px]">
                <div className="flex items-center justify-between px-2">
                   <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <div className={clsx("w-2 h-2 rounded-full", status === 'pending' ? "bg-slate-300" : status === 'in_progress' ? "bg-blue-500" : status === 'completed' ? "bg-emerald-500" : "bg-red-500")}></div>
                      {status.replace('_', ' ')}
                   </h4>
                   <span className="bg-slate-100 px-2 py-0.5 rounded text-[8px] font-black text-slate-500">{tasks.filter(t => t.status === status).length}</span>
                </div>
                <div className="space-y-4 bg-slate-50/50 p-4 rounded-[2.5rem] min-h-[500px] border border-slate-100/50">
                   {tasks.filter(t => t.status === status).map(v => (
                      <div 
                        key={v.id} 
                        draggable 
                        onDragStart={(e) => handleDragStart(e, v.id)}
                        className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-grab active:cursor-grabbing group"
                      >
                         <p className={clsx("text-xs font-black italic uppercase leading-tight mb-3", v.is_done && "line-through text-slate-300")}>{v.title}</p>
                         <div className="flex flex-wrap gap-2 mb-4">
                            <span className={clsx(
                               "px-2 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-widest border",
                               v.priority === 'urgent' ? "bg-red-50 text-red-600 border-red-100" : 
                               v.priority === 'high' ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-slate-50 text-slate-400"
                            )}>{v.priority}</span>
                            {v.due_date && <span className="text-[8px] font-bold text-slate-400 flex items-center gap-1 font-mono uppercase italic"><Clock className="w-2.5 h-2.5" /> {timeAgo(v.due_date)}</span>}
                         </div>
                         <div className="flex items-center justify-between">
                            <div className="flex -space-x-2">
                               <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-[8px] font-black text-white border-2 border-white shadow-sm ring-1 ring-slate-100">
                                  {v.assigned_to_name?.slice(0, 2).toUpperCase() || '??'}
                               </div>
                            </div>
                            <button onClick={() => setEditingTask(v)} className="p-1.5 text-slate-200 hover:text-slate-900 opacity-0 group-hover:opacity-100 transition-all"><Edit3 className="w-3.5 h-3.5" /></button>
                         </div>
                      </div>
                   ))}
                   {status === 'pending' && (
                      <button 
                        onClick={() => setIsDrawerOpen(true)}
                        className="w-full py-8 border-2 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 group hover:border-indigo-200 transition-all"
                      >
                         <Plus className="w-6 h-6 text-slate-200 group-hover:text-indigo-400 transition-colors" />
                         <span className="text-[8px] font-black uppercase text-slate-200 group-hover:text-indigo-600 transition-colors">Deploy Root Node</span>
                      </button>
                   )}
                </div>
             </div>
           ))}
        </div>
      )}

      {isDrawerOpen && <CreateTaskDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} onSuccess={refresh} />}
      {editingTask && <CreateTaskDrawer isOpen={!!editingTask} onClose={() => setEditingTask(null)} onSuccess={refresh} initialData={editingTask} />}
    </div>
  );
};

const TaskSection = ({ title, tasks, color, decorate = '', onToggle, onEdit }: any) => {
  const navigate = useNavigate();
  
  return (
    <section className="space-y-6">
       <h3 className={clsx("text-[10px] font-black uppercase tracking-[0.2em] underline underline-offset-8 decoration-2 mb-8", color, decorate)}>{title}</h3>
       <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm shadow-slate-100">
          <div className="divide-y divide-slate-50 italic">
             {tasks.length === 0 ? (
               <div className="p-12 text-center text-[10px] font-black uppercase text-slate-200 tracking-[0.5em] italic">No active nodes in this sequence</div>
             ) : (
               tasks.map((v: TaskType) => (
                 <div key={v.id} className="p-6 md:p-8 hover:bg-slate-50/50 transition-all group flex items-start gap-8">
                    <button 
                      onClick={() => onToggle(v)}
                      className={clsx(
                        "w-8 h-8 rounded-xl border-2 shrink-0 transition-all flex items-center justify-center",
                        v.is_done ? "bg-emerald-500 border-emerald-500" : "bg-white border-slate-200 hover:border-indigo-600 shadow-sm"
                      )}
                    >
                       {v.is_done && <CheckCircle className="w-4 h-4 text-white" />}
                    </button>
                    <div className="flex-1 space-y-3 font-bold">
                       <div className="flex items-center gap-3">
                          {(v as any).is_overdue && <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_12px_rgba(239,68,68,1)]" />}
                          <p className={clsx("text-lg font-black italic uppercase leading-tight transition-all", v.is_done ? "text-slate-200 line-through decoration-slate-300" : "text-slate-900")}>{v.title}</p>
                       </div>
                       <div className="flex flex-wrap items-center gap-6">
                          <span className={clsx(
                             "px-2 py-0.5 rounded-[4px] text-[8px] font-black uppercase tracking-widest border",
                             v.priority === 'urgent' ? "bg-red-50 text-red-600 border-red-100 shadow-sm" :
                             v.is_done ? "bg-slate-50 text-slate-300" : "bg-blue-50 text-blue-600 border-blue-100"
                          )}>{v.priority} Node</span>
                          {v.due_date && <span className={clsx("text-[9px] font-black uppercase font-mono italic", (v as any).is_overdue ? "text-red-500" : "text-slate-400")}>{v.due_time ? `${v.due_time} • ` : ''}{timeAgo(v.due_date)}</span>}
                          
                          {v.lead_id && (
                            <Link to={`/leads/${v.lead_id}`} className="flex items-center gap-2 group/lead hover:bg-indigo-50 px-2 py-1 rounded-lg transition-all border border-transparent hover:border-indigo-100">
                               <User className="w-3 h-3 text-indigo-400" />
                               <span className="text-[9px] font-black uppercase text-slate-400 group-hover/lead:text-indigo-600 italic">Lead: {v.lead_destination || 'Target'}</span>
                            </Link>
                          )}
                          {v.booking_id && (
                            <Link to={`/bookings/${v.booking_id}`} className="flex items-center gap-2 group/booking hover:bg-amber-50 px-2 py-1 rounded-lg transition-all border border-transparent hover:border-amber-100">
                               <Briefcase className="w-3 h-3 text-amber-400" />
                               <span className="text-[9px] font-black uppercase text-slate-400 group-hover/booking:text-amber-600 italic">Booking: {v.booking_number}</span>
                            </Link>
                          )}
                          {v.customer_id && (
                            <Link to={`/customers/${v.customer_id}`} className="flex items-center gap-2 group/cust hover:bg-emerald-50 px-2 py-1 rounded-lg transition-all border border-transparent hover:border-emerald-100">
                               <Users className="w-3 h-3 text-emerald-400" />
                               <span className="text-[9px] font-black uppercase text-slate-400 group-hover/cust:text-emerald-600 italic">Customer Node</span>
                            </Link>
                          )}
                       </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => onEdit(v)} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm"><Edit3 className="w-4 h-4" /></button>
                       <button className="p-3 text-slate-300 hover:text-red-500 hover:bg-white rounded-xl transition-all shadow-sm"><Trash2 className="w-4 h-4" /></button>
                    </div>
                 </div>
               ))
             )}
          </div>
       </div>
    </section>
  );
};
