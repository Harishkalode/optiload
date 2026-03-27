import React, { useState } from 'react';
import {
  Code2, Database, Zap, Globe, Lock, AlertTriangle, CheckCircle2,
  ChevronRight, ChevronDown, Copy, ExternalLink, Server, Shield,
  Activity, Key, Users, Truck, Package, BarChart3, FileText,
  Settings, Building2, Eye, Download, ArrowRight, Terminal,
  BookOpen, GitBranch, Layers, Cpu, Clock, RefreshCw, Info
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import {
  SCREEN_API_GROUPS, FIELD_BINDINGS, ENDPOINTS, ACTIONS,
  BACKEND_REQUIREMENTS, UI_STATES, API_BASE, AUTH_HEADER
} from '../config/apiBindings';

// ── Design tokens ────────────────────────────────────────────────────────────
const T = {
  api:     { bg: 'rgba(59,130,246,0.10)',  border: 'rgba(59,130,246,0.28)',  color: '#60A5FA', label: 'API' },
  field:   { bg: 'rgba(16,185,129,0.10)', border: 'rgba(16,185,129,0.28)', color: '#34D399', label: 'FIELD' },
  action:  { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.28)', color: '#FBBF24', label: 'ACTION' },
  state:   { bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.28)', color: '#A78BFA', label: 'STATE' },
  payload: { bg: 'rgba(236,72,153,0.10)', border: 'rgba(236,72,153,0.28)', color: '#F472B6', label: 'PAYLOAD' },
  screen:  { bg: 'rgba(6,182,212,0.10)',  border: 'rgba(6,182,212,0.28)',  color: '#22D3EE', label: 'SCREEN' },
  req:     { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.28)',  color: '#F87171', label: 'REQUIRED' },
  source:  { bg: 'rgba(99,102,241,0.10)', border: 'rgba(99,102,241,0.28)', color: '#818CF8', label: 'SOURCE' },
};

// ── Small badge ───────────────────────────────────────────────────────────────
function Tag({ kind, children }: { kind: keyof typeof T; children: React.ReactNode }) {
  const s = T[kind];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:3, background:s.bg, border:`1px solid ${s.border}`,
      borderRadius:4, padding:'2px 7px', fontFamily:'JetBrains Mono,monospace', fontSize:10,
      fontWeight:700, color:s.color, whiteSpace:'nowrap', letterSpacing:'0.03em' }}>
      <span style={{ opacity:0.55 }}>[{s.label}:</span> {children} <span style={{ opacity:0.55 }}>]</span>
    </span>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11,
      background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)',
      borderRadius:3, padding:'1px 5px', color:'#E2E8F0' }}>
      {children}
    </code>
  );
}

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET:'#34D399', POST:'#60A5FA', PATCH:'#FBBF24', DELETE:'#F87171', PUT:'#A78BFA'
  };
  return (
    <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:10, fontWeight:800,
      color: colors[method] || '#94A3B8', background: (colors[method]||'#94A3B8')+'18',
      border:`1px solid ${(colors[method]||'#94A3B8')}30`, borderRadius:3, padding:'1px 6px' }}>
      {method}
    </span>
  );
}

// ── Collapsible section ───────────────────────────────────────────────────────
function Section({ title, icon: Icon, color, badge, children }: {
  title: string; icon: any; color: string; badge?: string; children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ border:'1px solid rgba(255,255,255,0.06)', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 transition-colors"
        style={{ background:'rgba(255,255,255,0.025)', cursor:'pointer', border:'none', textAlign:'left' }}
      >
        <div className="flex items-center gap-3">
          <div className="rounded-lg flex items-center justify-center"
            style={{ width:32, height:32, background:color+'18', flexShrink:0 }}>
            <Icon size={15} style={{ color }} />
          </div>
          <span style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:14, color:'#F1F5F9' }}>
            {title}
          </span>
          {badge && (
            <span style={{ fontSize:10, fontWeight:600, color:'#64748B',
              background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.08)',
              borderRadius:99, padding:'1px 8px' }}>{badge}</span>
          )}
        </div>
        {open ? <ChevronDown size={16} style={{ color:'#475569' }} /> : <ChevronRight size={16} style={{ color:'#475569' }} />}
      </button>
      {open && <div className="p-5 pt-4" style={{ borderTop:'1px solid rgba(255,255,255,0.05)' }}>{children}</div>}
    </div>
  );
}

// ── Endpoint row ──────────────────────────────────────────────────────────────
function EndpointRow({ endpoint, def }: { endpoint: string; def: any }) {
  const [method, ...pathParts] = endpoint.split(' ');
  const path = pathParts.join(' ');
  return (
    <div className="flex flex-wrap gap-2 items-start py-2.5"
      style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex items-center gap-2 flex-shrink-0" style={{ minWidth:260 }}>
        <MethodBadge method={method} />
        <code style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#E2E8F0' }}>{path}</code>
      </div>
      <div className="flex flex-wrap gap-1.5 flex-1">
        {def.payload?.map((p: string) => <Tag key={p} kind="payload">{p}</Tag>)}
        {def.params?.map((p: string) => <Tag key={p} kind="field">?{p}</Tag>)}
        {def.response?.map((r: string) => <Tag key={r} kind="source">→ {r}</Tag>)}
      </div>
    </div>
  );
}

