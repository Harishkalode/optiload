import { createBrowserRouter } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { SuperAdminLayout } from './components/layout/SuperAdminLayout';
import { Dashboard } from './pages/Dashboard';
import { Vehicles } from './pages/Vehicles';
import { VehicleCreator } from './pages/VehicleCreator';
import { Loads } from './pages/Loads';
import { OptimizationJobs } from './pages/OptimizationJobs';
import { Processing } from './pages/Processing';
import { Results } from './pages/Results';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { UserManagement } from './pages/UserManagement';
import { RolesManagement } from './pages/RolesManagement';
import { AuditLogs } from './pages/AuditLogs';
import { ApiKeysManagement } from './pages/ApiKeysManagement';
import { IntegrationMap } from './pages/IntegrationMap';
import { ApiDocs } from './pages/ApiDocs';

// Super Admin pages
import { GlobalDashboard } from './pages/super-admin/GlobalDashboard';
import { OrganizationsManagement } from './pages/super-admin/OrganizationsManagement';
import { GlobalUsers } from './pages/super-admin/GlobalUsers';
import { SystemMonitoring } from './pages/super-admin/SystemMonitoring';
import { GlobalAuditLogs } from './pages/super-admin/GlobalAuditLogs';
import { ApiUsage } from './pages/super-admin/ApiUsage';
import { FeatureControl } from './pages/super-admin/FeatureControl';
import { SuperAdminSettings } from './pages/super-admin/SuperAdminSettings';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  // Developer integration map — standalone, no layout wrapper
  {
    path: '/dev/integration-map',
    Component: IntegrationMap,
  },
  // Developer API docs comment layer — standalone
  {
    path: '/dev/api-docs',
    Component: ApiDocs,
  },
  // Super Admin workspace — completely separate product
  {
    path: '/super-admin',
    Component: SuperAdminLayout,
    children: [
      { index: true, Component: GlobalDashboard },
      { path: 'organizations', Component: OrganizationsManagement },
      { path: 'users', Component: GlobalUsers },
      { path: 'monitoring', Component: SystemMonitoring },
      { path: 'audit', Component: GlobalAuditLogs },
      { path: 'api-usage', Component: ApiUsage },
      { path: 'feature-control', Component: FeatureControl },
      { path: 'settings', Component: SuperAdminSettings },
    ],
  },
  // Admin / Org workspace
  {
    path: '/',
    Component: AppLayout,
    children: [
      { index: true, Component: Dashboard },
      { path: 'jobs', Component: OptimizationJobs },
      { path: 'jobs/new', Component: OptimizationJobs },
      { path: 'jobs/processing', Component: Processing },
      { path: 'jobs/results', Component: Results },
      { path: 'vehicles', Component: Vehicles },
      { path: 'vehicles/new', Component: Vehicles },
      { path: 'vehicles/create', Component: VehicleCreator },
      { path: 'loads', Component: Loads },
      { path: 'loads/new', Component: Loads },
      { path: 'reports', Component: Reports },
      { path: 'users', Component: Users },
      { path: 'users/management', Component: UserManagement },
      { path: 'users/roles', Component: RolesManagement },
      { path: 'users/audit', Component: AuditLogs },
      { path: 'users/api-keys', Component: ApiKeysManagement },
      { path: 'settings', Component: Settings },
    ],
  },
]);