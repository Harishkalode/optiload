import React, { useState } from 'react';
import { ToggleLeft, ToggleRight, Building2, Search, AlertTriangle, CheckCircle2, Info, Zap } from 'lucide-react';
import { motion } from 'motion/react';

const SA = {
  bg: '#060A0F', card: '#0D1520', cardAlt: '#0A1018', border: '#162032',
  text: '#64748B', textPrimary: '#E2E8F0', textMuted: '#475569',
  cyan: '#06B6D4', blue: '#3B82F6', green: '#10B981',
  amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
};

interface Feature {
  id: string;
  name: string;
  description: string;
  category: string;
  risk: 'low' | 'medium' | 'high';
  beta?: boolean;
}

const FEATURES: Feature[] = [
  { id: 'F-001', name: 'Optimization Engine', description: 'Core multi-objective load optimization with AAR compliance', category: 'Core', risk: 'high' },
  { id: 'F-002', name: 'Advanced Analytics', description: 'Deep analytics, trend forecasting, and performance reports', category: 'Analytics', risk: 'low' },
  { id: 'F-003', name: 'Simulation Mode', description: 'Real-time shock & stress simulation on optimization results', category: 'Simulation', risk: 'medium', beta: true },
  { id: 'F-004', name: '3D Visualization', description: 'Interactive 3D scene viewer for load placement', category: 'Visualization', risk: 'low' },
  { id: 'F-005', name: 'Explainability Mode', description: 'AI-driven reasoning explanations for placement decisions', category: 'AI', risk: 'low', beta: true },
  { id: 'F-006', name: 'Bulk Import', description: 'CSV/Excel bulk import for loads and vehicles', category: 'Data', risk: 'low' },
  { id: 'F-007', name: 'API Access', description: 'Programmatic API access with key management', category: 'Integration', risk: 'medium' },
  { id: 'F-008', name: 'Compliance Export', description: 'AAR and DOT regulatory compliance report export', category: 'Compliance', risk: 'low' },
  { id: 'F-009', name: 'Multi-Objective Optimization', description: 'Weighted strategy optimization across multiple objectives', category: 'Core', risk: 'high', beta: true },
  { id: 'F-010', name: 'Real-time Collaboration', description: 'Multi-user real-time session sharing and commenting', category: 'Collaboration', risk: 'medium', beta: true },
  { id: 'F-011', name: 'Custom Role Creation', description: 'Allow admins to define custom roles and permissions', category: 'Security', risk: 'high' },
  { id: 'F-012', name: 'Webhook Integration', description: 'Outbound webhook notifications for job events', category: 'Integration', risk: 'low' },
];

const ORGS = [
  { id: 'ORG-001', name: 'RailCorp Inc.', plan: 'Enterprise' },
  { id: 'ORG-002', name: 'LogiTrans Partners', plan: 'Professional' },
  { id: 'ORG-003', name: 'FreightCo Global', plan: 'Enterprise' },
  { id: 'ORG-004', name: 'MidWest Rail', plan: 'Starter' },
  { id: 'ORG-005', name: 'National Rail Authority', plan: 'Enterprise' },
  { id: 'ORG-006', name: 'Coastal Logistics', plan: 'Professional' },
  { id: 'ORG-007', name: 'Alpine Freight', plan: 'Starter' },
  { id: 'ORG-008', name: 'Pacific Rail Systems', plan: 'Professional' },
];

const PLAN_COLORS: Record<string, string> = {
  Enterprise: SA.purple, Professional: SA.blue, Starter: SA.amber,
};

const RISK_COLORS: Record<string, string> = {
  low: SA.green, medium: SA.amber, high: SA.red,
};

// Default: Enterprise gets everything, Professional gets most, Starter gets basics
function defaultEnabled(featureId: string, plan: string): boolean {
  const starterFeatures = ['F-001', 'F-004', 'F-006', 'F-008'];
  const proFeatures = ['F-001', 'F-002', 'F-004', 'F-006', 'F-007', 'F-008', 'F-012'];
  if (plan === 'Starter') return starterFeatures.includes(featureId);
  if (plan === 'Professional') return proFeatures.includes(featureId);
  return !['F-010'].includes(featureId); // Enterprise: all except beta real-time
}

type OrgFeatureState = Record<string, Record<string, boolean>>;

