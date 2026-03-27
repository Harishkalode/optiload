/**
 * OptiLoad – Backend Integration Mapping Config
 * ─────────────────────────────────────────────
 * Single source of truth for all API bindings, field mappings,
 * action definitions, payload schemas, and data-flow annotations.
 *
 * NAMING CONVENTION:
 *   user.*          → /users  endpoints
 *   vehicle.*       → /vehicles endpoints
 *   load.*          → /loads endpoints
 *   optimization.*  → /optimization endpoints
 *   audit.*         → /audit-logs endpoints
 *   system.*        → /system endpoints
 *   org.*           → /organizations endpoints
 *   auth.*          → /auth endpoints
 *   report.*        → /reports endpoints
 *   apikey.*        → /api-keys endpoints
 *   role.*          → /roles endpoints
 */

// ──────────────────────────────────────────────
// BASE URL CONFIG
// ──────────────────────────────────────────────
export const API_BASE = '/api/v1';
export const AUTH_HEADER = 'Authorization: Bearer {{auth.access_token}}';

// ──────────────────────────────────────────────
// SCREEN → API GROUP MAP
// ──────────────────────────────────────────────
export const SCREEN_API_GROUPS: Record<string, { group: string; base: string; description: string }> = {
  Login:               { group: 'Auth',            base: '/auth',               description: 'Authentication & session management' },
  Dashboard:           { group: 'Dashboard',       base: '/dashboard',          description: 'KPI summaries & recent job activity' },
  Vehicles:            { group: 'Vehicles',        base: '/vehicles',           description: 'Fleet management & CRUD' },
  VehicleCreator:      { group: 'Vehicles',        base: '/vehicles',           description: 'Step-by-step vehicle configuration wizard' },
  Loads:               { group: 'Loads',           base: '/loads',             description: 'Load library management & bulk upload' },
  OptimizationJobs:    { group: 'Optimization',   base: '/optimization',       description: 'Job creation, queuing & status' },
  Processing:          { group: 'Optimization',   base: '/optimization',       description: 'Real-time job progress stream' },
  Results:             { group: 'Optimization',   base: '/optimization',       description: '3D result viewer & export' },
  Reports:             { group: 'Reports',         base: '/reports',           description: 'Analytics, charts & PDF export' },
  Users:               { group: 'Users',           base: '/users',             description: 'Org-level user directory' },
  UserManagement:      { group: 'Users',           base: '/users',             description: 'Invite, suspend, manage org users' },
  RolesManagement:     { group: 'Roles',           base: '/roles',             description: 'Permission matrix & role editor' },
  AuditLogs:           { group: 'Audit',           base: '/audit-logs',        description: 'Org-scoped event log with filters' },
  ApiKeysManagement:   { group: 'API Keys',        base: '/api-keys',          description: 'Create, revoke & scope API keys' },
  Settings:            { group: 'Settings',        base: '/settings',          description: 'Org preferences & integrations' },
  // ── Super Admin ──
  GlobalDashboard:     { group: 'Super Admin',     base: '/system',            description: 'Platform-wide KPIs & live feed' },
  Organizations:       { group: 'Organizations',  base: '/organizations',      description: 'Multi-tenant org management' },
  GlobalUsers:         { group: 'Super Admin',     base: '/users/global',      description: 'Cross-org user directory' },
  SystemMonitoring:    { group: 'System',          base: '/system',            description: 'Infrastructure & worker metrics' },
  GlobalAuditLogs:     { group: 'Audit',           base: '/audit-logs/global', description: 'Platform-wide event stream' },
  ApiUsage:            { group: 'System',          base: '/system/api-usage',  description: 'API call analytics by org/key' },
  FeatureControl:      { group: 'Feature Flags',   base: '/features',          description: 'Enable/disable platform features per org' },
  SuperAdminSettings:  { group: 'Settings',        base: '/settings/global',   description: 'Global platform configuration' },
};

