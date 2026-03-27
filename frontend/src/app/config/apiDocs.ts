/**
 * OptiLoad – Full Developer Comment Layer
 * ========================================
 * Structured API comment blocks, variable comments, action comments,
 * and state comments for every module in the application.
 * This file serves as the frontend-to-backend contract.
 */

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

export interface ApiComment {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  module: string;
  description: string;
  auth: boolean;
  authNote?: string;
  request: {
    headers?: string[];
    queryParams?: Array<{ name: string; type: string; required: boolean; description: string }>;
    body?: Array<{ field: string; type: string; required: boolean; description: string; validation?: string }>;
  };
  response: {
    success: string; // JSON string representation
    successCode: number;
    errorCodes: Array<{ code: number; meaning: string }>;
  };
  uiBindings: Array<{ token: string; element: string; screen: string }>;
  states: Array<{ state: string; behavior: string }>;
  edgeCases: string[];
  validation: string[];
  notes?: string;
}

export interface VariableComment {
  token: string;
  namespace: string;
  name: string;
  type: string;
  source: string;
  sourceMethod: string;
  description: string;
  usedIn: string[];
  validation: string[];
  fallback: string;
  sensitive?: boolean;
  example?: string;
}

export interface ActionComment {
  id: string;
  module: string;
  action: string;
  trigger: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  payload?: Array<{ field: string; type: string; required: boolean; description: string }>;
  successBehavior: string[];
  errorBehavior: string[];
  validation: string[];
  optimisticUpdate?: string;
  invalidates?: string[];
  redirect?: string;
}

