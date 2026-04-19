import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  PlaneTakeoff,
  Grid3x3,
  List,
  Loader2,
} from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
  isWithinInterval,
} from 'date-fns';
import { fetchCalendarEvents, CalendarEvent } from '../services/calendarService';

type ViewMode = 'month' | 'week';

const STATUS_COLORS: Record<string, string> = {
  confirmed:   'bg-emerald-500 text-white border-emerald-600',
  in_progress: 'bg-blue-500 text-white border-blue-600',
  completed:   'bg-slate-400 text-white border-slate-500',
  enquiry:     'bg-amber-400 text-white border-amber-500',
  cancelled:   'bg-red-400 text-white border-red-500',
  pending:     'bg-amber-400 text-white border-amber-500',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  booking:          '', // uses status-based color
  departure:        'bg-violet-500 text-white border-violet-600',
  checkout:         'bg-cyan-500 text-white border-cyan-600',
  followup:         'bg-orange-400 text-white border-orange-500',
  task_due:         'bg-rose-400 text-white border-rose-500',
  visa_appointment: 'bg-indigo-500 text-white border-indigo-600',
};

function getEventColor(event: CalendarEvent): string {
  if (event.event_type === 'booking' && event.status) {
    return STATUS_COLORS[event.status] || 'bg-slate-500 text-white border-slate-600';
  }
  return EVENT_TYPE_COLORS[event.event_type] || 'bg-slate-500 text-white border-slate-600';
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

const SkeletonCell: React.FC = () => (
  <div className="h-24 md:h-32 bg-slate-100 rounded-xl animate-pulse border border-slate-200" />
);

const SkeletonGrid: React.FC<{ count: number }> = ({ count }) => (
  <div className="grid grid-cols-7 gap-1.5">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCell key={i} />
    ))}
  </div>
);

// ─── Event Pill ────────────────────────────────────────────────────────────────

interface EventPillProps {
  event: CalendarEvent;
  onClick: () => void;
}

const EventPill: React.FC<EventPillProps> = ({ event, onClick }) => {
  const colorClass = getEventColor(event);
  const isBooking = event.event_type === 'booking';

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      title={event.title}
      className={`
        w-full text-left text-[10px] font-bold px-1.5 py-0.5 rounded-md 
        border truncate block transition-all hover:opacity-80 hover:scale-[1.02]
        ${colorClass}
      `}
    >
      {isBooking && event.booking_ref ? (
        <span className="opacity-80 mr-1">{event.booking_ref}</span>
      ) : null}
      {event.title.length > 22 ? event.title.substring(0, 20) + '…' : event.title}
    </button>
  );
};

// ─── Day Cell ─────────────────────────────────────────────────────────────────

interface DayCellProps {
  date: Date;
  events: CalendarEvent[];
  isCurrentMonth: boolean;
  isDepartingSoon: boolean;
  onEventClick: (event: CalendarEvent) => void;
}

