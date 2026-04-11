import { apiRequest } from '../services/http';

export interface OrgRow {
  id: number;
  name: string;
  status: string;
  plan_type: string;
  timezone: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  max_users: number;
  created_at: string;
}

export function fetchOrganization() {
  return apiRequest<OrgRow>('/organization');
}

export function updateOrganization(payload: Partial<OrgRow>) {
  return apiRequest<{ id: number; name: string }>('/organization', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function fetchOrganizationPlan() {
  return apiRequest<{ organization_id: number; plan_type: string; status: string }>('/organization/plan');
}
