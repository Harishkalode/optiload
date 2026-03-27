import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Keyboard } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string[]; description: string }[];
}

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: 'Global',
    shortcuts: [
      { keys: ['⌘', 'K'], description: 'Open command palette' },
      { keys: ['?'], description: 'Show keyboard shortcuts' },
      { keys: ['Esc'], description: 'Close dialog / deselect' },
      { keys: ['N'], description: 'Toggle notifications' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['G', 'D'], description: 'Go to Dashboard' },
      { keys: ['G', 'J'], description: 'Go to Optimization Jobs' },
      { keys: ['G', 'V'], description: 'Go to Vehicles' },
      { keys: ['G', 'L'], description: 'Go to Loads' },
      { keys: ['G', 'R'], description: 'Go to Reports' },
      { keys: ['G', 'S'], description: 'Go to Settings' },
    ],
  },
  {
    title: 'Results / 3D View',
    shortcuts: [
      { keys: ['1'], description: 'Isometric view' },
      { keys: ['2'], description: 'Top-down view' },
      { keys: ['3'], description: 'Front view' },
      { keys: ['4'], description: 'Side view' },
      { keys: ['R'], description: 'Reset camera' },
      { keys: ['+'], description: 'Zoom in' },
      { keys: ['-'], description: 'Zoom out' },
      { keys: ['Ctrl', 'Z'], description: 'Undo last move' },
      { keys: ['B'], description: 'Auto-balance loads' },
      { keys: ['E'], description: 'Export plan (if compliant)' },
    ],
  },
  {
    title: 'Theme',
    shortcuts: [
      { keys: ['T', 'L'], description: 'Switch to Light mode' },
      { keys: ['T', 'D'], description: 'Switch to Dark mode' },
      { keys: ['T', 'A'], description: 'Switch to Auto mode' },
      { keys: ['['], description: 'Collapse sidebar' },
      { keys: [']'], description: 'Expand sidebar' },
    ],
  },
];

export function KeyboardShortcuts({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { isDark, palette } = useTheme();

  const bg = isDark ? '#0A1018' : '#ffffff';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const tx = isDark ? '#94A3B8' : '#64748B';
  const txP = isDark ? '#F1F5F9' : '#0F172A';

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.18 }}
            className="relative rounded-xl overflow-hidden"
            style={{
              width: 680, maxWidth: '94vw', maxHeight: '80vh',
              background: bg, border: `1px solid ${border}`,
              boxShadow: '0 24px 72px rgba(0,0,0,0.45)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 flex-shrink-0" style={{ height: 56, borderBottom: `1px solid ${border}` }}>
              <div className="flex items-center gap-2.5">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 32, height: 32, background: `${palette.primary}20` }}
                >
                  <Keyboard size={15} style={{ color: palette.primary }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: txP, fontFamily: 'Space Grotesk, sans-serif' }}>Keyboard Shortcuts</div>
                  <div style={{ fontSize: 10.5, color: tx }}>Navigate OptiLoad faster with keyboard shortcuts</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex items-center justify-center rounded-lg transition-colors"
                style={{ width: 32, height: 32, color: tx }}
                onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#1E2A38' : '#F1F5F9')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ scrollbarWidth: 'thin' }}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {SHORTCUT_GROUPS.map(group => (
                  <div key={group.title}>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: palette.primary,
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                      marginBottom: 10, fontFamily: 'Space Grotesk, sans-serif',
                    }}>
                      {group.title}
                    </div>
                    <div className="space-y-1">
                      {group.shortcuts.map(({ keys, description }) => (
                        <div
                          key={description}
                          className="flex items-center justify-between py-2 px-2.5 rounded-lg transition-colors"
                          style={{ fontSize: 12 }}
                          onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#111B27' : '#F8FAFC')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <span style={{ color: txP, fontFamily: 'Inter, sans-serif' }}>{description}</span>
                          <div className="flex items-center gap-1">
                            {keys.map((k, i) => (
                              <span key={i} className="flex items-center gap-1">
                                {i > 0 && <span style={{ fontSize: 9, color: isDark ? '#374151' : '#CBD5E1', margin: '0 1px' }}>+</span>}
                                <kbd style={{
                                  fontSize: 10, fontFamily: 'JetBrains Mono, monospace',
                                  padding: '2px 8px', borderRadius: 4, minWidth: 22, textAlign: 'center',
                                  background: isDark ? '#1E2A38' : '#E2E8F0',
                                  color: tx, border: `1px solid ${border}`,
                                  boxShadow: isDark ? '0 1px 2px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.08)',
                                }}>
                                  {k}
                                </kbd>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-center px-6 flex-shrink-0" style={{ height: 40, borderTop: `1px solid ${border}`, background: isDark ? '#060C14' : '#F8FAFC' }}>
              <span style={{ fontSize: 10, color: isDark ? '#374151' : '#CBD5E1', fontFamily: 'Inter, sans-serif' }}>
                Press <kbd style={{
                  fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
                  padding: '1px 5px', borderRadius: 3,
                  background: isDark ? '#1E2A38' : '#E2E8F0',
                  border: `1px solid ${border}`,
                }}>?</kbd> anytime to toggle this panel
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}