// ──────────────────────────────────────────────
// FIELD BINDING REGISTRY
// ──────────────────────────────────────────────
export const FIELD_BINDINGS = {

  // AUTH
  auth: {
    email:            { token: '{{auth.email}}',           type: 'string', required: true },
    password:         { token: '{{auth.password}}',        type: 'string', required: true, sensitive: true },
    org_name:         { token: '{{auth.org_name}}',        type: 'string', required: false },
    invite_code:      { token: '{{auth.invite_code}}',     type: 'string', required: false },
    remember_me:      { token: '{{auth.remember_me}}',     type: 'boolean', required: false },
    access_token:     { token: '{{auth.access_token}}',    type: 'string', store: 'localStorage' },
    refresh_token:    { token: '{{auth.refresh_token}}',   type: 'string', store: 'localStorage', sensitive: true },
    role:             { token: '{{auth.role}}',            type: 'string' },
    org_id:           { token: '{{auth.org_id}}',          type: 'string' },
    user_id:          { token: '{{auth.user_id}}',         type: 'string' },
  },

  // USER
  user: {
    id:               { token: '{{user.id}}',              type: 'string' },
    name:             { token: '{{user.name}}',            type: 'string' },
    email:            { token: '{{user.email}}',           type: 'string' },
    role:             { token: '{{user.role}}',            type: 'string' },
    status:           { token: '{{user.status}}',          type: 'enum', values: ['active', 'suspended', 'invited'] },
    last_active:      { token: '{{user.last_active}}',     type: 'datetime' },
    mfa_enabled:      { token: '{{user.mfa_enabled}}',     type: 'boolean' },
    jobs_run:         { token: '{{user.jobs_run}}',        type: 'number' },
    created_by:       { token: '{{user.created_by}}',      type: 'string' },
    created_at:       { token: '{{user.created_at}}',      type: 'datetime' },
    org_id:           { token: '{{user.org_id}}',          type: 'string' },
    avatar_url:       { token: '{{user.avatar_url}}',      type: 'string' },
  },

  // VEHICLE
  vehicle: {
    id:               { token: '{{vehicle.id}}',           type: 'string' },
    name:             { token: '{{vehicle.name}}',         type: 'string' },
    type:             { token: '{{vehicle.type}}',         type: 'enum', values: ['Flatcar', 'Boxcar', 'Container', 'Hopper', 'Gondola'] },
    length:           { token: '{{vehicle.length}}',       type: 'number', unit: 'meters' },
    width:            { token: '{{vehicle.width}}',        type: 'number', unit: 'meters' },
    height:           { token: '{{vehicle.height}}',       type: 'number', unit: 'meters' },
    max_weight:       { token: '{{vehicle.max_weight}}',   type: 'number', unit: 'kg' },
    axles:            { token: '{{vehicle.axles}}',        type: 'number' },
    status:           { token: '{{vehicle.status}}',       type: 'enum', values: ['active', 'maintenance', 'inactive'] },
    hazmat:           { token: '{{vehicle.hazmat}}',       type: 'boolean' },
    fragile:          { token: '{{vehicle.fragile}}',      type: 'boolean' },
    refrigerated:     { token: '{{vehicle.refrigerated}}', type: 'boolean' },
    created_at:       { token: '{{vehicle.created_at}}',   type: 'datetime' },
    org_id:           { token: '{{vehicle.org_id}}',       type: 'string' },
  },

  // LOAD
  load: {
    id:               { token: '{{load.id}}',              type: 'string' },
    name:             { token: '{{load.name}}',            type: 'string' },
    weight:           { token: '{{load.weight}}',          type: 'number', unit: 'kg' },
    length:           { token: '{{load.length}}',          type: 'number', unit: 'meters' },
    width:            { token: '{{load.width}}',           type: 'number', unit: 'meters' },
    height:           { token: '{{load.height}}',          type: 'number', unit: 'meters' },
    cg_x:             { token: '{{load.cg_x}}',            type: 'number', unit: 'meters' },
    cg_y:             { token: '{{load.cg_y}}',            type: 'number', unit: 'meters' },
    cg_z:             { token: '{{load.cg_z}}',            type: 'number', unit: 'meters' },
    hazmat_class:     { token: '{{load.hazmat_class}}',    type: 'string' },
    fragile:          { token: '{{load.fragile}}',         type: 'boolean' },
    stackable:        { token: '{{load.stackable}}',       type: 'boolean' },
    quantity:         { token: '{{load.quantity}}',        type: 'number' },
    status:           { token: '{{load.status}}',          type: 'enum', values: ['draft', 'ready', 'in_use', 'archived'] },
    created_at:       { token: '{{load.created_at}}',      type: 'datetime' },
    org_id:           { token: '{{load.org_id}}',          type: 'string' },
  },

  // OPTIMIZATION
  optimization: {
    id:               { token: '{{optimization.id}}',              type: 'string' },
    status:           { token: '{{optimization.status}}',          type: 'enum', values: ['queued', 'processing', 'completed', 'failed', 'warning'] },
    progress:         { token: '{{optimization.progress}}',        type: 'number', unit: 'percent' },
    vehicle_ids:      { token: '{{optimization.vehicle_ids}}',     type: 'array<string>' },
    load_ids:         { token: '{{optimization.load_ids}}',        type: 'array<string>' },
    utilization:      { token: '{{optimization.utilization}}',     type: 'number', unit: 'percent' },
    cg_value:         { token: '{{optimization.cg_value}}',        type: 'number', unit: 'meters' },
    axle_load:        { token: '{{optimization.axle_load}}',       type: 'number', unit: 'kg/axle' },
    heatmap:          { token: '{{optimization.heatmap}}',         type: 'array<HeatmapCell>' },
    placements:       { token: '{{optimization.placements}}',      type: 'array<Placement3D>' },
    violations:       { token: '{{optimization.violations}}',      type: 'array<Violation>' },
    score:            { token: '{{optimization.score}}',           type: 'number' },
    created_by:       { token: '{{optimization.created_by}}',      type: 'string' },
    created_at:       { token: '{{optimization.created_at}}',      type: 'datetime' },
    completed_at:     { token: '{{optimization.completed_at}}',    type: 'datetime' },
    org_id:           { token: '{{optimization.org_id}}',          type: 'string' },
    mode:             { token: '{{optimization.mode}}',            type: 'enum', values: ['weight', 'space', 'balanced', 'multi-objective'] },
    explainability:   { token: '{{optimization.explainability}}',  type: 'object' },
  },

  // REPORT
  report: {
    id:               { token: '{{report.id}}',            type: 'string' },
    period:           { token: '{{report.period}}',        type: 'enum', values: ['1M', '3M', '6M', '1Y'] },
    avg_efficiency:   { token: '{{report.avg_efficiency}}', type: 'number', unit: 'percent' },
    total_jobs:       { token: '{{report.total_jobs}}',    type: 'number' },
    fleet_uptime:     { token: '{{report.fleet_uptime}}',  type: 'number', unit: 'percent' },
    cost_savings:     { token: '{{report.cost_savings}}',  type: 'number', unit: 'USD' },
    monthly_series:   { token: '{{report.monthly_series}}', type: 'array<MonthlyPoint>' },
    vehicle_util:     { token: '{{report.vehicle_util}}',  type: 'array<VehicleUtilPoint>' },
    top_routes:       { token: '{{report.top_routes}}',    type: 'array<RoutePoint>' },
  },

  // AUDIT
  audit: {
    id:               { token: '{{audit.id}}',             type: 'string' },
    user:             { token: '{{audit.user}}',           type: 'string' },
    action:           { token: '{{audit.action}}',         type: 'string' },
    resource:         { token: '{{audit.resource}}',       type: 'string' },
    resource_id:      { token: '{{audit.resource_id}}',    type: 'string' },
    timestamp:        { token: '{{audit.timestamp}}',      type: 'datetime' },
    ip_address:       { token: '{{audit.ip_address}}',     type: 'string' },
    severity:         { token: '{{audit.severity}}',       type: 'enum', values: ['info', 'warning', 'critical'] },
    org_id:           { token: '{{audit.org_id}}',         type: 'string' },
    metadata:         { token: '{{audit.metadata}}',       type: 'object' },
  },

  // SYSTEM (Super Admin)
  system: {
    active_users:     { token: '{{system.active_users}}',    type: 'number' },
    active_jobs:      { token: '{{system.active_jobs}}',     type: 'number' },
    error_rate:       { token: '{{system.error_rate}}',      type: 'number', unit: 'percent' },
    api_requests:     { token: '{{system.api_requests}}',    type: 'number', unit: 'req/min' },
    worker_util:      { token: '{{system.worker_util}}',     type: 'number', unit: 'percent' },
    queue_length:     { token: '{{system.queue_length}}',    type: 'number' },
    db_query_time:    { token: '{{system.db_query_time}}',   type: 'number', unit: 'ms' },
    cache_hit_rate:   { token: '{{system.cache_hit_rate}}',  type: 'number', unit: 'percent' },
    uptime:           { token: '{{system.uptime}}',          type: 'number', unit: 'percent' },
    version:          { token: '{{system.version}}',         type: 'string' },
  },

  // ORGANIZATION
  org: {
    id:               { token: '{{org.id}}',               type: 'string' },
    name:             { token: '{{org.name}}',             type: 'string' },
    plan:             { token: '{{org.plan}}',             type: 'enum', values: ['starter', 'professional', 'enterprise'] },
    status:           { token: '{{org.status}}',           type: 'enum', values: ['active', 'suspended', 'trial'] },
    user_count:       { token: '{{org.user_count}}',       type: 'number' },
    job_count:        { token: '{{org.job_count}}',        type: 'number' },
    created_at:       { token: '{{org.created_at}}',       type: 'datetime' },
    owner_email:      { token: '{{org.owner_email}}',      type: 'string' },
    region:           { token: '{{org.region}}',           type: 'string' },
  },

  // API KEYS
  apikey: {
    id:               { token: '{{apikey.id}}',            type: 'string' },
    name:             { token: '{{apikey.name}}',          type: 'string' },
    key_prefix:       { token: '{{apikey.key_prefix}}',    type: 'string' },
    scopes:           { token: '{{apikey.scopes}}',        type: 'array<string>' },
    created_at:       { token: '{{apikey.created_at}}',    type: 'datetime' },
    last_used:        { token: '{{apikey.last_used}}',     type: 'datetime' },
    expires_at:       { token: '{{apikey.expires_at}}',    type: 'datetime' },
    status:           { token: '{{apikey.status}}',        type: 'enum', values: ['active', 'revoked', 'expired'] },
  },

  // ROLE / PERMISSION
  role: {
    id:               { token: '{{role.id}}',              type: 'string' },
    name:             { token: '{{role.name}}',            type: 'string' },
    description:      { token: '{{role.description}}',     type: 'string' },
    permissions:      { token: '{{role.permissions}}',     type: 'array<string>' },
    user_count:       { token: '{{role.user_count}}',      type: 'number' },
    is_system:        { token: '{{role.is_system}}',       type: 'boolean' },
  },
};

