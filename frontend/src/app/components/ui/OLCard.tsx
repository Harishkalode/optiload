import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface OLCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  padding?: string;
}

export function OLCard({ children, className = '', style = {}, hover = false, padding = '20px' }: OLCardProps) {
  const { isDark } = useTheme();

  const bg = isDark ? '#0D1117' : '#ffffff';
  const border = isDark ? '#1E2A38' : '#E2E8F0';

  return (
    <div
      className={`rounded-xl transition-all duration-150 ${hover ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: bg,
        border: `1px solid ${border}`,
        padding,
        boxShadow: isDark ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
        ...style,
      }}
      onMouseEnter={hover ? e => (e.currentTarget.style.borderColor = isDark ? '#2D3F52' : '#CBD5E1') : undefined}
      onMouseLeave={hover ? e => (e.currentTarget.style.borderColor = border) : undefined}
    >
      {children}
    </div>
  );
}

export function OLCardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  const { isDark } = useTheme();
  return (
    <div className="flex items-center justify-between mb-4">
      <div>
        <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: isDark ? '#F1F5F9' : '#0F172A', letterSpacing: '-0.01em' }}>
          {title}
        </div>
        {subtitle && <div style={{ fontSize: '12px', color: isDark ? '#64748B' : '#94A3B8', marginTop: 2 }}>{subtitle}</div>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
