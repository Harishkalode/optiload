import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen, ChevronDown, ChevronRight, Lock, Users, Shield,
  Cpu, Truck, Package, FileText, Server, Database, Zap,
  Globe, Activity, Terminal, Code2, CheckCircle2, XCircle,
  AlertTriangle, ArrowRight, Info, Hash, Type, Eye, Box,
  ToggleLeft, RefreshCw, Clock, ExternalLink
} from 'lucide-react';
import {
  MODULE_INDEX, VARIABLE_COMMENTS, ACTION_COMMENTS, STATE_COMMENTS,
  type ApiComment, type VariableComment, type ActionComment, type StateComment,
} from '../config/apiDocs';

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  bg:       '#05090E',
  surface:  '#0A1018',
  card:     '#0D1520',
  border:   'rgba(255,255,255,0.07)',
  borderMid:'rgba(255,255,255,0.04)',
  text:     '#94A3B8',
  textDim:  '#475569',
  textPri:  '#E2E8F0',
  mono:     'JetBrains Mono, monospace',
  sans:     'Space Grotesk, sans-serif',
  body:     'Inter, sans-serif',
};

const METHOD_COLOR: Record<string, string> = {
  GET: '#34D399', POST: '#60A5FA', PUT: '#FBBF24', PATCH: '#FBBF24', DELETE: '#F87171',
};
const TYPE_COLOR: Record<string, string> = {
  string: '#34D399', number: '#60A5FA', boolean: '#A78BFA', array: '#F472B6',
  datetime: '#FBBF24', object: '#22D3EE',
};
const MOD_ICON: Record<string, any> = {
  auth: Lock, users: Users, roles: Shield, opt: Cpu,
  veh: Truck, loads: Package, audit: FileText, system: Server,
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVE BADGES
// ─────────────────────────────────────────────────────────────────────────────
function MethodBadge({ method }: { method: string }) {
  const c = METHOD_COLOR[method] || '#94A3B8';
  return (
    <span style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 800, color: c,
      background: c + '18', border: `1px solid ${c}30`, borderRadius: 4, padding: '2px 7px' }}>
      {method}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const base = type.replace('array<','').replace('>','').split('<')[0];
  const c = TYPE_COLOR[base] || '#94A3B8';
  return (
    <span style={{ fontFamily: C.mono, fontSize: 10, color: c,
      background: c + '12', border: `1px solid ${c}25`, borderRadius: 3, padding: '1px 5px' }}>
      {type}
    </span>
  );
}

function RequiredPill({ required }: { required: boolean }) {
  return required
    ? <span style={{ fontFamily: C.mono, fontSize: 9, fontWeight: 700, color: '#F87171',
        background: '#F8717112', border: '1px solid #F8717130', borderRadius: 3, padding: '1px 5px' }}>required</span>
    : <span style={{ fontFamily: C.mono, fontSize: 9, color: '#475569',
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 3, padding: '1px 5px' }}>optional</span>;
}

function SectionLabel({ children, color = '#60A5FA' }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{ fontFamily: C.mono, fontSize: 9, fontWeight: 800, color, letterSpacing: '0.08em',
      textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 2, height: 12, background: color, borderRadius: 1, flexShrink: 0 }} />
      {children}
    </div>
  );
}

function CodeBlock({ children, lang = '' }: { children: string; lang?: string }) {
  return (
    <div style={{ borderRadius: 8, overflow: 'hidden', border: `1px solid ${C.border}` }}>
      {lang && (
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '4px 12px',
          borderBottom: `1px solid ${C.border}`, fontFamily: C.mono, fontSize: 9, color: C.textDim }}>
          {lang}
        </div>
      )}
      <pre style={{ fontFamily: C.mono, fontSize: 11, color: '#94A3B8', padding: '12px 16px',
        margin: 0, overflowX: 'auto', lineHeight: 1.8, background: '#060A10' }}>
        {children}
      </pre>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 4, alignItems: 'flex-start' }}>
      <span style={{ fontFamily: C.mono, fontSize: 10, color: C.textDim, flexShrink: 0, width: 80, paddingTop: 1 }}>
        {label}
      </span>
      <span style={{ fontSize: 12, color: C.text, lineHeight: 1.5, flex: 1 }}>{children}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COLLAPSIBLE WRAPPER
