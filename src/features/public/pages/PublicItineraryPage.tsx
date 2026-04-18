import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  MapPin, Calendar, Clock, Plane, Hotel, 
  Target, Car, Utensils, Info, CheckCircle2,
  Globe, Shield, Coffee, Wifi, Landmark, Lock,
  FileText, ShieldCheck, ChevronRight
} from 'lucide-react';
import { itinerariesService } from '@/features/operations/services/itinerariesService';
import { ItineraryWithDetails, ItineraryItemType } from '@/features/operations/types/itinerary';
import { clsx } from 'clsx';

export const PublicItineraryPage: React.FC = () => {
  const { share_token } = useParams<{ share_token: string }>();
  const [itinerary, setItinerary] = useState<ItineraryWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPublicData = async () => {
      if (!share_token) return;
      try {
        const data = await itinerariesService.getItineraryBySlug(share_token);
        setItinerary(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublicData();
  }, [share_token]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="animate-pulse space-y-8 w-full max-w-3xl">
          <div className="h-64 bg-slate-100 rounded-[3rem]" />
          <div className="space-y-4">
             <div className="h-10 bg-slate-100 rounded-2xl w-3/4" />
             <div className="h-6 bg-slate-100 rounded-xl w-1/2" />
          </div>
          <div className="space-y-8 pl-8 border-l-2 border-slate-50">
             <div className="h-32 bg-slate-100 rounded-[2.5rem]" />
             <div className="h-32 bg-slate-100 rounded-[2.5rem]" />
          </div>
        </div>
      </div>
    );
  }

  if (!itinerary || !itinerary.is_public) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-12 text-center">
        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-8 border border-red-100">
           <Lock className="w-10 h-10" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic mb-4">Sequence Unavailable</h1>
        <p className="text-sm font-bold text-slate-400 max-w-md uppercase tracking-widest leading-relaxed">
          The requested operational blueprint is either private or has been decommissioned. 
          Please contact your mission specialist for access.
        </p>
        <div className="mt-12 h-px w-20 bg-slate-100 mx-auto" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-indigo-600 selection:text-white pb-32">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-40 px-6">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-xl shadow-indigo-200">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure Deployment Blueprint
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-slate-950 leading-[0.85] mb-8">
            {itinerary.title}
          </h1>
          <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
            <div className="flex items-center gap-4 group">
               <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                  <MapPin className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tactical Target</p>
                  <p className="text-xl font-black italic uppercase italic tracking-tight">{itinerary.destination || 'Global Objective'}</p>
               </div>
            </div>
            <div className="flex items-center gap-4 group">
               <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration Block</p>
                  <p className="text-xl font-black italic uppercase italic tracking-tight">{itinerary.days.length} Days / {Math.max(0, itinerary.days.length - 1)} Nights</p>
               </div>
            </div>
            {itinerary.start_date && (
               <div className="flex items-center gap-4 group">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                     <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Mission Start</p>
                     <p className="text-xl font-black italic uppercase italic tracking-tight">{new Date(itinerary.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long' })}</p>
                  </div>
               </div>
            )}
          </div>
        </div>
        
        {/* Background Decors */}
        <div className="absolute top-0 right-0 w-[50%] h-full opacity-[0.03] select-none pointer-events-none overflow-hidden">
           <Globe className="w-[120%] h-auto -translate-y-1/4 translate-x-1/4" />
        </div>
      </section>

      {/* Timeline Section */}
      <section className="max-w-4xl mx-auto px-6 space-y-32">
        {itinerary.days.map((day, dIdx) => {
          const dayDate = itinerary.start_date ? new Date(itinerary.start_date) : null;
          if (dayDate) dayDate.setDate(dayDate.getDate() + (day.day_number - 1));

          return (
            <div key={day.id} className="relative">
              {/* Day Header */}
              <div className="flex items-end gap-6 mb-12">
                 <div className="flex flex-col items-center shrink-0">
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-300">Phase</span>
                    <span className="text-7xl font-black italic text-slate-900 italic tracking-tighter leading-none">0{day.day_number}</span>
                 </div>
                 <div className="flex-1 pb-1">
                    <h2 className="text-3xl font-black uppercase italic italic text-slate-950 tracking-tight">{day.title || 'In Mission Progression'}</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-600 mt-2">{dayDate ? dayDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Continuous Sequence'}</p>
                 </div>
              </div>

              {day.description && (
                <p className="text-lg font-bold italic text-slate-400 leading-relaxed mb-12 ml-4 border-l-4 border-indigo-50 pl-8 py-2">
                   {day.description}
                </p>
              )}

              {/* Items List */}
              <div className="space-y-16 relative pl-12 border-l-2 border-slate-100/50 ml-4">
                 {day.items.map((item, iIdx) => (
                    <ItemNode key={item.id} item={item} />
                 ))}
                 
                 {dIdx < itinerary.days.length - 1 && (
                    <div className="pt-24 flex items-center justify-center">
                       <div className="h-px bg-slate-100 flex-1" />
                       <div className="px-6 text-[10px] font-black uppercase tracking-[0.5em] text-slate-200">Transition Node</div>
                       <div className="h-px bg-slate-100 flex-1" />
                    </div>
                 )}
              </div>
            </div>
          );
        })}
      </section>

      {/* Public Footer */}
      <footer className="mt-64 text-center pb-20">
         <div className="w-12 h-px bg-slate-100 mx-auto mb-12" />
         <p className="text-[10px] font-black uppercase tracking-[0.8em] text-slate-300">Built & Verified by Intravos Operational Intel</p>
         <div className="mt-8 flex items-center justify-center gap-3">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">End-to-End Encrypted Deployment</span>
         </div>
      </footer>
    </div>
  );
};

const ItemNode: React.FC<{ item: any }> = ({ item }) => {
  const getTheme = (type: string) => {
    switch (type) {
      case 'hotel': return { icon: Hotel, color: 'text-blue-500', bg: 'bg-blue-500' };
      case 'flight': return { icon: Plane, color: 'text-purple-500', bg: 'bg-purple-500' };
      case 'activity': return { icon: Target, color: 'text-orange-500', bg: 'bg-orange-500' };
      case 'transfer': return { icon: Car, color: 'text-slate-500', bg: 'bg-slate-500' };
      case 'meal': return { icon: Utensils, color: 'text-emerald-500', bg: 'bg-emerald-500' };
      default: return { icon: FileText, color: 'text-slate-400', bg: 'bg-slate-400' };
    }
  };

  const theme = getTheme(item.item_type);

  return (
    <div className="relative group">
       {/* Pin */}
       <div className={clsx(
         "absolute -left-[54.5px] top-6 w-3 h-3 rounded-full border-2 border-white shadow-sm ring-4 ring-white transition-all group-hover:scale-125",
         theme.bg
       )} />

       <div className="flex flex-col md:flex-row md:items-start gap-8">
          {item.time_val && (
             <div className="shrink-0 w-24 pt-2">
                <div className="text-xl font-black italic text-slate-900 italic flex items-center gap-2">
                   <Clock className="w-4 h-4 text-slate-300" />
                   {item.time_val}
                </div>
             </div>
          )}
          
          <div className="flex-1 bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-sm group-hover:shadow-2xl group-hover:shadow-slate-100 group-hover:border-indigo-100 transition-all duration-500">
             <div className="flex items-center gap-3 mb-6">
                <div className={clsx("p-2.5 rounded-2xl bg-slate-50", theme.color)}>
                   <theme.icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">{item.item_type}</span>
             </div>
             
             <h3 className="text-2xl font-black uppercase italic italic text-slate-950 mb-4 tracking-tight leading-none group-hover:text-indigo-600 transition-colors">
                {item.title}
             </h3>

             {item.description && (
                <p className="text-sm font-bold italic text-slate-500 leading-relaxed mb-8">
                   {item.description}
                </p>
             )}

             <div className="flex flex-wrap gap-8 items-center border-t border-slate-50 pt-6">
                {item.location && (
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <MapPin className="w-3.5 h-3.5" /> {item.location}
                   </div>
                )}
                {item.duration && (
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <Clock className="w-3.5 h-3.5" /> {item.duration}
                   </div>
                )}
             </div>

             {item.media_urls?.[0] && (
                <div className="mt-8 rounded-[2rem] overflow-hidden border border-slate-50 relative aspect-[21/9]">
                   <img src={item.media_urls[0]} alt="Mission Node Visual" className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" />
                </div>
             )}
          </div>
       </div>
    </div>
  );
};
