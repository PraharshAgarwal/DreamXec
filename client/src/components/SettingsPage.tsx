import React, { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Lock,
  Bell,
  Settings,
  Shield,
  Laptop
} from 'lucide-react';
import UnifiedDashboardLayout from './layout/UnifiedDashboardLayout';
import { useAuth } from '../context/AuthContext';

export default function SettingsPage() {
  const { user } = useAuth();
  const activeRole = (user?.activeProfile?.role || user?.role || 'USER').toUpperCase();
  const orgSlug = (user?.activeProfile as any)?.orgSlug || '';
  const isDxAdmin = ['dreamxec', 'dx-platform-org'].includes(orgSlug.toLowerCase()) || user?.role?.toLowerCase() === 'admin';

  const isStudentRole = ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER', 'USER'].includes(activeRole) && !isDxAdmin;

  const [activeTab, setActiveTab] = useState<'security' | 'notifications' | 'role_spec'>(isStudentRole ? 'security' : 'role_spec');
  const [loading, setLoading] = useState(false);

  // Security Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Notification Preferences State
  const [emailPayouts, setEmailPayouts] = useState(true);
  const [emailSessions, setEmailSessions] = useState(true);
  const [emailSecurity, setEmailSecurity] = useState(true);

  // Role Spec State - Mentor
  const [slotDuration, setSlotDuration] = useState('45');
  const [videoPlatform, setVideoPlatform] = useState('Google Meet');
  const [meetLink, setMeetLink] = useState('https://meet.google.com/abc-defg-hij');

  // Role Spec State - Donor
  const [fundingFocus, setFundingFocus] = useState('Student Innovations');
  const [taxPan, setTaxPan] = useState('ABCDE1234F');
  const [anonymousGiving, setAnonymousGiving] = useState(false);

  // Role Spec State - Org Admin
  const [domainWhitelist, setDomainWhitelist] = useState('nitkkr.ac.in, aero.nitkkr.ac.in');
  const [verificationPolicy, setVerificationPolicy] = useState('AUTO_DOMAIN');
  const [escrowThreshold, setEscrowThreshold] = useState('50000');

  // Role Spec State - DX Admin
  const [platformFee, setPlatformFee] = useState('2.5');
  const [enforce2FA, setEnforce2FA] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error('Please complete all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }, 1000);
  };

  const handleSaveRoleSettings = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Role preferences saved successfully!');
    }, 800);
  };

  return (
    <UnifiedDashboardLayout
      title="System & Role Settings | DreamXec"
      headerTitle="Settings & Configuration Hub"
      headerSubtitle="Configure account security, notification rules, and operational preferences"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {/* ── SETTINGS NAVIGATION TABS ── */}
        <div className="flex bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] overflow-x-auto">
          {!isStudentRole && (
            <button
              onClick={() => setActiveTab('role_spec')}
              className={`flex-1 py-4 px-6 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-r-3 border-[#121316] transition-all min-w-[200px] ${
                activeTab === 'role_spec'
                  ? 'bg-[#0F534A] text-white shadow-[inset_0_-4px_0_#FE4E1A]'
                  : 'text-[#121316] hover:bg-[#FFDD33]'
              }`}
            >
              <Settings className="w-4 h-4 text-[#FFDD33]" /> {activeRole} Preferences
            </button>
          )}

          <button
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-4 px-6 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-r-3 border-[#121316] transition-all min-w-[200px] ${
              activeTab === 'security'
                ? 'bg-[#0F534A] text-white shadow-[inset_0_-4px_0_#FE4E1A]'
                : 'text-[#121316] hover:bg-[#FFDD33]'
            }`}
          >
            <Lock className="w-4 h-4 text-[#9EFC5F]" /> Account Security & 2FA
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-4 px-6 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all min-w-[200px] ${
              activeTab === 'notifications'
                ? 'bg-[#0F534A] text-white shadow-[inset_0_-4px_0_#FE4E1A]'
                : 'text-[#121316] hover:bg-[#FFDD33]'
            }`}
          >
            <Bell className="w-4 h-4 text-[#18D7E8]" /> Notifications & Display
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 1: ROLE-SPECIFIC SETTINGS PANEL */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'role_spec' && (
          <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b-4 border-[#121316] pb-4">
              <div>
                <span className="bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[9px] font-headline font-black uppercase">
                  Active Profile Config
                </span>
                <h3 className="font-headline font-black text-xl sm:text-2xl text-[#121316] uppercase tracking-tight mt-1">
                  {isDxAdmin ? 'DX Root Super-Admin Settings' : `${activeRole} Operational Controls`}
                </h3>
              </div>
              <span className="bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] px-3 py-1 text-xs font-headline font-black uppercase">
                {user?.activeProfile?.orgName || 'DreamXec Governance'}
              </span>
            </div>

            {/* ── DX SUPER ADMIN SETTINGS ── */}
            {isDxAdmin && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] space-y-3">
                    <label className="block text-xs font-headline font-black uppercase text-[#121316]">
                      Platform Dual-Custody Fee (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={platformFee}
                      onChange={(e) => setPlatformFee(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-[#121316] text-xs font-bold"
                    />
                    <p className="text-[11px] text-gray-600 font-medium">
                      Platform maintenance fee deducted on dual-custody escrow tranche releases.
                    </p>
                  </div>

                  <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] space-y-3">
                    <label className="block text-xs font-headline font-black uppercase text-[#121316]">
                      Global Organization Security Policy
                    </label>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs font-medium text-gray-800">Enforce Mandatory 2FA for Org Admins</span>
                      <button
                        type="button"
                        onClick={() => setEnforce2FA(!enforce2FA)}
                        className={`w-12 h-6 border-2 border-[#121316] p-0.5 transition-all ${enforce2FA ? 'bg-[#9EFC5F]' : 'bg-gray-300'}`}
                      >
                        <div className={`w-4 h-4 bg-[#121316] transition-all ${enforce2FA ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-red-50 border-3 border-[#F4002C] space-y-3">
                  <div className="flex items-center gap-2 text-[#F4002C]">
                    <Shield className="w-5 h-5" />
                    <h4 className="font-headline font-black text-sm uppercase">Emergency Platform Maintenance Mode</h4>
                  </div>
                  <p className="text-xs text-gray-700 font-medium">
                    Activating maintenance mode temporarily disables campaign fundraising and micro-grant disbursements across the entire platform.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`px-4 py-2 border-2 border-[#121316] text-xs font-headline font-black uppercase shadow-[2px_2px_0_#121316] ${
                      maintenanceMode ? 'bg-[#F4002C] text-white' : 'bg-white text-[#121316]'
                    }`}
                  >
                    {maintenanceMode ? 'Maintenance Mode ACTIVE' : 'Enable Maintenance Mode'}
                  </button>
                </div>
              </div>
            )}

            {/* ── ORG ADMIN SETTINGS ── */}
            {!isDxAdmin && (activeRole === 'ORG_ADMIN' || activeRole === 'CORPORATE_ADMIN') && (
              <div className="space-y-6">
                <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] space-y-3">
                  <label className="block text-xs font-headline font-black uppercase text-[#121316]">
                    Allowed Email Domain Whitelist (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={domainWhitelist}
                    onChange={(e) => setDomainWhitelist(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border-2 border-[#121316] text-xs font-bold"
                  />
                  <p className="text-[11px] text-gray-600 font-medium">
                    Users registering with these email domains will automatically link to your institution.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] space-y-3">
                    <label className="block text-xs font-headline font-black uppercase text-[#121316]">
                      Student Onboarding Verification Policy
                    </label>
                    <select
                      value={verificationPolicy}
                      onChange={(e) => setVerificationPolicy(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-[#121316] text-xs font-bold"
                    >
                      <option value="AUTO_DOMAIN">Auto-Approve via Whitelisted Email</option>
                      <option value="MANUAL_REVIEW">Manual Admin Review Required</option>
                    </select>
                  </div>

                  <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] space-y-3">
                    <label className="block text-xs font-headline font-black uppercase text-[#121316]">
                      Dual-Custody Escrow Sign-off Threshold (₹)
                    </label>
                    <input
                      type="number"
                      value={escrowThreshold}
                      onChange={(e) => setEscrowThreshold(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-[#121316] text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── MENTOR SETTINGS ── */}
            {activeRole === 'MENTOR' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] space-y-3">
                    <label className="block text-xs font-headline font-black uppercase text-[#121316]">
                      Default 1-on-1 Guidance Session Duration
                    </label>
                    <select
                      value={slotDuration}
                      onChange={(e) => setSlotDuration(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-[#121316] text-xs font-bold"
                    >
                      <option value="30">30 Minutes</option>
                      <option value="45">45 Minutes</option>
                      <option value="60">60 Minutes</option>
                    </select>
                  </div>

                  <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] space-y-3">
                    <label className="block text-xs font-headline font-black uppercase text-[#121316]">
                      Preferred Video Conference Platform
                    </label>
                    <select
                      value={videoPlatform}
                      onChange={(e) => setVideoPlatform(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-[#121316] text-xs font-bold"
                    >
                      <option value="Google Meet">Google Meet</option>
                      <option value="Jitsi Meet">Jitsi Meet</option>
                      <option value="Zoom">Zoom</option>
                    </select>
                  </div>
                </div>

                <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] space-y-3">
                  <label className="block text-xs font-headline font-black uppercase text-[#121316]">
                    Default Video Meeting Room URL
                  </label>
                  <input
                    type="url"
                    value={meetLink}
                    onChange={(e) => setMeetLink(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border-2 border-[#121316] text-xs font-bold"
                  />
                </div>
              </div>
            )}

            {/* ── DONOR SETTINGS ── */}
            {activeRole === 'DONOR' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] space-y-3">
                    <label className="block text-xs font-headline font-black uppercase text-[#121316]">
                      Primary Impact Funding Focus
                    </label>
                    <select
                      value={fundingFocus}
                      onChange={(e) => setFundingFocus(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border-2 border-[#121316] text-xs font-bold"
                    >
                      <option value="Student Innovations">Student Hardware Innovations</option>
                      <option value="DeepTech Research">DeepTech Academic Research</option>
                      <option value="Women Founders">Women-Led Ventures</option>
                      <option value="Clean Energy">Clean Energy & Sustainability</option>
                    </select>
                  </div>

                  <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] space-y-3">
                    <label className="block text-xs font-headline font-black uppercase text-[#121316]">
                      80G Tax Exemption PAN Number
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={taxPan}
                      onChange={(e) => setTaxPan(e.target.value.toUpperCase())}
                      className="w-full px-4 py-2.5 bg-white border-2 border-[#121316] text-xs font-bold font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] flex items-center justify-between">
                  <div>
                    <h4 className="font-headline font-black text-sm uppercase text-[#121316]">
                      Anonymous Philanthropy Giving Mode
                    </h4>
                    <p className="text-xs text-gray-600 font-medium mt-0.5">
                      Hide your donor identity from public campaign supporter lists and marketplace leaderboards.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAnonymousGiving(!anonymousGiving)}
                    className={`w-12 h-6 border-2 border-[#121316] p-0.5 transition-all ${anonymousGiving ? 'bg-[#9EFC5F]' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-[#121316] transition-all ${anonymousGiving ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={handleSaveRoleSettings}
              disabled={loading}
              className="px-8 py-3 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-3 border-[#121316] shadow-[4px_4px_0_#FFDD33] font-headline font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {loading ? 'Saving Preferences...' : 'Save Role Preferences'}
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 2: ACCOUNT SECURITY & 2FA */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            {/* Password Form */}
            <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-6 sm:p-8 space-y-6">
              <div className="border-b-4 border-[#121316] pb-4">
                <h3 className="font-headline font-black text-xl sm:text-2xl text-[#121316] uppercase tracking-tight">
                  Update Account Password
                </h3>
                <p className="text-xs text-gray-600 font-medium mt-0.5">
                  Ensure your password uses at least 8 characters with numbers and special symbols.
                </p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FCFBF7] border-3 border-[#121316] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FCFBF7] border-3 border-[#121316] text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-[#FCFBF7] border-3 border-[#121316] text-xs font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-[#0F534A] text-white border-3 border-[#121316] shadow-[4px_4px_0_#9EFC5F] font-headline font-black text-xs uppercase tracking-wider transition-all"
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>
            </div>

            {/* 2FA Toggle Card */}
            <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#9EFC5F] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] px-2.5 py-0.5 text-[9px] font-headline font-black uppercase">
                  Recommended Protection
                </span>
                <h4 className="font-headline font-black text-xl text-[#121316] uppercase tracking-tight">
                  Two-Factor Authentication (2FA)
                </h4>
                <p className="text-xs text-gray-600 font-medium">
                  Add an extra layer of security using Google Authenticator or Microsoft Authenticator.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIs2FAEnabled(!is2FAEnabled);
                  toast.success(is2FAEnabled ? '2FA disabled.' : '2FA verification enabled!');
                }}
                className={`px-6 py-3 border-3 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase tracking-wider transition-all flex-shrink-0 ${
                  is2FAEnabled ? 'bg-[#9EFC5F] text-[#0F534A]' : 'bg-[#FFDD33] text-[#121316]'
                }`}
              >
                {is2FAEnabled ? '2FA Enabled ✓' : 'Enable 2FA Protection'}
              </button>
            </div>

            {/* Active Sessions List */}
            <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-6 sm:p-8 space-y-4">
              <h4 className="font-headline font-black text-lg text-[#121316] uppercase tracking-tight border-b-4 border-[#121316] pb-3">
                Active Browser Sessions
              </h4>

              <div className="p-4 bg-[#FCFBF7] border-3 border-[#121316] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Laptop className="w-6 h-6 text-[#0F534A]" />
                  <div>
                    <p className="text-xs font-headline font-black text-[#121316] uppercase">
                      Current Session — Windows PC (Chrome)
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">
                      IP: 103.24.182.10 • Active Now
                    </p>
                  </div>
                </div>
                <span className="bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase">
                  THIS DEVICE
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* TAB 3: NOTIFICATIONS & DISPLAY */}
        {/* ═══════════════════════════════════════════════════ */}
        {activeTab === 'notifications' && (
          <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#18D7E8] p-6 sm:p-8 space-y-6">
            <div className="border-b-4 border-[#121316] pb-4">
              <h3 className="font-headline font-black text-xl sm:text-2xl text-[#121316] uppercase tracking-tight">
                Notification Preferences
              </h3>
              <p className="text-xs text-gray-600 font-medium mt-0.5">
                Choose which automated email alerts and activity digests you receive.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] flex items-center justify-between">
                <div>
                  <h4 className="font-headline font-black text-sm uppercase text-[#121316]">
                    Milestone Escrow & Payout Alerts
                  </h4>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    Receive instant notifications when campaign funds or micro-grants are disbursed.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailPayouts(!emailPayouts)}
                  className={`w-12 h-6 border-2 border-[#121316] p-0.5 transition-all ${emailPayouts ? 'bg-[#9EFC5F]' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-[#121316] transition-all ${emailPayouts ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] flex items-center justify-between">
                <div>
                  <h4 className="font-headline font-black text-sm uppercase text-[#121316]">
                    Mentorship & Guidance Session Reminders
                  </h4>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    Get reminder emails 1 hour before scheduled 1-on-1 guidance calls.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailSessions(!emailSessions)}
                  className={`w-12 h-6 border-2 border-[#121316] p-0.5 transition-all ${emailSessions ? 'bg-[#9EFC5F]' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-[#121316] transition-all ${emailSessions ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] flex items-center justify-between">
                <div>
                  <h4 className="font-headline font-black text-sm uppercase text-[#121316]">
                    Account Security & Governance Warnings
                  </h4>
                  <p className="text-xs text-gray-600 font-medium mt-0.5">
                    Receive urgent alerts for password changes or unknown device logins.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setEmailSecurity(!emailSecurity)}
                  className={`w-12 h-6 border-2 border-[#121316] p-0.5 transition-all ${emailSecurity ? 'bg-[#9EFC5F]' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 bg-[#121316] transition-all ${emailSecurity ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>

            <button
              onClick={() => toast.success('Notification settings saved!')}
              className="px-8 py-3 bg-[#18D7E8] text-[#121316] border-3 border-[#121316] shadow-[4px_4px_0_#121316] font-headline font-black text-xs uppercase tracking-wider transition-all"
            >
              Save Notification Preferences
            </button>
          </div>
        )}
      </div>
    </UnifiedDashboardLayout>
  );
}
