OptiLoad – User Management Redesign & Super Admin Control System

Redesign the OptiLoad platform user management and access system with a clear separation between platform-level control (Super Admin) and organization-level control (Admin).

This is a UI/UX redesign only, not backend logic.

The goal is to make the system:

Enterprise-grade
Cleanly segmented
Role-driven
Scalable for multi-tenant usage
Easy to understand visually
🔷 1️⃣ CORE STRUCTURE CHANGES

Implement the following user hierarchy:

User Types:
Super Admin
Owner of the platform
Global visibility across all organizations
Admin (Customer)
Owns one organization
Manages users, roles, and permissions within their organization
Sub-Admin (Under Admin)
Created by Admin
Assigned roles and permissions
🔷 2️⃣ REMOVE FEATURE
Completely remove Templates module from all UI screens
Remove from sidebar, flows, and references
🔷 3️⃣ ROLE-BASED UI ENTRY

Design system so that:

On Login:
If user = Super Admin → redirect to Global Control Dashboard
If user = Admin/Sub-Admin → redirect to Organization Workspace

These must feel like two different products, not just different pages.

🔷 4️⃣ ADMIN (CUSTOMER) UI DESIGN
Sidebar (Admin View)
Dashboard
Optimizations
Vehicles
Loads
Users
Roles & Permissions
Audit Logs
Settings
🔹 Users Management Screen

Design:

Table layout:
Name
Email
Role
Status
Last Active
Actions

Top actions:

Add User
Filter by Role
Search

Click user → open side drawer:

Assign role
Activate/Deactivate
View activity summary
🔹 Roles & Permissions Screen
Role list (cards or table)
Create Role button

Click role → open editor:

Sections:

Role Name
Description
Permission Matrix

Permission matrix:

Categories:
Vehicles
Loads
Optimization
Analytics
User Management
Audit Logs

Use checkbox grid system.

🔹 Audit Logs Screen (Admin Scope)

Design:

Filters:

Date
User
Action type

Table:

Timestamp
User
Action
Resource
Status

Add:

Export logs button
🔷 5️⃣ SUPER ADMIN UI (CRITICAL – DESIGN DEEPLY)

This is NOT a normal dashboard.

This is a global system command center.

🧠 SUPER ADMIN EXPERIENCE GOAL

It should feel like:

AWS Console
Datadog
Control Tower
System Monitoring Platform
🔷 Sidebar (Super Admin)
Global Dashboard
Organizations
Users (Global)
System Monitoring
Audit Logs (Global)
API Usage
Feature Control
Settings
🔷 🔹 GLOBAL DASHBOARD (MAIN SCREEN)

Layout:

Top KPI Row:

Total Organizations
Active Users
Active Optimization Jobs
System Load %
Error Rate %

Middle Section:

1. Live Activity Feed
Real-time user activity stream
Example:
“User X ran optimization”
“User Y created vehicle”
“User Z exported report”
2. System Health Panel
API response time
Worker load
Failure rate
Queue length

Use graphs + status indicators.

3. Optimization Activity Map
Visual representation of active jobs
Status indicators (running / failed / completed)
🔷 🔹 ORGANIZATIONS SCREEN

Table:

Organization Name
Users Count
Active Jobs
Status
Plan Type

Actions:

View details
Suspend organization

Click organization:

Open detailed view:

All users
Activity summary
Usage metrics
Error logs
🔷 🔹 GLOBAL USERS SCREEN
View all users across organizations
Filter by organization
Filter by role

Super Admin Actions:

Suspend user
Reset access
View full activity history
🔷 🔹 SYSTEM MONITORING

Design like DevOps dashboard:

Metrics:

API requests per minute
Error rate %
Worker utilization
Optimization job queue

Graphs:

Line charts
Heatmaps
Status indicators
🔷 🔹 GLOBAL AUDIT LOGS

Same structure as Admin logs but:

Includes ALL organizations
Advanced filters:
Organization
Severity
Action type
🔷 🔹 FEATURE CONTROL PANEL
Toggle features per organization
Example:
Enable/disable optimization module
Enable advanced analytics
Enable simulation mode

Use toggle switches.

🔷 6️⃣ VISUAL DIFFERENTIATION
Admin UI:
Clean
Task-focused
Operational
Super Admin UI:
Darker tone
More data-dense
Monitoring-heavy
Feels powerful
🔷 7️⃣ INTERACTION RULES
Smooth transitions (150–300ms)
Role-based UI rendering
Drawer-based editing
No page reload feel
🔷 FINAL REQUIREMENT

The system must clearly communicate:

Who controls the platform (Super Admin)
Who operates within organizations (Admin)
Who executes tasks (Sub-Admins)

The Super Admin UI must feel like a system control center, not a normal SaaS dashboard.

The Admin UI must feel like a focused operational workspace.