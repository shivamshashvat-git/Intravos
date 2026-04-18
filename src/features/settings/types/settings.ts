export interface TenantSettings {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  agency_address: string | null;
  agency_phone: string | null;
  agency_email: string | null;
  gstin: string | null;
  pan: string | null;
  agency_website: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  
  invoice_prefix: string;
  invoice_next_num: number;
  invoice_bank_text: string | null;
  quote_prefix: string;
  quote_next_num: number;
  quote_validity: number;
  quote_terms: string | null;
  quote_inclusions: string | null;
  quote_exclusions: string | null;
  
  plan: string;
  subscription_status: string;
  trial_end: string | null;
  max_seats: number;
  features_enabled: string[];
}

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'staff' | 'partner';
  designation: string | null;
  phone: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login_at: string | null;
}

export interface BankAccount {
  id: string;
  tenant_id: string;
  account_name: string;
  bank_name: string;
  account_number: string;
  ifsc: string;
  acc_type: 'current' | 'savings' | 'upi';
  is_primary: boolean;
  running_balance: number;
}