const DayCell: React.FC<DayCellProps> = ({ date, events, isCurrentMonth, isDepartingSoon, onEventClick }) => {
  const today = isToday(date);
  const bookingEvents = events.filter(e => e.event_type === 'booking');
  const otherEvents = events.filter(e => e.event_type !== 'booking');
  const maxVisible = 3;
  const visibleEvents = [...bookingEvents, ...otherEvents].slice(0, maxVisible);
  const overflowCount = Math.max(0, events.length - maxVisible);

  return (
    <div
      className={`
        relative min-h-24 md:min-h-32 p-1.5 rounded-xl border transition-all group
        ${today ? 'border-indigo-400 bg-indigo-50/60 shadow-sm shadow-indigo-100' : 'border-slate-100'}
        ${!isCurrentMonth ? 'opacity-40' : ''}
        ${isDepartingSoon && isCurrentMonth ? 'bg-emerald-50/40 border-emerald-200' : !today ? 'bg-white' : ''}
        hover:border-slate-300 hover:shadow-sm
      `}
    >
      {/* Date number */}
      <div className="flex items-start justify-between mb-1">
        <span className={`
          text-xs font-black w-6 h-6 flex items-center justify-center rounded-full transition-colors
          ${today ? 'bg-indigo-600 text-white' : 'text-slate-700'}
        `}>
          {format(date, 'd')}
        </span>
        {isDepartingSoon && isCurrentMonth && bookingEvents.length > 0 && (
          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider flex items-center gap-0.5">
            <PlaneTakeoff className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">Departing</span>
          </span>
        )}
      </div>

      {/* Events */}
      <div className="space-y-0.5">
        {visibleEvents.map((event) => (
          <EventPill key={event.id} event={event} onClick={() => onEventClick(event)} />
        ))}
        {overflowCount > 0 && (
          <div className="text-[10px] font-bold text-slate-400 pl-1">
            +{overflowCount} more
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main CalendarPage ─────────────────────────────────────────────────────────

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Responsive: default to week view on mobile
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode('week');
    }
  }, []);

  // Compute the date ranges
  const monthKey = format(currentDate, 'yyyy-MM');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCalendarEvents(monthKey);
      setEvents(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [monthKey]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Navigation
  const goNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else setCurrentDate(addWeeks(currentDate, 1));
  };
  const goPrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else setCurrentDate(subWeeks(currentDate, 1));
  };
  const goToday = () => setCurrentDate(new Date());

  // Period label
  const periodLabel = viewMode === 'month'
    ? format(currentDate, 'MMMM yyyy')
    : (() => {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
        return `${format(weekStart, 'dd MMM')} – ${format(weekEnd, 'dd MMM yyyy')}`;
      })();

  // Build the grid days
  const gridDays: Date[] = (() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
      const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: gridStart, end: gridEnd });
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
  })();

  // Map events to dates
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(e => e.date === dateStr);
  };

  // Departing soon: confirmed bookings within next 7 days
  const today = new Date();
  const sevenDaysLater = new Date(today);
  sevenDaysLater.setDate(today.getDate() + 7);
  const departingSoonDates = new Set(
    events
      .filter(e =>
        e.event_type === 'booking' &&
        e.status === 'confirmed' &&
        isWithinInterval(parseISO(e.date), { start: today, end: sevenDaysLater })
      )
      .map(e => e.date)
  );

  const handleEventClick = (event: CalendarEvent) => {
    if (event.event_type === 'booking' && event.metadata?.booking_id) {
      navigate(`/bookings/${event.metadata.booking_id}`);
    } else if (event.metadata?.lead_id) {
      navigate(`/leads/${event.metadata.lead_id}`);
    }
  };

  const bookingCount = events.filter(e => e.event_type === 'booking').length;
  const weekDayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6 min-h-screen">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-indigo-600" />
            Departures Calendar
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            All confirmed booking departures plotted by date
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle — hidden on mobile */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <Grid3x3 className="w-3.5 h-3.5" />
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === 'week'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Week
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToday}
              className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Today
            </button>
            <button
              onClick={goNext}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Period label */}
          <span className="text-sm font-black text-slate-900 min-w-36 text-center hidden sm:block">
            {periodLabel}
          </span>
        </div>
      </div>

      {/* Mobile period label */}
      <div className="sm:hidden text-center">
        <span className="text-sm font-black text-slate-900">{periodLabel}</span>
      </div>

      {/* ── Stats Strip ── */}
      {!loading && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg text-xs font-bold text-indigo-700">
            {bookingCount} booking{bookingCount !== 1 ? 's' : ''} this {viewMode}
          </span>
          {departingSoonDates.size > 0 && (
            <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg text-xs font-bold text-emerald-700 flex items-center gap-1">
              <PlaneTakeoff className="w-3.5 h-3.5" />
              {departingSoonDates.size} departing in next 7 days
            </span>
          )}
          <div className="flex items-center gap-2 ml-auto">
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" /> Confirmed
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Pending
            </span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-sm bg-slate-400 inline-block" /> Completed
            </span>
          </div>
        </div>
      )}

      {/* ── Error Banner ── */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium">
          {error} — <button onClick={fetchEvents} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* ── Calendar Grid ── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50">
          {weekDayHeaders.map(day => (
            <div
              key={day}
              className="text-center py-3 text-[11px] font-black uppercase tracking-widest text-slate-400"
            >
              <span className="hidden sm:inline">{day}</span>
              <span className="sm:hidden">{day[0]}</span>
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="p-2">
          {loading ? (
            <SkeletonGrid count={viewMode === 'month' ? 35 : 7} />
          ) : (
            <div className="grid grid-cols-7 gap-1.5">
              {gridDays.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                return (
                  <DayCell
                    key={dayStr}
                    date={day}
                    events={getEventsForDate(day)}
                    isCurrentMonth={isSameMonth(day, currentDate)}
                    isDepartingSoon={departingSoonDates.has(dayStr)}
                    onEventClick={handleEventClick}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Empty State ── */}
      {!loading && !error && bookingCount === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6 shadow-inner">
            <CalendarIcon className="w-10 h-10 text-indigo-300" />
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">No departures this {viewMode}</h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            There are no confirmed booking departures for {periodLabel}.
            Navigate to another period or create a new booking.
          </p>
          <button
            onClick={() => navigate('/bookings')}
            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
          >
            View All Bookings
          </button>
        </div>
      )}

      {/* ── Loading overlay hint ── */}
      {loading && (
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading calendar events…
        </div>
      )}
    </div>
  );
};
