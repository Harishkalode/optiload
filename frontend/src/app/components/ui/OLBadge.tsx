import React from 'react';

type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral' | 'active' | 'inactive';

interface OLBadgeProps {
  status: BadgeStatus;
  label: string;
  dot?: boolean;
}

const CONFIG: Record<BadgeStatus, { bg: string; color: string; dot: string }> = {
  success:  { bg: '#16A34A15', color: '#16A34A', dot: '#16A34A' },
  warning:  { bg: '#F59E0B15', color: '#D97706', dot: '#F59E0B' },
  error:    { bg: '#DC262615', color: '#DC2626', dot: '#EF4444' },
  info:     { bg: '#3B82F615', color: '#2563EB', dot: '#3B82F6' },
  neutral:  { bg: '#64748B15', color: '#64748B', dot: '#94A3B8' },
  active:   { bg: '#22C55E15', color: '#15803D', dot: '#22C55E' },
  inactive: { bg: '#94A3B815', color: '#64748B', dot: '#94A3B8' },
};

export function OLBadge({ status, label, dot = true }: OLBadgeProps) {
  const cfg = CONFIG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5"
      style={{ background: cfg.bg, color: cfg.color, fontSize: '11px', fontWeight: 600, letterSpacing: '0.02em', fontFamily: 'Inter, sans-serif' }}
    >
      {dot && <span className="rounded-full" style={{ width: 5, height: 5, background: cfg.dot, flexShrink: 0 }} />}
      {label}
    </span>
  );
}
