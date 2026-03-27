import React, { useState } from 'react';
import { Shield, Bell, Key, Globe, Database, Lock, Save } from 'lucide-react';

const SA = {
  bg: '#060A0F', card: '#0D1520', cardAlt: '#0A1018', border: '#162032',
  text: '#64748B', textPrimary: '#E2E8F0', textMuted: '#475569',
  cyan: '#06B6D4', blue: '#3B82F6', green: '#10B981',
  amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
};

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative rounded-full transition-all duration-200"
      style={{ width: 36, height: 20, background: value ? SA.cyan : SA.border, border: 'none', cursor: 'pointer', flexShrink: 0 }}
    >
      <div
        className="absolute top-0.5 rounded-full transition-all duration-200"
        style={{ width: 16, height: 16, background: '#fff', left: value ? 18 : 2 }}
      />
    </button>
  );
}

const SECTIONS = [
  {
    id: 'security', label: 'Security', icon: Shield,
    settings: [
      { id: 'mfa_required', label: 'Force MFA for all Super Admins', sub: 'Require multi-factor authentication on every login', type: 'toggle', defaultVal: true },
      { id: 'session_timeout', label: 'Session Timeout', sub: 'Auto-logout after inactivity', type: 'select', options: ['30 min', '1 hour', '4 hours', '8 hours'], defaultVal: '1 hour' },
      { id: 'ip_allowlist', label: 'IP Allowlist', sub: 'Restrict Super Admin access to specific IP ranges', type: 'textarea', defaultVal: '10.0.0.0/8\n192.168.0.0/16' },
      { id: 'audit_retention', label: 'Audit Log Retention', sub: 'How long to keep global audit logs', type: 'select', options: ['30 days', '90 days', '180 days', '1 year', '3 years'], defaultVal: '90 days' },
    ]
  },
  {
    id: 'platform', label: 'Platform', icon: Globe,
    settings: [
      { id: 'maintenance_mode', label: 'Maintenance Mode', sub: 'Temporarily disable access for all non-admin users', type: 'toggle', defaultVal: false },
      { id: 'new_signups', label: 'New Organization Signups', sub: 'Allow new organizations to self-register', type: 'toggle', defaultVal: true },
      { id: 'default_plan', label: 'Default Plan for New Orgs', sub: 'Plan assigned at signup', type: 'select', options: ['Starter', 'Professional', 'Enterprise'], defaultVal: 'Starter' },
      { id: 'global_notice', label: 'Global System Notice', sub: 'Banner shown to all users across all orgs', type: 'textarea', defaultVal: '' },
    ]
  },
  {
    id: 'notifications', label: 'Notifications', icon: Bell,
    settings: [
      { id: 'critical_alerts', label: 'Critical System Alerts', sub: 'Notify Super Admin on critical incidents', type: 'toggle', defaultVal: true },
      { id: 'new_org_alerts', label: 'New Organization Alerts', sub: 'Notify when a new organization signs up', type: 'toggle', defaultVal: true },
      { id: 'error_threshold', label: 'Error Rate Alert Threshold', sub: 'Alert when error rate exceeds this value', type: 'select', options: ['1%', '2%', '5%', '10%'], defaultVal: '2%' },
      { id: 'slack_webhook', label: 'Slack Webhook URL', sub: 'Receive alerts in Slack', type: 'text', defaultVal: '' },
    ]
  },
  {
    id: 'api', label: 'API & Integrations', icon: Key,
    settings: [
      { id: 'rate_limit_global', label: 'Global Rate Limit (rpm)', sub: 'Maximum API requests per minute across all orgs', type: 'text', defaultVal: '10000' },
      { id: 'webhook_retries', label: 'Webhook Max Retries', sub: 'Number of retry attempts on webhook failure', type: 'select', options: ['1', '3', '5', '10'], defaultVal: '3' },
    ]
  },
];

export function SuperAdminSettings() {
  const [active, setActive] = useState('security');
  const [values, setValues] = useState<Record<string, any>>(() => {
    const v: Record<string, any> = {};
    SECTIONS.forEach(s => s.settings.forEach(s2 => { v[s2.id] = s2.defaultVal; }));
    return v;
  });

  const section = SECTIONS.find(s => s.id === active)!;

  return (
    <div className="p-6" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="mb-6">
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: SA.textPrimary, letterSpacing: '-0.02em' }}>
          Platform Settings
        </h1>
        <p style={{ fontSize: 13, color: SA.text, marginTop: 2 }}>Global configuration for the OptiLoad platform</p>
      </div>

      <div className="flex gap-5">
        {/* Section nav */}
        <div className="flex-shrink-0 w-48 space-y-1">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all text-left"
              style={{
                background: active === s.id ? SA.cyan + '15' : 'transparent',
                border: `1px solid ${active === s.id ? SA.cyan + '40' : 'transparent'}`,
                cursor: 'pointer',
              }}
            >
              <s.icon size={14} style={{ color: active === s.id ? SA.cyan : SA.text }} />
              <span style={{ fontSize: 13, fontWeight: active === s.id ? 600 : 400, color: active === s.id ? SA.textPrimary : SA.text }}>
                {s.label}
              </span>
            </button>
          ))}
        </div>

        {/* Settings panel */}
        <div className="flex-1 space-y-4">
          <div className="rounded-xl overflow-hidden" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
            <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: `1px solid ${SA.border}` }}>
              <section.icon size={15} style={{ color: SA.cyan }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: SA.textPrimary }}>{section.label} Settings</span>
            </div>
            <div className="p-5 space-y-5">
              {section.settings.map(setting => (
                <div key={setting.id} className="flex items-start justify-between gap-6">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: SA.textPrimary }}>{setting.label}</div>
                    <div style={{ fontSize: 12, color: SA.text, marginTop: 2 }}>{setting.sub}</div>
                  </div>
                  <div className="flex-shrink-0">
                    {setting.type === 'toggle' && (
                      <Toggle value={values[setting.id]} onChange={v => setValues(prev => ({ ...prev, [setting.id]: v }))} />
                    )}
                    {setting.type === 'select' && (
                      <select
                        value={values[setting.id]}
                        onChange={e => setValues(prev => ({ ...prev, [setting.id]: e.target.value }))}
                        style={{ background: SA.cardAlt, border: `1px solid ${SA.border}`, color: SA.textPrimary, borderRadius: 8, padding: '6px 12px', fontSize: 12, outline: 'none', cursor: 'pointer' }}
                      >
                        {(setting as any).options?.map((o: string) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    )}
                    {setting.type === 'text' && (
                      <input
                        value={values[setting.id]}
                        onChange={e => setValues(prev => ({ ...prev, [setting.id]: e.target.value }))}
                        style={{ background: SA.cardAlt, border: `1px solid ${SA.border}`, color: SA.textPrimary, borderRadius: 8, padding: '6px 12px', fontSize: 12, outline: 'none', width: 180 }}
                      />
                    )}
                    {setting.type === 'textarea' && (
                      <textarea
                        value={values[setting.id]}
                        onChange={e => setValues(prev => ({ ...prev, [setting.id]: e.target.value }))}
                        rows={3}
                        style={{ background: SA.cardAlt, border: `1px solid ${SA.border}`, color: SA.textPrimary, borderRadius: 8, padding: '8px 12px', fontSize: 12, outline: 'none', width: 240, resize: 'vertical', fontFamily: 'monospace' }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              className="flex items-center gap-2 rounded-lg px-5 py-2.5 transition-all"
              style={{ background: SA.cyan, color: '#fff', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Save size={14} /> Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
