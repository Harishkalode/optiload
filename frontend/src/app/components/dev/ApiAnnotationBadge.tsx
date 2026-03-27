import React from 'react';
import { useDevMode } from '../../contexts/DevModeContext';

type BadgeKind = 'api' | 'field' | 'action' | 'state' | 'payload' | 'screen' | 'source';

interface Props {
  kind: BadgeKind;
  label: string;
  inline?: boolean;
  block?: boolean;
}

const KIND_STYLE: Record<BadgeKind, { bg: string; border: string; color: string; prefix: string }> = {
  api:     { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.35)',  color: '#60A5FA', prefix: 'API' },
  field:   { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.35)', color: '#34D399', prefix: 'FIELD' },
  action:  { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', color: '#FBBF24', prefix: 'ACTION' },
  state:   { bg: 'rgba(139,92,246,0.12)', border: 'rgba(139,92,246,0.35)', color: '#A78BFA', prefix: 'STATE' },
  payload: { bg: 'rgba(236,72,153,0.12)', border: 'rgba(236,72,153,0.35)', color: '#F472B6', prefix: 'PAYLOAD' },
  screen:  { bg: 'rgba(6,182,212,0.12)',  border: 'rgba(6,182,212,0.35)',  color: '#22D3EE', prefix: 'SCREEN' },
  source:  { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.35)', color: '#818CF8', prefix: 'SOURCE' },
};

export function ApiAnnotationBadge({ kind, label, inline, block }: Props) {
  const { devMode } = useDevMode();
  if (!devMode) return null;

  const s = KIND_STYLE[kind];
  return (
    <span
      style={{
        display: block ? 'block' : inline ? 'inline-flex' : 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderRadius: 4,
        padding: '1px 6px',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '9px',
        fontWeight: 700,
        color: s.color,
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
        userSelect: 'none',
        pointerEvents: 'none',
        margin: inline ? '0 4px' : block ? '2px 0' : '0 2px',
        lineHeight: 1.6,
      }}
    >
      <span style={{ opacity: 0.6 }}>[{s.prefix}:</span>
      <span>{label}</span>
      <span style={{ opacity: 0.6 }}>]</span>
    </span>
  );
}

/** Wraps a UI element and overlays multiple annotation badges */
interface AnnotatedProps {
  children: React.ReactNode;
  annotations: Array<{ kind: BadgeKind; label: string }>;
  className?: string;
}

export function Annotated({ children, annotations, className }: AnnotatedProps) {
  const { devMode } = useDevMode();

  return (
    <div className={className} style={{ position: 'relative' }}>
      {children}
      {devMode && annotations.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: -1,
            right: -1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 2,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          {annotations.map((a, i) => (
            <ApiAnnotationBadge key={i} kind={a.kind} label={a.label} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Screen-level annotation header bar */
interface ScreenAnnotationBarProps {
  screenName: string;
  apiGroup: string;
  baseEndpoint: string;
  description: string;
}

export function ScreenAnnotationBar({ screenName, apiGroup, baseEndpoint, description }: ScreenAnnotationBarProps) {
  const { devMode } = useDevMode();
  if (!devMode) return null;

  return (
    <div
      style={{
        background: 'rgba(6,182,212,0.06)',
        border: '1px solid rgba(6,182,212,0.2)',
        borderRadius: 8,
        padding: '8px 14px',
        marginBottom: 12,
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        alignItems: 'center',
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 10,
      }}
    >
      <span style={{ color: '#22D3EE', fontWeight: 700 }}>[SCREEN: {screenName}]</span>
      <span style={{ color: '#60A5FA' }}>[API GROUP: {apiGroup}]</span>
      <span style={{ color: '#34D399' }}>[BASE ENDPOINT: {baseEndpoint}]</span>
      <span style={{ color: '#94A3B8' }}>{description}</span>
    </div>
  );
}

/** Token placeholder display */
export function TokenPlaceholder({ token }: { token: string }) {
  const { devMode } = useDevMode();
  if (!devMode) return <span style={{ opacity: 0.4, fontStyle: 'italic', fontSize: '0.85em' }}>{token}</span>;
  return (
    <code
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: '11px',
        background: 'rgba(245,158,11,0.1)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: 3,
        padding: '0 4px',
        color: '#FBBF24',
      }}
    >
      {token}
    </code>
  );
}