// ──────────────────────────────────────────────
// ENDPOINT DEFINITIONS
// ──────────────────────────────────────────────
export const ENDPOINTS = {
  // AUTH
  'POST /auth/login':           { payload: ['auth.email', 'auth.password'],                         response: ['auth.access_token', 'auth.refresh_token', 'auth.role', 'auth.org_id', 'auth.user_id'] },
  'POST /auth/signup':          { payload: ['auth.email', 'auth.password', 'auth.org_name', 'auth.invite_code'], response: ['auth.access_token', 'auth.role', 'auth.org_id'] },
  'POST /auth/refresh':         { payload: ['auth.refresh_token'],                                  response: ['auth.access_token'] },
  'POST /auth/logout':          { payload: [],                                                       response: [] },
  'POST /auth/forgot-password': { payload: ['auth.email'],                                           response: [] },

  // USERS
  'GET /users':                 { params: ['search', 'role', 'status', 'page', 'limit'],            response: ['user[]', 'total', 'page'] },
  'GET /users/{id}':            { params: [],                                                        response: ['user'] },
  'POST /users/invite':         { payload: ['user.email', 'user.role'],                             response: ['user'] },
  'PATCH /users/{id}':          { payload: ['user.role', 'user.status'],                            response: ['user'] },
  'DELETE /users/{id}':         { payload: [],                                                       response: [] },
  'POST /users/{id}/suspend':   { payload: ['reason'],                                              response: ['user'] },
  'POST /users/{id}/activate':  { payload: [],                                                       response: ['user'] },

  // VEHICLES
  'GET /vehicles':              { params: ['search', 'type', 'status', 'page', 'limit'],            response: ['vehicle[]', 'total'] },
  'GET /vehicles/{id}':         { params: [],                                                        response: ['vehicle'] },
  'POST /vehicles':             { payload: ['vehicle.name', 'vehicle.type', 'vehicle.length', 'vehicle.width', 'vehicle.height', 'vehicle.max_weight', 'vehicle.axles', 'vehicle.hazmat', 'vehicle.fragile', 'vehicle.refrigerated'], response: ['vehicle'] },
  'PATCH /vehicles/{id}':       { payload: ['vehicle.*'],                                           response: ['vehicle'] },
  'DELETE /vehicles/{id}':      { payload: [],                                                       response: [] },
  'POST /vehicles/bulk-import': { payload: ['file: CSV/JSON'],                                      response: ['imported_count', 'errors[]'] },

  // LOADS
  'GET /loads':                 { params: ['search', 'status', 'hazmat', 'page', 'limit'],          response: ['load[]', 'total'] },
  'GET /loads/{id}':            { params: [],                                                        response: ['load'] },
  'POST /loads':                { payload: ['load.name', 'load.weight', 'load.length', 'load.width', 'load.height', 'load.cg_x', 'load.cg_y', 'load.cg_z', 'load.hazmat_class', 'load.fragile', 'load.stackable', 'load.quantity'], response: ['load'] },
  'PATCH /loads/{id}':          { payload: ['load.*'],                                              response: ['load'] },
  'DELETE /loads/{id}':         { payload: [],                                                       response: [] },
  'POST /loads/bulk-import':    { payload: ['file: CSV/JSON'],                                      response: ['imported_count', 'errors[]'] },

  // OPTIMIZATION
  'GET /optimization':                    { params: ['status', 'page', 'limit'],                    response: ['optimization[]', 'total'] },
  'GET /optimization/{id}':              { params: [],                                               response: ['optimization'] },
  'POST /optimization/run':              { payload: ['optimization.vehicle_ids', 'optimization.load_ids', 'optimization.mode'], response: ['optimization.id', 'optimization.status'] },
  'GET /optimization/{id}/progress':     { params: [],                                               response: ['optimization.progress', 'optimization.status'] },
  'GET /optimization/{id}/results':      { params: [],                                               response: ['optimization.placements', 'optimization.utilization', 'optimization.cg_value', 'optimization.axle_load', 'optimization.heatmap', 'optimization.violations', 'optimization.score'] },
  'DELETE /optimization/{id}':           { payload: [],                                              response: [] },
  'POST /optimization/{id}/export':      { payload: ['format: pdf|csv|json'],                       response: ['download_url'] },

  // REPORTS
  'GET /reports/summary':       { params: ['period', 'org_id'],                                     response: ['report.avg_efficiency', 'report.total_jobs', 'report.fleet_uptime', 'report.cost_savings'] },
  'GET /reports/series':        { params: ['period', 'metric'],                                     response: ['report.monthly_series'] },
  'GET /reports/vehicle-util':  { params: ['period'],                                               response: ['report.vehicle_util'] },
  'GET /reports/routes':        { params: ['period', 'limit'],                                      response: ['report.top_routes'] },
  'POST /reports/export':       { payload: ['period', 'format: pdf|xlsx'],                          response: ['download_url'] },

  // AUDIT LOGS
  'GET /audit-logs':            { params: ['user_id', 'action', 'resource', 'severity', 'from', 'to', 'page', 'limit'], response: ['audit[]', 'total'] },
  'GET /audit-logs/global':     { params: ['org_id', 'user_id', 'action', 'from', 'to', 'page'],  response: ['audit[]', 'total'] },
  'GET /audit-logs/export':     { params: ['from', 'to', 'format: csv|json'],                      response: ['download_url'] },

  // ROLES
  'GET /roles':                 { params: [],                                                        response: ['role[]'] },
  'GET /roles/{id}':            { params: [],                                                        response: ['role'] },
  'POST /roles':                { payload: ['role.name', 'role.description', 'role.permissions'],   response: ['role'] },
  'PATCH /roles/{id}':          { payload: ['role.permissions'],                                    response: ['role'] },
  'DELETE /roles/{id}':         { payload: [],                                                       response: [] },

  // API KEYS
  'GET /api-keys':              { params: [],                                                        response: ['apikey[]'] },
  'POST /api-keys':             { payload: ['apikey.name', 'apikey.scopes', 'apikey.expires_at'],   response: ['apikey', 'secret_key (one-time)'] },
  'DELETE /api-keys/{id}':      { payload: [],                                                       response: [] },

  // SYSTEM (Super Admin)
  'GET /system/metrics':        { params: [],                                                        response: ['system.active_users', 'system.active_jobs', 'system.error_rate', 'system.api_requests', 'system.worker_util', 'system.queue_length', 'system.db_query_time', 'system.cache_hit_rate'] },
  'GET /system/jobs':           { params: ['status', 'org_id'],                                     response: ['optimization[]'] },
  'GET /system/errors':         { params: ['from', 'to'],                                           response: ['error[]'] },
  'GET /system/api-usage':      { params: ['org_id', 'period'],                                     response: ['usage[]'] },

  // ORGANIZATIONS
  'GET /organizations':         { params: ['status', 'plan', 'search'],                             response: ['org[]', 'total'] },
  'GET /organizations/{id}':    { params: [],                                                        response: ['org'] },
  'POST /organizations':        { payload: ['org.name', 'org.plan', 'org.owner_email'],             response: ['org'] },
  'PATCH /organizations/{id}':  { payload: ['org.plan', 'org.status'],                              response: ['org'] },
  'DELETE /organizations/{id}': { payload: [],                                                       response: [] },

  // FEATURES
  'GET /features':              { params: ['org_id'],                                                response: ['feature[]'] },
  'PATCH /features/{key}':      { payload: ['enabled: boolean', 'org_id?'],                         response: ['feature'] },

  // SETTINGS
  'GET /settings':              { params: [],                                                        response: ['settings'] },
  'PATCH /settings':            { payload: ['settings.*'],                                          response: ['settings'] },
};

