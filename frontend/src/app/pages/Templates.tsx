import React, { useState } from 'react';
import { Search, Plus, FileStack, Download, Copy, Trash2, Clock, Tag } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { OLCard } from '../components/ui/OLCard';
import { OLBadge } from '../components/ui/OLBadge';
import { OLButton } from '../components/ui/OLButton';
import { toast } from 'sonner';

const TEMPLATES = [
  { id: 'TPL-001', name: 'Standard Rail Freight', desc: 'General-purpose optimization for mixed freight on flatcars', vehicles: 4, loads: 'Up to 200', category: 'General', uses: 142, updated: '2 days ago' },
  { id: 'TPL-002', name: 'Automotive Parts Express', desc: 'Optimized for fragile automotive components with rotation disabled', vehicles: 2, loads: 'Up to 80', category: 'Automotive', uses: 87, updated: '1 week ago' },
  { id: 'TPL-003', name: 'Heavy Bulk Transport', desc: 'High-capacity configuration for bulk grain and aggregate loads', vehicles: 6, loads: 'Up to 500', category: 'Bulk', uses: 53, updated: '3 days ago' },
  { id: 'TPL-004', name: 'Hazmat Compliant Config', desc: 'Strictly enforces hazmat separation and regulatory constraints', vehicles: 3, loads: 'Up to 60', category: 'Hazmat', uses: 31, updated: '5 days ago' },
  { id: 'TPL-005', name: 'Cold Chain Logistics', desc: 'Temperature-sensitive cargo with specialized vehicle constraints', vehicles: 2, loads: 'Up to 40', category: 'Cold Chain', uses: 18, updated: '2 weeks ago' },
  { id: 'TPL-006', name: 'Cross-Country Long-Haul', desc: 'Maximizes load density for 1000+ mile rail routes', vehicles: 8, loads: 'Up to 800', category: 'General', uses: 94, updated: '4 days ago' },
];

const CATEGORIES = ['All', 'General', 'Automotive', 'Bulk', 'Hazmat', 'Cold Chain'];
const CAT_COLORS: Record<string, string> = {
  General: '#3B82F6', Automotive: '#10B981', Bulk: '#F59E0B', Hazmat: '#EF4444', 'Cold Chain': '#06B6D4',
};

export function Templates() {
  const { isDark, palette } = useTheme();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  const text = isDark ? '#94A3B8' : '#64748B';
  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const border = isDark ? '#1E2A38' : '#E2E8F0';
  const inputBg = isDark ? '#0D1117' : '#F8FAFC';

  const filtered = TEMPLATES.filter(t =>
    (category === 'All' || t.category === category) &&
    (search === '' || t.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-3 sm:p-6">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-4 sm:mb-6">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: text }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search templates..."
            style={{ background: inputBg, border: `1px solid ${border}`, color: textPrimary, borderRadius: 8, padding: '8px 12px', paddingLeft: 36, fontSize: '13px', fontFamily: 'Inter, sans-serif', outline: 'none', width: '100%' }} />
        </div>
        <OLButton variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => toast.success('Template builder coming soon')}>New Template</OLButton>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className="px-3 py-1.5 rounded-lg transition-colors"
            style={{ fontSize: '12px', fontWeight: 500, background: category === c ? palette.primary : (isDark ? '#1E2A38' : '#E2E8F0'), color: category === c ? '#fff' : text, border: `1px solid ${category === c ? palette.primary : 'transparent'}` }}>
            {c}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(t => (
          <OLCard key={t.id} hover padding="20px">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center justify-center rounded-xl" style={{ width: 44, height: 44, background: (CAT_COLORS[t.category] || palette.primary) + '18' }}>
                <FileStack size={20} style={{ color: CAT_COLORS[t.category] || palette.primary }} />
              </div>
              <span className="px-2 py-0.5 rounded-md" style={{ fontSize: '10px', fontWeight: 600, background: (CAT_COLORS[t.category] || palette.primary) + '15', color: CAT_COLORS[t.category] || palette.primary, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                {t.category}
              </span>
            </div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 600, fontSize: '14px', color: textPrimary, marginBottom: 6 }}>{t.name}</div>
            <div style={{ fontSize: '12px', color: text, lineHeight: 1.5, marginBottom: 16 }}>{t.desc}</div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {[['Vehicles', t.vehicles], ['Max Loads', t.loads]].map(([k, v]) => (
                <div key={k as string} className="rounded-lg p-2.5" style={{ background: isDark ? '#161D2A' : '#F8FAFC', border: `1px solid ${border}` }}>
                  <div style={{ fontSize: '10px', color: text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: textPrimary, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${border}` }}>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1" style={{ fontSize: '11px', color: text }}>
                  <Tag size={11} />{t.uses} uses
                </span>
                <span className="flex items-center gap-1" style={{ fontSize: '11px', color: text }}>
                  <Clock size={11} />{t.updated}
                </span>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 rounded-md transition-colors" style={{ color: text }}
                  onClick={() => toast.success('Template duplicated')}
                  onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#1E2A38' : '#F1F5F9')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <Copy size={13} />
                </button>
                <button className="p-1.5 rounded-md transition-colors" style={{ color: text }}
                  onClick={() => toast.success('Exported')}
                  onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#1E2A38' : '#F1F5F9')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <Download size={13} />
                </button>
                <button className="p-1.5 rounded-md transition-colors" style={{ color: '#EF4444' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EF444415')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </OLCard>
        ))}
      </div>
    </div>
  );
}