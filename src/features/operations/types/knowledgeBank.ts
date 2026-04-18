import { Itinerary, ItineraryDay, ItineraryItem, ItineraryItemType } from './itinerary';

export type TemplateCategory = 'adventure' | 'heritage' | 'luxury' | 'pilgrimage' | 'honeymoon' | 'family' | 'corporate' | 'custom';

export interface ItineraryTemplate extends Itinerary {
  is_template: true;
  category: TemplateCategory;
  description: string | null;
  tags: string[];
  duration_days: number;
  base_price_per_person: number | null;
  currency: string;
}

export interface DetailedTemplate extends ItineraryTemplate {
  days: ItineraryDay[];
}

export interface CreateTemplateInput {
  title: string;
  destination: string;
  category: TemplateCategory;
  description?: string;
  tags?: string[];
  duration_days: number;
  base_price_per_person?: number;
  is_public?: boolean;
}

export const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  adventure: 'Adventure',
  heritage: 'Heritage & Culture',
  luxury: 'Luxury',
  pilgrimage: 'Pilgrimage',
  honeymoon: 'Honeymoon',
  family: 'Family',
  corporate: 'Corporate',
  custom: 'Custom'
};

export const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  adventure: 'bg-orange-100 text-orange-700 border-orange-200',
  heritage: 'bg-amber-100 text-amber-700 border-amber-200',
  luxury: 'bg-purple-100 text-purple-700 border-purple-200',
  pilgrimage: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  honeymoon: 'bg-rose-100 text-rose-700 border-rose-200',
  family: 'bg-blue-100 text-blue-700 border-blue-200',
  corporate: 'bg-slate-100 text-slate-700 border-slate-200',
  custom: 'bg-emerald-100 text-emerald-700 border-emerald-200'
};