export interface StateComment {
  state: string;
  module: string;
  trigger: string;
  uiBehavior: string[];
  disabledElements: string[];
  exitCondition: string;
  transitionTo: string;
  example: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 1 — AUTH / LOGIN
// ─────────────────────────────────────────────────────────────────────────────

export const AUTH_API_COMMENTS: ApiComment[] = [
  {
    endpoint: '/auth/login',
    method: 'POST',
    module: 'Auth',
    description: 'Authenticate a user with email and password. Returns a JWT access token and refresh token. Role is embedded in the token payload and must be used for client-side routing. All subsequent API requests must include the access token in the Authorization header.',
    auth: false,
    authNote: 'No token required — this is the token issuance endpoint.',
    request: {
      headers: ['Content-Type: application/json'],
      body: [
        { field: 'email',    type: 'string',  required: true,  description: 'User work email address', validation: 'Must be valid email format' },
        { field: 'password', type: 'string',  required: true,  description: 'User password (min 8 chars)', validation: 'Min 8 characters' },
      ],
    },
    response: {
      successCode: 200,
      success: `{
  "access_token":  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "expires_in":    3600,
  "user": {
    "id":              "{{auth.user_id}}",
    "email":           "{{auth.email}}",
    "role":            "{{auth.role}}",
    "organization_id": "{{auth.org_id}}",
    "name":            "{{user.name}}"
  }
}`,
      errorCodes: [
        { code: 401, meaning: 'Invalid credentials (wrong email or password)' },
        { code: 403, meaning: 'User account is suspended' },
        { code: 429, meaning: 'Rate limit exceeded (10 req/min per IP)' },
        { code: 422, meaning: 'Validation error (email format invalid)' },
      ],
    },
    uiBindings: [
      { token: '{{auth.email}}',        element: 'Email input field',         screen: 'Login' },
      { token: '{{auth.password}}',     element: 'Password input field',      screen: 'Login' },
      { token: '{{auth.access_token}}', element: 'Stored in localStorage',    screen: 'All screens (Authorization header)' },
      { token: '{{auth.role}}',         element: 'Role-based redirect logic',  screen: 'Login → post-auth routing' },
      { token: '{{auth.org_id}}',       element: 'Org context header',        screen: 'All API calls' },
      { token: '{{user.name}}',         element: 'Sidebar user display name', screen: 'AppLayout sidebar' },
    ],
    states: [
      { state: 'loading',  behavior: 'Disable submit button, show Loader2 spinner inside button, replace button label with "Authenticating..."' },
      { state: 'error',    behavior: 'Show red error banner below form with message from API response body: "Invalid credentials" or "Account suspended"' },
      { state: 'success',  behavior: 'Store access_token + refresh_token in localStorage, update AuthContext, redirect based on role' },
    ],
    edgeCases: [
      'If role === "Super Admin" → redirect to /super-admin',
      'If role === any other → redirect to /',
      'If token already exists in localStorage on page load → skip login, redirect directly',
      'If access_token expires mid-session → call POST /auth/refresh silently, retry original request',
      'If refresh_token also expired → clear localStorage, redirect to /login with session-expired param',
      'If user is suspended → show specific "Account suspended" message, do NOT store token',
    ],
    validation: [
      'email: required, valid email format (RFC 5322)',
      'password: required, min 1 character (server validates strength)',
      'Client must NOT store plain-text password anywhere',
    ],
    notes: 'Rate-limited to 10 requests per minute per IP. Use exponential backoff on 429 responses.',
  },
  {
    endpoint: '/auth/signup',
    method: 'POST',
    module: 'Auth',
    description: 'Create a new organization and its first owner user. The org_name becomes the tenant namespace. Returns same token structure as /auth/login. If invite_code is provided, join an existing org instead of creating a new one.',
    auth: false,
    request: {
      headers: ['Content-Type: application/json'],
      body: [
        { field: 'org_name',    type: 'string',  required: true,  description: 'Organization display name', validation: 'Min 2, max 100 chars' },
        { field: 'email',       type: 'string',  required: true,  description: 'Owner email address', validation: 'Valid email, must not already exist' },
        { field: 'password',    type: 'string',  required: true,  description: 'Account password', validation: 'Min 8 chars, 1 uppercase, 1 number' },
        { field: 'invite_code', type: 'string',  required: false, description: 'Invite code to join existing org (overrides org_name)', validation: 'Must match existing active invite' },
      ],
    },
    response: {
      successCode: 201,
      success: `{
  "access_token":  "{{auth.access_token}}",
  "refresh_token": "{{auth.refresh_token}}",
  "user": {
    "id":              "{{auth.user_id}}",
    "role":            "Organization Owner",
    "organization_id": "{{auth.org_id}}"
  }
}`,
      errorCodes: [
        { code: 409, meaning: 'Email already registered' },
        { code: 400, meaning: 'Invalid invite code' },
        { code: 422, meaning: 'Validation errors on fields' },
      ],
    },
    uiBindings: [
      { token: '{{auth.org_name}}',  element: 'Organization name input', screen: 'Login (signup mode)' },
      { token: '{{auth.invite_code}}', element: 'Invite code input',     screen: 'Login (signup mode)' },
    ],
    states: [
      { state: 'loading', behavior: 'Spinner on "Create Organization" button' },
      { state: 'error',   behavior: 'Show field-level errors (e.g., "Email already exists") or banner for invite code errors' },
    ],
    edgeCases: [
      'If invite_code provided → join existing org (ignore org_name)',
      'If email exists → show "Email already registered" with link to login',
      'Password confirm mismatch → client-side validation, prevent submit',
    ],
    validation: [
      'password === confirm_password (client-side)',
      'org_name: 2-100 chars, no special chars except hyphens and spaces',
      'email: RFC 5322 format',
    ],
  },
  {
    endpoint: '/auth/refresh',
    method: 'POST',
    module: 'Auth',
    description: 'Exchange a valid refresh token for a new access token. Called automatically by the API client when a 401 is received on any protected endpoint. The user never sees this call. If refresh token is also expired, the session must be terminated.',
    auth: false,
    request: {
      body: [
        { field: 'refresh_token', type: 'string', required: true, description: 'The refresh token from login response' },
      ],
    },
    response: {
      successCode: 200,
      success: `{
  "access_token": "{{auth.access_token}}",
  "expires_in":   3600
}`,
      errorCodes: [
        { code: 401, meaning: 'Refresh token expired or invalid → must re-login' },
      ],
    },
    uiBindings: [
      { token: '{{auth.access_token}}', element: 'Updated in localStorage and all future request headers', screen: 'All screens (transparent)' },
    ],
    states: [
      { state: 'transparent', behavior: 'No UI change — runs silently in background interceptor' },
      { state: 'error',       behavior: 'If 401 returned → clear all tokens, redirect to /login?reason=session_expired' },
    ],
    edgeCases: ['Prevent duplicate refresh calls — use a single in-flight promise for concurrent requests'],
    validation: ['refresh_token must not be empty'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 2 — USERS
// ─────────────────────────────────────────────────────────────────────────────

export const USERS_API_COMMENTS: ApiComment[] = [
  {
    endpoint: '/users',
    method: 'GET',
    module: 'Users',
    description: 'Fetch all users belonging to the authenticated user\'s organization. Supports search, role filter, status filter, and pagination. Results are scoped to org_id extracted from the JWT. Super Admins use /users/global instead.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}'],
      queryParams: [
        { name: 'search', type: 'string',  required: false, description: 'Filter by name or email (partial match, case-insensitive)' },
        { name: 'role',   type: 'string',  required: false, description: 'Filter by exact role name (e.g., "Admin", "Rail Planner")' },
        { name: 'status', type: 'string',  required: false, description: 'Filter by status: active | suspended | invited' },
        { name: 'page',   type: 'number',  required: false, description: 'Page number, 1-indexed (default: 1)' },
        { name: 'limit',  type: 'number',  required: false, description: 'Results per page (default: 25, max: 100)' },
      ],
    },
    response: {
      successCode: 200,
      success: `{
  "data": [
    {
      "id":          "{{user.id}}",
      "name":        "{{user.name}}",
      "email":       "{{user.email}}",
      "role":        "{{user.role}}",
      "status":      "{{user.status}}",
      "last_active": "{{user.last_active}}",
      "mfa_enabled": {{user.mfa_enabled}},
      "jobs_run":    {{user.jobs_run}},
      "created_by":  "{{user.created_by}}",
      "created_at":  "{{user.created_at}}"
    }
  ],
  "total": {{number}},
  "page":  {{number}},
  "limit": {{number}}
}`,
      errorCodes: [
        { code: 401, meaning: 'Token expired or missing' },
        { code: 403, meaning: 'Role does not have users:read permission' },
      ],
    },
    uiBindings: [
      { token: '{{user.id}}',          element: 'Row key, delete/edit actions',  screen: 'UserManagement table' },
      { token: '{{user.name}}',        element: 'Name column + avatar initials', screen: 'UserManagement table, Users page' },
      { token: '{{user.email}}',       element: 'Email column',                  screen: 'UserManagement table' },
      { token: '{{user.role}}',        element: 'Role column (color-coded badge)', screen: 'UserManagement table' },
      { token: '{{user.status}}',      element: 'Status badge (Active/Suspended/Invited)', screen: 'UserManagement table' },
      { token: '{{user.last_active}}', element: 'Last Active column (relative time)', screen: 'UserManagement table' },
      { token: '{{user.mfa_enabled}}', element: 'MFA icon indicator',            screen: 'UserManagement table' },
      { token: '{{user.jobs_run}}',    element: 'Jobs Run column',               screen: 'UserManagement table' },
    ],
    states: [
      { state: 'loading', behavior: 'Show 5 skeleton rows in table while fetching' },
      { state: 'error',   behavior: 'Red banner: "Failed to load users. [Retry]"' },
      { state: 'empty',   behavior: 'Empty state: "No users found" with "Invite User" CTA' },
    ],
    edgeCases: [
      'If search + role + status all active → combine as AND filters server-side',
      'If user viewing own record → disable "Delete" and "Suspend" actions',
      'Organization Owner row → no role change allowed (protected)',
      'Page out of range → return last available page, not 404',
    ],
    validation: [
      'role filter must be one of: Organization Owner, Admin, Sub-Admin, Operations Manager, Rail Planner, Compliance Officer, Yard Supervisor, Loader Operator, Viewer',
      'status filter must be one of: active, suspended, invited',
      'limit max: 100',
    ],
  },
  {
    endpoint: '/users/invite',
    method: 'POST',
    module: 'Users',
    description: 'Invite a new user to the organization by email. Sends an invitation email with a time-limited link. The invited user appears in the users list with status "invited" until they accept. Only users with users:invite permission can call this endpoint.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}', 'Content-Type: application/json'],
      body: [
        { field: 'email', type: 'string', required: true,  description: 'Email address of the person to invite', validation: 'Valid email, must not already be a member' },
        { field: 'role',  type: 'string', required: true,  description: 'Initial role to assign on acceptance', validation: 'Must be a valid role below inviter\'s own role' },
      ],
    },
    response: {
      successCode: 201,
      success: `{
  "data": {
    "id":         "{{user.id}}",
    "email":      "{{user.email}}",
    "role":       "{{user.role}}",
    "status":     "invited",
    "invited_at": "{{user.created_at}}"
  }
}`,
      errorCodes: [
        { code: 409, meaning: 'Email already belongs to an org member' },
        { code: 403, meaning: 'Cannot assign role equal to or above your own role' },
        { code: 422, meaning: 'Validation error' },
      ],
    },
    uiBindings: [
      { token: '{{user.email}}', element: 'Invite modal email input', screen: 'UserManagement' },
      { token: '{{user.role}}',  element: 'Invite modal role selector', screen: 'UserManagement' },
    ],
    states: [
      { state: 'loading', behavior: 'Spinner on "Send Invite" button' },
      { state: 'success', behavior: 'Close invite modal, show success toast: "Invitation sent to {{user.email}}", refresh users list' },
      { state: 'error',   behavior: 'Show error inside modal: "This email is already a member" or validation message' },
    ],
    edgeCases: [
      'Invitation link expires after 72 hours — show "Resend Invite" action for invited users',
      'If email domain blocked by org SSO → show specific error',
      'Role dropdown must only show roles lower than the inviter\'s own role',
    ],
    validation: [
      'email: required, valid format, not already in org',
      'role: required, must be valid role enum, must be ≤ inviter\'s role in hierarchy',
    ],
  },
  {
    endpoint: '/users/{id}',
    method: 'PATCH',
    module: 'Users',
    description: 'Update a specific user\'s role or status within the organization. Partial updates are supported — only send fields that changed. Cannot demote Organization Owner or modify own role. Audit logged automatically.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}', 'Content-Type: application/json'],
      body: [
        { field: 'role',   type: 'string',  required: false, description: 'New role to assign', validation: 'Valid role enum, below editor\'s own role' },
        { field: 'status', type: 'string',  required: false, description: 'New status: active | suspended', validation: 'active or suspended only (not invited)' },
      ],
    },
    response: {
      successCode: 200,
      success: `{
  "data": {
    "id":     "{{user.id}}",
    "role":   "{{user.role}}",
    "status": "{{user.status}}"
  }
}`,
      errorCodes: [
        { code: 403, meaning: 'Cannot modify user with higher or equal role' },
        { code: 404, meaning: 'User not found in this organization' },
        { code: 422, meaning: 'Invalid role or status value' },
      ],
    },
    uiBindings: [
      { token: '{{user.role}}',   element: 'Role selector in user detail drawer', screen: 'UserManagement' },
      { token: '{{user.status}}', element: 'Suspend / Activate toggle button',    screen: 'UserManagement' },
    ],
    states: [
      { state: 'loading', behavior: 'Inline spinner on the changed field, disable the row' },
      { state: 'success', behavior: 'Toast: "User updated successfully", refresh row data' },
      { state: 'error',   behavior: 'Revert field to previous value, show error toast' },
    ],
    edgeCases: [
      'Self-update prevention → disable role/status controls for own user row',
      'Org Owner protection → role field disabled/hidden for Org Owner rows',
      'Optimistic update → apply change immediately, revert on error',
    ],
    validation: [
      'role: valid role string from enum',
      'status: "active" or "suspended" — cannot set to "invited"',
      'Cannot set role higher than or equal to calling user\'s own role',
    ],
  },
  {
    endpoint: '/users/{id}',
    method: 'DELETE',
    module: 'Users',
    description: 'Permanently remove a user from the organization. This is irreversible. The user loses all access immediately. Their historical records (jobs, audit logs) are retained but disassociated. Requires users:delete permission.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}'],
    },
    response: {
      successCode: 204,
      success: '(empty body)',
      errorCodes: [
        { code: 403, meaning: 'Cannot delete user with equal or higher role' },
        { code: 403, meaning: 'Cannot delete yourself' },
        { code: 404, meaning: 'User not found' },
      ],
    },
    uiBindings: [
      { token: '{{user.id}}',   element: 'Delete confirmation modal target ID', screen: 'UserManagement' },
      { token: '{{user.name}}', element: 'Delete modal confirmation text',      screen: 'UserManagement' },
    ],
    states: [
      { state: 'loading', behavior: 'Spinner on "Delete User" confirm button, prevent double-submit' },
      { state: 'success', behavior: 'Close modal, toast: "User removed", remove row from list (optimistic)' },
      { state: 'error',   behavior: 'Show error in modal, keep modal open' },
    ],
    edgeCases: [
      'Must show confirmation modal with user name before proceeding',
      'If deleting last admin → warn: "This will leave the org with no admin"',
      'Org Owner can never be deleted via UI — hide delete action for Org Owner rows',
    ],
    validation: ['User must exist in the current org', 'Target user role must be below caller\'s role'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 3 — ROLES & PERMISSIONS
// ─────────────────────────────────────────────────────────────────────────────

export const ROLES_API_COMMENTS: ApiComment[] = [
  {
    endpoint: '/roles',
    method: 'GET',
    module: 'Roles',
    description: 'Fetch all roles defined for the current organization, including their full permission sets. System roles (Super Admin, Organization Owner) are returned but marked is_system: true and cannot be modified.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}'],
    },
    response: {
      successCode: 200,
      success: `{
  "data": [
    {
      "id":          "{{role.id}}",
      "name":        "{{role.name}}",
      "description": "{{role.description}}",
      "permissions": [{{role.permissions}}],
      "user_count":  {{role.user_count}},
      "is_system":   {{role.is_system}}
    }
  ]
}`,
      errorCodes: [
        { code: 403, meaning: 'Role does not have roles:read permission' },
      ],
    },
    uiBindings: [
      { token: '{{role.id}}',          element: 'Role card key, edit/delete target', screen: 'RolesManagement' },
      { token: '{{role.name}}',        element: 'Role name heading on card',          screen: 'RolesManagement' },
      { token: '{{role.permissions}}', element: 'Permission toggle matrix',           screen: 'RolesManagement' },
      { token: '{{role.user_count}}',  element: '"X users" badge on role card',       screen: 'RolesManagement' },
      { token: '{{role.is_system}}',   element: 'Disables edit/delete for system roles', screen: 'RolesManagement' },
    ],
    states: [
      { state: 'loading', behavior: 'Show 4 skeleton role cards' },
      { state: 'error',   behavior: 'Error banner: "Failed to load roles"' },
      { state: 'empty',   behavior: 'Should never be empty (system roles always exist) — if empty, show critical error' },
    ],
    edgeCases: [
      'System roles → render with lock icon, all permission toggles disabled',
      'role.user_count > 0 → disable delete, show tooltip "Cannot delete role with active users"',
    ],
    validation: [],
  },
  {
    endpoint: '/roles',
    method: 'POST',
    module: 'Roles',
    description: 'Create a new custom role for the organization with a specific permission set. Custom roles can be assigned to users like built-in roles. The permission set must be a subset of the caller\'s own permissions (cannot grant permissions you don\'t have).',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}', 'Content-Type: application/json'],
      body: [
        { field: 'name',        type: 'string',         required: true,  description: 'Display name for the role', validation: 'Unique within org, 2-50 chars' },
        { field: 'description', type: 'string',         required: false, description: 'Human-readable description of the role\'s purpose' },
        { field: 'permissions', type: 'array<string>',  required: true,  description: 'Array of permission key strings', validation: 'Must be subset of caller\'s own permissions' },
      ],
    },
    response: {
      successCode: 201,
      success: `{
  "data": {
    "id":          "{{role.id}}",
    "name":        "{{role.name}}",
    "permissions": [{{role.permissions}}],
    "is_system":   false
  }
}`,
      errorCodes: [
        { code: 409, meaning: 'Role name already exists in this org' },
        { code: 403, meaning: 'Attempting to grant permissions above own level' },
        { code: 422, meaning: 'Invalid permission key in array' },
      ],
    },
    uiBindings: [
      { token: '{{role.name}}',        element: 'Create role modal name input',       screen: 'RolesManagement' },
      { token: '{{role.permissions}}', element: 'Permission checkbox grid in modal',  screen: 'RolesManagement' },
    ],
    states: [
      { state: 'loading', behavior: 'Spinner on "Create Role" button, disable form' },
      { state: 'success', behavior: 'Close modal, toast: "Role created", refresh roles list' },
      { state: 'error',   behavior: 'Show error in modal with specific message' },
    ],
    edgeCases: ['Warn if no permissions selected before submit', 'Role name uniqueness checked client-side on blur (debounced GET /roles?name=)'],
    validation: ['name: 2-50 chars, unique in org', 'permissions: non-empty array, valid permission keys', 'No permission in the array can exceed caller\'s own permission level'],
  },
  {
    endpoint: '/roles/{id}',
    method: 'PATCH',
    module: 'Roles',
    description: 'Update the permission set of a custom role. Changes apply immediately to all users with that role — no need to re-assign. System roles (is_system: true) cannot be modified. Returns the full updated role.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}', 'Content-Type: application/json'],
      body: [
        { field: 'permissions', type: 'array<string>', required: true, description: 'Complete new permission set (not a delta — full replacement)', validation: 'Subset of caller\'s own permissions' },
      ],
    },
    response: {
      successCode: 200,
      success: `{
  "data": {
    "id":          "{{role.id}}",
    "name":        "{{role.name}}",
    "permissions": [{{role.permissions}}],
    "updated_at":  "{{datetime}}"
  }
}`,
      errorCodes: [
        { code: 403, meaning: 'Target is a system role (immutable)' },
        { code: 403, meaning: 'Attempting to add permissions above own level' },
        { code: 404, meaning: 'Role not found' },
      ],
    },
    uiBindings: [
      { token: '{{role.permissions}}', element: 'Individual permission toggle switches in matrix', screen: 'RolesManagement' },
    ],
    states: [
      { state: 'loading', behavior: 'Individual toggle shows spinner state, "Save Changes" button shows loader' },
      { state: 'success', behavior: 'Toast: "Permissions updated for {{role.name}}"' },
      { state: 'error',   behavior: 'Revert toggle to previous state, show error toast' },
    ],
    edgeCases: [
      'Batch mode: collect all toggle changes, send one PATCH on "Save Changes" click',
      'Individual toggle mode: debounce each toggle (500ms), auto-save without button',
      'Warn: "Removing this permission will affect {{role.user_count}} users"',
    ],
    validation: ['permissions array must be valid permission key strings', 'Cannot grant permissions not held by calling user'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 4 — OPTIMIZATION
// ─────────────────────────────────────────────────────────────────────────────

export const OPTIMIZATION_API_COMMENTS: ApiComment[] = [
  {
    endpoint: '/optimization/run',
    method: 'POST',
    module: 'Optimization',
    description: 'Submit a new optimization job to the processing queue. The engine performs multi-objective load optimization (weight distribution, CG, axle load, space utilization) using AAR-compliant algorithms. Returns immediately with a job ID; poll /optimization/{id}/progress for status.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}', 'Content-Type: application/json'],
      body: [
        { field: 'vehicle_ids',   type: 'array<string>', required: true,  description: 'IDs of vehicles to include in this optimization run', validation: 'Min 1, all must belong to current org' },
        { field: 'load_ids',      type: 'array<string>', required: true,  description: 'IDs of loads to place', validation: 'Min 1, all must belong to current org' },
        { field: 'mode',          type: 'string',        required: true,  description: 'Optimization strategy', validation: '"weight" | "space" | "balanced" | "multi-objective"' },
        { field: 'constraints',   type: 'object',        required: false, description: 'Override default AAR constraints (e.g., max_axle_load, cg_tolerance)' },
        { field: 'priority',      type: 'string',        required: false, description: 'Queue priority: "normal" | "high"', validation: 'High priority requires enterprise plan' },
      ],
    },
    response: {
      successCode: 202,
      success: `{
  "data": {
    "id":         "{{optimization.id}}",
    "status":     "queued",
    "queue_pos":  {{number}},
    "estimated_duration_s": {{number}},
    "created_at": "{{optimization.created_at}}"
  }
}`,
      errorCodes: [
        { code: 400, meaning: 'Invalid vehicle_ids or load_ids (not found or wrong org)' },
        { code: 409, meaning: 'Duplicate job (same vehicles + loads already queued/processing)' },
        { code: 402, meaning: 'Plan limit reached (job quota exceeded)' },
        { code: 422, meaning: 'Validation error on payload' },
      ],
    },
    uiBindings: [
      { token: '{{optimization.id}}',     element: 'Returned to redirect to /jobs/processing?id=...', screen: 'OptimizationJobs → Processing' },
      { token: '{{optimization.status}}', element: 'Initial "Queued" status badge',                   screen: 'Processing' },
    ],
    states: [
      { state: 'loading', behavior: 'Spinner on "Run Optimization" button, disable vehicle/load selectors' },
      { state: 'success', behavior: 'Navigate to /jobs/processing?id={{optimization.id}}, show "Job queued" toast' },
      { state: 'error',   behavior: 'Show error banner with reason (e.g., "Vehicle not available", "Quota exceeded")' },
    ],
    edgeCases: [
      'If no vehicles selected → show "Select at least 1 vehicle" validation',
      'If no loads selected → show "Select at least 1 load" validation',
      'If total load weight exceeds combined vehicle capacity → warn before submit (client-side pre-check)',
      'If job already running for same vehicles → show "A similar job is already in progress" warning',
    ],
    validation: [
      'vehicle_ids: array, min length 1, all IDs must exist in org',
      'load_ids: array, min length 1, all IDs must exist in org',
      'mode: one of "weight" | "space" | "balanced" | "multi-objective"',
    ],
  },
  {
    endpoint: '/optimization/{id}/progress',
    method: 'GET',
    module: 'Optimization',
    description: 'Poll the current status and progress percentage of an optimization job. The Processing screen polls this every 2 seconds using setInterval. Stop polling when status is "completed" or "failed". Progress is 0-100.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}'],
    },
    response: {
      successCode: 200,
      success: `{
  "data": {
    "id":       "{{optimization.id}}",
    "status":   "{{optimization.status}}",
    "progress": {{optimization.progress}},
    "stage":    "Calculating axle load distribution...",
    "eta_s":    {{number}}
  }
}`,
      errorCodes: [
        { code: 404, meaning: 'Job not found or belongs to different org' },
      ],
    },
    uiBindings: [
      { token: '{{optimization.progress}}', element: 'Animated progress bar (0-100%)',      screen: 'Processing' },
      { token: '{{optimization.status}}',   element: 'Status badge (queued/processing/...)', screen: 'Processing' },
    ],
    states: [
      { state: 'polling', behavior: 'setInterval 2000ms, running as long as status ∈ {queued, processing}' },
      { state: 'completed', behavior: 'Clear interval, show success message, navigate to /jobs/results?id={{optimization.id}} after 1s delay' },
      { state: 'failed',    behavior: 'Clear interval, show error with failure reason, offer "Retry" button' },
    ],
    edgeCases: [
      'If browser tab hidden → pause polling (visibilitychange event), resume on focus',
      'If 5 consecutive errors on poll → show "Lost connection to server" warning',
      'If status stuck at "queued" for >5 minutes → show "Job may be stalled" warning',
    ],
    validation: ['id: valid UUID from job creation response'],
  },
  {
    endpoint: '/optimization/{id}/results',
    method: 'GET',
    module: 'Optimization',
    description: 'Fetch the complete results of a finished optimization job. Includes 3D placement coordinates for every load, CG position, axle load distribution, heatmap data, space utilization score, and any AAR constraint violations.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}'],
    },
    response: {
      successCode: 200,
      success: `{
  "data": {
    "id":           "{{optimization.id}}",
    "utilization":  {{optimization.utilization}},
    "cg_value":     {{optimization.cg_value}},
    "axle_load":    {{optimization.axle_load}},
    "score":        {{optimization.score}},
    "placements": [
      {
        "load_id": "{{load.id}}",
        "x": 0.0, "y": 0.0, "z": 0.0,
        "rotation": 0,
        "vehicle_id": "{{vehicle.id}}"
      }
    ],
    "heatmap": [
      { "x": 0, "z": 0, "value": {{number}}, "normalized": {{number}} }
    ],
    "violations": [
      {
        "type":    "axle_overload",
        "message": "{{string}}",
        "severity": "warning"
      }
    ]
  }
}`,
      errorCodes: [
        { code: 404, meaning: 'Job not found' },
        { code: 409, meaning: 'Job not yet completed — poll /progress first' },
      ],
    },
    uiBindings: [
      { token: '{{optimization.placements}}',  element: '3D load boxes rendered in Scene3D (Three.js)',  screen: 'Results' },
      { token: '{{optimization.heatmap}}',     element: 'Heatmap overlay on 3D viewport',               screen: 'Results' },
      { token: '{{optimization.cg_value}}',    element: 'CG position indicator in left panel',          screen: 'Results' },
      { token: '{{optimization.axle_load}}',   element: 'Axle load bar chart in left panel',            screen: 'Results' },
      { token: '{{optimization.utilization}}', element: 'Utilization % gauge / hero metric',            screen: 'Results' },
      { token: '{{optimization.violations}}',  element: 'Violation alert badges in constraint panel',   screen: 'Results' },
      { token: '{{optimization.score}}',       element: 'Optimization score display',                   screen: 'Results' },
    ],
    states: [
      { state: 'loading', behavior: 'Show 3D skeleton / loading spinner over viewport, skeleton panels' },
      { state: 'error',   behavior: 'Show "Failed to load results" with retry button' },
      { state: 'success', behavior: 'Render full 3D scene, populate all metric panels, enable export' },
    ],
    edgeCases: [
      'If violations array non-empty → auto-open Constraints panel, show badge count on tab',
      'If THREE.Color() called with heatmap values → wrap in safe parser (see Scene3D.tsx note)',
      'If placements array empty → show "No loads were placed" warning state',
    ],
    validation: ['Job must be in "completed" status before this endpoint returns data'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 5 — VEHICLES
// ─────────────────────────────────────────────────────────────────────────────

export const VEHICLES_API_COMMENTS: ApiComment[] = [
  {
    endpoint: '/vehicles',
    method: 'GET',
    module: 'Vehicles',
    description: 'Fetch all vehicles in the organization\'s fleet. Supports search by name/ID, type filter, and status filter. Results are paginated. Used as source data for the optimization job vehicle selector.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}'],
      queryParams: [
        { name: 'search', type: 'string',  required: false, description: 'Search by vehicle name or ID' },
        { name: 'type',   type: 'string',  required: false, description: 'Filter: Flatcar | Boxcar | Container | Hopper | Gondola' },
        { name: 'status', type: 'string',  required: false, description: 'Filter: active | maintenance | inactive' },
        { name: 'page',   type: 'number',  required: false, description: 'Page number (default: 1)' },
        { name: 'limit',  type: 'number',  required: false, description: 'Results per page (default: 25)' },
      ],
    },
    response: {
      successCode: 200,
      success: `{
  "data": [
    {
      "id":          "{{vehicle.id}}",
      "name":        "{{vehicle.name}}",
      "type":        "{{vehicle.type}}",
      "length":      {{vehicle.length}},
      "width":       {{vehicle.width}},
      "height":      {{vehicle.height}},
      "max_weight":  {{vehicle.max_weight}},
      "axles":       {{vehicle.axles}},
      "status":      "{{vehicle.status}}",
      "hazmat":      {{vehicle.hazmat}},
      "fragile":     {{vehicle.fragile}},
      "refrigerated":{{vehicle.refrigerated}}
    }
  ],
  "total": {{number}},
  "page":  {{number}}
}`,
      errorCodes: [
        { code: 403, meaning: 'vehicles:read permission missing' },
      ],
    },
    uiBindings: [
      { token: '{{vehicle.id}}',         element: 'Row key, checkbox selection, action target', screen: 'Vehicles table' },
      { token: '{{vehicle.name}}',       element: 'Vehicle name column',                        screen: 'Vehicles table' },
      { token: '{{vehicle.type}}',       element: 'Type badge column',                          screen: 'Vehicles table' },
      { token: '{{vehicle.length}}',     element: 'Dimensions cell (L × W × H)',                screen: 'Vehicles table' },
      { token: '{{vehicle.max_weight}}', element: 'Max Weight column',                          screen: 'Vehicles table' },
      { token: '{{vehicle.axles}}',      element: 'Axles column',                               screen: 'Vehicles table' },
      { token: '{{vehicle.status}}',     element: 'Status badge (Active/Maintenance/Inactive)',  screen: 'Vehicles table' },
    ],
    states: [
      { state: 'loading', behavior: 'Skeleton rows (6) in table body' },
      { state: 'error',   behavior: '"Failed to load fleet data" banner with retry' },
      { state: 'empty',   behavior: '"No vehicles found" with "Add Vehicle" and "Import CSV" CTAs' },
    ],
    edgeCases: [
      'Vehicles with status "maintenance" → disable selection in optimization job selector',
      'Bulk selection → show floating action bar with "Archive Selected" and "Delete Selected"',
    ],
    validation: ['type filter: one of Flatcar, Boxcar, Container, Hopper, Gondola', 'status filter: one of active, maintenance, inactive'],
  },
  {
    endpoint: '/vehicles',
    method: 'POST',
    module: 'Vehicles',
    description: 'Create a new vehicle in the fleet. All physical dimensions are required as they feed directly into the 3D optimization engine for spatial calculations. AAR compliance constraints are derived server-side from axle count and max weight.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}', 'Content-Type: application/json'],
      body: [
        { field: 'name',         type: 'string',  required: true,  description: 'Human-readable vehicle name', validation: 'Unique within org' },
        { field: 'type',         type: 'string',  required: true,  description: 'Vehicle type enum', validation: 'Flatcar | Boxcar | Container | Hopper | Gondola' },
        { field: 'length',       type: 'number',  required: true,  description: 'Interior length in meters', validation: '> 0, max 30m' },
        { field: 'width',        type: 'number',  required: true,  description: 'Interior width in meters',  validation: '> 0, max 5m' },
        { field: 'height',       type: 'number',  required: true,  description: 'Interior height in meters', validation: '> 0, max 8m' },
        { field: 'max_weight',   type: 'number',  required: true,  description: 'Maximum payload in kg',     validation: '> 0' },
        { field: 'axles',        type: 'number',  required: true,  description: 'Number of axles',           validation: '2 | 4 | 6 | 8' },
        { field: 'hazmat',       type: 'boolean', required: false, description: 'HAZMAT certified transport', validation: 'default: false' },
        { field: 'fragile',      type: 'boolean', required: false, description: 'Fragile load capable',      validation: 'default: false' },
        { field: 'refrigerated', type: 'boolean', required: false, description: 'Temperature-controlled',    validation: 'default: false' },
      ],
    },
    response: {
      successCode: 201,
      success: `{
  "data": {
    "id":     "{{vehicle.id}}",
    "name":   "{{vehicle.name}}",
    "status": "active"
  }
}`,
      errorCodes: [
        { code: 409, meaning: 'Vehicle name already exists' },
        { code: 422, meaning: 'Dimension validation failed' },
      ],
    },
    uiBindings: [
      { token: '{{vehicle.name}}',       element: 'Add Vehicle form — Name field',        screen: 'Vehicles modal' },
      { token: '{{vehicle.type}}',       element: 'Add Vehicle form — Type select',       screen: 'Vehicles modal' },
      { token: '{{vehicle.length}}',     element: 'Add Vehicle form — Length input',      screen: 'Vehicles modal' },
      { token: '{{vehicle.width}}',      element: 'Add Vehicle form — Width input',       screen: 'Vehicles modal' },
      { token: '{{vehicle.height}}',     element: 'Add Vehicle form — Height input',      screen: 'Vehicles modal' },
      { token: '{{vehicle.max_weight}}', element: 'Add Vehicle form — Max Weight input',  screen: 'Vehicles modal' },
      { token: '{{vehicle.axles}}',      element: 'Add Vehicle form — Axles select',      screen: 'Vehicles modal' },
    ],
    states: [
      { state: 'loading', behavior: 'Spinner on "Save Vehicle" button' },
      { state: 'success', behavior: 'Close modal, toast: "Vehicle added", prepend new row to table' },
      { state: 'error',   behavior: 'Show field-level validation errors inline' },
    ],
    edgeCases: ['VehicleCreator wizard → same POST endpoint, just multi-step UI', 'Bulk import CSV → POST /vehicles/bulk-import with file body'],
    validation: [
      'length, width, height: positive numbers, max decimal precision 2',
      'max_weight: positive integer kg',
      'axles: 2, 4, 6, or 8 only',
      'AAR validation: max_weight / axles must not exceed 33,000 kg per axle (server-enforced)',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 6 — LOADS
// ─────────────────────────────────────────────────────────────────────────────

export const LOADS_API_COMMENTS: ApiComment[] = [
  {
    endpoint: '/loads',
    method: 'GET',
    module: 'Loads',
    description: 'Fetch the organization\'s load library. Loads are the cargo items placed inside vehicles during optimization. Each load has precise physical dimensions and center-of-gravity coordinates needed for 3D placement algorithms.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}'],
      queryParams: [
        { name: 'search',  type: 'string',  required: false, description: 'Search by load name or ID' },
        { name: 'hazmat',  type: 'boolean', required: false, description: 'Filter HAZMAT-only loads' },
        { name: 'status',  type: 'string',  required: false, description: 'draft | ready | in_use | archived' },
        { name: 'page',    type: 'number',  required: false, description: 'Page number' },
        { name: 'limit',   type: 'number',  required: false, description: 'Page size (default: 25)' },
      ],
    },
    response: {
      successCode: 200,
      success: `{
  "data": [
    {
      "id":           "{{load.id}}",
      "name":         "{{load.name}}",
      "weight":       {{load.weight}},
      "length":       {{load.length}},
      "width":        {{load.width}},
      "height":       {{load.height}},
      "cg_x":         {{load.cg_x}},
      "cg_y":         {{load.cg_y}},
      "cg_z":         {{load.cg_z}},
      "hazmat_class": "{{load.hazmat_class}}",
      "fragile":      {{load.fragile}},
      "stackable":    {{load.stackable}},
      "quantity":     {{load.quantity}},
      "status":       "{{load.status}}"
    }
  ],
  "total": {{number}}
}`,
      errorCodes: [
        { code: 403, meaning: 'loads:read permission missing' },
      ],
    },
    uiBindings: [
      { token: '{{load.id}}',           element: 'Row key, selection target',                          screen: 'Loads table' },
      { token: '{{load.name}}',         element: 'Load name column',                                   screen: 'Loads table' },
      { token: '{{load.weight}}',       element: 'Weight column (formatted with unit)',                 screen: 'Loads table' },
      { token: '{{load.length}}',       element: 'Dimensions cell (L × W × H)',                        screen: 'Loads table' },
      { token: '{{load.cg_x}}',         element: 'CG coordinates display in load detail',              screen: 'Loads detail drawer' },
      { token: '{{load.hazmat_class}}', element: 'HAZMAT badge (orange) on load row',                  screen: 'Loads table' },
      { token: '{{load.stackable}}',    element: 'Stackable icon indicator',                           screen: 'Loads table' },
      { token: '{{load.quantity}}',     element: 'Quantity column',                                    screen: 'Loads table' },
      { token: '{{load.status}}',       element: 'Status badge',                                       screen: 'Loads table' },
    ],
    states: [
      { state: 'loading', behavior: 'Skeleton table rows' },
      { state: 'error',   behavior: '"Failed to load cargo library" banner with retry' },
      { state: 'empty',   behavior: '"No loads found" with "Add Load" and "Import CSV" CTAs' },
    ],
    edgeCases: [
      'Loads with status "in_use" → disable delete, show which job is using them',
      'HAZMAT loads → only assignable to HAZMAT-certified vehicles (validated server-side)',
      'Non-stackable loads → optimization engine places them on top layer only',
    ],
    validation: ['status: one of draft, ready, in_use, archived', 'hazmat filter: boolean'],
  },
  {
    endpoint: '/loads',
    method: 'POST',
    module: 'Loads',
    description: 'Create a new load in the cargo library. Center-of-gravity coordinates (cg_x, cg_y, cg_z) are critical for optimization accuracy — they represent the load\'s CG offset from its geometric center. If not provided, the engine assumes symmetric distribution.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}', 'Content-Type: application/json'],
      body: [
        { field: 'name',         type: 'string',  required: true,  description: 'Load display name', validation: 'Max 100 chars' },
        { field: 'weight',       type: 'number',  required: true,  description: 'Total weight in kg', validation: '> 0' },
        { field: 'length',       type: 'number',  required: true,  description: 'Exterior length in meters' },
        { field: 'width',        type: 'number',  required: true,  description: 'Exterior width in meters' },
        { field: 'height',       type: 'number',  required: true,  description: 'Exterior height in meters' },
        { field: 'cg_x',         type: 'number',  required: false, description: 'CG X offset from center (longitudinal)', validation: 'default: 0' },
        { field: 'cg_y',         type: 'number',  required: false, description: 'CG Y offset from center (vertical)',      validation: 'default: 0' },
        { field: 'cg_z',         type: 'number',  required: false, description: 'CG Z offset from center (lateral)',       validation: 'default: 0' },
        { field: 'hazmat_class', type: 'string',  required: false, description: 'DOT HAZMAT class (e.g., "3", "8")',       validation: 'If set, DOT class code' },
        { field: 'fragile',      type: 'boolean', required: false, description: 'Cannot be stacked under other loads',     validation: 'default: false' },
        { field: 'stackable',    type: 'boolean', required: false, description: 'Can be placed under other loads',         validation: 'default: true' },
        { field: 'quantity',     type: 'number',  required: false, description: 'Number of identical units',               validation: 'min: 1, default: 1' },
      ],
    },
    response: {
      successCode: 201,
      success: `{
  "data": {
    "id":     "{{load.id}}",
    "name":   "{{load.name}}",
    "status": "ready"
  }
}`,
      errorCodes: [
        { code: 422, meaning: 'Dimension or weight validation failed' },
      ],
    },
    uiBindings: [
      { token: '{{load.weight}}',       element: 'Add Load form — Weight input',      screen: 'Loads modal' },
      { token: '{{load.length}}',       element: 'Add Load form — Length input',      screen: 'Loads modal' },
      { token: '{{load.cg_x}}',         element: 'Add Load form — CG X input',        screen: 'Loads modal' },
      { token: '{{load.hazmat_class}}', element: 'Add Load form — HAZMAT class input', screen: 'Loads modal' },
    ],
    states: [
      { state: 'loading', behavior: 'Spinner on "Save Load" button' },
      { state: 'success', behavior: 'Close modal, toast: "Load added to library", prepend to table' },
      { state: 'error',   behavior: 'Field-level validation errors inline' },
    ],
    edgeCases: [
      'If hazmat_class set → show HAZMAT warning to user before saving',
      'CG inputs default to 0 if left blank (symmetric load assumption)',
      'Bulk import: POST /loads/bulk-import with CSV containing same fields',
    ],
    validation: [
      'weight, length, width, height: positive numbers > 0',
      'cg_x, cg_y, cg_z: must be within ±(dimension/2) of respective axis',
      'hazmat_class: valid DOT class code if provided',
      'quantity: positive integer',
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE 7 — AUDIT LOGS
// ─────────────────────────────────────────────────────────────────────────────

export const AUDIT_API_COMMENTS: ApiComment[] = [
  {
    endpoint: '/audit-logs',
    method: 'GET',
    module: 'Audit',
    description: 'Retrieve the organization-scoped immutable audit event log. Every mutation (create, update, delete, login, export) is automatically logged server-side. Logs cannot be deleted. Supports filtering by user, action type, resource type, severity level, and date range.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}'],
      queryParams: [
        { name: 'user_id',   type: 'string',   required: false, description: 'Filter events by specific user' },
        { name: 'action',    type: 'string',   required: false, description: 'Filter by action type (e.g., "login", "delete", "update")' },
        { name: 'resource',  type: 'string',   required: false, description: 'Filter by resource type (e.g., "user", "vehicle", "job")' },
        { name: 'severity',  type: 'string',   required: false, description: 'info | warning | critical' },
        { name: 'from',      type: 'datetime', required: false, description: 'Start of date range (ISO 8601)' },
        { name: 'to',        type: 'datetime', required: false, description: 'End of date range (ISO 8601)' },
        { name: 'page',      type: 'number',   required: false, description: 'Page number (default: 1)' },
        { name: 'limit',     type: 'number',   required: false, description: 'Max 500 per request' },
      ],
    },
    response: {
      successCode: 200,
      success: `{
  "data": [
    {
      "id":          "{{audit.id}}",
      "user":        "{{audit.user}}",
      "action":      "{{audit.action}}",
      "resource":    "{{audit.resource}}",
      "resource_id": "{{audit.resource_id}}",
      "timestamp":   "{{audit.timestamp}}",
      "ip_address":  "{{audit.ip_address}}",
      "severity":    "{{audit.severity}}",
      "metadata":    {{audit.metadata}}
    }
  ],
  "total": {{number}},
  "page":  {{number}}
}`,
      errorCodes: [
        { code: 403, meaning: 'audit:read permission required' },
      ],
    },
    uiBindings: [
      { token: '{{audit.user}}',        element: 'User column (name + avatar)',           screen: 'AuditLogs table' },
      { token: '{{audit.action}}',      element: 'Action column (verb badge)',            screen: 'AuditLogs table' },
      { token: '{{audit.resource}}',    element: 'Resource column',                      screen: 'AuditLogs table' },
      { token: '{{audit.timestamp}}',   element: 'Timestamp column (relative + tooltip)', screen: 'AuditLogs table' },
      { token: '{{audit.ip_address}}',  element: 'IP column (monospace font)',            screen: 'AuditLogs table' },
      { token: '{{audit.severity}}',    element: 'Severity badge (info/warning/critical)', screen: 'AuditLogs table' },
      { token: '{{audit.metadata}}',    element: 'Expandable JSON detail row',           screen: 'AuditLogs table' },
    ],
    states: [
      { state: 'loading', behavior: 'Skeleton rows (10) in audit table' },
      { state: 'error',   behavior: '"Failed to load audit log" banner' },
      { state: 'empty',   behavior: '"No audit events match your filters" with "Clear Filters" button' },
    ],
    edgeCases: [
      'Logs are immutable — no edit or delete actions in the UI',
      'audit.metadata is arbitrary JSON — render as collapsible <pre> block',
      'Date range: from > to → show validation error "End date must be after start date"',
      'If audit.user is "System" → show system icon instead of user avatar',
    ],
    validation: [
      'severity: one of info, warning, critical',
      'from / to: valid ISO 8601 datetime strings',
      'from must be ≤ to if both provided',
    ],
  },
];

