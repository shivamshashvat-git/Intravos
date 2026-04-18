export type MarkupType = 'percentage' | 'fixed';
export type AppliesTo = 'all' | 'hotel' | 'flight' | 'activity' | 'transfer';

export interface MarkupPreset {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  applies_to: AppliesTo;
  calc_type: MarkupType;
  calc_value: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
}

export interface CreateMarkupPresetInput {
  name: string;
  description?: string;
  applies_to: AppliesTo;
  calc_type: MarkupType;
  calc_value: number;
  is_default: boolean;
  is_active: boolean;
}
