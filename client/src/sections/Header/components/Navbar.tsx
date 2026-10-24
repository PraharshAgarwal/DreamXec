import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Logo } from '../../../components/Logo';
import { MobileMenuButton } from '../../../components/MobileMenuButton';
import { DesktopMenu } from './DesktopMenu';
import type { User } from '../../../types';
import UserAvatar from '../../../components/common/UserAvatar';
import { getUserDisplayPersona, getUserRoleProfile } from '../../../utils/roleUtils';
import { useAuth } from '../../../context/AuthContext';

interface NavbarProps {
  currentUser?: User | any | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export const Navbar = ({ currentUser, onLogin, onLogout }: NavbarProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const authContext = useAuth();
  const personaMode = authContext?.personaMode || 'species';
  const identityUser = authContext?.user || currentUser;

  const isAuthPage =
    ['/login', '/register', '/auth', '/reset-password'].includes(location.pathname) ||
    location.pathname.startsWith('/auth') ||
    location.pathname.startsWith('/onboarding');

  // Role & Identity Resolution
  const displayPersona = getUserDisplayPersona(identityUser, personaMode);
  const roleProfile = getUserRoleProfile(identityUser);
  const activeRole = roleProfile.roleRaw.toLowerCase();
  const orgSlug = (((identityUser as any)?.activeProfile?.orgSlug || '') as string).toLowerCase();
  const isDxOrg = ['dreamxec', 'dx-platform-org'].includes(orgSlug);

  const isAdminRole =
    !!identityUser &&
    (activeRole === 'admin' ||
      activeRole === 'org_admin' ||
      activeRole === 'corporate_admin' ||
      activeRole === 'compliance_officer' ||
      isDxOrg);

  const isStudentType =
    !!identityUser &&
    (activeRole === 'student' ||
      activeRole === 'student_president' ||
      activeRole === 'researcher' ||
      activeRole === 'professor' ||
      activeRole === 'incubator_manager' ||
      activeRole === 'mentor' ||
      activeRole === 'user');

  const isDonorType = !!identityUser && activeRole === 'donor';

  const adminConsoleUrl = '/dx-admin';

  const dashboardUrl = isAdminRole
    ? adminConsoleUrl
    : activeRole === 'mentor'
      ? '/mentor/dashboard'
      : isDonorType
        ? '/donor/dashboard'
        : '/dashboard';

  return (
    <>
      <nav className="flex items-center justify-between px-4 py-2">
        {/* Logo */}
        <Logo />

        {/* Navigation & Controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            <DesktopMenu currentUser={identityUser} onLogin={onLogin} />
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            {identityUser && (
              <>
                {/* User Profile Button: Icon + Name ONLY */}
                <button
                  onClick={() => {
                    navigate('/profile/setup');
                  }}
                  className="hidden md:flex items-center gap-2 bg-white border-2 border-[#0F534A] shadow-[2px_2px_0px_#0F534A] rounded-lg px-3 py-1.5 cursor-pointer hover:bg-[#FCFBF7] transition-all text-left max-w-[220px]"
                  title={`View Profile • ${displayPersona.displayName}`}
                >
                  <UserAvatar
                    user={identityUser}
                    src={displayPersona.avatarUrl}
                    name={displayPersona.displayName}
                    size="sm"
                    borderClassName="border-2 border-[#0F534A]"
                  />
                  <span className="min-w-0 flex flex-col items-start">
                    <span className="text-[#0F534A] font-bold text-xs sm:text-sm font-sans truncate max-w-[150px]">
                      {displayPersona.displayName}
                    </span>
                    <span className="text-[9px] font-headline font-black uppercase text-gray-600 truncate max-w-[150px]">
                      Active · {roleProfile.badgeLabel}
                    </span>
                    <span className="text-[9px] font-medium text-gray-500 truncate max-w-[150px]">
                      {roleProfile.orgName}
                    </span>
                  </span>
                </button>

                {/* Admin Console shortcut button ONLY for authorized admins */}
                {isAdminRole && (
                  <button
                    onClick={() => navigate(adminConsoleUrl)}
                    className="hidden md:flex items-center gap-1.5 bg-[#FE4E1A] border-2 border-[#121316] px-3.5 py-2 font-headline font-black uppercase text-white hover:bg-[#0F534A] transition-colors shadow-[2px_2px_0_#121316] text-xs cursor-pointer rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Admin Console
                  </button>
                )}

                <button
                  onClick={onLogout}
                  className="bg-white border-2 border-[#121316] text-[#0F534A] px-3.5 py-1.5 rounded-lg font-headline font-black text-xs uppercase tracking-wider hover:bg-[#FE4E1A] hover:text-white shadow-[2px_2px_0_#121316] hover:-translate-y-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                  title="Logout"
                >
                  Logout
                </button>
              </>
            )}

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <MobileMenuButton onClick={() => setMobileMenuOpen(!mobileMenuOpen)} />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t-2 border-dreamxec-navy shadow-lg rounded-b-2xl">
          <div className="flex flex-col gap-2 p-4">
            {identityUser ? (
              <>
                {/* User Profile Card */}
                <button
                  onClick={() => {
                    navigate('/profile/setup');
                    setMobileMenuOpen(false);
                  }}
                  className="px-4 py-3 bg-dreamxec-beige border-3 border-dreamxec-navy rounded-lg mb-2 hover:bg-dreamxec-cream hover:shadow-pastel-card transition-all w-full text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar
                      user={identityUser}
                      src={displayPersona.avatarUrl}
                      name={displayPersona.displayName}
                      size="sm"
                      borderClassName="border-2 border-dreamxec-navy"
                    />
                    <span className="min-w-0 flex flex-col items-start">
                      <span className="text-dreamxec-navy font-bold text-sm font-sans truncate">
                        {displayPersona.displayName}
                      </span>
                      <span className="text-[10px] font-headline font-black uppercase text-gray-600 truncate">
                        Active · {roleProfile.badgeLabel}
                      </span>
                      <span className="text-[10px] font-medium text-gray-500 truncate">
                        {roleProfile.orgName}
                      </span>
                    </span>
                  </div>
                </button>

                {/* Navigation Links for Logged-In Users */}
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left px-4 py-2.5 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
                >
                  HOME
                </Link>

                <Link
                  to={dashboardUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left px-4 py-2.5 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
                >
                  DASHBOARD
                </Link>

                <Link
                  to="/campaigns"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left px-4 py-2.5 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
                >
                  CAMPAIGNS
                </Link>

                {/* My Campaigns (Only for innovators/students) */}
                {isStudentType && (
                  <Link
                    to="/my-campaigns"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-left px-4 py-2.5 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
                  >
                    MY CAMPAIGNS
                  </Link>
                )}

                <Link
                  to="/clubs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left px-4 py-2.5 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
                >
                  CLUBS
                </Link>

                <Link
                  to="/services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left px-4 py-2.5 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
                >
                  SERVICES
                </Link>

                {/* Admin Console (Only for authorized admins) */}
                {isAdminRole && (
                  <Link
                    to={adminConsoleUrl}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-left px-4 py-3 bg-[#FE4E1A] text-white font-headline font-black uppercase transition-colors border-2 border-[#121316] shadow-[2px_2px_0_#121316] flex items-center justify-between my-1 rounded-lg"
                  >
                    <span>ADMIN CONSOLE</span>
                    <span className="text-[10px] bg-[#FFDD33] text-[#121316] px-2 py-0.5 border border-[#121316] font-mono font-black">
                      ADMIN
                    </span>
                  </Link>
                )}

                {/* Logout Button */}
                <button
                  onClick={() => {
                    onLogout?.();
                    setMobileMenuOpen(false);
                  }}
                  className="mx-2 mt-3 bg-dreamxec-orange text-white px-6 py-3 rounded-lg font-bold border-3 border-dreamxec-navy hover:bg-dreamxec-green transition-colors font-display shadow-pastel-saffron cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                {/* Guest Links */}
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left px-4 py-2.5 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
                >
                  HOME
                </Link>
                <Link
                  to="/campaigns"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left px-4 py-2.5 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
                >
                  CAMPAIGNS
                </Link>
                <Link
                  to="/clubs"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left px-4 py-2.5 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
                >
                  CLUBS
                </Link>
                <Link
                  to="/services"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-left px-4 py-2.5 text-dreamxec-navy hover:bg-dreamxec-cream hover:text-dreamxec-orange font-bold transition-colors rounded-lg font-display border-2 border-transparent hover:border-dreamxec-navy"
                >
                  SERVICES
                </Link>

                <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-gray-200">
                  {!isAuthPage && (
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="text-center mx-2 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] hover:bg-[#FE4E1A] hover:text-white px-5 py-2.5 font-headline font-black text-xs uppercase tracking-wider transition-all"
                    >
                      Join the Movement
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      onLogin?.();
                      setMobileMenuOpen(false);
                    }}
                    className="mx-2 bg-dreamxec-orange text-white px-6 py-2.5 rounded-lg font-bold border-3 border-dreamxec-navy hover:bg-dreamxec-saffron transition-colors font-display shadow-pastel-saffron cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
