import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface OLModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  danger?: boolean;
}

export function OLModal({ open, onClose, title, subtitle, children, footer, width = 520, danger = false }: OLModalProps) {
  const { isDark, palette } = useTheme();
  const bg = isDark ? '#0D1117' : '#ffffff';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const textSub = isDark ? '#64748B' : '#94A3B8';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            className="relative rounded-xl overflow-hidden"
            style={{ background: bg, border: `1px solid ${danger ? '#DC262640' : border}`, width, maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between p-5" style={{ borderBottom: `1px solid ${border}` }}>
              <div>
                <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '16px', color: danger ? '#EF4444' : textPrimary }}>
                  {title}
                </div>
                {subtitle && <div style={{ fontSize: '12px', color: textSub, marginTop: 4 }}>{subtitle}</div>}
              </div>
              <button onClick={onClose} className="flex items-center justify-center rounded-lg transition-colors" style={{ width: 28, height: 28, color: textSub }}
                onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#161D2A' : '#F1F5F9')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <X size={16} />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5">{children}</div>
            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-3 p-4" style={{ borderTop: `1px solid ${border}` }}>
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