// ────────────────────────────────────��────────────────────────────────────────
// MODULE 8 — SYSTEM MONITORING (SUPER ADMIN)
// ─────────────────────────────────────────────────────────────────────────────

export const SYSTEM_API_COMMENTS: ApiComment[] = [
  {
    endpoint: '/system/metrics',
    method: 'GET',
    module: 'SystemMonitoring',
    description: 'Real-time platform health metrics aggregated across all organizations. Accessible only to Super Admin role. Polled every 3 seconds by the SystemMonitoring dashboard. Returns current snapshot values — no historical series (use /system/api-usage for time-series).',
    auth: true,
    authNote: 'Super Admin JWT required. org_id claim ignored — returns global metrics.',
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}'],
    },
    response: {
      successCode: 200,
      success: `{
  "data": {
    "active_users":    {{system.active_users}},
    "active_jobs":     {{system.active_jobs}},
    "error_rate":      {{system.error_rate}},
    "api_requests":    {{system.api_requests}},
    "worker_util":     {{system.worker_util}},
    "queue_length":    {{system.queue_length}},
    "db_query_time":   {{system.db_query_time}},
    "cache_hit_rate":  {{system.cache_hit_rate}},
    "uptime":          {{system.uptime}},
    "version":         "{{system.version}}",
    "snapshot_at":     "{{datetime}}"
  }
}`,
      errorCodes: [
        { code: 403, meaning: 'Only accessible to Super Admin role' },
      ],
    },
    uiBindings: [
      { token: '{{system.active_users}}',   element: 'KPI card: Active Users',          screen: 'SystemMonitoring' },
      { token: '{{system.active_jobs}}',    element: 'KPI card: Active Jobs',           screen: 'SystemMonitoring' },
      { token: '{{system.error_rate}}',     element: 'KPI card: Error Rate % (red if >1%)', screen: 'SystemMonitoring' },
      { token: '{{system.api_requests}}',   element: 'KPI card: API req/min',           screen: 'SystemMonitoring' },
      { token: '{{system.worker_util}}',    element: 'Worker utilization gauge',        screen: 'SystemMonitoring' },
      { token: '{{system.queue_length}}',   element: 'Queue depth indicator',           screen: 'SystemMonitoring' },
      { token: '{{system.db_query_time}}',  element: 'DB response time ms indicator',  screen: 'SystemMonitoring' },
      { token: '{{system.cache_hit_rate}}', element: 'Cache hit rate % gauge',         screen: 'SystemMonitoring' },
    ],
    states: [
      { state: 'polling',      behavior: 'setInterval(3000ms), updates all KPI cards in-place' },
      { state: 'stale',        behavior: 'If no update for >10s → show "Data stale" warning badge on header' },
      { state: 'error',        behavior: 'Keep showing last known values, show "Live data unavailable" banner' },
      { state: 'alert',        behavior: 'If error_rate > 5% → flash red, show alert panel automatically' },
    ],
    edgeCases: [
      'error_rate > 1% → KPI card turns amber',
      'error_rate > 5% → KPI card turns red, auto-expand error log section',
      'queue_length > 50 → show "Queue backed up" warning',
      'db_query_time > 500ms → show "DB slow" warning',
      'worker_util > 90% → show "Workers saturated" warning',
    ],
    validation: [],
  },
  {
    endpoint: '/system/jobs',
    method: 'GET',
    module: 'SystemMonitoring',
    description: 'Fetch all active and recently completed optimization jobs across all organizations. Super Admin view of the global job queue. Supports filtering by status and organization.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}'],
      queryParams: [
        { name: 'status', type: 'string', required: false, description: 'queued | processing | completed | failed' },
        { name: 'org_id', type: 'string', required: false, description: 'Filter to a specific organization' },
        { name: 'limit',  type: 'number', required: false, description: 'Max 100' },
      ],
    },
    response: {
      successCode: 200,
      success: `{
  "data": [
    {
      "id":         "{{optimization.id}}",
      "status":     "{{optimization.status}}",
      "progress":   {{optimization.progress}},
      "org_id":     "{{org.id}}",
      "org_name":   "{{org.name}}",
      "created_by": "{{optimization.created_by}}",
      "created_at": "{{optimization.created_at}}"
    }
  ]
}`,
      errorCodes: [{ code: 403, meaning: 'Super Admin only' }],
    },
    uiBindings: [
      { token: '{{optimization.id}}',       element: 'Job ID column (monospace)',       screen: 'SystemMonitoring jobs table' },
      { token: '{{optimization.status}}',   element: 'Status badge column',            screen: 'SystemMonitoring jobs table' },
      { token: '{{optimization.progress}}', element: 'Progress bar column',            screen: 'SystemMonitoring jobs table' },
      { token: '{{org.name}}',              element: 'Organization column',            screen: 'SystemMonitoring jobs table' },
    ],
    states: [
      { state: 'loading', behavior: 'Skeleton rows in jobs table' },
      { state: 'empty',   behavior: '"No active jobs" with system status indicator' },
    ],
    edgeCases: ['Allow Super Admin to force-cancel stuck jobs via DELETE /optimization/{id}'],
    validation: ['status must be valid optimization status enum'],
  },
  {
    endpoint: '/system/errors',
    method: 'GET',
    module: 'SystemMonitoring',
    description: 'Fetch platform-wide error events from all services. Used to populate the error log panel in System Monitoring. Includes error code, affected organization, timestamp, stack trace reference, and resolution status.',
    auth: true,
    request: {
      headers: ['Authorization: Bearer {{auth.access_token}}'],
      queryParams: [
        { name: 'from',  type: 'datetime', required: false, description: 'Start of error time range' },
        { name: 'to',    type: 'datetime', required: false, description: 'End of error time range' },
        { name: 'limit', type: 'number',   required: false, description: 'Max 200' },
      ],
    },
    response: {
      successCode: 200,
      success: `{
  "data": [
    {
      "id":        "{{uuid}}",
      "message":   "{{string}}",
      "code":      "{{string}}",
      "org_id":    "{{org.id}}",
      "service":   "{{string}}",
      "severity":  "error | warning | critical",
      "resolved":  {{boolean}},
      "occurred_at": "{{datetime}}"
    }
  ]
}`,
      errorCodes: [{ code: 403, meaning: 'Super Admin only' }],
    },
    uiBindings: [
      { token: '{{system.error_rate}}', element: 'Drives error_rate KPI card value', screen: 'SystemMonitoring' },
    ],
    states: [
      { state: 'loading', behavior: 'Skeleton in error log panel' },
      { state: 'empty',   behavior: '"No errors in selected range" with green indicator' },
    ],
    edgeCases: ['Critical severity errors → show red flashing dot on Monitoring nav item'],
    validation: [],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// VARIABLE COMMENTS — comprehensive token documentation
// ─────────────────────────────────────────────────────────────────────────────

export const VARIABLE_COMMENTS: VariableComment[] = [
  // AUTH
  { token: '{{auth.email}}',         namespace:'auth', name:'email',         type:'string',   source:'/auth/login', sourceMethod:'POST', description:'User work email address used for authentication',              usedIn:['Login form input','POST /auth/login payload'],               validation:['Required','RFC 5322 email format'],                          fallback:'— (required field, no fallback)',  sensitive:false, example:'user@railcorp.com' },
  { token: '{{auth.password}}',      namespace:'auth', name:'password',      type:'string',   source:'/auth/login', sourceMethod:'POST', description:'User password — never stored or logged client-side',          usedIn:['Login form password input'],                                  validation:['Required','Min 8 characters'],                               fallback:'— (required field, no fallback)',  sensitive:true },
  { token: '{{auth.access_token}}',  namespace:'auth', name:'access_token',  type:'string',   source:'/auth/login', sourceMethod:'POST', description:'JWT access token — included in Authorization header of every API call', usedIn:['All API request headers','AuthContext','localStorage'], validation:['Non-empty string','Validate expiry before use'],           fallback:'Redirect to /login if missing',    sensitive:true, example:'eyJhbGci...' },
  { token: '{{auth.role}}',          namespace:'auth', name:'role',          type:'string',   source:'/auth/login', sourceMethod:'POST', description:'User\'s assigned role — used for client-side route gating and UI rendering', usedIn:['Login redirect logic','Sidebar nav items','Permission guards'], validation:['Must match one of 10 defined roles'],              fallback:'Redirect to /login',              sensitive:false, example:'Admin' },
  { token: '{{auth.org_id}}',        namespace:'auth', name:'org_id',        type:'string',   source:'/auth/login', sourceMethod:'POST', description:'Organization UUID — scopes all subsequent API calls',          usedIn:['All API calls (implicit via JWT)','Org context display'],    validation:['Non-empty UUID'],                                           fallback:'Redirect to /login',              sensitive:false, example:'org_abc123' },
  // USER
  { token: '{{user.id}}',            namespace:'user', name:'id',            type:'string',   source:'/users',       sourceMethod:'GET',  description:'Unique user identifier within the organization',               usedIn:['User table row key','Edit/delete action target','Audit log'],  validation:['Non-empty UUID string'],                                    fallback:'— (should always be present)',    example:'u_xyz789' },
  { token: '{{user.name}}',          namespace:'user', name:'name',          type:'string',   source:'/users',       sourceMethod:'GET',  description:'Full display name of the user',                               usedIn:['UserManagement name column','Sidebar user info','Avatar initials'], validation:['Required','Max 100 characters'],                        fallback:'"Unknown User"',                  example:'Sarah Mitchell' },
  { token: '{{user.email}}',         namespace:'user', name:'email',         type:'string',   source:'/users',       sourceMethod:'GET',  description:'User\'s work email address',                                  usedIn:['UserManagement email column','Invite modal','Audit log'],      validation:['Valid email format'],                                       fallback:'"—"',                             example:'sarah@railcorp.com' },
  { token: '{{user.role}}',          namespace:'user', name:'role',          type:'string',   source:'/users',       sourceMethod:'GET',  description:'Assigned role controlling permissions',                        usedIn:['Role badge in table','Role selector in edit drawer','Permission checks'], validation:['One of 10 valid role strings'],                       fallback:'"Viewer"',                        example:'Operations Manager' },
  { token: '{{user.status}}',        namespace:'user', name:'status',        type:'string',   source:'/users',       sourceMethod:'GET',  description:'Current account status',                                      usedIn:['Status badge (color-coded) in user table','Filter dropdown'], validation:['"active" | "suspended" | "invited"'],                       fallback:'"unknown"',                       example:'active' },
  { token: '{{user.last_active}}',   namespace:'user', name:'last_active',   type:'datetime', source:'/users',       sourceMethod:'GET',  description:'Timestamp of last user activity (login or API call)',          usedIn:['Last Active column in user table'],                            validation:['ISO 8601 UTC string'],                                      fallback:'"Never"',                         example:'2026-03-27T14:30:00Z' },
  { token: '{{user.mfa_enabled}}',   namespace:'user', name:'mfa_enabled',   type:'boolean',  source:'/users',       sourceMethod:'GET',  description:'Whether the user has MFA configured',                         usedIn:['MFA shield icon in user table'],                               validation:['true | false'],                                             fallback:'false' },
  { token: '{{user.jobs_run}}',      namespace:'user', name:'jobs_run',      type:'number',   source:'/users',       sourceMethod:'GET',  description:'Count of optimization jobs run by this user',                 usedIn:['Jobs Run column in user table'],                               validation:['Non-negative integer'],                                     fallback:'"0"' },
  // VEHICLE
  { token: '{{vehicle.id}}',         namespace:'vehicle', name:'id',         type:'string',   source:'/vehicles',    sourceMethod:'GET',  description:'Unique vehicle identifier',                                    usedIn:['Vehicles table key','Optimization selector','Job results'],    validation:['Non-empty UUID'],                                           fallback:'— (should always be present)',    example:'v_flat001' },
  { token: '{{vehicle.name}}',       namespace:'vehicle', name:'name',       type:'string',   source:'/vehicles',    sourceMethod:'GET',  description:'Human-readable vehicle name',                                  usedIn:['Vehicles table name column','Optimization vehicle selector'],  validation:['Required, unique per org, max 100 chars'],                  fallback:'"Unnamed Vehicle"',               example:'Flatcar Alpha-7' },
  { token: '{{vehicle.type}}',       namespace:'vehicle', name:'type',       type:'string',   source:'/vehicles',    sourceMethod:'GET',  description:'Vehicle category for optimization rule selection',             usedIn:['Type filter badge, VehicleCreator 3D model selector'],         validation:['Flatcar | Boxcar | Container | Hopper | Gondola'],          fallback:'"Unknown"',                       example:'Flatcar' },
  { token: '{{vehicle.length}}',     namespace:'vehicle', name:'length',     type:'number',   source:'/vehicles',    sourceMethod:'GET',  description:'Interior length in meters — primary constraint for load placement', usedIn:['Dimensions cell in table','3D scene vehicle geometry'],   validation:['> 0, max 30, precision 2dp'],                               fallback:'"—"', example:'20.0' },
  { token: '{{vehicle.max_weight}}', namespace:'vehicle', name:'max_weight', type:'number',   source:'/vehicles',    sourceMethod:'GET',  description:'Maximum payload capacity in kg',                               usedIn:['Max Weight column, AAR constraint calculations'],              validation:['> 0 integer kg'],                                           fallback:'"—"', example:'80000' },
  { token: '{{vehicle.axles}}',      namespace:'vehicle', name:'axles',      type:'number',   source:'/vehicles',    sourceMethod:'GET',  description:'Axle count — used to calculate per-axle load distribution',  usedIn:['Axles column, Results axle chart'],                             validation:['2 | 4 | 6 | 8'],                                           fallback:'"4"', example:'4' },
  { token: '{{vehicle.status}}',     namespace:'vehicle', name:'status',     type:'string',   source:'/vehicles',    sourceMethod:'GET',  description:'Operational status of the vehicle',                           usedIn:['Status badge, optimization selector (maintenance → disabled)'], validation:['active | maintenance | inactive'],                          fallback:'"unknown"', example:'active' },
  // LOAD
  { token: '{{load.id}}',            namespace:'load', name:'id',            type:'string',   source:'/loads',       sourceMethod:'GET',  description:'Unique load identifier',                                       usedIn:['Loads table key, optimization load selector, placement results'], validation:['Non-empty UUID'],                                        fallback:'— (should always be present)' },
  { token: '{{load.weight}}',        namespace:'load', name:'weight',        type:'number',   source:'/loads',       sourceMethod:'GET',  description:'Total weight of the load item in kg',                         usedIn:['Weight column in loads table, CG calculation, AAR compliance'], validation:['> 0 integer kg'],                                          fallback:'"—"', example:'5000' },
  { token: '{{load.cg_x}}',          namespace:'load', name:'cg_x',          type:'number',   source:'/loads',       sourceMethod:'GET',  description:'Center of gravity longitudinal offset from geometric center',  usedIn:['Load detail CG display, optimization engine input'],            validation:['Within ±(length/2)'],                                      fallback:'0.0 (symmetric assumption)', example:'-0.3' },
  { token: '{{load.hazmat_class}}',  namespace:'load', name:'hazmat_class',  type:'string',   source:'/loads',       sourceMethod:'GET',  description:'DOT HAZMAT classification code — drives placement constraints', usedIn:['HAZMAT badge on load row, vehicle compatibility filter'],      validation:['Valid DOT class string or null'],                           fallback:'null (no HAZMAT)', example:'"3"' },
  { token: '{{load.stackable}}',     namespace:'load', name:'stackable',     type:'boolean',  source:'/loads',       sourceMethod:'GET',  description:'Whether other loads can be placed on top of this one',        usedIn:['Stackable icon, optimization vertical placement rules'],         validation:['true | false'],                                            fallback:'true', example:'false' },
  // OPTIMIZATION
  { token: '{{optimization.id}}',          namespace:'optimization', name:'id',          type:'string',  source:'/optimization/run', sourceMethod:'POST', description:'Unique job identifier returned on submission — used for all subsequent polling and result fetching', usedIn:['Processing page URL param, job table'], validation:['Non-empty UUID'], fallback:'— (must not be null)' },
  { token: '{{optimization.status}}',      namespace:'optimization', name:'status',      type:'string',  source:'/optimization/{id}/progress', sourceMethod:'GET', description:'Current lifecycle state of the job', usedIn:['Status badge on Processing, Results, Dashboard'], validation:['queued | processing | completed | failed | warning'], fallback:'"unknown"', example:'processing' },
  { token: '{{optimization.progress}}',    namespace:'optimization', name:'progress',    type:'number',  source:'/optimization/{id}/progress', sourceMethod:'GET', description:'Job completion percentage 0-100', usedIn:['Animated progress bar on Processing screen'], validation:['0-100 integer'], fallback:'0', example:'67' },
  { token: '{{optimization.cg_value}}',    namespace:'optimization', name:'cg_value',    type:'number',  source:'/optimization/{id}/results',  sourceMethod:'GET', description:'Combined CG position offset (longitudinal) of the loaded vehicle', usedIn:['CG indicator in Results left panel, Explainability mode'], validation:['meters, within ±vehicle.length/2'], fallback:'"N/A"', example:'0.42' },
  { token: '{{optimization.axle_load}}',   namespace:'optimization', name:'axle_load',   type:'number',  source:'/optimization/{id}/results',  sourceMethod:'GET', description:'Maximum load on any single axle in kg', usedIn:['Axle load bar chart in Results'], validation:['kg per axle, AAR max: 33,000 kg'], fallback:'"N/A"', example:'28000' },
  { token: '{{optimization.utilization}}', namespace:'optimization', name:'utilization', type:'number',  source:'/optimization/{id}/results',  sourceMethod:'GET', description:'Space/weight utilization percentage (higher = better packing)', usedIn:['Utilization gauge on Results, KPI card on Dashboard'], validation:['0-100 percent'], fallback:'"0%"', example:'91.2' },
  { token: '{{optimization.heatmap}}',     namespace:'optimization', name:'heatmap',     type:'array',   source:'/optimization/{id}/results',  sourceMethod:'GET', description:'2D array of weight distribution values mapped onto vehicle floor grid', usedIn:['Heatmap overlay in 3D viewport (Scene3D)'], validation:['Array of {x, z, value, normalized} objects'], fallback:'Empty array → hide heatmap toggle' },
  { token: '{{optimization.violations}}',  namespace:'optimization', name:'violations',  type:'array',   source:'/optimization/{id}/results',  sourceMethod:'GET', description:'Array of AAR constraint violations detected during optimization', usedIn:['Violation alert badges in Results Constraints panel'], validation:['Array of {type, message, severity}'], fallback:'Empty array → no violations badge' },
  // AUDIT
  { token: '{{audit.user}}',      namespace:'audit', name:'user',      type:'string',   source:'/audit-logs', sourceMethod:'GET', description:'Display name of user who performed the action', usedIn:['User column in audit table'], validation:['String or "System"'], fallback:'"System"', example:'Sarah Mitchell' },
  { token: '{{audit.action}}',    namespace:'audit', name:'action',    type:'string',   source:'/audit-logs', sourceMethod:'GET', description:'Verb describing what was done (create, update, delete, login, export)', usedIn:['Action badge column in audit table'], validation:['Non-empty string'], fallback:'"unknown"', example:'delete' },
  { token: '{{audit.resource}}',  namespace:'audit', name:'resource',  type:'string',   source:'/audit-logs', sourceMethod:'GET', description:'Type of resource affected (user, vehicle, job, role)', usedIn:['Resource column in audit table'], validation:['Non-empty string'], fallback:'"—"', example:'vehicle' },
  { token: '{{audit.timestamp}}', namespace:'audit', name:'timestamp', type:'datetime', source:'/audit-logs', sourceMethod:'GET', description:'UTC timestamp when the event occurred', usedIn:['Timestamp column — shown relative (e.g., "2 hours ago") with absolute tooltip'], validation:['ISO 8601 UTC'], fallback:'"—"', example:'2026-03-27T14:00:00Z' },
  { token: '{{audit.severity}}',  namespace:'audit', name:'severity',  type:'string',   source:'/audit-logs', sourceMethod:'GET', description:'Severity level of the event', usedIn:['Severity badge (blue/amber/red) in audit table'], validation:['info | warning | critical'], fallback:'"info"', example:'warning' },
  // SYSTEM
  { token: '{{system.active_users}}',   namespace:'system', name:'active_users',   type:'number',  source:'/system/metrics', sourceMethod:'GET', description:'Count of users with API activity in the last 5 minutes', usedIn:['Active Users KPI card on SystemMonitoring'], validation:['Non-negative integer'], fallback:'"—"' },
  { token: '{{system.active_jobs}}',    namespace:'system', name:'active_jobs',    type:'number',  source:'/system/metrics', sourceMethod:'GET', description:'Count of optimization jobs currently in queued or processing state', usedIn:['Active Jobs KPI card, system jobs table count'], validation:['Non-negative integer'], fallback:'"0"' },
  { token: '{{system.error_rate}}',     namespace:'system', name:'error_rate',     type:'number',  source:'/system/metrics', sourceMethod:'GET', description:'Percentage of API requests returning 5xx in the last minute', usedIn:['Error Rate KPI card (color-coded by threshold)'], validation:['0-100 percent, 2dp'], fallback:'"0.00%"', example:'0.42' },
  { token: '{{system.api_requests}}',   namespace:'system', name:'api_requests',   type:'number',  source:'/system/metrics', sourceMethod:'GET', description:'Total API requests per minute across all services', usedIn:['API Requests KPI card, sparkline chart'], validation:['Non-negative integer'], fallback:'"0"' },
];

// ─────────────────────────────────────────────────────────────────────────────
// ACTION COMMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const ACTION_COMMENTS: ActionComment[] = [
  {
    id: 'login_submit',
    module: 'Auth',
    action: 'Sign In',
    trigger: 'onClick on "Sign In to OptiLoad" button in Login form',
    method: 'POST',
    endpoint: '/auth/login',
    payload: [
      { field: 'email',    type: 'string', required: true, description: 'From {{auth.email}} input' },
      { field: 'password', type: 'string', required: true, description: 'From {{auth.password}} input' },
    ],
    successBehavior: ['Store access_token + refresh_token in localStorage', 'Update AuthContext with user data', 'If role === "Super Admin" → navigate("/super-admin")', 'Else → navigate("/")'],
    errorBehavior: ['Show red error banner below form', 'Clear password field', 'Do NOT clear email field', 'Log error to console with context'],
    validation: ['Email: required, valid format', 'Password: required, non-empty'],
    redirect: '/super-admin or / (role-based)',
  },
  {
    id: 'invite_user',
    module: 'Users',
    action: 'Invite User',
    trigger: 'onClick on "Send Invite" button inside Invite User modal',
    method: 'POST',
    endpoint: '/users/invite',
    payload: [
      { field: 'email', type: 'string', required: true,  description: 'Invitee email from modal input' },
      { field: 'role',  type: 'string', required: true,  description: 'Selected role from modal dropdown' },
    ],
    successBehavior: ['Close invite modal', 'Show toast: "Invitation sent to {{user.email}}"', 'Refresh users list (GET /users)'],
    errorBehavior: ['Keep modal open', 'Show inline error message (e.g., "Email already exists")', 'Email field highlighted red if validation error'],
    validation: ['email: required, valid format', 'role: required, must be lower than inviter\'s own role'],
    invalidates: ['GET /users'],
  },
  {
    id: 'suspend_user',
    module: 'Users',
    action: 'Suspend User',
    trigger: 'onClick on "Suspend" button in user row actions or detail drawer',
    method: 'POST',
    endpoint: '/users/{id}/suspend',
    payload: [{ field: 'reason', type: 'string', required: false, description: 'Optional suspension reason for audit log' }],
    successBehavior: ['Update user row status badge to "Suspended" (optimistic)', 'Show toast: "User suspended"', 'Disable their action buttons'],
    errorBehavior: ['Revert optimistic update', 'Show error toast with reason'],
    validation: ['Cannot suspend yourself', 'Cannot suspend user with equal or higher role'],
    optimisticUpdate: 'Immediately set user.status = "suspended" in local state before API responds',
    invalidates: ['GET /users'],
  },
  {
    id: 'run_optimization',
    module: 'Optimization',
    action: 'Run Optimization',
    trigger: 'onClick on "Run Optimization" button in OptimizationJobs screen',
    method: 'POST',
    endpoint: '/optimization/run',
    payload: [
      { field: 'vehicle_ids', type: 'array<string>', required: true,  description: 'Selected vehicle IDs from multi-select' },
      { field: 'load_ids',    type: 'array<string>', required: true,  description: 'Selected load IDs from load table' },
      { field: 'mode',        type: 'string',        required: true,  description: 'Optimization mode from mode selector' },
    ],
    successBehavior: ['Navigate to /jobs/processing?id={{optimization.id}}', 'Start 2s polling of /optimization/{id}/progress', 'Show "Job queued" toast'],
    errorBehavior: ['Show error banner with specific reason', 'Remain on OptimizationJobs screen', 'Re-enable "Run Optimization" button'],
    validation: ['At least 1 vehicle selected', 'At least 1 load selected', 'Mode is selected', 'Total load weight ≤ combined vehicle capacity (client pre-check)'],
    redirect: '/jobs/processing?id={{optimization.id}}',
  },
  {
    id: 'export_results',
    module: 'Optimization',
    action: 'Export Results',
    trigger: 'onClick on Export button (PDF/CSV/JSON) in Results screen toolbar',
    method: 'POST',
    endpoint: '/optimization/{id}/export',
    payload: [{ field: 'format', type: 'string', required: true, description: '"pdf" | "csv" | "json"' }],
    successBehavior: ['Receive download_url from response', 'Programmatically click hidden <a download> with the signed URL', 'Show toast: "Export ready — downloading"'],
    errorBehavior: ['Show error toast: "Export failed — please try again"'],
    validation: ['format: one of pdf, csv, json'],
  },
  {
    id: 'add_vehicle',
    module: 'Vehicles',
    action: 'Add Vehicle',
    trigger: 'onClick on "Save Vehicle" in Add Vehicle modal (or wizard final step)',
    method: 'POST',
    endpoint: '/vehicles',
    payload: [
      { field: 'name',       type: 'string',  required: true,  description: 'Vehicle name from form' },
      { field: 'type',       type: 'string',  required: true,  description: 'Type from dropdown' },
      { field: 'length',     type: 'number',  required: true,  description: 'Length in meters' },
      { field: 'width',      type: 'number',  required: true,  description: 'Width in meters' },
      { field: 'height',     type: 'number',  required: true,  description: 'Height in meters' },
      { field: 'max_weight', type: 'number',  required: true,  description: 'Max payload kg' },
      { field: 'axles',      type: 'number',  required: true,  description: 'Axle count' },
      { field: 'hazmat',     type: 'boolean', required: false, description: 'HAZMAT flag' },
    ],
    successBehavior: ['Close modal', 'Toast: "Vehicle added to fleet"', 'Prepend new vehicle row to table', 'Reset form for next entry'],
    errorBehavior: ['Keep modal open', 'Show field-level validation errors', 'Highlight invalid fields red'],
    validation: ['All dimension fields: positive numbers', 'axles: 2, 4, 6, or 8', 'AAR per-axle weight check: max_weight/axles ≤ 33,000 kg'],
    invalidates: ['GET /vehicles'],
  },
  {
    id: 'toggle_feature',
    module: 'SuperAdmin',
    action: 'Toggle Feature Flag',
    trigger: 'onChange on feature enable/disable toggle switch in FeatureControl screen',
    method: 'PATCH',
    endpoint: '/features/{key}',
    payload: [
      { field: 'enabled', type: 'boolean', required: true,  description: 'New state of the feature flag' },
      { field: 'org_id',  type: 'string',  required: false, description: 'If set, applies to specific org only; if null, applies globally' },
    ],
    successBehavior: ['Toast: "Feature {{key}} {{enabled ? "enabled" : "disabled"}}"', 'Update toggle UI state'],
    errorBehavior: ['Revert toggle to previous state', 'Show error toast'],
    validation: ['enabled: required boolean', 'key: valid feature flag identifier'],
    optimisticUpdate: 'Immediately toggle switch before API response',
  },
  {
    id: 'update_permissions',
    module: 'Roles',
    action: 'Update Role Permissions',
    trigger: 'onChange on individual permission toggle in Roles Management matrix, then onClick "Save Changes"',
    method: 'PATCH',
    endpoint: '/roles/{id}',
    payload: [{ field: 'permissions', type: 'array<string>', required: true, description: 'Full replacement permission set' }],
    successBehavior: ['Toast: "Permissions saved for {{role.name}}"', 'Update local role state'],
    errorBehavior: ['Revert all toggles to last saved state', 'Show error banner in roles screen'],
    validation: ['permissions: non-empty array of valid permission keys', 'No permission above caller\'s own level'],
    invalidates: ['GET /roles'],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// STATE COMMENTS
// ─────────────────────────────────────────────────────────────────────────────

export const STATE_COMMENTS: StateComment[] = [
  {
    state: 'loading',
    module: 'Global',
    trigger: 'Any API request is initiated (fetch/axios call fired)',
    uiBehavior: ['Show skeleton loaders in place of data (not full-page spinner)', 'Disable all action buttons (Add, Edit, Delete, Export)', 'Replace button labels with spinner icon (for mutation buttons)', 'Show shimmer animation on KPI cards'],
    disabledElements: ['Add/Edit/Delete buttons', 'Form submit buttons', 'Export buttons', 'Filter controls that trigger new fetches'],
    exitCondition: 'API response received (success or error)',
    transitionTo: 'success → populate data, error → show error state',
    example: 'GET /users initiated → skeleton rows appear in table → response arrives → rows populated',
  },
  {
    state: 'error',
    module: 'Global',
    trigger: 'API returns non-2xx HTTP status, or network timeout/offline',
    uiBehavior: ['Show red error banner below page/section toolbar', 'Display error.message from API response body', 'Show "Retry" button that re-fires the same request', 'For mutations: show toast notification with error summary', 'For form fields: show inline validation error below field'],
    disabledElements: ['Export button while in error state', 'Actions that depend on failed data'],
    exitCondition: 'User clicks Retry and API succeeds, or user dismisses banner',
    transitionTo: 'loading → then success or error again',
    example: 'GET /users returns 500 → error banner: "Failed to load users [Retry]" → user clicks Retry → loading state → success',
  },
  {
    state: 'empty',
    module: 'Global',
    trigger: 'API returns 200 with data: [] or total: 0',
    uiBehavior: ['Replace table/list with empty state illustration', 'Show contextual empty message (e.g., "No vehicles found")', 'Show primary CTA button (e.g., "Add Vehicle")', 'If filters are active → show "Clear Filters" button instead of CTA'],
    disabledElements: ['Pagination controls', 'Bulk action bar', 'Export button (if no data to export)'],
    exitCondition: 'User adds data or clears filters',
    transitionTo: 'loading → success (with data)',
    example: 'GET /vehicles returns [] → empty state: "No vehicles in your fleet" + "Add Vehicle" button',
  },
  {
    state: 'success',
    module: 'Global',
    trigger: 'API mutation (POST/PATCH/DELETE) returns 2xx',
    uiBehavior: ['Show success toast notification (bottom-right, auto-dismiss 4s)', 'Close modal/drawer if mutation was from one', 'Update affected data in UI (optimistic update validated)', 'Invalidate and refetch related queries'],
    disabledElements: [],
    exitCondition: 'Toast auto-dismisses or user dismisses',
    transitionTo: 'Normal data display state',
    example: 'POST /users/invite succeeds → modal closes → toast: "Invitation sent" → users list refreshes',
  },
  {
    state: 'polling',
    module: 'Processing',
    trigger: 'User navigates to /jobs/processing page with valid job ID',
    uiBehavior: ['Animated progress bar updates every 2 seconds', '"Live" pulse indicator in header', 'Stage label updates with current engine step', 'ETA countdown visible if eta_s provided'],
    disabledElements: ['Back button (show warning: "Job is running — leaving won\'t stop it")', 'Run Optimization button'],
    exitCondition: 'optimization.status becomes "completed" or "failed"',
    transitionTo: 'completed → 1s delay → navigate to /jobs/results | failed → error state with retry',
    example: 'GET /optimization/{id}/progress returns {status:"processing", progress:67} → progress bar → 2s → {status:"completed", progress:100} → navigate to results',
  },
  {
    state: 'stale',
    module: 'SystemMonitoring',
    trigger: 'System metrics polling receives no update for >10 seconds',
    uiBehavior: ['Show amber "Data stale" badge on monitoring dashboard header', 'KPI card values shown with reduced opacity (0.7)', 'Last-updated timestamp shows time since last successful poll'],
    disabledElements: [],
    exitCondition: 'Successful poll response received',
    transitionTo: 'polling → normal display',
    example: 'GET /system/metrics fails for 10s → "Data stale — Last updated 10s ago" badge appears',
  },
  {
    state: 'optimistic',
    module: 'Users / Vehicles / Roles',
    trigger: 'User performs an action where immediate feedback improves perceived performance',
    uiBehavior: ['Apply change to UI immediately (e.g., toggle status, remove row)', 'Show subtle loading indicator on the specific element', 'If API fails → revert element to previous state', 'Show error toast explaining the revert'],
    disabledElements: ['The specific element being updated (disable during in-flight request)'],
    exitCondition: 'API response confirms success or failure',
    transitionTo: 'success → keep optimistic state | error → revert + error state',
    example: 'Toggle user suspended → row status badge changes immediately → PATCH fires → if 403 → badge reverts + error toast',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// MODULE INDEX — for the page to render organized sections
// ─────────────────────────────────────────────────────────────────────────────

export const MODULE_INDEX = [
  { id: 'auth',   label: 'Auth / Login',            color: '#60A5FA', apiComments: AUTH_API_COMMENTS },
  { id: 'users',  label: 'Users',                   color: '#34D399', apiComments: USERS_API_COMMENTS },
  { id: 'roles',  label: 'Roles & Permissions',     color: '#F87171', apiComments: ROLES_API_COMMENTS },
  { id: 'opt',    label: 'Optimization',            color: '#A78BFA', apiComments: OPTIMIZATION_API_COMMENTS },
  { id: 'veh',    label: 'Vehicles',                color: '#FBBF24', apiComments: VEHICLES_API_COMMENTS },
  { id: 'loads',  label: 'Loads',                   color: '#F472B6', apiComments: LOADS_API_COMMENTS },
  { id: 'audit',  label: 'Audit Logs',              color: '#FB923C', apiComments: AUDIT_API_COMMENTS },
  { id: 'system', label: 'System Monitoring',       color: '#22D3EE', apiComments: SYSTEM_API_COMMENTS },
];
