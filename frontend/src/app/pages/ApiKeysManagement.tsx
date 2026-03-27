import React, { useState } from 'react';
import { Key, Plus, Copy, Eye, EyeOff, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  scope: string[];
  created: string;
  lastUsed: string;
  status: 'active' | 'revoked';
  usage: number;
  rateLimit: string;
}

const MOCK_KEYS: ApiKey[] = [
  { id: 'AK-001', name: 'Production API - ERP Integration', key: 'optl_prod_8f4a9c2e1d7b3f5a...', scope: ['optimization.run', 'load.create', 'vehicle.view'], created: '2025-12-15', lastUsed: '2 hours ago', status: 'active', usage: 12847, rateLimit: '1000/hour' },
  { id: 'AK-002', name: 'WMS Integration', key: 'optl_prod_3d8e2f1a9c7b4e6d...', scope: ['load.create', 'load.view', 'optimization.view'], created: '2026-01-08', lastUsed: '5 hours ago', status: 'active', usage: 8924, rateLimit: '500/hour' },
  { id: 'AK-003', name: 'Mobile App - iOS', key: 'optl_prod_7c3f2a8e1d9b5e4a...', scope: ['optimization.view', 'execution.view', 'execution.confirm'], created: '2026-01-22', lastUsed: '1 day ago', status: 'active', usage: 3456, rateLimit: '100/hour' },
  { id: 'AK-004', name: 'Legacy System (Deprecated)', key: 'optl_prod_1a2b3c4d5e6f7g8h...', scope: ['load.view'], created: '2025-11-03', lastUsed: '3 weeks ago', status: 'revoked', usage: 245, rateLimit: '50/hour' },
  { id: 'AK-005', name: 'Test Environment', key: 'optl_test_9f8e7d6c5b4a3g2h...', scope: ['*'], created: '2026-02-10', lastUsed: '3 hours ago', status: 'active', usage: 567, rateLimit: 'Unlimited' },
];

export function ApiKeysManagement() {
  const { isDark, palette } = useTheme();
  const [keys, setKeys] = useState(MOCK_KEYS);
  const [showKey, setShowKey] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const bg = isDark ? '#0D1117' : '#FFFFFF';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const cardBg = isDark ? '#161D2A' : '#F8FAFC';
  const hoverBg = isDark ? '#1E2A38' : '#F1F5F9';

  const copyToClipboard = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API key copied to clipboard');
  };

  const revokeKey = (id: string) => {
    setKeys(keys.map(k => k.id === id ? { ...k, status: 'revoked' as const } : k));
    toast.success('API key revoked successfully');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: bg }}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, fontFamily: 'Space Grotesk, sans-serif' }}>
              API Keys
            </h2>
            <p style={{ fontSize: 12, color: text, marginTop: 2 }}>
              Manage API keys for system integrations
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:scale-105"
            style={{ background: palette.primary, color: 'white', fontWeight: 600, fontSize: 13 }}
          >
            <Plus size={16} />
            Create API Key
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex-shrink-0 mx-6 my-4 p-4 rounded-lg border" style={{ background: '#F59E0B10', borderColor: '#F59E0B40' }}>
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B', marginBottom: 4 }}>
              Keep your API keys secure
            </div>
            <div style={{ fontSize: 12, color: text, lineHeight: 1.5 }}>
              API keys provide full programmatic access to your account. Treat them like passwords and never commit them to version control. If a key is compromised, revoke it immediately.
            </div>
          </div>
        </div>
      </div>

      {/* API Keys List */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="space-y-3">
          {keys.map((apiKey, idx) => (
            <motion.div
              key={apiKey.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="p-5 rounded-lg border"
              style={{ background: cardBg, borderColor: border }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div
                    className="flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{
                      width: 40,
                      height: 40,
                      background: apiKey.status === 'active' ? palette.primary + '15' : '#64748B15'
                    }}
                  >
                    <Key size={18} style={{ color: apiKey.status === 'active' ? palette.primary : '#64748B' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary }}>{apiKey.name}</div>
                      {apiKey.status === 'active' ? (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: '#10B98115', fontSize: 11, fontWeight: 600, color: '#10B981' }}>
                          <CheckCircle2 size={10} />
                          Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded" style={{ background: '#64748B15', fontSize: 11, fontWeight: 600, color: '#64748B' }}>
                          Revoked
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: text, marginTop: 2 }}>
                      Created {apiKey.created} • ID: {apiKey.id}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {apiKey.status === 'active' && (
                    <>
                      <button
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="p-2 rounded-lg border transition-colors"
                        style={{ borderColor: border, color: text }}
                        title="Copy key"
                      >
                        <Copy size={14} />
                      </button>
                      <button
                        onClick={() => revokeKey(apiKey.id)}
                        className="p-2 rounded-lg border transition-colors"
                        style={{ borderColor: '#EF444440', color: '#EF4444' }}
                        title="Revoke key"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* API Key */}
              <div className="mb-4 p-3 rounded-lg font-mono flex items-center justify-between" style={{ background: bg, border: `1px solid ${border}` }}>
                <code style={{ fontSize: 13, color: textPrimary }}>
                  {showKey === apiKey.id ? apiKey.key : '••••••••••••••••••••••••••••••••'}
                </code>
                <button
                  onClick={() => setShowKey(showKey === apiKey.id ? null : apiKey.id)}
                  className="p-1 rounded hover:bg-opacity-10"
                  style={{ color: text }}
                >
                  {showKey === apiKey.id ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div>
                  <div style={{ fontSize: 11, color: text, marginBottom: 4 }}>Last Used</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{apiKey.lastUsed}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: text, marginBottom: 4 }}>Total Requests</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{apiKey.usage.toLocaleString()}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: text, marginBottom: 4 }}>Rate Limit</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{apiKey.rateLimit}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: text, marginBottom: 4 }}>Scopes</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: textPrimary }}>{apiKey.scope.length} permissions</div>
                </div>
              </div>

              {/* Scopes */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Scopes
                </div>
                <div className="flex flex-wrap gap-2">
                  {apiKey.scope.map((scope, idx) => (
                    <div
                      key={idx}
                      className="px-2 py-1 rounded font-mono"
                      style={{ background: bg, fontSize: 11, color: palette.primary, border: `1px solid ${border}` }}
                    >
                      {scope}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Create Modal (simplified) */}
      {showCreateModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0, 0, 0, 0.6)' }}
          onClick={() => setShowCreateModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 rounded-lg shadow-2xl"
            style={{ background: cardBg, border: `1px solid ${border}`, width: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>
              Create New API Key
            </h3>
            <div className="space-y-4">
              <div>
                <label style={{ fontSize: 12, color: text, marginBottom: 8, display: 'block' }}>Key Name</label>
                <input
                  type="text"
                  placeholder="e.g., Production ERP Integration"
                  className="w-full px-3 py-2 rounded-lg border outline-none"
                  style={{ background: bg, borderColor: border, color: textPrimary, fontSize: 13 }}
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border transition-colors"
                  style={{ borderColor: border, color: textPrimary, fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    toast.success('API key created successfully');
                  }}
                  className="flex-1 px-4 py-2 rounded-lg transition-all"
                  style={{ background: palette.primary, color: 'white', fontWeight: 600, fontSize: 13 }}
                >
                  Create Key
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