// ──────────────────────────────────────────────
// ACTION DEFINITIONS (UI buttons/triggers)
// ──────────────────────────────────────────────
export const ACTIONS = {
  // AUTH
  'login_submit':           { trigger: 'onClick (Sign In button)',     method: 'POST', endpoint: '/auth/login',          payload: ['auth.email', 'auth.password'],                   storeToken: true, redirect: 'role-based' },
  'signup_submit':          { trigger: 'onClick (Create Account)',     method: 'POST', endpoint: '/auth/signup',         payload: ['auth.org_name', 'auth.email', 'auth.password', 'auth.invite_code'], storeToken: true, redirect: '/' },
  'logout':                 { trigger: 'onClick (Logout)',             method: 'POST', endpoint: '/auth/logout',         payload: [],                                               clearToken: true,  redirect: '/login' },

  // JOBS
  'new_job':                { trigger: 'onClick (New Job)',            method: 'POST', endpoint: '/optimization/run',   payload: ['optimization.vehicle_ids', 'optimization.load_ids', 'optimization.mode'], redirect: '/jobs/processing?id={{optimization.id}}' },
  'delete_job':             { trigger: 'onClick (Delete Job)',         method: 'DELETE', endpoint: '/optimization/{id}', payload: [],                                              invalidates: ['GET /optimization', 'GET /dashboard'] },
  'export_job':             { trigger: 'onClick (Export)',             method: 'POST', endpoint: '/optimization/{id}/export', payload: ['format'],                                 response: 'download_url' },
  'view_results':           { trigger: 'onClick (View Results)',       method: 'GET',  endpoint: '/optimization/{id}/results', payload: [],                                        redirect: '/jobs/results?id={{optimization.id}}' },
  'poll_progress':          { trigger: 'interval (2s, Processing)',    method: 'GET',  endpoint: '/optimization/{id}/progress', payload: [],                                       stopOn: 'completed|failed' },

  // VEHICLES
  'add_vehicle':            { trigger: 'onClick (Add Vehicle)',        method: 'POST', endpoint: '/vehicles',            payload: ['vehicle.*'],                                   invalidates: ['GET /vehicles'] },
  'edit_vehicle':           { trigger: 'onClick (Edit)',               method: 'PATCH', endpoint: '/vehicles/{id}',      payload: ['vehicle.*'],                                   invalidates: ['GET /vehicles'] },
  'delete_vehicle':         { trigger: 'onClick (Delete)',             method: 'DELETE', endpoint: '/vehicles/{id}',     payload: [],                                              invalidates: ['GET /vehicles'] },
  'bulk_import_vehicles':   { trigger: 'onChange (File Upload)',       method: 'POST', endpoint: '/vehicles/bulk-import', payload: ['file'],                                       invalidates: ['GET /vehicles'] },

  // LOADS
  'add_load':               { trigger: 'onClick (Add Load)',           method: 'POST', endpoint: '/loads',               payload: ['load.*'],                                      invalidates: ['GET /loads'] },
  'edit_load':              { trigger: 'onClick (Edit)',               method: 'PATCH', endpoint: '/loads/{id}',          payload: ['load.*'],                                      invalidates: ['GET /loads'] },
  'delete_load':            { trigger: 'onClick (Delete)',             method: 'DELETE', endpoint: '/loads/{id}',         payload: [],                                              invalidates: ['GET /loads'] },
  'bulk_import_loads':      { trigger: 'onChange (File Upload)',       method: 'POST', endpoint: '/loads/bulk-import',    payload: ['file'],                                        invalidates: ['GET /loads'] },

  // USERS
  'invite_user':            { trigger: 'onClick (Invite User)',        method: 'POST', endpoint: '/users/invite',        payload: ['user.email', 'user.role'],                     invalidates: ['GET /users'] },
  'suspend_user':           { trigger: 'onClick (Suspend)',            method: 'POST', endpoint: '/users/{id}/suspend',  payload: ['reason'],                                      invalidates: ['GET /users'] },
  'activate_user':          { trigger: 'onClick (Activate)',           method: 'POST', endpoint: '/users/{id}/activate', payload: [],                                              invalidates: ['GET /users'] },
  'change_user_role':       { trigger: 'onChange (Role select)',       method: 'PATCH', endpoint: '/users/{id}',         payload: ['user.role'],                                   invalidates: ['GET /users'] },
  'delete_user':            { trigger: 'onClick (Delete User)',        method: 'DELETE', endpoint: '/users/{id}',        payload: [],                                              invalidates: ['GET /users'] },

  // API KEYS
  'create_api_key':         { trigger: 'onClick (Create Key)',         method: 'POST', endpoint: '/api-keys',            payload: ['apikey.name', 'apikey.scopes', 'apikey.expires_at'], response: 'secret_key (one-time display)' },
  'revoke_api_key':         { trigger: 'onClick (Revoke)',             method: 'DELETE', endpoint: '/api-keys/{id}',     payload: [],                                              invalidates: ['GET /api-keys'] },

  // REPORTS
  'filter_report':          { trigger: 'onClick (Period tabs)',        method: 'GET',  endpoint: '/reports/summary',     payload: ['report.period'] },
  'export_report':          { trigger: 'onClick (Export Report)',      method: 'POST', endpoint: '/reports/export',      payload: ['period', 'format'] },

  // AUDIT LOGS
  'filter_audit':           { trigger: 'onChange (Filters)',           method: 'GET',  endpoint: '/audit-logs',          payload: ['user_id', 'action', 'severity', 'from', 'to'] },
  'export_audit':           { trigger: 'onClick (Export)',             method: 'GET',  endpoint: '/audit-logs/export',   payload: ['from', 'to', 'format'] },

  // ROLES
  'save_role':              { trigger: 'onClick (Save Role)',          method: 'POST', endpoint: '/roles',               payload: ['role.name', 'role.permissions'],               invalidates: ['GET /roles'] },
  'update_permissions':     { trigger: 'onChange (Permission toggle)', method: 'PATCH', endpoint: '/roles/{id}',         payload: ['role.permissions'],                            invalidates: ['GET /roles'] },

  // SUPER ADMIN
  'refresh_metrics':        { trigger: 'interval (3s) | onClick',     method: 'GET',  endpoint: '/system/metrics',      payload: [] },
  'suspend_org':            { trigger: 'onClick (Suspend Org)',        method: 'PATCH', endpoint: '/organizations/{id}', payload: ['org.status: suspended'] },
  'toggle_feature':         { trigger: 'onChange (Feature toggle)',    method: 'PATCH', endpoint: '/features/{key}',     payload: ['enabled', 'org_id?'] },
};