// ─────────────────────────────────────────────────────────────────────────────
function Collapsible({ id, title, subtitle, accent, defaultOpen = false, children, badge }:
  { id: string; title: string; subtitle?: string; accent: string; defaultOpen?: boolean; children: React.ReactNode; badge?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }} id={id}>
      <button onClick={() => setOpen(v => !v)} className="w-full text-left transition-colors"
        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
          background: `${accent}06`, border: 'none', cursor: 'pointer' }}>
        <div style={{ width: 3, height: 22, background: accent, borderRadius: 2, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: C.mono, fontSize: 12, fontWeight: 700, color: C.textPri }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: C.textDim, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {badge && (
          <span style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim,
            background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
            borderRadius: 99, padding: '2px 8px', flexShrink: 0 }}>{badge}</span>
        )}
        {open ? <ChevronDown size={14} style={{ color: C.textDim, flexShrink: 0 }} />
               : <ChevronRight size={14} style={{ color: C.textDim, flexShrink: 0 }} />}
      </button>
      {open && (
        <div style={{ padding: '16px 20px', borderTop: `1px solid ${C.border}`, background: C.surface }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// API COMMENT CARD
// ─────────────────────────────────────────────────────────────────────────────
function ApiCommentCard({ comment, accent, index }: { comment: ApiComment; accent: string; index: number }) {
  const id = `api-${comment.method}-${comment.endpoint.replace(/[^a-z0-9]/gi, '-')}`;
  return (
    <Collapsible
      id={id}
      defaultOpen={index === 0}
      accent={METHOD_COLOR[comment.method] || accent}
      title={`${comment.method} ${comment.endpoint}`}
      subtitle={comment.description.slice(0, 90) + (comment.description.length > 90 ? '…' : '')}
      badge={`[API COMMENT] · HTTP ${comment.response.successCode}`}
    >
      {/* Comment header banner */}
      <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`, borderRadius: 8,
        padding: '10px 14px', marginBottom: 16, fontFamily: C.mono, fontSize: 10 }}>
        <div style={{ color: C.textDim, marginBottom: 4 }}>{'// ─'.repeat(30)}</div>
        <div style={{ color: '#60A5FA', fontWeight: 700 }}>{'// [API COMMENT]'}</div>
        <div style={{ color: C.textDim }}>{'// ENDPOINT: '}<span style={{ color: C.textPri }}>{comment.method} {comment.endpoint}</span></div>
        <div style={{ color: C.textDim }}>{'// MODULE:   '}<span style={{ color: accent }}>{comment.module}</span></div>
        <div style={{ color: C.textDim }}>{'// AUTH:     '}<span style={{ color: comment.auth ? '#34D399' : '#F59E0B' }}>{comment.auth ? 'Required (Bearer Token)' : 'Not Required (Public endpoint)'}</span></div>
        {comment.authNote && <div style={{ color: '#F59E0B' }}>{'// NOTE:     '}{comment.authNote}</div>}
        <div style={{ color: C.textDim }}>{'// ─'.repeat(30)}</div>
      </div>

      {/* Description */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel color="#60A5FA">DESCRIPTION</SectionLabel>
        <p style={{ fontSize: 12, color: C.text, lineHeight: 1.7, margin: 0, padding: '10px 12px',
          background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 6 }}>
          {comment.description}
        </p>
      </div>

      {/* Request */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel color="#FBBF24">REQUEST</SectionLabel>
        <div style={{ background: 'rgba(255,255,255,0.025)', borderRadius: 8, padding: '12px 14px',
          border: `1px solid ${C.border}` }}>
          {comment.request.headers && comment.request.headers.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>HEADERS</div>
              {comment.request.headers.map(h => (
                <div key={h} style={{ fontFamily: C.mono, fontSize: 11, color: '#FBBF24', marginBottom: 2 }}>
                  {'→ '}{h}
                </div>
              ))}
            </div>
          )}

          {comment.request.queryParams && comment.request.queryParams.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>QUERY PARAMETERS</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Param', 'Type', 'Required', 'Description'].map(h => (
                      <th key={h} style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim, textAlign: 'left',
                        padding: '3px 8px', borderBottom: `1px solid ${C.borderMid}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comment.request.queryParams.map(p => (
                    <tr key={p.name} onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                      <td style={{ padding: '5px 8px' }}><code style={{ fontFamily: C.mono, fontSize: 11, color: '#FBBF24' }}>{p.name}</code></td>
                      <td style={{ padding: '5px 8px' }}><TypeBadge type={p.type} /></td>
                      <td style={{ padding: '5px 8px' }}><RequiredPill required={p.required} /></td>
                      <td style={{ padding: '5px 8px', fontSize: 11, color: C.text }}>{p.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {comment.request.body && comment.request.body.length > 0 && (
            <div>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>REQUEST BODY (JSON)</div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['Field', 'Type', 'Required', 'Description', 'Validation'].map(h => (
                      <th key={h} style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim, textAlign: 'left',
                        padding: '3px 8px', borderBottom: `1px solid ${C.borderMid}`, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {comment.request.body.map(f => (
                    <tr key={f.field} onMouseEnter={e => (e.currentTarget.style.background='rgba(255,255,255,0.02)')}
                      onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                      <td style={{ padding: '5px 8px' }}><code style={{ fontFamily: C.mono, fontSize: 11, color: '#60A5FA' }}>{f.field}</code></td>
                      <td style={{ padding: '5px 8px' }}><TypeBadge type={f.type} /></td>
                      <td style={{ padding: '5px 8px' }}><RequiredPill required={f.required} /></td>
                      <td style={{ padding: '5px 8px', fontSize: 11, color: C.text }}>{f.description}</td>
                      <td style={{ padding: '5px 8px', fontSize: 10, color: C.textDim, fontFamily: C.mono }}>{f.validation || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Response */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel color="#34D399">RESPONSE — HTTP {comment.response.successCode}</SectionLabel>
        <CodeBlock lang="JSON">{comment.response.success}</CodeBlock>
        {comment.response.errorCodes.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <div style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim, marginBottom: 6, letterSpacing: '0.06em', textTransform: 'uppercase' }}>ERROR CODES</div>
            {comment.response.errorCodes.map(e => (
              <div key={e.code} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: '#F87171',
                  background: '#F8717112', border: '1px solid #F8717130', borderRadius: 3, padding: '1px 6px', flexShrink: 0 }}>
                  HTTP {e.code}
                </span>
                <span style={{ fontSize: 11, color: C.text }}>{e.meaning}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* UI Bindings */}
      {comment.uiBindings.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel color="#A78BFA">UI BINDINGS</SectionLabel>
          <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)', borderRadius: 8, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid rgba(139,92,246,0.15)` }}>
                  {['Token', 'UI Element', 'Screen'].map(h => (
                    <th key={h} style={{ fontFamily: C.mono, fontSize: 9, color: '#A78BFA', textAlign: 'left',
                      padding: '6px 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comment.uiBindings.map((b, i) => (
                  <tr key={i} style={{ borderBottom: i < comment.uiBindings.length - 1 ? `1px solid rgba(255,255,255,0.03)` : 'none' }}
                    onMouseEnter={e => (e.currentTarget.style.background='rgba(139,92,246,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background='transparent')}>
                    <td style={{ padding: '6px 10px' }}><code style={{ fontFamily: C.mono, fontSize: 10, color: '#FBBF24' }}>{b.token}</code></td>
                    <td style={{ padding: '6px 10px', fontSize: 11, color: C.text }}>{b.element}</td>
                    <td style={{ padding: '6px 10px', fontSize: 11, color: C.textDim, fontFamily: C.mono }}>{b.screen}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* States */}
      <div style={{ marginBottom: 16 }}>
        <SectionLabel color="#22D3EE">STATES</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {comment.states.map(s => (
            <div key={s.state} style={{ display: 'flex', gap: 10, padding: '8px 12px', borderRadius: 6,
              background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: C.mono, fontSize: 10, fontWeight: 700, color: '#22D3EE',
                background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
                borderRadius: 4, padding: '1px 7px', flexShrink: 0, height: 'fit-content' }}>
                {s.state}
              </span>
              <span style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{s.behavior}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Edge Cases */}
      {comment.edgeCases.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <SectionLabel color="#F59E0B">EDGE CASES</SectionLabel>
          <div style={{ background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8, padding: '10px 12px' }}>
            {comment.edgeCases.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 5 }}>
                <AlertTriangle size={11} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 11, color: C.text, lineHeight: 1.5 }}>{e}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Validation */}
      {comment.validation.length > 0 && (
        <div style={{ marginBottom: comment.notes ? 16 : 0 }}>
          <SectionLabel color="#34D399">VALIDATION</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {comment.validation.map((v, i) => (
              <div key={i} style={{ display: 'flex', gap: 8 }}>
                <CheckCircle2 size={11} style={{ color: '#34D399', flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 11, color: C.text }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      {comment.notes && (
        <div style={{ marginTop: 0 }}>
          <SectionLabel color="#818CF8">NOTES</SectionLabel>
          <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 6, padding: '8px 12px', fontSize: 11, color: C.text, lineHeight: 1.6 }}>
            {comment.notes}
          </div>
        </div>
      )}
    </Collapsible>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VARIABLE COMMENT CARD
// ─────────────────────────────────────────────────────────────────────────────
function VariableCommentCard({ v }: { v: VariableComment }) {
  const baseType = v.type.replace('array<','').replace('>','');
  const c = TYPE_COLOR[baseType] || '#94A3B8';
  return (
    <Collapsible
      id={`var-${v.token.replace(/[^a-z0-9]/gi,'-')}`}
      accent={c}
      title={v.token}
      subtitle={v.description.slice(0, 80) + '…'}
      badge="[VARIABLE COMMENT]"
    >
      <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`, borderRadius: 8,
        padding: '10px 14px', marginBottom: 14, fontFamily: C.mono, fontSize: 10 }}>
        <div style={{ color: C.textDim, marginBottom: 2 }}>{'// [VARIABLE COMMENT]'}</div>
        <div style={{ color: C.textDim }}>{'// NAME:      '}<span style={{ color: '#FBBF24' }}>{v.token}</span></div>
        <div style={{ color: C.textDim }}>{'// TYPE:      '}<span style={{ color: c }}>{v.type}</span></div>
        <div style={{ color: C.textDim }}>{'// SOURCE:    '}<span style={{ color: '#34D399' }}>{v.sourceMethod} {v.source}</span></div>
        {v.sensitive && <div style={{ color: '#F87171' }}>{'// ⚠ SENSITIVE — never log or display to end users'}</div>}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <SectionLabel color={c}>DESCRIPTION</SectionLabel>
          <p style={{ fontSize: 12, color: C.text, lineHeight: 1.6, margin: 0 }}>{v.description}</p>
          {v.example && (
            <div style={{ marginTop: 8, fontFamily: C.mono, fontSize: 11, color: '#34D399' }}>
              Example: <span style={{ color: C.textPri }}>{v.example}</span>
            </div>
          )}
        </div>
        <div>
          <SectionLabel color="#60A5FA">TYPE DETAILS</SectionLabel>
          <InfoRow label="Type"><TypeBadge type={v.type} /></InfoRow>
          <InfoRow label="Source"><code style={{ fontFamily: C.mono, fontSize: 10, color: '#34D399' }}>{v.sourceMethod} {v.source}</code></InfoRow>
          <InfoRow label="Fallback"><code style={{ fontFamily: C.mono, fontSize: 10, color: '#FBBF24' }}>{v.fallback}</code></InfoRow>
          {v.sensitive && <InfoRow label="Sensitive"><span style={{ color: '#F87171', fontSize: 11, fontWeight: 600 }}>🔒 Yes — treat as secret</span></InfoRow>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <SectionLabel color="#A78BFA">USED IN</SectionLabel>
          {v.usedIn.map((u, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 4 }}>
              <ArrowRight size={10} style={{ color: '#A78BFA', flexShrink: 0, marginTop: 3 }} />
              <span style={{ fontSize: 11, color: C.text }}>{u}</span>
            </div>
          ))}
        </div>
        <div>
          <SectionLabel color="#34D399">VALIDATION</SectionLabel>
          {v.validation.map((val, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 4 }}>
              <CheckCircle2 size={10} style={{ color: '#34D399', flexShrink: 0, marginTop: 3 }} />
              <span style={{ fontSize: 11, color: C.text }}>{val}</span>
            </div>
          ))}
          {v.validation.length === 0 && <span style={{ fontSize: 11, color: C.textDim }}>No additional validation</span>}
        </div>
      </div>
    </Collapsible>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTION COMMENT CARD
// ─────────────────────────────────────────────────────────────────────────────
function ActionCommentCard({ a }: { a: ActionComment }) {
  const mc = METHOD_COLOR[a.method] || '#94A3B8';
  return (
    <Collapsible
      id={`act-${a.id}`}
      accent={mc}
      title={a.action}
      subtitle={`${a.method} ${a.endpoint} · ${a.trigger}`}
      badge="[ACTION COMMENT]"
    >
      <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`, borderRadius: 8,
        padding: '10px 14px', marginBottom: 14, fontFamily: C.mono, fontSize: 10 }}>
        <div style={{ color: '#FBBF24', fontWeight: 700 }}>{'// [ACTION COMMENT]'}</div>
        <div style={{ color: C.textDim }}>{'// ACTION:  '}<span style={{ color: C.textPri }}>{a.action}</span></div>
        <div style={{ color: C.textDim }}>{'// TRIGGER: '}<span style={{ color: '#22D3EE' }}>{a.trigger}</span></div>
        <div style={{ color: C.textDim }}>{'// API:     '}<span style={{ color: mc }}>{a.method} {a.endpoint}</span></div>
        {a.redirect && <div style={{ color: C.textDim }}>{'// REDIRECT: '}<span style={{ color: '#A78BFA' }}>{a.redirect}</span></div>}
        {a.optimisticUpdate && <div style={{ color: '#F59E0B' }}>{'// OPTIMISTIC: '}{a.optimisticUpdate}</div>}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Payload */}
        {a.payload && a.payload.length > 0 && (
          <div>
            <SectionLabel color="#F472B6">PAYLOAD</SectionLabel>
            <div style={{ background: 'rgba(244,114,182,0.05)', border: '1px solid rgba(244,114,182,0.15)',
              borderRadius: 7, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(244,114,182,0.12)' }}>
                    {['field', 'type', 'req'].map(h => (
                      <th key={h} style={{ fontFamily: C.mono, fontSize: 9, color: '#F472B6', textAlign: 'left',
                        padding: '4px 8px', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {a.payload.map(p => (
                    <tr key={p.field} style={{ borderBottom: `1px solid ${C.borderMid}` }}>
                      <td style={{ padding: '4px 8px' }}><code style={{ fontFamily: C.mono, fontSize: 10, color: '#60A5FA' }}>{p.field}</code></td>
                      <td style={{ padding: '4px 8px' }}><TypeBadge type={p.type} /></td>
                      <td style={{ padding: '4px 8px' }}><RequiredPill required={p.required} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Validation */}
        <div>
          <SectionLabel color="#34D399">VALIDATION</SectionLabel>
          {a.validation.map((v, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
              <CheckCircle2 size={10} style={{ color: '#34D399', flexShrink: 0, marginTop: 3 }} />
              <span style={{ fontSize: 11, color: C.text }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <SectionLabel color="#10B981">SUCCESS BEHAVIOR</SectionLabel>
          {a.successBehavior.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
              <CheckCircle2 size={10} style={{ color: '#10B981', flexShrink: 0, marginTop: 3 }} />
              <span style={{ fontSize: 11, color: C.text }}>{s}</span>
            </div>
          ))}
        </div>
        <div>
          <SectionLabel color="#F87171">ERROR BEHAVIOR</SectionLabel>
          {a.errorBehavior.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
              <XCircle size={10} style={{ color: '#F87171', flexShrink: 0, marginTop: 3 }} />
              <span style={{ fontSize: 11, color: C.text }}>{e}</span>
            </div>
          ))}
        </div>
      </div>

      {a.invalidates && a.invalidates.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <SectionLabel color="#818CF8">CACHE INVALIDATION</SectionLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {a.invalidates.map(inv => (
              <span key={inv} style={{ fontFamily: C.mono, fontSize: 10, color: '#818CF8',
                background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: 4, padding: '2px 8px' }}>
                invalidates: {inv}
              </span>
            ))}
          </div>
        </div>
      )}
    </Collapsible>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STATE COMMENT CARD
// ─────────────────────────────────────────────────────────────────────────────
const STATE_COLORS: Record<string, string> = {
  loading: '#A78BFA', error: '#F87171', empty: '#94A3B8', success: '#34D399',
  polling: '#22D3EE', stale: '#F59E0B', optimistic: '#60A5FA',
};

function StateCommentCard({ s }: { s: StateComment }) {
  const c = STATE_COLORS[s.state] || '#94A3B8';
  return (
    <Collapsible
      id={`state-${s.state}-${s.module}`}
      accent={c}
      title={`[STATE: ${s.state.toUpperCase()}]`}
      subtitle={`${s.module} · ${s.trigger.slice(0, 70)}${s.trigger.length > 70 ? '…' : ''}`}
      badge="[STATE COMMENT]"
    >
      <div style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${C.border}`, borderRadius: 8,
        padding: '10px 14px', marginBottom: 14, fontFamily: C.mono, fontSize: 10 }}>
        <div style={{ color: c, fontWeight: 700 }}>{'// [STATE COMMENT]'}</div>
        <div style={{ color: C.textDim }}>{'// STATE:   '}<span style={{ color: c }}>{s.state}</span></div>
        <div style={{ color: C.textDim }}>{'// MODULE:  '}<span style={{ color: C.textPri }}>{s.module}</span></div>
        <div style={{ color: C.textDim }}>{'// TRIGGER: '}<span style={{ color: '#22D3EE' }}>{s.trigger}</span></div>
        <div style={{ color: C.textDim }}>{'// EXIT:    '}<span style={{ color: '#34D399' }}>{s.exitCondition}</span></div>
        <div style={{ color: C.textDim }}>{'// NEXT:    '}<span style={{ color: '#A78BFA' }}>{s.transitionTo}</span></div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <SectionLabel color={c}>UI BEHAVIOR</SectionLabel>
          {s.uiBehavior.map((b, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
              <Activity size={10} style={{ color: c, flexShrink: 0, marginTop: 3 }} />
              <span style={{ fontSize: 11, color: C.text }}>{b}</span>
            </div>
          ))}
        </div>
        <div>
          <SectionLabel color="#F87171">DISABLED ELEMENTS</SectionLabel>
          {s.disabledElements.length > 0 ? s.disabledElements.map((d, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, marginBottom: 5 }}>
              <ToggleLeft size={10} style={{ color: '#F87171', flexShrink: 0, marginTop: 3 }} />
              <span style={{ fontSize: 11, color: C.text }}>{d}</span>
            </div>
          )) : <span style={{ fontSize: 11, color: C.textDim }}>No elements disabled</span>}

          <div style={{ marginTop: 12 }}>
            <SectionLabel color="#34D399">EXIT CONDITION</SectionLabel>
            <div style={{ fontSize: 11, color: C.text, padding: '6px 10px',
              background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 5 }}>
              {s.exitCondition}
            </div>
          </div>
        </div>
      </div>

      <SectionLabel color="#818CF8">EXAMPLE FLOW</SectionLabel>
      <div style={{ fontFamily: C.mono, fontSize: 11, color: '#818CF8', padding: '8px 12px',
        background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 6, lineHeight: 1.7 }}>
        {s.example}
      </div>
    </Collapsible>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB BAR
// ─────────────────────────────────────────────────────────────────────────────
type Tab = 'api' | 'variables' | 'actions' | 'states';

const TABS: Array<{ id: Tab; label: string; icon: any; count: number; color: string }> = [
  { id: 'api',       label: 'API Comments',      icon: Globe,     count: 0, color: '#60A5FA' },
  { id: 'variables', label: 'Variable Comments', icon: Database,  count: 0, color: '#FBBF24' },
  { id: 'actions',   label: 'Action Comments',   icon: Zap,       count: 0, color: '#F472B6' },
  { id: 'states',    label: 'State Comments',    icon: Activity,  count: 0, color: '#A78BFA' },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export function ApiDocs() {
  const [activeTab, setActiveTab] = useState<Tab>('api');
  const [activeModule, setActiveModule] = useState<string>('auth');
  const [varSearch, setVarSearch] = useState('');
  const [varNs, setVarNs] = useState('all');

  const allApiComments = MODULE_INDEX.flatMap(m => m.apiComments);
  const totalCounts = {
    api: allApiComments.length,
    variables: VARIABLE_COMMENTS.length,
    actions: ACTION_COMMENTS.length,
    states: STATE_COMMENTS.length,
  };

  const activeModData = MODULE_INDEX.find(m => m.id === activeModule) || MODULE_INDEX[0];

  const filteredVars = VARIABLE_COMMENTS.filter(v => {
    const matchNs = varNs === 'all' || v.namespace === varNs;
    const matchSearch = !varSearch || v.token.toLowerCase().includes(varSearch.toLowerCase()) ||
      v.description.toLowerCase().includes(varSearch.toLowerCase());
    return matchNs && matchSearch;
  });

  const uniqueNs = Array.from(new Set(VARIABLE_COMMENTS.map(v => v.namespace)));

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: C.body, color: C.textPri }}>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div style={{ background: 'linear-gradient(135deg,#06090F 0%,#0C1628 100%)',
        borderBottom: `1px solid ${C.border}`, padding: '20px 28px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BookOpen size={18} style={{ color: '#818CF8' }} />
            </div>
            <div>
              <h1 style={{ fontFamily: C.sans, fontWeight: 800, fontSize: 20, color: '#F1F5F9',
                letterSpacing: '-0.02em', margin: 0 }}>
                OptiLoad — Developer Comment Layer
              </h1>
              <p style={{ fontSize: 11, color: C.textDim, margin: '2px 0 0' }}>
                Frontend-to-backend contract ·{' '}
                <span style={{ color: '#60A5FA' }}>{totalCounts.api} API comments</span> ·{' '}
                <span style={{ color: '#FBBF24' }}>{totalCounts.variables} variables</span> ·{' '}
                <span style={{ color: '#F472B6' }}>{totalCounts.actions} actions</span> ·{' '}
                <span style={{ color: '#A78BFA' }}>{totalCounts.states} states</span>
              </p>
            </div>
          </div>

          {/* Contract badge */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            {['✔ API documentation', '✔ Frontend specification', '✔ Backend contract', '✔ Developer onboarding guide'].map(b => (
              <span key={b} style={{ fontFamily: C.mono, fontSize: 9, color: '#34D399', letterSpacing: '0.03em' }}>{b}</span>
            ))}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: 2 }}>
          {TABS.map(t => {
            const active = activeTab === t.id;
            return (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  borderBottom: active ? `2px solid ${t.color}` : '2px solid transparent',
                  color: active ? t.color : C.textDim, fontSize: 12,
                  fontWeight: active ? 700 : 500, marginBottom: -1, transition: 'all 0.15s' }}>
                <t.icon size={13} />
                {t.label}
                <span style={{ fontFamily: C.mono, fontSize: 9, color: active ? t.color : C.textDim,
                  background: active ? `${t.color}18` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${active ? t.color + '40' : C.border}`,
                  borderRadius: 99, padding: '1px 7px', marginLeft: 2 }}>
                  {totalCounts[t.id]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CONTENT ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', minHeight: 'calc(100vh - 120px)' }}>

        {/* ── SIDEBAR ─────────────────────────────────────────────────── */}
        <div style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${C.border}`,
          padding: '16px 12px', background: C.surface, position: 'sticky', top: 0,
          height: 'calc(100vh - 120px)', overflowY: 'auto' }}>

          {activeTab === 'api' && (
            <>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim, marginBottom: 10,
                letterSpacing: '0.08em', textTransform: 'uppercase' }}>Modules</div>
              {MODULE_INDEX.map(m => {
                const Icon = MOD_ICON[m.id] || Globe;
                const active = activeModule === m.id;
                return (
                  <button key={m.id} onClick={() => setActiveModule(m.id)}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors text-left"
                    style={{ background: active ? `${m.color}12` : 'none', border: active ? `1px solid ${m.color}30` : '1px solid transparent',
                      color: active ? m.color : C.textDim, cursor: 'pointer', fontSize: 12,
                      fontWeight: active ? 700 : 400, marginBottom: 2 }}>
                    <Icon size={12} style={{ color: active ? m.color : C.textDim, flexShrink: 0 }} />
                    <span style={{ flex: 1 }}>{m.label}</span>
                    <span style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim }}>
                      {m.apiComments.length}
                    </span>
                  </button>
                );
              })}
            </>
          )}

          {activeTab === 'variables' && (
            <>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim, marginBottom: 8,
                letterSpacing: '0.08em', textTransform: 'uppercase' }}>Namespace</div>
              {['all', ...uniqueNs].map(ns => (
                <button key={ns} onClick={() => setVarNs(ns)}
                  className="w-full text-left rounded-lg px-3 py-1.5 transition-colors"
                  style={{ background: varNs === ns ? 'rgba(251,191,36,0.1)' : 'none',
                    border: varNs === ns ? '1px solid rgba(251,191,36,0.25)' : '1px solid transparent',
                    color: varNs === ns ? '#FBBF24' : C.textDim, cursor: 'pointer',
                    fontSize: 11, fontFamily: C.mono, marginBottom: 2, display: 'block' }}>
                  {ns === 'all' ? 'all namespaces' : `{{${ns}.*}}`}
                </button>
              ))}
            </>
          )}

          {activeTab === 'actions' && (
            <>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim, marginBottom: 10,
                letterSpacing: '0.08em', textTransform: 'uppercase' }}>By Module</div>
              {Array.from(new Set(ACTION_COMMENTS.map(a => a.module))).map(mod => (
                <div key={mod} style={{ fontSize: 11, color: C.textDim, padding: '4px 8px',
                  borderLeft: '2px solid rgba(244,114,182,0.3)', marginBottom: 4 }}>
                  {mod}
                </div>
              ))}
            </>
          )}

          {activeTab === 'states' && (
            <>
              <div style={{ fontFamily: C.mono, fontSize: 9, color: C.textDim, marginBottom: 10,
                letterSpacing: '0.08em', textTransform: 'uppercase' }}>States</div>
              {STATE_COMMENTS.map(s => (
                <div key={`${s.state}-${s.module}`} style={{ display: 'flex', gap: 8, alignItems: 'center',
                  padding: '4px 8px', marginBottom: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: 3,
                    background: STATE_COLORS[s.state] || '#94A3B8', flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: C.textDim }}>{s.state}</span>
                  <span style={{ fontSize: 9, color: C.textDim, fontFamily: C.mono, marginLeft: 'auto' }}>{s.module}</span>
                </div>
              ))}
            </>
          )}
        </div>

        {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
        <div style={{ flex: 1, padding: '20px 24px', overflowY: 'auto' }}>

          {/* ══ API COMMENTS TAB ══ */}
          {activeTab === 'api' && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: `${activeModData.color}18`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {React.createElement(MOD_ICON[activeModule] || Globe, { size: 15, style: { color: activeModData.color } })}
                </div>
                <div>
                  <div style={{ fontFamily: C.sans, fontWeight: 700, fontSize: 15, color: C.textPri }}>
                    {activeModData.label}
                  </div>
                  <div style={{ fontFamily: C.mono, fontSize: 10, color: C.textDim }}>
                    {activeModData.apiComments.length} API comment{activeModData.apiComments.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {activeModData.apiComments.map((comment, i) => (
                <ApiCommentCard key={`${comment.method}-${comment.endpoint}`}
                  comment={comment} accent={activeModData.color} index={i} />
              ))}
            </div>
          )}

          {/* ══ VARIABLE COMMENTS TAB ══ */}
          {activeTab === 'variables' && (
            <div>
              {/* Search */}
              <div style={{ marginBottom: 16 }}>
                <input
                  placeholder="Search tokens or descriptions…"
                  value={varSearch}
                  onChange={e => setVarSearch(e.target.value)}
                  style={{ width: '100%', background: C.card, border: `1px solid ${C.border}`,
                    borderRadius: 8, padding: '8px 14px', fontSize: 12, color: C.textPri,
                    outline: 'none', fontFamily: C.body, boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ fontFamily: C.mono, fontSize: 10, color: C.textDim, marginBottom: 12 }}>
                Showing {filteredVars.length} of {VARIABLE_COMMENTS.length} variable comments
              </div>

              {filteredVars.map(v => <VariableCommentCard key={v.token} v={v} />)}

              {filteredVars.length === 0 && (
                <div style={{ textAlign: 'center', padding: '48px 0', color: C.textDim, fontSize: 13 }}>
                  No variables match "{varSearch}"
                </div>
              )}
            </div>
          )}

          {/* ══ ACTION COMMENTS TAB ══ */}
          {activeTab === 'actions' && (
            <div>
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(244,114,182,0.05)', border: '1px solid rgba(244,114,182,0.15)' }}>
                <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: '#F472B6' }}>
                  [ACTION COMMENT LAYER] — Every user interaction that triggers a backend call.
                  Each action defines: trigger → payload → success → error → validation → cache invalidation.
                </span>
              </div>
              {ACTION_COMMENTS.map(a => <ActionCommentCard key={a.id} a={a} />)}
            </div>
          )}

          {/* ══ STATE COMMENTS TAB ══ */}
          {activeTab === 'states' && (
            <div>
              <div style={{ padding: '10px 14px', borderRadius: 8, marginBottom: 16,
                background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.15)' }}>
                <span style={{ fontFamily: C.mono, fontSize: 11, fontWeight: 700, color: '#A78BFA' }}>
                  [STATE COMMENT LAYER] — Every UI state that exists in the application.
                  Defines trigger, visual behavior, disabled elements, exit conditions, and example flows.
                </span>
              </div>
              {STATE_COMMENTS.map(s => <StateCommentCard key={`${s.state}-${s.module}`} s={s} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
