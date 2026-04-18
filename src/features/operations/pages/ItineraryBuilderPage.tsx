import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { 
  Plus, X, GripVertical, Calendar, MapPin, 
  Share2, Save, Eye, Layout, Copy, Trash2, 
  ChevronRight, Clock, Info, Check, AlertCircle, 
  Maximize2, Minimize2, MoreHorizontal, ExternalLink,
  Hotel, Plane, Target, Car, FileText, Utensils, 
  Shield, Coffee, Wifi, Landmark, ArrowLeft, RefreshCw, Lock,
  Globe, CheckCircle2, ChevronDown, ChevronUp, User, History,
  Tent, Ship, Bike, Camera, Music, Palmtree
} from 'lucide-react';

// DND Kit
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useItinerary } from '@/features/operations/hooks/useItinerary';
import { ItineraryItemType, ItineraryItem, ItineraryDay } from '@/features/operations/types/itinerary';
import { itinerariesService } from '@/features/operations/services/itinerariesService';
import { bookingsService } from '@/features/operations/services/bookingsService';
import { PlacesAutocomplete } from '@/shared/components/PlacesAutocomplete';
import { formatINR } from '@/utils/currency';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
  return twMerge(clsx(inputs));
}

export const ItineraryBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const bookingIdParam = searchParams.get('booking_id');
  const navigate = useNavigate();
  
  const { 
    itinerary, isLoading, isSaving, 
    addDay, updateDay, deleteDay, reorderDays,
    addItem, updateItem, deleteItem, reorderItemsInDay, 
    toggleShare, refreshItinerary
  } = useItinerary(id!);

  const [activeDayId, setActiveDayId] = useState<string | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState('');
  
  const [searchBooking, setSearchBooking] = useState('');
  const [booking, setBooking] = useState<any>(null);

  useEffect(() => {
    if (itinerary?.booking_id) {
      bookingsService.getBookingById(itinerary.booking_id, itinerary.tenant_id).then(setBooking);
    }
  }, [itinerary?.booking_id]);

  // Sensors for DND
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (itinerary?.title) {
      setEditingTitle(itinerary.title);
    }
    if (itinerary?.days?.length && !activeDayId) {
      setActiveDayId(itinerary.days[0].id);
    }
  }, [itinerary, activeDayId]);

  // Handle auto-linking if booking_id exists in URL
  useEffect(() => {
    const autoLink = async () => {
      if (bookingIdParam && itinerary && !itinerary.booking_id) {
        await itinerariesService.updateItinerary(itinerary.id, itinerary.tenant_id, { booking_id: bookingIdParam });
        refreshItinerary();
      }
    };
    autoLink();
  }, [bookingIdParam, itinerary]);

  const handleTitleSave = async () => {
    if (!itinerary || !editingTitle) return;
    setIsEditingTitle(false);
    await itinerariesService.updateItinerary(itinerary.id, itinerary.tenant_id, { title: editingTitle });
    refreshItinerary();
  };

  const handleDayDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !itinerary) return;

    const oldIndex = itinerary.days.findIndex(d => d.id === active.id);
    const newIndex = itinerary.days.findIndex(d => d.id === over.id);
    
    const reorderedIds = arrayMove(itinerary.days.map(d => d.id), oldIndex, newIndex);
    reorderDays(reorderedIds);
  };

  const handleItemDragEnd = (event: DragEndEvent, dayId: string) => {
    const { active, over } = event;
    const day = itinerary?.days.find(d => d.id === dayId);
    if (!over || active.id === over.id || !day) return;

    const oldIndex = day.items.findIndex(i => i.id === active.id);
    const newIndex = day.items.findIndex(i => i.id === over.id);
    
    const reorderedIds = arrayMove(day.items.map(i => i.id), oldIndex, newIndex);
    reorderItemsInDay(dayId, reorderedIds);
  };

  if (isLoading) return <div className="h-screen flex items-center justify-center italic text-slate-400">Booting Operation Board...</div>;
  if (!itinerary) return <div className="p-8 text-center text-red-500 font-bold uppercase italic">Operation Sequence Not Found.</div>;

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Top Controller */}
      <header className="bg-slate-950 px-6 py-4 flex items-center justify-between shrink-0 text-white shadow-2xl z-[100] border-b border-white/5">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(booking ? `/bookings/${booking.id}` : '/itineraries')} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all text-white/50 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            {booking && <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Back to {booking.booking_number}</span>}
          </button>
          <div className="h-8 w-px bg-white/10"></div>
          <div>
            <div className="flex items-center gap-3">
              {isEditingTitle ? (
                <input 
                  autoFocus
                  className="bg-transparent text-xl font-black italic uppercase tracking-tight border-b-2 border-indigo-500 outline-none text-white w-96"
                  value={editingTitle}
                  onChange={e => setEditingTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={e => e.key === 'Enter' && handleTitleSave()}
                />
              ) : (
                <h1 
                  className="text-xl font-black italic uppercase tracking-tight cursor-text hover:text-indigo-400 transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {itinerary.title}
                </h1>
              )}
              <span className="text-[10px] bg-indigo-600 px-2.5 py-1 rounded font-black italic tracking-widest">{itinerary.status.toUpperCase()}</span>
            </div>
            {itinerary.booking_id && (
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mt-1 flex items-center gap-2">
                <CheckCircle2 className="w-3 h-3" /> Linked to Mission System
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase text-white/40 mr-6">
            {isSaving ? (
              <span className="flex items-center gap-2 text-indigo-400 animate-pulse"><RefreshCw className="w-3 h-3 animate-spin" /> Syncing Operation...</span>
            ) : (
              <span className="flex items-center gap-2 text-emerald-500"><CheckCircle2 className="w-3.5 h-3.5" /> Deployment Ready</span>
            )}
          </div>
          
          <button onClick={() => window.open(`/share/itinerary/${itinerary.public_slug}`, '_blank')} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all text-white/70" title="Preview Public View">
            <Eye className="w-5 h-5" />
          </button>
          
          <button onClick={toggleShare} className={cn(
            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border shadow-lg flex items-center gap-2",
            itinerary.is_public ? "bg-emerald-600 border-emerald-500 shadow-emerald-500/20" : "bg-white/5 border-white/10 hover:bg-white/10"
          )}>
            {itinerary.is_public ? <><Globe className="w-3 h-3" /> Live Control</> : <><Lock className="w-3 h-3" /> Internal Node</>}
          </button>

          <button className="px-8 py-2.5 bg-indigo-600 text-white font-black rounded-xl text-xs uppercase italic shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-95">
            Finalize Mission
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        {/* LEFT CANVAS: 65% */}
        <div className="w-[65%] overflow-y-auto bg-slate-50/50 p-12 space-y-20 scroll-smooth custom-scrollbar">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDayDragEnd}>
            <SortableContext items={itinerary.days.map(d => d.id) as UniqueIdentifier[]} strategy={verticalListSortingStrategy}>
              {itinerary.days.map((day, idx) => (
                <SortableDay 
                  key={day.id} 
                  day={day} 
                  itinerary={itinerary}
                  idx={idx}
                  isActive={activeDayId === day.id}
                  setActiveDayId={setActiveDayId}
                  updateDay={updateDay}
                  deleteDay={deleteDay}
                  addItem={addItem}
                  updateItem={updateItem}
                  deleteItem={deleteItem}
                  onItemDragEnd={(e) => handleItemDragEnd(e, day.id)}
                />
              ))}
            </SortableContext>
          </DndContext>

          <button 
            onClick={addDay}
            className="w-full h-32 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-slate-200 rounded-[3rem] hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-all"><Plus className="w-6 h-6" /></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 group-hover:text-indigo-600">Deploy New Strategic Day Node</p>
          </button>
        </div>

        {/* RIGHT SETTINGS: 35% */}
        <aside className="w-[35%] bg-white border-l border-slate-100 overflow-y-auto p-10 space-y-10 shadow-[-10px_0_30px_rgba(0,0,0,0.02)] z-10">
          <section className="space-y-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-indigo-600" /> Operational Context
            </h3>
            
            <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-6 border border-slate-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4">Itinerary Title</label>
                <input 
                  className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black uppercase italic outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  value={itinerary.title}
                  onChange={e => itinerariesService.updateItinerary(itinerary.id, itinerary.tenant_id, { title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4">Main Destination</label>
                <input 
                  className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-sm font-black uppercase italic outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                  value={itinerary.destination || ''}
                  placeholder="e.g. BALI, INDONESIA"
                  onChange={e => itinerariesService.updateItinerary(itinerary.id, itinerary.tenant_id, { destination: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4">Deployment Date</label>
                  <input 
                    type="date"
                    className="w-full px-6 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black outline-none focus:ring-4 focus:ring-indigo-100 uppercase"
                    value={itinerary.start_date || ''}
                    onChange={e => itinerariesService.updateItinerary(itinerary.id, itinerary.tenant_id, { start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-4">End Date</label>
                  <div className="w-full px-6 py-4 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-black text-slate-400 italic">
                    {itinerary.end_date || 'COMPUTED_ON_SAVE'}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-emerald-500" /> Share Control
            </h3>
            <div className="bg-indigo-900 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-indigo-200 relative overflow-hidden group">
              <Globe className="absolute -bottom-6 -right-6 w-32 h-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-50 mb-4">Public Operations Hub</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black italic uppercase italic tracking-tighter">Client Portal</span>
                  <div className={cn("w-3 h-3 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]", itinerary.is_public ? "bg-emerald-400 animate-pulse" : "bg-red-400")} />
                </div>
              </div>

              <div className="group/url bg-white/10 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-white/60 truncate italic">/share/itinerary/{itinerary.public_slug}</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/share/itinerary/${itinerary.public_slug}`);
                    alert('Command Link Copied.');
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>

              <button 
                onClick={toggleShare}
                className={cn(
                  "w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all",
                  itinerary.is_public ? "bg-white text-indigo-950" : "bg-indigo-600 text-white border border-white/20"
                )}
              >
                {itinerary.is_public ? 'Disable Cloud Access' : 'Enable Live Deployment'}
              </button>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
              <Layout className="w-4 h-4 text-purple-500" /> Legend & Tags
            </h3>
            <div className="grid grid-cols-2 gap-3 pb-20">
              {[
                { label: 'Flights', icon: Plane, color: 'text-purple-500', bg: 'bg-purple-50' },
                { label: 'Hotels', icon: Hotel, color: 'text-blue-500', bg: 'bg-blue-50' },
                { label: 'Activities', icon: Target, color: 'text-orange-500', bg: 'bg-orange-50' },
                { label: 'Transfers', icon: Car, color: 'text-slate-500', bg: 'bg-slate-50' },
                { label: 'Meals', icon: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { label: 'Visa Ops', icon: Shield, color: 'text-red-500', bg: 'bg-red-50' },
              ].map(tag => (
                <div key={tag.label} className={cn("p-4 rounded-2xl flex items-center gap-3 border border-slate-100", tag.bg)}>
                  <tag.icon className={cn("w-4 h-4", tag.color)} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-900">{tag.label}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
};

// SORTABLE DAY COMPONENT
const SortableDay: React.FC<{
  day: ItineraryDay;
  itinerary: any;
  idx: number;
  isActive: boolean;
  setActiveDayId: (id: string) => void;
  updateDay: any;
  deleteDay: any;
  addItem: any;
  updateItem: any;
  deleteItem: any;
  onItemDragEnd: (e: DragEndEvent) => void;
}> = ({ 
  day, idx, isActive, setActiveDayId, updateDay, deleteDay, 
  addItem, updateItem, deleteItem, onItemDragEnd, itinerary 
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: day.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(useSensor(PointerSensor));
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const dayDate = useMemo(() => {
    if (!itinerary?.start_date) return null;
    const d = new Date(itinerary.start_date);
    d.setDate(d.getDate() + (day.day_number - 1));
    return d;
  }, [itinerary?.start_date, day.day_number]);

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className={cn(
        "bg-white rounded-[3rem] border-2 transition-all p-10 max-w-5xl mx-auto shadow-2xl relative group/day",
        isActive ? "border-indigo-600 ring-8 ring-indigo-50/50" : "border-transparent shadow-slate-200/50"
      )}
      onClick={() => setActiveDayId(day.id)}
    >
      {/* Day Header */}
      <div className="flex items-start justify-between mb-12">
        <div className="flex items-start gap-8 flex-1">
          <div className="flex items-center gap-4">
             <div className="flex flex-col items-center">
               <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Tactical</span>
               <span className="text-4xl font-black italic text-slate-950 italic tracking-tighter">0{day.day_number}</span>
             </div>
             <button 
                {...attributes} {...listeners} 
                className="p-2 cursor-grab active:cursor-grabbing text-slate-200 hover:text-indigo-600 opacity-0 group-hover/day:opacity-100 transition-opacity"
             >
                <GripVertical className="w-6 h-6" />
             </button>
          </div>
          <div className="flex-1 space-y-1">
             <input 
               className="w-full text-3xl font-black uppercase italic text-slate-900 border-none outline-none focus:text-indigo-600 transition-colors bg-transparent" 
               value={day.title || ''} 
               placeholder="High-Level Focus..." 
               onChange={e => updateDay(day.id, { title: e.target.value })} 
             />
             <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
               <Calendar className="w-3 h-3" /> {dayDate ? dayDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Floating Sequence Node'}
             </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={() => setIsExpanded(!isExpanded)} className="p-3 text-slate-300 hover:text-slate-600">
             {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
           </button>
           <button onClick={() => deleteDay(day.id)} className="p-3 text-slate-200 hover:text-red-500 transition-all opacity-0 group-hover/day:opacity-100"><Trash2 className="w-5 h-5" /></button>
        </div>
      </div>

      {isExpanded && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          {/* Day Overview */}
          <textarea 
            className="w-full bg-slate-50 p-6 rounded-[2rem] text-sm font-semibold italic text-slate-500 border-none outline-none focus:bg-white focus:ring-4 focus:ring-slate-100 transition-all mb-10 h-24 resize-none"
            placeholder="Executive summary for this deployment block..."
            value={day.description || ''}
            onChange={e => updateDay(day.id, { description: e.target.value })}
          />

          {/* Items Canvas */}
          <div className="space-y-6 relative pl-12 border-l-2 border-slate-100">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onItemDragEnd}>
              <SortableContext items={day.items.map(i => i.id) as UniqueIdentifier[]} strategy={verticalListSortingStrategy}>
                {day.items.map((item, iIdx) => (
                  <SortableItem 
                    key={item.id} 
                    item={item} 
                    updateItem={updateItem}
                    deleteItem={deleteItem}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Add Activity Node */}
            <div className="relative pt-6">
              <div className="absolute -left-[54.5px] top-6 w-3 h-3 rounded-full bg-slate-100 border-2 border-white shadow-sm"></div>
              <div className="flex gap-3 flex-wrap">
                {[
                  { id: 'flight', icon: Plane, label: 'Flight' },
                  { id: 'hotel', icon: Hotel, label: 'Hotel' },
                  { id: 'activity', icon: Target, label: 'Activity' },
                  { id: 'transfer', icon: Car, label: 'Car' },
                  { id: 'meal', icon: Utensils, label: 'Meal' },
                  { id: 'note', icon: FileText, label: 'Note' },
                ].map(type => (
                  <button 
                    key={type.id}
                    onClick={() => addItem(day.id, type.id as any)}
                    className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-2 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all group/btn shadow-sm"
                  >
                    <type.icon className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-white" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// SORTABLE ITEM COMPONENT
const SortableItem: React.FC<{
  item: ItineraryItem;
  updateItem: any;
  deleteItem: any;
}> = ({ item, updateItem, deleteItem }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 60 : 0,
    opacity: isDragging ? 0.5 : 1,
  };

  const getCategoryTheme = (type: string) => {
    switch (type) {
      case 'hotel': return { icon: Hotel, color: 'text-blue-500', bg: 'bg-blue-500' };
      case 'flight': return { icon: Plane, color: 'text-purple-500', bg: 'bg-purple-500' };
      case 'activity': return { icon: Target, color: 'text-orange-500', bg: 'bg-orange-500' };
      case 'transfer': return { icon: Car, color: 'text-slate-500', bg: 'bg-slate-500' };
      case 'meal': return { icon: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-500' };
      case 'internal_note': return { icon: Lock, color: 'text-red-500', bg: 'bg-red-500' };
      default: return { icon: FileText, color: 'text-slate-400', bg: 'bg-slate-400' };
    }
  };

  const theme = getCategoryTheme(item.item_type);

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="group/item relative animate-in slide-in-from-left-4 duration-300"
    >
      {/* Connector Dot */}
      <div className={cn(
        "absolute -left-[54.5px] top-7 w-3 h-3 rounded-full border-2 border-white shadow-sm transition-all z-10 group-hover/item:scale-150",
        theme.bg
      )}></div>

      <div className="flex items-start gap-4">
        <div className="w-20 shrink-0 flex flex-col items-center pt-5">
           <input 
             className="w-full text-center text-[10px] font-black uppercase text-slate-400 bg-transparent border-none outline-none focus:text-slate-900 italic font-mono" 
             value={item.time_val || ''} 
             placeholder="HH:MM" 
             onChange={e => updateItem(item.id, { time_val: e.target.value })} 
           />
        </div>

        <div className="flex-1 bg-white border border-slate-100 rounded-3xl p-6 group-hover/item:border-indigo-200 group-hover/item:shadow-xl group-hover/item:shadow-slate-100 transition-all flex items-start gap-6">
           <div 
             {...attributes} {...listeners}
             className="p-2 cursor-grab active:cursor-grabbing text-slate-100 hover:text-slate-400 transition-colors"
           >
             <GripVertical className="w-5 h-5" />
           </div>

           <div className="flex-1">
             <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-2">
                 <div className={cn("p-2 rounded-xl bg-slate-50", theme.color)}>
                   <theme.icon className="w-4 h-4" />
                 </div>
                 <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-300">{item.item_type}</span>
               </div>
               <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-100 hover:text-red-500 transition-all opacity-0 group-hover/item:opacity-100"><Trash2 className="w-4 h-4" /></button>
             </div>

             <div className="space-y-3">
               <input 
                 className="w-full text-lg font-black uppercase italic text-slate-900 border-none outline-none focus:text-indigo-600 transition-colors p-0 bg-transparent"
                 value={item.title}
                 placeholder="Activity Title..."
                 onChange={e => updateItem(item.id, { title: e.target.value })}
               />
               <textarea 
                 className="w-full bg-transparent border-none outline-none text-[11px] font-bold text-slate-400 p-0 resize-none h-auto min-h-[1.5rem]"
                 rows={1}
                 placeholder="Contextual details for this activity node..."
                 value={item.description || ''}
                 onChange={e => updateItem(item.id, { description: e.target.value })}
                 onInput={(e: any) => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
               />
             </div>

             <div className="mt-6 flex flex-wrap gap-6 items-center border-t border-slate-50 pt-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-slate-300" />
                  <input 
                    className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-transparent border-none outline-none placeholder:text-slate-200"
                    placeholder="LOC_CODE"
                    value={item.location || ''}
                    onChange={e => updateItem(item.id, { location: e.target.value })}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-slate-300" />
                  <input 
                    className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-transparent border-none outline-none placeholder:text-slate-200"
                    placeholder="DURATION"
                    value={item.duration || ''}
                    onChange={e => updateItem(item.id, { duration: e.target.value })}
                  />
                </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
