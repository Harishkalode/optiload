import { apiRequest } from './http';

export type Period = '1M' | '3M' | '6M' | '1Y';

export interface DashboardSummary {
  total_loads: number;
  total_vehicles: number;
  optimizations: number;
  avg_efficiency: number;
  efficiency_trend: { index: number; efficiency: number }[];
}

export interface DashboardActivity {
  id: number;
  action: string;
  resource: string;
  timestamp: string;
  user_id: number;
  user_email: string | null;
  user_name: string | null;
}

export interface RecentOptimization {
  id: number;
  vehicle_id: number;
  load_count: number;
  efficiency_score: number | null;
  status: string;
  created_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface VehicleRow {
  id: number;
  organization_id: number;
  type: string;
  dimensions: Record<string, unknown>;
  capacity: number;
}

export interface LoadRow {
  id: number;
  organization_id: number;
  type: string;
  dimensions: Record<string, unknown>;
  weight: number;
  quantity: number;
}

export interface NotificationRow {
  id: number;
  title: string;
  body: string;
  category: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface AuditLogRow {
  id: number;
  user_id: number;
  organization_id: number | null;
  action: string;
  resource: string;
  resource_id: string | null;
  metadata_json: Record<string, unknown> | null;
  ip_address: string | null;
  timestamp: string;
}

export interface MetaOption {
  value: string;
  label: string;
}

export function fetchDashboardSummary() {
  return apiRequest<DashboardSummary>('/dashboard/summary');
}

export function fetchRecentActivities() {
  return apiRequest<DashboardActivity[]>('/dashboard/recent-activities');
}

export function fetchRecentOptimizations() {
  return apiRequest<RecentOptimization[]>('/dashboard/recent-optimizations');
}

export function fetchNotifications(unreadOnly = false) {
  const q = unreadOnly ? '?unread_only=true' : '';
  return apiRequest<NotificationRow[]>(`/notifications${q}`);
}

export function markNotificationRead(id: number) {
  return apiRequest<{ id: number; updated: boolean }>(`/notifications/${id}/read`, { method: 'PATCH' });
}

export function markAllNotificationsRead() {
  return apiRequest<{ updated: number }>('/notifications/read-all', { method: 'PATCH' });
}

export function fetchVehicles(page = 1, pageSize = 100) {
  return apiRequest<Paginated<VehicleRow>>(`/vehicles?page=${page}&page_size=${pageSize}`);
}

export function fetchLoads(page = 1, pageSize = 100) {
  return apiRequest<Paginated<LoadRow>>(`/loads?page=${page}&page_size=${pageSize}`);
}

export function runOptimization(vehicle_id: number, loads: { load_id: number; quantity: number }[], constraints?: Record<string, boolean>) {
  return apiRequest<{ id: number; status: string }>('/optimization/run', {
    method: 'POST',
    body: JSON.stringify({ vehicle_id, loads, constraints }),
  });
}

export function fetchOptimizationStatus(id: number) {
  return apiRequest<{ id: number; status: string }>(`/optimization/${id}/status`);
}

export function fetchOptimizationResult(id: number) {
  return apiRequest<{ id: number; result: Record<string, unknown> | null; efficiency_score: number | null }>(
    `/optimization/${id}/result`,
  );
}

export function fetchOptimizationHistory() {
  return apiRequest<{ id: number; status: string; efficiency_score: number | null; created_at: string }[]>(
    '/optimization/history',
  );
}

export function fetchAuditLogs(params: Record<string, string | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') sp.set(k, v);
  });
  const q = sp.toString();
  return apiRequest<AuditLogRow[]>(q ? `/audit-logs?${q}` : '/audit-logs');
}

export function fetchReportSummary(period: Period) {
  return apiRequest<{
    period: Period;
    total_optimizations: number;
    avg_efficiency: number;
    fleet_size: number;
    load_catalog_size: number;
    cost_savings_estimate_usd: number;
  }>(`/reports/summary?period=${period}`);
}

export function fetchReportUtilization(period: Period) {
  return apiRequest<{
    period: Period;
    items: { vehicle_id: number; runs: number; avg_efficiency: number }[];
  }>(`/reports/utilization?period=${period}`);
}

export function fetchReportPerformance(period: Period) {
  return apiRequest<{
    period: Period;
    series: { month: string; jobs: number; avg_efficiency: number }[];
  }>(`/reports/performance?period=${period}`);
}

export function fetchVehicleTypes() {
  return apiRequest<{ items: MetaOption[] }>('/vehicle-types');
}

export function fetchLoadTypes() {
  return apiRequest<{ items: MetaOption[] }>('/load-types');
}

export function fetchRoles() {
  return apiRequest<{ id: number; name: string; scope: string; description: string | null; permission_ids: number[] }[]>(
    '/roles',
  );
}

export function fetchOrganizations() {
  return apiRequest<{ id: number; name: string; status: string; plan_type: string; created_at: string }[]>(
    '/organizations',
  );
}

export function fetchUsersGlobal(page = 1, pageSize = 100) {
  return apiRequest<Paginated<{
    id: number;
    organization_id: number | null;
    name: string;
    email: string;
    role_id: number;
    status: string;
    mfa_enabled: boolean;
    last_login: string | null;
    created_at: string;
  }>>(`/users?scope=global&page=${page}&page_size=${pageSize}`);
}

export function fetchSystemMetrics() {
  return apiRequest<{ id: number; metric_type: string; value: number; timestamp: string }[]>('/system/metrics');
}

export function fetchSystemErrors() {
  return apiRequest<unknown[]>('/system/errors');
}

export function fetchSystemActivities() {
  return apiRequest<
    {
      id: number;
      user_id: number;
      organization_id: number | null;
      action: string;
      resource: string;
      resource_id: string | null;
      timestamp: string;
    }[]
  >('/system/activities');
}
