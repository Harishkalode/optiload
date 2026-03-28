# OptiLoad Backend Blueprint (Phased, Exhaustive)

## PHASE 1 — UI → Feature Extraction

- **Auth**: login, refresh, me, logout, error states, remember-me-compatible token flow.
- **Dashboard**: KPI summary, recent loads, activity feed.
- **User Management**: paginated list, search, role/status filters, create/update/delete, patch role/status.
- **Role & Permissions**: role CRUD, permission matrix read/write per role.
- **Organization Settings**: org profile get/update, current plan.
- **API Keys**: list/create/revoke key per organization.
- **Vehicle Management**: list/detail/create/update/delete for railcar/container, dimension + max weight validation.
- **Load Management**: list/detail/create/update/delete for cylinder/cube, quantity + dimensions validation.
- **Load Builder**: create session, add item, remove item, fetch session with items.
- **Optimization**: run, status, result, detail, history with efficiency score and 3D payload.
- **Audit Logs**: list with filters and detail endpoint.
- **System Monitoring**: metrics, errors, health.

## PHASE 2 — Exhaustive API Inventory

### Auth

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/refresh`

### Users

- `GET /users` (pagination + search + role/status)
- `GET /users/{id}`
- `POST /users`
- `PUT /users/{id}`
- `DELETE /users/{id}`
- `PATCH /users/{id}/status`
- `PATCH /users/{id}/role`

### Roles / Permissions

- `GET /roles`
- `POST /roles`
- `PUT /roles/{id}`
- `DELETE /roles/{id}`
- `GET /permissions`
- `GET /roles/{id}/permissions`
- `PUT /roles/{id}/permissions`

### Organization / API Keys

- `GET /organization`
- `PUT /organization`
- `GET /organization/plan`
- `GET /api-keys`
- `POST /api-keys`
- `DELETE /api-keys/{id}`

### Vehicles / Loads

- `GET /vehicles`, `GET /vehicles/{id}`, `POST /vehicles`, `PUT /vehicles/{id}`, `DELETE /vehicles/{id}`
- `GET /loads`, `GET /loads/{id}`, `POST /loads`, `PUT /loads/{id}`, `DELETE /loads/{id}`

### Load Builder / Optimization

- `POST /load-builder/session`
- `POST /load-builder/add-item`
- `DELETE /load-builder/remove-item`
- `GET /load-builder/session/{id}`
- `POST /optimization/run`
- `GET /optimization/{id}`
- `GET /optimization/{id}/status`
- `GET /optimization/{id}/result`
- `GET /optimization/history`

### Dashboard / Audit / System

- `GET /dashboard/summary`
- `GET /dashboard/recent-loads`
- `GET /dashboard/activity`
- `GET /audit-logs`
- `GET /audit-logs/{id}`
- `GET /system/metrics`
- `GET /system/errors`
- `GET /system/health`

## PHASE 3 — Database Design

- `users(id, organization_id, name, email unique, password_hash, role_id, status, last_login, created_at)`
- `roles(id, name, scope, description)`
- `permissions(id, name, category)`
- `role_permissions(role_id, permission_id)`
- `organizations(id, name unique, status, plan_type, created_at)`
- `api_keys(id, organization_id, key_hash, permissions_json)`
- `vehicles(id, organization_id, type[railcar|container], dimensions JSON, capacity)`
- `loads(id, organization_id, type[cylinder|cube], dimensions JSON, weight, quantity)`
- `load_sessions(id, user_id, vehicle_id, status, created_at)`
- `load_session_items(id, session_id, load_id, quantity)`
- `optimizations(id, organization_id, vehicle_id, input_json, result_json, status, efficiency_score, created_at)`
- `audit_logs(id, user_id, organization_id, action, resource, resource_id, metadata_json, ip_address, timestamp)`
- `system_metrics(id, metric_type, value, timestamp)`

## PHASE 4 — Architecture Design

- Monolithic modular FastAPI:
    - `app/modules/<domain>/{model,repository,service,controller,validator}.py`
    - `app/core/{database,middlewares,utils}`
- Cross-cutting middleware:
    - authentication (JWT)
    - role checks (RBAC)
    - tenant isolation enforcement
    - rate limiting + security headers

## PHASE 5 — API Contract Rules

All APIs return envelope:

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
