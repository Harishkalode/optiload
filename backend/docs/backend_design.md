# OptiLoad Backend Design (FastAPI Monolithic Modular)

## 1) Requirement Understanding
- Multi-tenant logistics backend with strict org isolation.
- User types: super_admin (global), admin (organization owner), sub_admin.
- Core features: auth/login, users, roles/permissions, vehicles/loads, optimization, audit logs, system monitoring.
- API-driven frontend with consistent response envelope.

## 2) Database Schema (Design First)

### Enums
- `organization_status`: `active`, `suspended`, `deleted`
- `organization_plan_type`: `starter`, `growth`, `enterprise`
- `user_status`: `active`, `invited`, `disabled`
- `role_scope`: `global`, `org`
- `vehicle_type`: `truck`, `trailer`, `van`, `container`
- `load_type`: `pallet`, `box`, `loose`, `mixed`
- `optimization_status`: `pending`, `running`, `completed`, `failed`
- `metric_type`: `cpu_usage`, `memory_usage`, `request_count`, `error_count`, `job_latency`

### Tables and Constraints
1. `organizations`
   - `id` (PK)
   - `name` (unique, indexed)
   - `status` (enum, indexed)
   - `plan_type` (enum, indexed)
   - `created_at` (indexed)

2. `roles`
   - `id` (PK)
   - `name` (indexed)
   - `scope` (enum)
   - `description`
   - Unique constraint: `(name, scope)`

3. `permissions`
   - `id` (PK)
   - `name` (unique, indexed)
   - `category` (indexed)

4. `users`
   - `id` (PK)
   - `organization_id` (FK organizations.id, nullable for super_admin)
   - `name` (indexed)
   - `email` (unique, indexed)
   - `password_hash`
   - `role_id` (FK roles.id)
   - `status` (enum, indexed)
   - `mfa_enabled` (bool)
   - `last_login`
   - `created_at` (indexed)

5. `role_permissions`
   - `role_id` (FK roles.id)
   - `permission_id` (FK permissions.id)
   - Composite PK `(role_id, permission_id)`

6. `user_permission_overrides`
   - `user_id` (FK users.id)
   - `permission_id` (FK permissions.id)
   - `allowed` (bool)
   - Composite PK `(user_id, permission_id)`

7. `vehicles`
   - `id` (PK)
   - `organization_id` (FK organizations.id, indexed)
   - `type` (enum, indexed)
   - `dimensions` (JSON)
   - `capacity` (float)

8. `loads`
   - `id` (PK)
   - `organization_id` (FK organizations.id, indexed)
   - `type` (enum, indexed)
   - `dimensions` (JSON)
   - `weight` (float)

9. `optimizations`
   - `id` (PK)
   - `organization_id` (FK organizations.id, indexed)
   - `vehicle_id` (FK vehicles.id)
   - `status` (enum, indexed)
   - `result_json` (JSON)
   - `created_at` (indexed)

10. `audit_logs`
   - `id` (PK)
   - `user_id` (FK users.id, indexed)
   - `organization_id` (FK organizations.id, nullable for global actions, indexed)
   - `action` (indexed)
   - `resource` (indexed)
   - `resource_id` (indexed)
   - `metadata_json` (JSON)
   - `ip_address`
   - `timestamp` (indexed)

11. `system_metrics`
   - `id` (PK)
   - `metric_type` (enum, indexed)
   - `value` (float)
   - `timestamp` (indexed)

12. `api_keys`
   - `id` (PK)
   - `organization_id` (FK organizations.id, indexed)
   - `key_hash` (unique)
   - `permissions_json` (JSON)

## 3) Relationships
- Organization → Users (1:N)
- User → Role (N:1)
- Role → Permissions (M:N via role_permissions)
- User → Permission overrides (M:N via user_permission_overrides)
- Organization → Vehicles/Loads/Optimizations/API Keys (1:N)
- Optimization → Vehicle (N:1)
- Audit logs linked to User and Organization

## 4) Module Design
Each module has: `model.py`, `repository.py`, `service.py`, `controller.py`, `validator.py`
- `auth`: login, JWT issuance, current user context.
- `users`: org-scoped user CRUD.
- `roles`: role CRUD + role-permission mapping.
- `permissions`: list permissions catalog.
- `organizations`: org CRUD (super admin).
- `vehicles`: org-scoped vehicle CRUD.
- `loads`: org-scoped load CRUD.
- `optimization`: run/retrieve optimization jobs.
- `audit_logs`: immutable action records.
- `system_monitoring`: metrics/jobs/errors views.

## 5) API Contracts
- `POST /api/v1/auth/login`
- `GET/POST/PUT/DELETE /api/v1/users`
- `GET/POST/PUT /api/v1/roles`
- `GET /api/v1/permissions`
- `GET/POST /api/v1/vehicles`
- `GET/POST /api/v1/loads`
- `POST /api/v1/optimization/run`, `GET /api/v1/optimization/{id}`
- `GET /api/v1/audit-logs`
- `GET /api/v1/system/metrics`, `GET /api/v1/system/jobs`, `GET /api/v1/system/errors`

Response envelope:
```json
{ "success": true, "data": {}, "error": null }
```
Validation + error standards:
- `409`: duplicate entities (email, role scope/name)
- `400`: invalid dimensions, invalid enum, overweight load
- `401`: unauthorized/invalid token
- `403`: cross-tenant access denied
- `404`: missing resource
- `422`: optimization failure due to invalid setup

Representative contracts:
- `POST /vehicles`: `{type, dimensions:{length,width,height,max_weight}, capacity}` → `{id}`
- `POST /loads`: `{type, dimensions:{length,width,height}, weight, quantity}` → `{id}`
- `POST /optimization/run`: `{vehicle_id, load_ids[]}` → `{id,status}`

## PHASE 6 — Implementation Notes
- Controller: transport-only (validation + mapping)
- Service: all business rules
- Repository: persistence abstraction
- Edge cases handled:
  - duplicate user/role
  - invalid dimensions
  - overweight loads vs vehicle max weight
  - unauthorized token
  - cross-tenant access
  - optimization setup failures