export function FeatureControl() {
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(ORGS[0].id);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [pending, setPending] = useState<string | null>(null);

  const initState = (): OrgFeatureState => {
    const s: OrgFeatureState = {};
    ORGS.forEach(org => {
      s[org.id] = {};
      FEATURES.forEach(f => {
        s[org.id][f.id] = defaultEnabled(f.id, org.plan);
      });
    });
    return s;
  };

  const [state, setState] = useState<OrgFeatureState>(initState);

  const org = ORGS.find(o => o.id === selectedOrg)!;
  const categories = ['all', ...Array.from(new Set(FEATURES.map(f => f.category)))];

  const filtered = FEATURES.filter(f => {
    const matchSearch = f.name.toLowerCase().includes(search.toLowerCase()) || f.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === 'all' || f.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const toggle = (featureId: string) => {
    if (pending) return;
    setPending(featureId);
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        [selectedOrg]: {
          ...prev[selectedOrg],
          [featureId]: !prev[selectedOrg][featureId],
        },
      }));
      setPending(null);
    }, 400);
  };

  const enabledCount = FEATURES.filter(f => state[selectedOrg][f.id]).length;

  return (
    <div className="p-6 space-y-5" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, color: SA.textPrimary, letterSpacing: '-0.02em' }}>
          Feature Control
        </h1>
        <p style={{ fontSize: 13, color: SA.text, marginTop: 2 }}>
          Toggle platform features per organization — changes take effect immediately
        </p>
      </div>

      <div className="flex gap-5">
        {/* Org selector */}
        <div className="flex-shrink-0 w-56 space-y-1.5">
          <div style={{ fontSize: 11, color: SA.text, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Organizations</div>
          {ORGS.map(o => (
            <button
              key={o.id}
              onClick={() => setSelectedOrg(o.id)}
              className="w-full rounded-lg px-3 py-2.5 text-left transition-all"
              style={{
                background: selectedOrg === o.id ? SA.cyan + '15' : SA.card,
                border: `1px solid ${selectedOrg === o.id ? SA.cyan + '50' : SA.border}`,
                cursor: 'pointer',
              }}
            >
              <div className="flex items-center gap-2">
                <Building2 size={12} style={{ color: selectedOrg === o.id ? SA.cyan : SA.text }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: selectedOrg === o.id ? 600 : 400, color: selectedOrg === o.id ? SA.textPrimary : SA.text }}>
                    {o.name}
                  </div>
                  <div style={{ fontSize: 10, color: PLAN_COLORS[o.plan] }}>{o.plan}</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Feature panel */}
        <div className="flex-1 space-y-4">
          {/* Org header */}
          <div className="rounded-xl p-4 flex items-center justify-between" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: SA.textPrimary }}>{org.name}</div>
              <div style={{ fontSize: 12, color: SA.text, marginTop: 2 }}>
                <span style={{ color: PLAN_COLORS[org.plan], fontWeight: 600 }}>{org.plan}</span>
                {' · '}
                <span style={{ color: SA.green }}>{enabledCount} features enabled</span>
                {' / '}
                <span>{FEATURES.length} total</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-lg px-3 py-1.5" style={{ background: SA.amber + '10', border: `1px solid ${SA.amber}25` }}>
                <AlertTriangle size={12} style={{ color: SA.amber }} />
                <span style={{ fontSize: 11, color: SA.amber }}>Changes affect all users in this org</span>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-lg px-3 py-2 flex-1 min-w-48" style={{ background: SA.card, border: `1px solid ${SA.border}` }}>
              <Search size={13} style={{ color: SA.text }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search features..."
                style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: SA.textPrimary, flex: 1 }}
              />
            </div>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className="rounded-lg px-3 py-1.5 transition-all"
                style={{
                  fontSize: 12,
                  background: categoryFilter === cat ? SA.blue + '20' : SA.card,
                  border: `1px solid ${categoryFilter === cat ? SA.blue : SA.border}`,
                  color: categoryFilter === cat ? SA.blue : SA.text,
                  cursor: 'pointer', textTransform: cat === 'all' ? 'none' : 'none',
                }}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>

          {/* Feature grid */}
          <div className="space-y-2">
            {filtered.map(feature => {
              const enabled = state[selectedOrg][feature.id];
              const isToggling = pending === feature.id;
              return (
                <motion.div
                  key={feature.id}
                  layout
                  className="rounded-xl p-4 flex items-center justify-between gap-4 transition-all"
                  style={{
                    background: enabled ? SA.card : SA.cardAlt,
                    border: `1px solid ${enabled ? SA.border : SA.border + '80'}`,
                    opacity: isToggling ? 0.7 : 1,
                  }}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="rounded-lg p-1.5 mt-0.5 flex-shrink-0" style={{ background: (enabled ? SA.green : SA.text) + '18' }}>
                      <Zap size={13} style={{ color: enabled ? SA.green : SA.text }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ fontSize: 13, fontWeight: 600, color: enabled ? SA.textPrimary : SA.text }}>{feature.name}</span>
                        {feature.beta && (
                          <span className="rounded px-1.5 py-0.5" style={{ fontSize: 9, fontWeight: 700, background: SA.purple + '20', color: SA.purple, letterSpacing: '0.05em' }}>BETA</span>
                        )}
                        <span className="rounded px-1.5 py-0.5" style={{ fontSize: 9, background: RISK_COLORS[feature.risk] + '18', color: RISK_COLORS[feature.risk], textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {feature.risk} risk
                        </span>
                        <span className="rounded px-1.5 py-0.5" style={{ fontSize: 9, background: SA.border, color: SA.text, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          {feature.category}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: SA.text, marginTop: 2 }}>{feature.description}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span style={{ fontSize: 11, color: enabled ? SA.green : SA.text, fontWeight: 500 }}>{enabled ? 'Enabled' : 'Disabled'}</span>
                    <button
                      onClick={() => toggle(feature.id)}
                      disabled={isToggling}
                      className="transition-all"
                      style={{ background: 'none', border: 'none', cursor: isToggling ? 'wait' : 'pointer', padding: 0 }}
                    >
                      {enabled ? (
                        <ToggleRight size={28} style={{ color: SA.green }} />
                      ) : (
                        <ToggleLeft size={28} style={{ color: SA.textMuted }} />
                      )}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12 rounded-xl" style={{ background: SA.card, border: `1px solid ${SA.border}`, color: SA.text, fontSize: 13 }}>
              No features match your search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
