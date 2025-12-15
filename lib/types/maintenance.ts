// Maintenance Request Types
export interface MaintenanceRequest {
  id: string;
  unit_id: string;
  title: string;
  description: string;
  status: string;
  detailed_status?: 'new' | 'in_progress' | 'preparing_materials' | 'waiting_technician' | 'fixing' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  location?: string;
  contact_phone?: string;
  reported_by?: string;
  request_type?: string;
  has_cost?: boolean;
  estimated_cost?: number;
  technician_assigned?: string;
  notes?: string;
  image_urls?: string[];
  project_id?: string | null;
  created_at: string;
  updated_at?: string;
  units?: {
    unit_number: string;
    owner_name: string;
  };
}

export interface MaintenanceTimeline {
  id: string;
  maintenance_request_id: string;
  status: string;
  updated_by: string;
  notes?: string;
  created_at: string;
}

export interface MaintenanceComment {
  id: string;
  maintenance_request_id: string;
  comment_by: string;
  comment_text: string;
  is_resident: boolean;
  image_urls?: string[];
  created_at: string;
  updated_at: string;
}

export interface MaintenanceFormData {
  unit_id: string;
  title: string;
  description: string;
  priority: string;
  location?: string;
  contact_phone?: string;
  request_type?: string;
  has_cost?: boolean;
  estimated_cost?: number;
  image_urls?: string[];
}



















