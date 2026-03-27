import React from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface OLButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export function OLButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  disabled,
  className = '',
  style: styleProp = {},
  ...props
}: OLButtonProps) {
  const { palette, isDark } = useTheme();

  const sizes = {
    sm: { padding: '6px 12px', fontSize: '12px', height: '32px', gap: 6, iconSize: 14 },
    md: { padding: '8px 16px', fontSize: '13px', height: '38px', gap: 8, iconSize: 16 },
    lg: { padding: '10px 20px', fontSize: '14px', height: '44px', gap: 8, iconSize: 18 },
  };

  const s = sizes[size];

  const getStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      gap: s.gap, height: s.height, padding: s.padding, fontSize: s.fontSize,
      fontWeight: 500, fontFamily: 'Inter, sans-serif', borderRadius: '8px',
      border: '1px solid transparent', cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1, transition: 'all 0.15s ease', whiteSpace: 'nowrap',
      letterSpacing: '-0.01em',
    };

    switch (variant) {
      case 'primary':
        return { ...base, background: palette.primary, color: '#ffffff', borderColor: palette.primary };
      case 'secondary':
        return { ...base, background: isDark ? '#1E2A38' : '#E2E8F0', color: isDark ? '#F1F5F9' : '#0F172A', borderColor: isDark ? '#2D3F52' : '#CBD5E1' };
      case 'ghost':
        return { ...base, background: 'transparent', color: isDark ? '#94A3B8' : '#64748B', borderColor: 'transparent' };
      case 'danger':
        return { ...base, background: '#DC2626', color: '#ffffff', borderColor: '#DC2626' };
      case 'outline':
        return { ...base, background: 'transparent', color: palette.primary, borderColor: palette.primary };
      default:
        return base;
    }
  };

  return (
    <motion.button
      whileTap={!disabled && !loading ? { scale: 0.97 } : undefined}
      whileHover={!disabled && !loading ? { opacity: 0.88 } : undefined}
      style={{ ...getStyle(), ...styleProp }}
      disabled={disabled || loading}
      className={className}
      {...props as any}
    >
      {loading ? <Loader2 size={s.iconSize} className="animate-spin" /> : icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
      {!loading && iconRight && <span style={{ display: 'flex', alignItems: 'center' }}>{iconRight}</span>}
    </motion.button>
  );
}