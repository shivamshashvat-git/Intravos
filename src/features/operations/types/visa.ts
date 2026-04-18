export type VisaStatus = 
  | 'documents_pending' 
  | 'documents_received' 
  | 'submitted_to_embassy' 
  | 'under_processing' 
  | 'approved' 
  | 'rejected' 
  | 'cancelled';

export type PassportCustody = 
  | 'with_client' 
  | 'with_agency' 
  | 'submitted_to_vfs' 
  | 'submitted_to_embassy' 
  | 'returned_to_client';

export type VisaDocumentType = 
  | 'passport_copy' 
  | 'photo' 
  | 'bank_statement' 
  | 'flight_booking' 
  | 'hotel_booking' 
  | 'insurance' 
  | 'itr' 
  | 'noc' 
  | 'other';

export interface VisaDocument {
  id: string;
  tenant_id: string;
  visa_tracking_id: string;
  document_type: VisaDocumentType;
  document_name: string;
  file_url: string;
  file_size: number | null;
  uploaded_by: string;
  uploaded_at: string;
  notes?: string;
}

export interface VisaTracking {
  id: string;
  tenant_id: string;
  booking_id: string | null;
  lead_id: string | null;
  customer_id: string;
  
  // Traveler Info
  traveler_name: string;
  traveler_phone: string | null;
  passport_number: string | null;
  passport_expiry: string | null;
  passport_country: string;
  nationality: string;

  // Visa application details
  visa_country: string;
  visa_type: string | null;
  visa_category: string | null;
  entry_type: string | null;
  visa_duration: string | null;
  travel_date: string | null;

  // Application workflow
  status: VisaStatus;
  passport_custody: PassportCustody;

  // VFS / Embassy details
  vfs_center: string | null;
  vfs_appointment_date: string | null;
  vfs_reference_number: string | null;
  embassy_reference: string | null;
  submitted_at: string | null;
  expected_decision_date: string | null;

  // Resolution
  decision_date: string | null;
  visa_number: string | null;
  visa_expiry: string | null;
  rejection_reason: string | null;

  // Financials
  visa_fee: number;
  service_charge: number;
  total_amount: number;

  // Passport return tracking
  passport_dispatched_date: string | null;
  passport_courier_name: string | null;
  passport_tracking_number: string | null;
  passport_received_date: string | null;

  // Meta
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  
  // Joins
  customer?: { name: string };
  booking?: { id: string; booking_number: string; title: string };
  documents?: VisaDocument[];
}

export interface VisaFilters {
  status?: VisaStatus | VisaStatus[];
  passport_custody?: PassportCustody;
  visa_country?: string;
  search?: string;
  booking_id?: string;
  customer_id?: string;
  expiring_soon?: boolean;
  appointment_soon?: boolean;
  overdue?: boolean;
}
