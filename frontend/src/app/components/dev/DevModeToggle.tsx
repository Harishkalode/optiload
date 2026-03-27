import React, { useState } from 'react';
import { Code2, X, ExternalLink, Layers, Database, Globe, Zap, GitBranch, Server, BookOpen } from 'lucide-react';
import { useDevMode } from '../../contexts/DevModeContext';
import { useNavigate } from 'react-router';

export function DevModeToggle() {
  const { devMode, toggleDevMode } = useDevMode();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 8,
        fontFamily: 'JetBrains Mono, monospace',
      }}
    >
      {/* Expanded panel */}
      {expanded && (
        <div style={{
          background: '#0A1220',
          border: '1px solid rgba(6,182,212,0.3)',
          borderRadius: 12,
          padding: '14px 16px',
          width: 272,
          boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
        }}>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: 11, fontWeight: 700, color: '#22D3EE', letterSpacing: '0.05em' }}>
              DEV MODE
            </span>
            <button onClick={() => setExpanded(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 0 }}>
              <X size={13} />
            </button>
          </div>

          <div style={{ fontSize: 10, color: '#475569', marginBottom: 10, lineHeight: 1.6 }}>
            Toggle API annotation overlays on all screens.
            Shortcut: <span style={{ color: '#22D3EE' }}>Ctrl+Shift+D</span>
          </div>

          {/* Toggle */}
          <div className="flex items-center justify-between mb-4 rounded-lg px-3 py-2"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span style={{ fontSize: 11, color: devMode ? '#22D3EE' : '#475569', fontWeight: 700 }}>
              {devMode ? 'Annotations ON' : 'Annotations OFF'}
            </span>
            <button
              onClick={toggleDevMode}
              style={{
                width: 36, height: 20, borderRadius: 10, cursor: 'pointer', border: 'none',
                background: devMode ? '#0891B2' : '#1E293B',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <div style={{
                width: 14, height: 14, borderRadius: 7, background: '#fff',
                position: 'absolute', top: 3, left: devMode ? 19 : 3,
                transition: 'left 0.2s',
              }} />
            </button>
          </div>

          {/* Integration Map links */}
          <div style={{ fontSize: 10, color: '#334155', marginBottom: 6, fontWeight: 700, letterSpacing: '0.05em' }}>
            INTEGRATION MAP
          </div>
          {[
            { label: 'Screen Map',    icon: Layers,    path: '/dev/integration-map' },
            { label: 'Field Tokens',  icon: Database,  path: '/dev/integration-map' },
            { label: 'Endpoints',     icon: Globe,     path: '/dev/integration-map' },
            { label: 'Actions',       icon: Zap,       path: '/dev/integration-map' },
            { label: 'Data Flows',    icon: GitBranch, path: '/dev/integration-map' },
            { label: 'Backend Reqs',  icon: Server,    path: '/dev/integration-map' },
          ].map(({ label, icon: Icon, path }) => (
            <button
              key={label}
              onClick={() => { navigate(path); setExpanded(false); }}
              className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 11,
                textAlign: 'left', marginBottom: 2 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <Icon size={12} style={{ color: '#22D3EE', flexShrink: 0 }} />
              {label}
              <ExternalLink size={10} style={{ marginLeft: 'auto', opacity: 0.4 }} />
            </button>
          ))}

          <button
            onClick={() => { navigate('/dev/integration-map'); setExpanded(false); }}
            className="flex items-center justify-center gap-2 w-full rounded-lg py-2 mt-2 transition-colors"
            style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)',
              color: '#22D3EE', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(6,182,212,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(6,182,212,0.12)')}
          >
            <ExternalLink size={12} /> Integration Map
          </button>

          {/* Divider */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '12px 0 10px' }} />

          {/* API Docs links */}
          <div style={{ fontSize: 10, color: '#334155', marginBottom: 6, fontWeight: 700, letterSpacing: '0.05em' }}>
            DEVELOPER COMMENT LAYER
          </div>
          {[
            { label: 'API Comments',      icon: Globe,     tab: 'api' },
            { label: 'Variable Comments', icon: Database,  tab: 'variables' },
            { label: 'Action Comments',   icon: Zap,       tab: 'actions' },
            { label: 'State Comments',    icon: Server,    tab: 'states' },
          ].map(({ label, icon: Icon, tab }) => (
            <button
              key={tab}
              onClick={() => { navigate('/dev/api-docs'); setExpanded(false); }}
              className="flex items-center gap-2 w-full rounded-md px-2 py-1.5 transition-colors"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', fontSize: 11,
                textAlign: 'left', marginBottom: 2 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <Icon size={12} style={{ color: '#818CF8', flexShrink: 0 }} />
              {label}
              <ExternalLink size={10} style={{ marginLeft: 'auto', opacity: 0.4 }} />
            </button>
          ))}

          <button
            onClick={() => { navigate('/dev/api-docs'); setExpanded(false); }}
            className="flex items-center justify-center gap-2 w-full rounded-lg py-2 mt-2 transition-colors"
            style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
              color: '#818CF8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.22)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.12)')}
          >
            <BookOpen size={12} /> Developer Comment Layer
          </button>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setExpanded(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: devMode ? 'rgba(6,182,212,0.15)' : 'rgba(13,21,32,0.95)',
          border: `1px solid ${devMode ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 99, padding: '8px 14px',
          cursor: 'pointer', boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          transition: 'all 0.2s',
        }}
        title="Dev Mode (Ctrl+Shift+D)"
      >
        <Code2 size={13} style={{ color: devMode ? '#22D3EE' : '#475569' }} />
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.05em',
          color: devMode ? '#22D3EE' : '#475569',
        }}>
          {devMode ? 'DEV ON' : 'DEV'}
        </span>
        {devMode && (
          <div style={{ width: 6, height: 6, borderRadius: 3, background: '#22D3EE',
            boxShadow: '0 0 6px #22D3EE' }} />
        )}
      </button>
    </div>
  );
}