// ──────────────────────────────────────────────
// LOADING / ERROR / EMPTY STATE KEYS
// ──────────────────────────────────────────────
export const UI_STATES = {
  loading:  '[STATE: loading]  — Show skeleton/spinner while awaiting API response',
  error:    '[STATE: error]    — Show error banner with message from API response body',
  empty:    '[STATE: empty]    — Show empty state illustration when API returns empty array',
  success:  '[STATE: success]  — Show toast notification on successful mutation',
};

// ──────────────────────────────────────────────
// BACKEND REQUIREMENTS (JWT + RBAC)
// ──────────────────────────────────────────────
export const BACKEND_REQUIREMENTS = [
  'Implement JWT authentication (access + refresh token pair)',
  'Return user.role, user.org_id, user.id in every auth response',
  'All API endpoints must require Authorization: Bearer <token> header',
  'Tokens must be stored securely (httpOnly cookie preferred, or encrypted localStorage)',
  'Implement role-based access control (RBAC) server-side — do not trust client role claims',
  'Super Admin routes must be protected separately from org-scoped routes',
  'Return standardized error shape: { error: string, code: string, details?: any }',
  'Return standardized pagination: { data: [], total: number, page: number, limit: number }',
  'All timestamps must be ISO 8601 UTC strings',
  'Audit log every mutation (POST/PATCH/DELETE) server-side automatically',
  'Rate-limit /auth/login to 10 req/min per IP',
  'API key authentication must be accepted as alternative to JWT for machine-to-machine calls',
];

export type ApiBindings = typeof FIELD_BINDINGS;
export type EndpointKey = keyof typeof ENDPOINTS;
export type ActionKey = keyof typeof ACTIONS;
