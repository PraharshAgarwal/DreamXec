import type { User } from '../../../types';
import { Link, useLocation } from 'react-router-dom';
import { getUserRoleProfile } from '../../../utils/roleUtils';

interface DesktopMenuProps {
  currentUser?: User | any | null;
  onLogin?: () => void;
}

export const DesktopMenu = ({ currentUser, onLogin }: DesktopMenuProps) => {
  const location = useLocation();
  const isAuthPage =
    ['/login', '/register', '/auth', '/reset-password'].includes(location.pathname) ||
    location.pathname.startsWith('/auth') ||
    location.pathname.startsWith('/onboarding');
  const roleProfile = getUserRoleProfile(currentUser);
  const activeRole = roleProfile.roleRaw.toLowerCase();
  const orgSlug = (((currentUser as any)?.activeProfile?.orgSlug || '') as string).toLowerCase();
  const isDxOrg = ['dreamxec', 'dx-platform-org'].includes(orgSlug);
  const isAdmin =
    !!currentUser &&
    (activeRole === 'admin' ||
      activeRole === 'org_admin' ||
      activeRole === 'corporate_admin' ||
      activeRole === 'compliance_officer' ||
      isDxOrg);

  const isMentor = !!currentUser && activeRole === 'mentor';
  const isDonor = !!currentUser && activeRole === 'donor';

  const isStudentOrInnovator =
    !!currentUser &&
    [
      'student',
      'student_president',
      'researcher',
      'professor',
      'incubator_manager',
      'user',
      'mentor',
    ].includes(activeRole);

  const adminConsoleUrl = '/dx-admin';

  const dashboardUrl = isAdmin
    ? adminConsoleUrl
    : isMentor
      ? '/mentor/dashboard'
      : isDonor
        ? '/donor/dashboard'
        : '/dashboard';

  return (
    <nav className="flex items-center gap-6">
      {/* Public Navigation */}
      <Link
        to="/"
        className={`text-xs font-headline font-bold uppercase tracking-wider transition-colors ${
          location.pathname === '/'
            ? 'text-[#FE4E1A] border-b-2 border-[#FE4E1A] pb-0.5'
            : 'text-[#0F534A] hover:text-[#FE4E1A]'
        }`}
      >
        Home
      </Link>

      <Link
        to="/campaigns"
        className={`text-xs font-headline font-bold uppercase tracking-wider transition-colors ${
          location.pathname.startsWith('/campaign') &&
          !location.pathname.startsWith('/campaigns/my')
            ? 'text-[#FE4E1A] border-b-2 border-[#FE4E1A] pb-0.5'
            : 'text-[#0F534A] hover:text-[#FE4E1A]'
        }`}
      >
        Campaigns
      </Link>

      <Link
        to="/clubs"
        className={`text-xs font-headline font-bold uppercase tracking-wider transition-colors ${
          location.pathname.startsWith('/clubs')
            ? 'text-[#FE4E1A] border-b-2 border-[#FE4E1A] pb-0.5'
            : 'text-[#0F534A] hover:text-[#FE4E1A]'
        }`}
      >
        Clubs
      </Link>

      <Link
        to="/services"
        className={`text-xs font-headline font-bold uppercase tracking-wider transition-colors ${
          location.pathname.startsWith('/services')
            ? 'text-[#FE4E1A] border-b-2 border-[#FE4E1A] pb-0.5'
            : 'text-[#0F534A] hover:text-[#FE4E1A]'
        }`}
      >
        Services
      </Link>

      {/* Logged-in user links */}
      {currentUser && (
        <>
          {isStudentOrInnovator && (
            <Link
              to="/my-campaigns"
              className={`text-xs font-headline font-bold uppercase tracking-wider transition-colors ${
                location.pathname.startsWith('/my-campaigns')
                  ? 'text-[#FE4E1A] border-b-2 border-[#FE4E1A] pb-0.5'
                  : 'text-[#0F534A] hover:text-[#FE4E1A]'
              }`}
            >
              My Campaigns
            </Link>
          )}

          <Link
            to={dashboardUrl}
            className={`text-xs font-headline font-bold uppercase tracking-wider transition-colors ${
              location.pathname === dashboardUrl || location.pathname.startsWith('/dashboard')
                ? 'text-[#FE4E1A] border-b-2 border-[#FE4E1A] pb-0.5'
                : 'text-[#0F534A] hover:text-[#FE4E1A]'
            }`}
          >
            Dashboard
          </Link>
        </>
      )}

      {/* Guest CTAs */}
      {!currentUser && (
        <div className="flex items-center gap-3 ml-2">
          {!isAuthPage && (
            <Link
              to="/register"
              className="bg-[#FE4E1A] text-white hover:bg-[#0F534A] border-2 border-[#121316] shadow-[2px_2px_0_#121316] px-4 py-2 font-headline font-bold text-xs uppercase tracking-wider transition-all hover:-translate-y-0.5 whitespace-nowrap rounded-md"
            >
              Join Movement
            </Link>
          )}
          <button
            onClick={onLogin}
            className="bg-white text-[#0F534A] hover:bg-[#FCFBF7] border-2 border-[#121316] shadow-[2px_2px_0_#121316] px-4 py-2 font-headline font-bold text-xs uppercase tracking-wider transition-all hover:-translate-y-0.5 whitespace-nowrap cursor-pointer rounded-md"
          >
            Sign In
          </button>
        </div>
      )}
    </nav>
  );
};
