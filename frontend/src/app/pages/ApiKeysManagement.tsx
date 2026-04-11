import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Key } from 'lucide-react';

export function ApiKeysManagement() {
  const { isDark } = useTheme();
  return (
    <div className="flex items-center justify-center h-full" style={{ background: isDark ? '#0B1120' : '#F8FAFC' }}>
      <div className="text-center p-8">
        <div className="mx-auto mb-4 flex items-center justify-center rounded-full" style={{ width: 64, height: 64, background: isDark ? '#1E293B' : '#E2E8F0' }}>
          <Key size={28} style={{ color: isDark ? '#64748B' : '#94A3B8' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A', marginBottom: 8 }}>API Keys</h2>
        <p style={{ fontSize: 14, color: isDark ? '#94A3B8' : '#64748B', maxWidth: 320 }}>
          API key generation, management, and usage tracking are under development.
        </p>
      </div>
    </div>
  );
}
