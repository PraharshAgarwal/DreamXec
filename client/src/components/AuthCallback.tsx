import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { handleOAuthSuccess } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const completeAuth = async () => {
      try {
        // 1. Extract token from URL hash or query params
        const urlParams = new URLSearchParams(window.location.search);
        let token = urlParams.get('token');

        if (!token && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          token = hashParams.get('token');
        }

        if (!token) {
          console.error('[AuthCallback] No token in callback URL');
          toast.error('Authentication failed: Missing access token.');
          navigate('/login', { replace: true });
          return;
        }

        // Clean up token from URL bar for security
        window.history.replaceState({}, document.title, window.location.pathname);

        // 2. Load and cache user in AuthContext
        const user = await handleOAuthSuccess(token);

        if (!user) {
          console.error('[AuthCallback] Could not load user credentials');
          toast.error('Failed to load user profile. Please try logging in again.');
          navigate('/login', { replace: true });
          return;
        }

        // 3. Smart Onboarding / Multi-Profile Redirect
        const hasOrganizations = Array.isArray(user.organizations) && user.organizations.length > 0;
        const hasMemberships = Array.isArray(user.memberships) && user.memberships.length > 0;
        const isNewAccount = user.isNewUser || (!user.activeProfile && !hasOrganizations && !hasMemberships);

        if (isNewAccount) {
          console.log('[AuthCallback] New user detected, navigating to organization onboarding');
          navigate('/onboarding/existing-org', { replace: true });
          return;
        }

        // 4. Navigate directly to profile selection screen
        navigate('/select-profile', { replace: true });
      } catch (err: any) {
        console.error('[AuthCallback] Error completing authentication:', err);
        toast.error(err?.message || 'Authentication failed. Please sign in again.');
        navigate('/login', { replace: true });
      }
    };

    completeAuth();
  }, [navigate, handleOAuthSuccess]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EBE7DF] bg-dot-grid relative overflow-hidden p-4">
      {/* Neo-brutalist loading card */}
      <div
        className="bg-white p-8 max-w-sm w-full text-center relative z-10"
        style={{
          border: '4px solid #0F534A',
          boxShadow: '8px 8px 0 #FE4E1A',
        }}
      >
        <div className="w-14 h-14 border-4 border-[#0F534A] border-t-[#FE4E1A] rounded-full animate-spin mx-auto mb-5" />
        <h2 className="font-headline font-black text-lg text-[#0F534A] uppercase tracking-wider mb-2">
          Verifying Identity
        </h2>
        <p className="font-headline font-bold text-xs text-[#4717AE]">
          Securing session &amp; preparing your dashboard...
        </p>
        <div className="mt-5 flex h-1.5 w-full">
          <div className="flex-1 bg-[#FE4E1A]" />
          <div className="flex-1 bg-[#FFDD33]" />
          <div className="flex-1 bg-[#0F534A]" />
        </div>
      </div>
    </div>
  );
}