// ── Field table ───────────────────────────────────────────────────────────────
function FieldTable({ namespace, fields }: { namespace: string; fields: Record<string, any> }) {
  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
        <thead>
          <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            {['Token', 'Type', 'Unit / Values', 'Notes'].map(h => (
              <th key={h} className="text-left py-2 px-3"
                style={{ fontSize:10, fontWeight:700, color:'#475569', letterSpacing:'0.06em', textTransform:'uppercase' }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(fields).map(([key, def]: [string, any]) => (
            <tr key={key} style={{ borderBottom:'1px solid rgba(255,255,255,0.03)' }}
              onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.02)')}
              onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
              <td className="py-2 px-3">
                <code style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#FBBF24' }}>
                  {def.token}
                </code>
              </td>
              <td className="py-2 px-3">
                <span style={{ fontSize:11, color:'#60A5FA', fontFamily:'JetBrains Mono,monospace' }}>
                  {def.type}
                </span>
              </td>
              <td className="py-2 px-3">
                <span style={{ fontSize:11, color:'#94A3B8' }}>
                  {def.unit || (def.values ? def.values.join(' | ') : (def.store ? `store: ${def.store}` : '—'))}
                </span>
              </td>
              <td className="py-2 px-3">
                <span style={{ fontSize:11, color:'#475569' }}>
                  {def.required === true ? '✓ required' : def.sensitive ? '🔒 sensitive' : ''}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Action card ───────────────────────────────────────────────────────────────
function ActionCard({ name, def }: { name: string; def: any }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)',
      borderRadius:8, padding:'12px 14px', marginBottom:8 }}>
      <div className="flex flex-wrap gap-2 items-center mb-2">
        <MethodBadge method={def.method} />
        <code style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#E2E8F0' }}>{def.endpoint}</code>
        <span style={{ fontSize:10, color:'#475569' }}>{def.trigger}</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {def.payload?.map((p: string) => <Tag key={p} kind="payload">{p}</Tag>)}
        {def.redirect && <Tag kind="state">redirect: {def.redirect}</Tag>}
        {def.storeToken && <Tag kind="source">storeToken: localStorage</Tag>}
        {def.clearToken && <Tag kind="state">clearToken</Tag>}
        {def.stopOn && <Tag kind="state">stopOn: {def.stopOn}</Tag>}
        {def.invalidates?.map((e: string) => <Tag key={e} kind="api">invalidates: {e}</Tag>)}
      </div>
    </div>
  );
}

// ── Screen map card ───────────────────────────────────────────────────────────
const SCREEN_ICONS: Record<string, any> = {
  Login: Lock, Dashboard: BarChart3, Vehicles: Truck, VehicleCreator: Truck,
  Loads: Package, OptimizationJobs: Cpu, Processing: Activity, Results: Eye,
  Reports: FileText, Users: Users, UserManagement: Users, RolesManagement: Shield,
  AuditLogs: FileText, ApiKeysManagement: Key, Settings: Settings,
  GlobalDashboard: Globe, Organizations: Building2, GlobalUsers: Users,
  SystemMonitoring: Server, GlobalAuditLogs: FileText, ApiUsage: BarChart3,
  FeatureControl: GitBranch, SuperAdminSettings: Settings,
};

const SCREEN_COLORS: Record<string, string> = {
  Login:'#60A5FA', Dashboard:'#34D399', Vehicles:'#FBBF24', VehicleCreator:'#FBBF24',
  Loads:'#F472B6', OptimizationJobs:'#A78BFA', Processing:'#22D3EE', Results:'#A78BFA',
  Reports:'#34D399', Users:'#60A5FA', UserManagement:'#60A5FA', RolesManagement:'#F87171',
  AuditLogs:'#FBBF24', ApiKeysManagement:'#818CF8', Settings:'#94A3B8',
  GlobalDashboard:'#22D3EE', Organizations:'#60A5FA', GlobalUsers:'#60A5FA',
  SystemMonitoring:'#F87171', GlobalAuditLogs:'#FBBF24', ApiUsage:'#A78BFA',
  FeatureControl:'#34D399', SuperAdminSettings:'#94A3B8',
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export function IntegrationMap() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'overview' | 'fields' | 'endpoints' | 'actions' | 'flows' | 'backend'>('overview');

  const bg      = '#060A0F';
  const card    = '#0D1520';
  const border  = 'rgba(255,255,255,0.07)';
  const text    = '#64748B';
  const textPri = '#E2E8F0';

  const tabs = [
    { id: 'overview',   label: 'Screen Map',    icon: Layers },
    { id: 'fields',     label: 'Field Tokens',  icon: Database },
    { id: 'endpoints',  label: 'Endpoints',     icon: Globe },
    { id: 'actions',    label: 'Actions',       icon: Zap },
    { id: 'flows',      label: 'Data Flows',    icon: GitBranch },
    { id: 'backend',    label: 'Backend Reqs',  icon: Server },
  ] as const;

  return (
    <div style={{ minHeight:'100vh', background:bg, fontFamily:'Inter,sans-serif', color:textPri }}>

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ background:'linear-gradient(135deg,#080E16 0%,#0D1A2E 100%)',
        borderBottom:`1px solid ${border}`, padding:'24px 32px 0' }}>
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center rounded-xl"
                style={{ width:40, height:40, background:'rgba(59,130,246,0.15)', border:'1px solid rgba(59,130,246,0.3)' }}>
                <Code2 size={20} style={{ color:'#60A5FA' }} />
              </div>
              <div>
                <h1 style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:800, fontSize:22,
                  color:'#F1F5F9', letterSpacing:'-0.02em', margin:0 }}>
                  OptiLoad — Backend Integration Map
                </h1>
                <p style={{ fontSize:12, color:'#475569', margin:0, marginTop:2 }}>
                  Full API binding blueprint · {Object.keys(SCREEN_API_GROUPS).length} screens ·{' '}
                  {Object.keys(ENDPOINTS).length} endpoints · {Object.keys(ACTIONS).length} actions ·{' '}
                  {Object.values(FIELD_BINDINGS).reduce((n,g) => n + Object.keys(g).length, 0)} field tokens
                </p>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-3">
              {Object.entries(T).map(([k, s]) => (
                <span key={k} style={{ display:'inline-flex', alignItems:'center', gap:4,
                  background:s.bg, border:`1px solid ${s.border}`, borderRadius:4,
                  padding:'2px 8px', fontFamily:'JetBrains Mono,monospace', fontSize:9,
                  fontWeight:700, color:s.color }}>
                  [{s.label}]
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5"
              style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)' }}>
              <div className="h-1.5 w-1.5 rounded-full" style={{ background:'#10B981' }} />
              <span style={{ fontSize:11, color:'#10B981', fontWeight:600 }}>Zero static data</span>
            </div>
            <span style={{ fontSize:10, color:'#334155', fontFamily:'JetBrains Mono,monospace' }}>
              BASE: {API_BASE}
            </span>
          </div>
        </div>

        {/* ── Tabs ─────────────────────────────────────────────────────── */}
        <div className="flex gap-1">
          {tabs.map(t => {
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                className="flex items-center gap-1.5 px-4 py-2.5 transition-colors"
                style={{ background:'transparent', border:'none', cursor:'pointer',
                  borderBottom: active ? '2px solid #60A5FA' : '2px solid transparent',
                  color: active ? '#60A5FA' : '#475569', fontSize:12, fontWeight: active ? 700 : 500,
                  marginBottom: -1 }}>
                <t.icon size={13} /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENT ────────────────────────────────────────────────────── */}
      <div style={{ padding:'28px 32px', maxWidth:1400 }}>

        {/* ══════════════ SCREEN MAP ══════════════ */}
        {activeTab === 'overview' && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {/* Auth flow */}
              <div className="md:col-span-2 rounded-xl p-5" style={{ background:'rgba(59,130,246,0.05)', border:'1px solid rgba(59,130,246,0.15)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Lock size={15} style={{ color:'#60A5FA' }} />
                  <span style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:13, color:'#60A5FA' }}>
                    LOGIN / AUTH FLOW — CRITICAL PATH
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {[
                    { step:'1', title:'Input Fields', items:['{{auth.email}}','{{auth.password}}','{{auth.org_name}}','{{auth.invite_code}}'], kind:'field' as const },
                    { step:'2', title:'Submit Action', items:['[ACTION: POST /auth/login]','[PAYLOAD: email, password, role?]','[ACTION: POST /auth/signup]'], kind:'action' as const },
                    { step:'3', title:'Store Response', items:['[TOKEN: access_token → localStorage]','[TOKEN: refresh_token → localStorage]','[STORE: user.role]','[STORE: user.org_id]'], kind:'source' as const },
                    { step:'4', title:'Role-based Redirect', items:['Super Admin → /super-admin','Admin → /','Operations Manager → /','Viewer → / (read-only)'], kind:'screen' as const },
                  ].map(col => (
                    <div key={col.step} className="rounded-lg p-3" style={{ background:'rgba(0,0,0,0.2)', border:'1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize:10, color:'#475569', marginBottom:6, fontWeight:700 }}>
                        STEP {col.step} — {col.title}
                      </div>
                      {col.items.map(item => (
                        <div key={item} className="mb-1"><Tag kind={col.kind}>{item}</Tag></div>
                      ))}
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 rounded-lg" style={{ background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.15)' }}>
                  <span style={{ fontSize:10, fontWeight:700, color:'#F87171', fontFamily:'JetBrains Mono,monospace' }}>
                    [BACKEND REQUIREMENT] JWT → Return user.role + org_id in every auth response.
                    All subsequent API calls must include Authorization: Bearer {'<token>'}
                  </span>
                </div>
              </div>

              {/* Screen cards */}
              {Object.entries(SCREEN_API_GROUPS).map(([screen, info]) => {
                const Icon = SCREEN_ICONS[screen] || Globe;
                const color = SCREEN_COLORS[screen] || '#94A3B8';
                return (
                  <div key={screen} className="rounded-xl p-4"
                    style={{ background:card, border:`1px solid ${border}` }}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ width:32, height:32, background:color+'15' }}>
                        <Icon size={14} style={{ color }} />
                      </div>
                      <div>
                        <div style={{ fontFamily:'Space Grotesk,sans-serif', fontWeight:700, fontSize:13, color:textPri }}>
                          {screen}
                        </div>
                        <div style={{ fontSize:10, color:text, marginTop:1 }}>{info.description}</div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Tag kind="screen">{info.group}</Tag>
                      <Tag kind="api">BASE: {info.base}</Tag>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════ FIELD TOKENS ══════════════ */}
        {activeTab === 'fields' && (
          <div>
            <div className="rounded-xl p-4 mb-6" style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Info size={13} style={{ color:'#FBBF24' }} />
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, fontWeight:700, color:'#FBBF24' }}>
                  PLACEHOLDER TOKEN FORMAT
                </span>
              </div>
              <p style={{ fontSize:12, color:'#94A3B8', lineHeight:1.7, margin:0 }}>
                All UI values are replaced with <Code>{'{{namespace.field_name}}'}</Code> tokens.
                These must be bound to API response fields before rendering.
                Never display raw token strings to end users ��� they must be resolved at runtime.
                Naming convention is strictly <Code>namespace.snake_case</Code>.
              </p>
            </div>

            {Object.entries(FIELD_BINDINGS).map(([ns, fields]) => (
              <Section key={ns} title={`${ns.toUpperCase()} namespace`} icon={Database}
                color={T.field.color} badge={`${Object.keys(fields).length} fields`}>
                <div className="mb-2">
                  <Tag kind="screen">{`{{${ns}}.*`}</Tag>
                  <span style={{ fontSize:11, color:text, marginLeft:8 }}>
                    bound to API responses from&nbsp;
                    <Code>/{ns === 'auth' ? 'auth' : ns === 'apikey' ? 'api-keys' : ns === 'org' ? 'organizations' : ns + 's'}</Code>
                  </span>
                </div>
                <FieldTable namespace={ns} fields={fields} />
              </Section>
            ))}
          </div>
        )}

        {/* ══════════════ ENDPOINTS ══════════════ */}
        {activeTab === 'endpoints' && (
          <div>
            <div className="rounded-xl p-4 mb-6" style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)' }}>
              <div className="flex items-center gap-2 mb-2">
                <Globe size={13} style={{ color:'#60A5FA' }} />
                <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, fontWeight:700, color:'#60A5FA' }}>
                  BASE URL: {API_BASE} · {AUTH_HEADER}
                </span>
              </div>
              <p style={{ fontSize:12, color:'#94A3B8', margin:0 }}>
                {Object.keys(ENDPOINTS).length} total endpoints · All require Authorization header except POST /auth/login and POST /auth/signup.
                Response envelopes: <Code>{'{ data, total?, page?, error? }'}</Code>
              </p>
            </div>

            {/* Group by domain */}
            {[
              { label:'Authentication', icon:Lock, color:'#60A5FA', prefix:'/auth' },
              { label:'Users',          icon:Users, color:'#34D399', prefix:'/users' },
              { label:'Vehicles',       icon:Truck, color:'#FBBF24', prefix:'/vehicles' },
              { label:'Loads',          icon:Package, color:'#F472B6', prefix:'/loads' },
              { label:'Optimization',   icon:Cpu, color:'#A78BFA', prefix:'/optimization' },
              { label:'Reports',        icon:BarChart3, color:'#34D399', prefix:'/reports' },
              { label:'Audit Logs',     icon:FileText, color:'#FBBF24', prefix:'/audit-logs' },
              { label:'Roles',          icon:Shield, color:'#F87171', prefix:'/roles' },
              { label:'API Keys',       icon:Key, color:'#818CF8', prefix:'/api-keys' },
              { label:'System',         icon:Server, color:'#F87171', prefix:'/system' },
              { label:'Organizations',  icon:Building2, color:'#60A5FA', prefix:'/organizations' },
              { label:'Features',       icon:GitBranch, color:'#34D399', prefix:'/features' },
              { label:'Settings',       icon:Settings, color:'#94A3B8', prefix:'/settings' },
            ].map(group => {
              const groupEndpoints = Object.entries(ENDPOINTS).filter(([k]) =>
                k.includes(group.prefix) || (group.prefix === '/auth' && k.startsWith('POST /auth')));
              if (!groupEndpoints.length) return null;
              return (
                <Section key={group.label} title={group.label} icon={group.icon}
                  color={group.color} badge={`${groupEndpoints.length} endpoints`}>
                  <div className="mb-2"><Tag kind="api">BASE: {group.prefix}</Tag></div>
                  {groupEndpoints.map(([ep, def]) => <EndpointRow key={ep} endpoint={ep} def={def} />)}
                </Section>
              );
            })}
          </div>
        )}

        {/* ══════════════ ACTIONS ══════════════ */}
        {activeTab === 'actions' && (
          <div>
            <div className="rounded-xl p-4 mb-6" style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.15)' }}>
              <span style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, fontWeight:700, color:'#FBBF24' }}>
                [ACTION MAP] — Every user interaction that triggers a network request.
                Format: [ACTION: trigger → METHOD /endpoint] [PAYLOAD: fields]
              </span>
            </div>

            {[
              { label:'Authentication', icon:Lock, color:'#60A5FA', keys:['login_submit','signup_submit','logout'] },
              { label:'Optimization Jobs', icon:Cpu, color:'#A78BFA', keys:['new_job','delete_job','export_job','view_results','poll_progress'] },
              { label:'Vehicles', icon:Truck, color:'#FBBF24', keys:['add_vehicle','edit_vehicle','delete_vehicle','bulk_import_vehicles'] },
              { label:'Loads', icon:Package, color:'#F472B6', keys:['add_load','edit_load','delete_load','bulk_import_loads'] },
              { label:'Users', icon:Users, color:'#34D399', keys:['invite_user','suspend_user','activate_user','change_user_role','delete_user'] },
              { label:'API Keys', icon:Key, color:'#818CF8', keys:['create_api_key','revoke_api_key'] },
              { label:'Reports', icon:BarChart3, color:'#34D399', keys:['filter_report','export_report'] },
              { label:'Audit Logs', icon:FileText, color:'#FBBF24', keys:['filter_audit','export_audit'] },
              { label:'Roles', icon:Shield, color:'#F87171', keys:['save_role','update_permissions'] },
              { label:'Super Admin', icon:Globe, color:'#22D3EE', keys:['refresh_metrics','suspend_org','toggle_feature'] },
            ].map(group => (
              <Section key={group.label} title={group.label} icon={group.icon}
                color={group.color} badge={`${group.keys.length} actions`}>
                {group.keys.map(k => (
                  <ActionCard key={k} name={k} def={(ACTIONS as any)[k]} />
                ))}
              </Section>
            ))}
          </div>
        )}

        {/* ══════════════ DATA FLOWS ══════════════ */}
        {activeTab === 'flows' && (
          <div className="space-y-5">

            {/* Auth flow */}
            <Section title="Authentication Data Flow" icon={Lock} color="#60A5FA">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    label: '[UI COMPONENT] Login Form',
                    color: '#60A5FA',
                    items: [
                      '{{auth.email}} → input[type=email]',
                      '{{auth.password}} → input[type=password]',
                      '{{auth.org_name}} → input[text] (signup only)',
                      '{{auth.invite_code}} → input[text] (signup only)',
                      '[STATE: loading] → Loader spinner on submit button',
                      '[STATE: error] → Error banner below form',
                    ]
                  },
                  {
                    label: '[DATA FLOW] Request → Response',
                    color: '#FBBF24',
                    items: [
                      '[ACTION: onClick → POST /auth/login]',
                      '[PAYLOAD: email, password]',
                      '[RESPONSE: access_token, refresh_token, role, org_id, user_id]',
                      '[STORE: tokens → localStorage]',
                      '[STATE: global] → AuthContext updated',
                      '[REDIRECT: role-based routing]',
                    ]
                  },
                  {
                    label: '[PROTECTED ROUTES] Role Gate',
                    color: '#34D399',
                    items: [
                      'Super Admin → /super-admin/* (role check)',
                      'Organization Owner → /* (full access)',
                      'Admin → /* (no billing)',
                      'Viewer → /* (read-only)',
                      '[STATE: error] → Redirect to /login if token expired',
                      '[ACTION: interval → POST /auth/refresh (token expiry)]',
                    ]
                  },
                ].map(col => (
                  <div key={col.label} className="rounded-lg p-4"
                    style={{ background:'rgba(255,255,255,0.025)', border:`1px solid rgba(255,255,255,0.06)` }}>
                    <div style={{ fontSize:10, fontWeight:700, color:col.color, marginBottom:10,
                      fontFamily:'JetBrains Mono,monospace' }}>{col.label}</div>
                    {col.items.map(item => (
                      <div key={item} style={{ fontSize:11, color:'#94A3B8', marginBottom:5, lineHeight:1.5 }}>
                        → {item}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </Section>

            {/* Optimization flow */}
            <Section title="Optimization Job Data Flow" icon={Cpu} color="#A78BFA">
              <div className="space-y-3">
                {[
                  {
                    step:'1 — Job Setup (OptimizationJobs screen)',
                    color:'#60A5FA',
                    left:'[UI: Vehicle selector multi-select]\n[DATA SOURCE: API]\n[API: GET /vehicles → vehicle[]]',
                    right:'[UI: Load selector table]\n[DATA SOURCE: API]\n[API: GET /loads → load[]]',
                  },
                  {
                    step:'2 — Submit & Queue',
                    color:'#FBBF24',
                    left:'[ACTION: onClick → POST /optimization/run]\n[PAYLOAD: vehicle_ids, load_ids, mode]',
                    right:'[RESPONSE: optimization.id, optimization.status]\n[REDIRECT: /jobs/processing?id={{optimization.id}}]',
                  },
                  {
                    step:'3 — Live Progress (Processing screen)',
                    color:'#A78BFA',
                    left:'[ACTION: setInterval(2s) → GET /optimization/{id}/progress]\n[FIELD: optimization.progress → progress bar]\n[FIELD: optimization.status → status badge]',
                    right:'[STATE: loading] → Spinner until status ≠ queued\n[STATE: error] → Error banner if status = failed\n[STOP: status ∈ {completed, failed}]',
                  },
                  {
                    step:'4 — Results (Results screen)',
                    color:'#34D399',
                    left:'[API: GET /optimization/{id}/results]\n[FIELD: optimization.placements → 3D Scene]\n[FIELD: optimization.heatmap → Heatmap layer]\n[FIELD: optimization.cg_value → CG indicator]',
                    right:'[FIELD: optimization.axle_load → Axle chart]\n[FIELD: optimization.utilization → Gauge]\n[FIELD: optimization.violations → Alert badges]\n[ACTION: onClick → POST /optimization/{id}/export]',
                  },
                ].map(row => (
                  <div key={row.step} className="rounded-lg overflow-hidden"
                    style={{ border:`1px solid rgba(255,255,255,0.06)` }}>
                    <div className="px-4 py-2" style={{ background:'rgba(255,255,255,0.03)', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize:10, fontWeight:700, color:row.color, fontFamily:'JetBrains Mono,monospace' }}>
                        STEP {row.step}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-0 divide-x divide-white/5">
                      {[row.left, row.right].map((col, ci) => (
                        <div key={ci} className="p-3">
                          {col.split('\n').map((line, li) => (
                            <div key={li} style={{ fontSize:11, color:'#94A3B8', marginBottom:4, fontFamily:'JetBrains Mono,monospace', lineHeight:1.6 }}>
                              {line}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Loading / Error / Empty states */}
            <Section title="UI State Definitions" icon={Activity} color="#A78BFA">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    state: 'loading', color:'#A78BFA',
                    trigger: 'While awaiting any API response',
                    ui: ['Skeleton rows in tables', 'Spinner on buttons', 'Shimmer on KPI cards', 'Disabled form submit'],
                    source: '[STATE: loading] → set on API request start, clear on response'
                  },
                  {
                    state: 'error', color:'#F87171',
                    trigger: 'API returns non-2xx status',
                    ui: ['Error banner (red) below toolbar', 'Toast notification', 'Field-level error messages (form validation)', 'Retry button'],
                    source: '[STATE: error] [ERROR SOURCE: API] → display error.message from response body'
                  },
                  {
                    state: 'empty', color:'#94A3B8',
                    trigger: 'API returns data: [] or total: 0',
                    ui: ['Empty state illustration', 'Helper text', 'Primary CTA button (e.g., Add Vehicle)', 'Clear filters button if filters active'],
                    source: '[STATE: empty] → check data.length === 0 after loading resolves'
                  },
                ].map(s => (
                  <div key={s.state} className="rounded-xl p-4"
                    style={{ background:'rgba(255,255,255,0.02)', border:`1px solid ${s.color}25` }}>
                    <div className="mb-3">
                      <Tag kind={s.state === 'loading' ? 'state' : s.state === 'error' ? 'req' : 'source'}>
                        STATE: {s.state}
                      </Tag>
                    </div>
                    <div style={{ fontSize:11, color:'#64748B', marginBottom:8 }}>{s.trigger}</div>
                    {s.ui.map(u => (
                      <div key={u} style={{ fontSize:11, color:'#94A3B8', marginBottom:3 }}>• {u}</div>
                    ))}
                    <div className="mt-3" style={{ fontSize:10, color:s.color, fontFamily:'JetBrains Mono,monospace' }}>
                      {s.source}
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* RBAC flow */}
            <Section title="RBAC & Permission Flow" icon={Shield} color="#F87171">
              <div className="space-y-3">
                <div className="rounded-lg p-4" style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize:11, color:'#94A3B8', lineHeight:1.8, fontFamily:'JetBrains Mono,monospace' }}>
                    {[
                      '// Role hierarchy (highest → lowest privilege):',
                      '// 1. Super Admin         → global platform access (/super-admin/*)',
                      '// 2. Organization Owner  → full org access',
                      '// 3. Admin               → org admin (no billing/owner transfer)',
                      '// 4. Sub-Admin           → delegated admin subset',
                      '// 5. Operations Manager  → jobs + vehicles + loads',
                      '// 6. Rail Planner        → jobs + loads (read vehicles)',
                      '// 7. Compliance Officer  → read-only + export',
                      '// 8. Yard Supervisor     → loads + vehicle status',
                      '// 9. Loader Operator     → load assignment only',
                      '// 10. Viewer             → read-only, no export',
                      '',
                      '// Frontend: read role from auth.role (JWT claim)',
                      '// Backend: validate permissions server-side on every request',
                      '// DO NOT trust client-side role for security decisions',
                      '',
                      '[API: GET /roles] → fetch permission matrix for current org',
                      '[FIELD: role.permissions] → array of permission keys',
                      '[ACTION: onChange permission toggle → PATCH /roles/{id}]',
                    ].map((line, i) => (
                      <div key={i} style={{ color: line.startsWith('//') ? '#475569' : '#E2E8F0' }}>{line || <br/>}</div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* Audit log flow */}
            <Section title="Audit Log Data Flow" icon={FileText} color="#FBBF24">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg p-4" style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <Tag kind="screen">SCREEN API GROUP: Audit</Tag>
                  <div className="mt-3 space-y-2">
                    {[
                      '[API: GET /audit-logs]',
                      '[FIELDS: audit.user, audit.action, audit.resource, audit.timestamp, audit.severity, audit.ip_address]',
                      '[PARAMS: user_id, action, resource, severity, from, to, page, limit]',
                      '[ACTION: onChange filters → GET /audit-logs?filters]',
                      '[ACTION: onClick Export → GET /audit-logs/export?format=csv]',
                      '[STATE: local] → filter state (search, dateRange, severity)',
                      '[STATE: global] → audit entries cache',
                    ].map((item, i) => (
                      <div key={i} style={{ fontSize:11, color:'#94A3B8', fontFamily:'JetBrains Mono,monospace' }}>{item}</div>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg p-4" style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <Tag kind="screen">SCREEN API GROUP: Super Admin Audit</Tag>
                  <div className="mt-3 space-y-2">
                    {[
                      '[API: GET /audit-logs/global]',
                      '[PARAMS: org_id (cross-tenant filter), user_id, action, from, to, page]',
                      '[FIELD: audit.org_id] → visible in global view only',
                      '[FIELD: audit.metadata] → expandable JSON detail',
                      '[ACTION: Server-side auto-audit every POST/PATCH/DELETE]',
                      '[BACKEND: Audit must be written server-side, never from client]',
                    ].map((item, i) => (
                      <div key={i} style={{ fontSize:11, color:'#94A3B8', fontFamily:'JetBrains Mono,monospace' }}>{item}</div>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* Super Admin monitoring */}
            <Section title="Super Admin — System Monitoring Flow" icon={Server} color="#22D3EE">
              <div className="rounded-lg p-4" style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.06)' }}>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label:'[API: GET /system/metrics]',
                      fields:['{{system.active_users}}','{{system.active_jobs}}','{{system.error_rate}}','{{system.api_requests}}','{{system.worker_util}}','{{system.queue_length}}','{{system.db_query_time}}','{{system.cache_hit_rate}}'],
                      color:'#22D3EE'
                    },
                    {
                      label:'[API: GET /system/jobs]',
                      fields:['optimization.id → job row','optimization.status → status badge','optimization.progress → progress bar','optimization.org → org name column'],
                      color:'#A78BFA'
                    },
                    {
                      label:'[API: GET /system/errors]',
                      fields:['error.message','error.code','error.org_id','error.timestamp','[ACTION: interval 3s → GET /system/metrics]'],
                      color:'#F87171'
                    },
                  ].map(col => (
                    <div key={col.label}>
                      <div style={{ fontSize:10, fontWeight:700, color:col.color, marginBottom:8, fontFamily:'JetBrains Mono,monospace' }}>{col.label}</div>
                      {col.fields.map(f => (
                        <div key={f} style={{ fontSize:11, color:'#94A3B8', marginBottom:4, fontFamily:'JetBrains Mono,monospace' }}>→ {f}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>
        )}

        {/* ══════════════ BACKEND REQUIREMENTS ══════════════ */}
        {activeTab === 'backend' && (
          <div className="space-y-5">
            {/* Requirements list */}
            <Section title="Backend Requirements" icon={Server} color="#F87171">
              <div className="space-y-2">
                {BACKEND_REQUIREMENTS.map((req, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg p-3"
                    style={{ background:'rgba(239,68,68,0.04)', border:'1px solid rgba(239,68,68,0.1)' }}>
                    <div className="rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ width:18, height:18, background:'rgba(239,68,68,0.15)', fontSize:9, fontWeight:800, color:'#F87171' }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.6 }}>{req}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* JWT spec */}
            <Section title="JWT Token Specification" icon={Key} color="#818CF8">
              <div className="rounded-xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-4 py-2 flex items-center gap-2" style={{ background:'rgba(255,255,255,0.03)' }}>
                  <Terminal size={13} style={{ color:'#818CF8' }} />
                  <span style={{ fontSize:11, color:'#818CF8', fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>JWT PAYLOAD SCHEMA</span>
                </div>
                <pre style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, color:'#94A3B8', padding:'16px 20px', margin:0, overflowX:'auto', lineHeight:1.7 }}>
{`{
  "sub":          "{{auth.user_id}}",          // User UUID
  "email":        "{{auth.email}}",
  "role":         "{{auth.role}}",             // RBAC role string
  "org_id":       "{{auth.org_id}}",           // Organization UUID
  "is_super_admin": false,                     // boolean flag
  "permissions":  ["{{role.permissions[0]}}", "..."], // resolved permissions
  "iat":          1711497600,                  // issued at (UTC unix)
  "exp":          1711501200,                  // expires at (UTC unix, 1h default)
  "jti":          "{{uuid}}",                  // JWT ID for revocation
  "iss":          "optiload-api"               // issuer
}`}
                </pre>
              </div>
              <div className="mt-4 rounded-xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.08)' }}>
                <div className="px-4 py-2" style={{ background:'rgba(255,255,255,0.03)' }}>
                  <span style={{ fontSize:11, color:'#818CF8', fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>AUTHORIZATION HEADER (all protected routes)</span>
                </div>
                <pre style={{ fontFamily:'JetBrains Mono,monospace', fontSize:12, color:'#94A3B8', padding:'16px 20px', margin:0 }}>
{`Authorization: Bearer {{auth.access_token}}`}
                </pre>
              </div>
            </Section>

            {/* Error response schema */}
            <Section title="Standardized API Response Schemas" icon={Code2} color="#34D399">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label:'SUCCESS (list)', code:`{\n  "data": [{{model[]}}],\n  "total": {{number}},\n  "page":  {{number}},\n  "limit": {{number}}\n}` },
                  { label:'SUCCESS (single)', code:`{\n  "data": {{model}}\n}` },
                  { label:'ERROR (4xx/5xx)', code:`{\n  "error":   "{{error.message}}",\n  "code":    "{{error.code}}",\n  "details": {{error.details | null}},\n  "path":    "{{request.path}}",\n  "ts":      "{{ISO 8601 UTC}}"\n}` },
                  { label:'VALIDATION ERROR (422)', code:`{\n  "error": "Validation failed",\n  "code":  "VALIDATION_ERROR",\n  "fields": {\n    "{{field_name}}": "{{error_message}}"\n  }\n}` },
                ].map(s => (
                  <div key={s.label} className="rounded-xl overflow-hidden" style={{ border:'1px solid rgba(255,255,255,0.07)' }}>
                    <div className="px-4 py-2" style={{ background:'rgba(255,255,255,0.03)' }}>
                      <span style={{ fontSize:10, color:'#34D399', fontFamily:'JetBrains Mono,monospace', fontWeight:700 }}>{s.label}</span>
                    </div>
                    <pre style={{ fontFamily:'JetBrains Mono,monospace', fontSize:11, color:'#94A3B8',
                      padding:'12px 16px', margin:0, overflowX:'auto', lineHeight:1.7 }}>
                      {s.code}
                    </pre>
                  </div>
                ))}
              </div>
            </Section>

            {/* UI States */}
            <Section title="UI State Enum Reference" icon={Activity} color="#A78BFA">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(UI_STATES).map(([state, desc]) => (
                  <div key={state} className="flex gap-3 rounded-lg p-3"
                    style={{ background:'rgba(139,92,246,0.05)', border:'1px solid rgba(139,92,246,0.15)' }}>
                    <Tag kind="state">{state}</Tag>
                    <span style={{ fontSize:11, color:'#94A3B8', lineHeight:1.5 }}>{desc}</span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Consistency rules */}
            <Section title="Naming Consistency Rules" icon={BookOpen} color="#FBBF24">
              <div className="space-y-2">
                {[
                  { rule:'DO NOT mix UI label text with token values', example:'✗ "Sarah Mitchell"  ✓ {{user.name}}' },
                  { rule:'Use snake_case for all field tokens', example:'✗ {{user.lastName}}  ✓ {{user.last_name}}' },
                  { rule:'Namespace must match API domain', example:'✗ {{data.email}}  ✓ {{user.email}}' },
                  { rule:'Arrays use plural bracket notation', example:'{{vehicle[]}} / {{load[]}} / {{optimization.placements[]}}' },
                  { rule:'Booleans are always lowercase true/false', example:'{{vehicle.hazmat}} = true | false' },
                  { rule:'All timestamps are ISO 8601 UTC', example:'"2026-03-27T00:00:00Z" — never Unix ms in UI tokens' },
                  { rule:'Sensitive fields (passwords, tokens) must never appear in UI annotations', example:'✗ {{auth.password}} in table  ✓ only in form binding' },
                  { rule:'Static mock data must be fully removed before integration', example:'Replace every hardcoded string, number, ID with a token' },
                ].map((r, i) => (
                  <div key={i} className="rounded-lg p-3"
                    style={{ background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.12)' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:'#FBBF24', marginBottom:4 }}>{r.rule}</div>
                    <code style={{ fontSize:11, color:'#94A3B8', fontFamily:'JetBrains Mono,monospace' }}>{r.example}</code>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}
      </div>
    </div>
  );
}