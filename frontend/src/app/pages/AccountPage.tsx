import React, { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';
import { apiRequest } from '../services/http';
import { User, Shield, Bell, Eye, EyeOff, Loader2, Check, X } from 'lucide-react';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  role_id: number;
  status: string;
  mfa_enabled: boolean;
  last_login: string | null;
  created_at: string;
  organization_id: number | null;
}

type Tab = 'profile' | 'security' | 'preferences';

export function AccountPage() {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Profile state
  const [editName, setEditName] = useState('');
  const [editingName, setEditingName] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [togglingMfa, setTogglingMfa] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const data = await apiRequest<UserProfile>('/users/me');
        setProfile(data);
        setEditName(data.name);
      } catch (e: any) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    void loadProfile();
  }, []);

  const handleSaveName = useCallback(async () => {
    if (!editName.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      await apiRequest('/users/me', { method: 'PUT', body: JSON.stringify({ name: editName.trim() }) });
      setProfile(prev => prev ? { ...prev, name: editName.trim() } : null);
      setEditingName(false);
      toast.success('Name updated');
    } catch {
      toast.error('Failed to update name');
    } finally {
      setSaving(false);
    }
  }, [editName]);

  const handleChangePassword = useCallback(async () => {
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setChangingPassword(true);
    try {
      await apiRequest('/users/me/password', {
        method: 'POST',
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success('Password changed successfully');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  }, [currentPassword, newPassword, confirmPassword]);

  const handleToggleMfa = useCallback(async () => {
    setTogglingMfa(true);
    try {
      const data = await apiRequest<{ mfa_enabled: boolean }>('/users/me/mfa', {
        method: 'POST',
        body: JSON.stringify({ enabled: !profile?.mfa_enabled }),
      });
      setProfile(prev => prev ? { ...prev, mfa_enabled: data.mfa_enabled } : null);
      toast.success(data.mfa_enabled ? 'MFA enabled' : 'MFA disabled');
    } catch {
      toast.error('Failed to toggle MFA');
    } finally {
      setTogglingMfa(false);
    }
  }, [profile?.mfa_enabled]);

  const bg = isDark ? '#0B1120' : '#FFFFFF';
  const cardBg = isDark ? '#111827' : '#F8FAFC';
  const border = isDark ? '#1E293B' : '#E2E8F0';
  const text = isDark ? '#F1F5F9' : '#0F172A';
  const muted = isDark ? '#94A3B8' : '#64748B';
  const inputBg = isDark ? '#1E293B' : '#FFFFFF';
  const inputBorder = isDark ? '#334155' : '#CBD5E1';

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User size={16} /> },
    { id: 'security', label: 'Security', icon: <Shield size={16} /> },
    { id: 'preferences', label: 'Preferences', icon: <Bell size={16} /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ background: bg }}>
        <Loader2 size={32} className="animate-spin" style={{ color: '#3B82F6' }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: bg, color: text }}>
      {/* Header */}
      <div className="px-6 py-4" style={{ borderBottom: `1px solid ${border}` }}>
        <h1 className="text-xl font-bold">Account Settings</h1>
        <p className="text-sm mt-1" style={{ color: muted }}>Manage your profile, security, and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex px-6 gap-1" style={{ borderBottom: `1px solid ${border}` }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors"
            style={{
              borderColor: activeTab === tab.id ? '#3B82F6' : 'transparent',
              color: activeTab === tab.id ? '#3B82F6' : muted,
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Profile Tab */}
        {activeTab === 'profile' && profile && (
          <div className="max-w-2xl space-y-6">
            {/* Avatar + Name */}
            <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: '#3B82F6', color: '#fff' }}>
                {profile.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                {editingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') { setEditingName(false); setEditName(profile.name); } }}
                      className="px-3 py-1.5 rounded text-sm font-medium"
                      style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: text }}
                      autoFocus
                    />
                    <button onClick={handleSaveName} disabled={saving} className="p-1 rounded" style={{ color: '#10B981' }}>
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button onClick={() => { setEditingName(false); setEditName(profile.name); }} className="p-1 rounded" style={{ color: '#EF4444' }}>
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="font-semibold text-lg">{profile.name}</div>
                    <button onClick={() => setEditingName(true)} className="text-xs mt-0.5" style={{ color: '#3B82F6' }}>Edit name</button>
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="p-4 rounded-lg space-y-3" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: muted }}>Details</h3>
              {[
                { label: 'Email', value: profile.email },
                { label: 'Status', value: profile.status },
                { label: 'Role ID', value: String(profile.role_id) },
                { label: 'Organization', value: profile.organization_id ? `#${profile.organization_id}` : 'None' },
                { label: 'Member since', value: profile.created_at ? new Date(profile.created_at).toLocaleDateString() : '—' },
                { label: 'Last login', value: profile.last_login ? new Date(profile.last_login).toLocaleString() : 'Never' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between items-center py-2" style={{ borderBottom: `1px solid ${border}` }}>
                  <span className="text-sm" style={{ color: muted }}>{label}</span>
                  <span className="text-sm font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="max-w-2xl space-y-6">
            {/* Password Change */}
            <div className="p-4 rounded-lg space-y-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: muted }}>Change Password</h3>
              {[
                { label: 'Current Password', value: currentPassword, onChange: setCurrentPassword, show: showCurrent, toggle: () => setShowCurrent(!showCurrent) },
                { label: 'New Password', value: newPassword, onChange: setNewPassword, show: showNew, toggle: () => setShowNew(!showNew) },
                { label: 'Confirm Password', value: confirmPassword, onChange: setConfirmPassword, show: showConfirm, toggle: () => setShowConfirm(!showConfirm) },
              ].map(({ label, value, onChange, show, toggle }) => (
                <div key={label}>
                  <label className="text-xs font-medium mb-1 block" style={{ color: muted }}>{label}</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      value={value}
                      onChange={e => onChange(e.target.value)}
                      className="w-full px-3 py-2 rounded text-sm pr-10"
                      style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: text }}
                    />
                    <button onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: muted }}>
                      {show ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}
              <button
                onClick={handleChangePassword}
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className="px-4 py-2 rounded text-sm font-medium text-white transition-opacity disabled:opacity-50"
                style={{ background: '#3B82F6' }}
              >
                {changingPassword ? <Loader2 size={16} className="animate-spin inline mr-2" /> : null}
                Change Password
              </button>
            </div>

            {/* MFA */}
            <div className="p-4 rounded-lg flex items-center justify-between" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <div>
                <h3 className="text-sm font-semibold">Two-Factor Authentication</h3>
                <p className="text-xs mt-1" style={{ color: muted }}>
                  {profile?.mfa_enabled ? 'MFA is enabled. Your account is more secure.' : 'Enable MFA for extra security.'}
                </p>
              </div>
              <button
                onClick={handleToggleMfa}
                disabled={togglingMfa}
                className="px-4 py-2 rounded text-sm font-medium transition-colors"
                style={{
                  background: profile?.mfa_enabled ? '#EF444420' : '#10B98120',
                  color: profile?.mfa_enabled ? '#EF4444' : '#10B981',
                  border: `1px solid ${profile?.mfa_enabled ? '#EF444440' : '#10B98140'}`,
                }}
              >
                {togglingMfa ? <Loader2 size={16} className="animate-spin" /> : profile?.mfa_enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div className="max-w-2xl space-y-6">
            <div className="p-4 rounded-lg space-y-4" style={{ background: cardBg, border: `1px solid ${border}` }}>
              <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: muted }}>Notification Preferences</h3>
              <p className="text-sm" style={{ color: muted }}>Notification preferences will be available soon.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
