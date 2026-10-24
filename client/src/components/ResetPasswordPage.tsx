import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  KeyRound,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Clock,
  RefreshCw,
  Check,
  X,
} from 'lucide-react';
import { verifyResetToken, resetPassword } from '../services/authService';

type TokenStatus = 'verifying' | 'valid' | 'invalid' | 'expired' | 'missing';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string>('');

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>(token ? 'verifying' : 'missing');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live password validation rules
  const rules = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    passwordsMatch: Boolean(password && confirmPassword && password === confirmPassword),
  };

  const isFormValid =
    rules.minLength &&
    rules.hasUppercase &&
    rules.hasLowercase &&
    rules.hasNumber &&
    rules.passwordsMatch;

  // Verify token on mount
  const checkToken = useCallback(async () => {
    if (!token) {
      setTokenStatus('missing');
      setStatusMessage('No reset token was found in the link. Please check your email.');
      return;
    }

    setTokenStatus('verifying');
    try {
      const res = await verifyResetToken(token);
      if (res.data?.valid) {
        setTokenStatus('valid');
        if (res.data.email) {
          setAccountEmail(res.data.email);
        }

        if (res.data.expiresAt) {
          const expiryTime = new Date(res.data.expiresAt).getTime();
          const now = Date.now();
          const diffSeconds = Math.max(0, Math.floor((expiryTime - now) / 1000));
          setSecondsRemaining(diffSeconds);
        } else {
          // Default fallback to 300 seconds (5 mins)
          setSecondsRemaining(300);
        }
      } else {
        setTokenStatus('invalid');
        setStatusMessage(res.message || 'The reset link is invalid or has already been used.');
      }
    } catch (err: any) {
      console.warn('Token validation error:', err);
      const msg = err?.message || 'Invalid or expired password reset link.';
      if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('5-minute')) {
        setTokenStatus('expired');
      } else {
        setTokenStatus('invalid');
      }
      setStatusMessage(msg);
    }
  }, [token]);

  useEffect(() => {
    checkToken();
  }, [checkToken]);

  // Countdown timer ticker
  useEffect(() => {
    if (tokenStatus !== 'valid' || secondsRemaining === null) {
      return;
    }

    if (secondsRemaining <= 0) {
      setTokenStatus('expired');
      setStatusMessage('Your 5-minute password reset window has expired. Please request a new link.');
      return;
    }

    timerRef.current = setTimeout(() => {
      setSecondsRemaining((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [tokenStatus, secondsRemaining]);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('Missing reset token. Please request a new link.');
      return;
    }

    if (!isFormValid) {
      toast.error('Please satisfy all password security requirements.');
      return;
    }

    setLoading(true);
    try {
      const res = await resetPassword(token, password);
      if (res.status === 'success' || res.token || res.message) {
        setSuccess(true);
        toast.success('🎉 Password reset successfully! Redirecting...');
        setTimeout(() => {
          navigate('/auth');
        }, 2200);
      } else {
        throw new Error(res.message || 'Failed to reset password');
      }
    } catch (err: any) {
      console.error('Password reset submit error:', err);
      const msg = err?.message || 'Failed to update password. Please try again.';
      toast.error(msg);
      if (msg.toLowerCase().includes('expired')) {
        setTokenStatus('expired');
        setStatusMessage(msg);
      } else if (msg.toLowerCase().includes('already been used')) {
        setTokenStatus('invalid');
        setStatusMessage(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF7] flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white border-4 border-[#121316] shadow-[8px_8px_0_#FE4E1A] p-6 sm:p-8 space-y-6">
        {/* Top Badge & Header */}
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-3 py-1 text-xs font-headline font-black uppercase tracking-wider shadow-[2px_2px_0_#121316]">
            <ShieldCheck className="w-4 h-4 text-[#0F534A]" /> DreamXec Identity Verification
          </div>
          <h1 className="text-2xl sm:text-3xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
            Reset Password
          </h1>
          {accountEmail ? (
            <p className="text-xs text-[#4717AE] font-bold">
              Account: <span className="underline">{accountEmail}</span>
            </p>
          ) : (
            <p className="text-xs text-gray-600 font-medium">
              Enter your new secure password below to complete verification and update your account.
            </p>
          )}
        </div>

        {/* Verifying State */}
        {tokenStatus === 'verifying' && (
          <div className="p-6 bg-gray-50 border-2 border-[#121316] text-center space-y-3 shadow-[3px_3px_0_#121316]">
            <RefreshCw className="w-8 h-8 text-[#FE4E1A] animate-spin mx-auto" />
            <h3 className="text-sm font-headline font-black text-[#121316] uppercase">
              Verifying Security Token...
            </h3>
            <p className="text-xs text-gray-600">
              Validating the active 5-minute security window with DreamXec authentication servers.
            </p>
          </div>
        )}

        {/* Missing / Invalid / Expired State */}
        {(tokenStatus === 'missing' || tokenStatus === 'invalid' || tokenStatus === 'expired') && (
          <div className="p-5 bg-red-50 border-3 border-[#121316] text-left space-y-3 shadow-[4px_4px_0_#F4002C]">
            <div className="flex items-center gap-2 text-[#F4002C]">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-headline font-black uppercase">
                {tokenStatus === 'expired' ? 'Link Expired (5-Min Limit)' : 'Invalid Security Link'}
              </h3>
            </div>
            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              {statusMessage ||
                'This password reset link is invalid, expired, or has already been used. Security links expire strictly 5 minutes after creation.'}
            </p>
            <div className="pt-2">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-[#FE4E1A] hover:bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer gap-2"
              >
                Request A New Reset Link <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Success State */}
        {success && (
          <div className="p-6 bg-[#9EFC5F]/20 border-3 border-[#121316] text-center space-y-3 shadow-[4px_4px_0_#121316]">
            <CheckCircle2 className="w-12 h-12 text-[#0F534A] mx-auto animate-bounce" />
            <h3 className="text-lg font-headline font-black text-[#0F534A] uppercase">Password Updated!</h3>
            <p className="text-xs text-gray-700 font-medium">
              Your account password has been updated securely. Redirecting you to sign in...
            </p>
            <Link
              to="/auth"
              className="inline-block px-5 py-2.5 bg-[#0F534A] hover:bg-[#FE4E1A] text-white font-headline font-black text-xs uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all"
            >
              Sign In Now →
            </Link>
          </div>
        )}

        {/* Active Valid Form */}
        {tokenStatus === 'valid' && !success && (
          <>
            {/* Live 5-Minute Countdown Timer Banner */}
            {secondsRemaining !== null && (
              <div className="flex items-center justify-between p-2.5 bg-[#FFDD33]/30 border-2 border-[#121316] shadow-[2px_2px_0_#121316]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#121316]">
                  <Clock className="w-4 h-4 text-[#FE4E1A]" />
                  <span>Link Active Window:</span>
                </div>
                <div className="px-2 py-0.5 bg-[#121316] text-white font-mono font-black text-xs tracking-wider rounded">
                  ⏳ {formatCountdown(secondsRemaining)}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1.5">
                  New Password <span className="text-[#F4002C]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#FCFBF7] border-2 border-[#121316] p-3 text-xs font-bold text-[#121316] pr-10 focus:outline-none focus:border-[#FE4E1A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-[#121316]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1.5">
                  Confirm New Password <span className="text-[#F4002C]">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#FCFBF7] border-2 border-[#121316] p-3 text-xs font-bold text-[#121316] pr-10 focus:outline-none focus:border-[#FE4E1A]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-500 hover:text-[#121316]"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Validation Checklist */}
              <div className="p-3 bg-gray-50 border-2 border-[#121316] space-y-1.5">
                <div className="text-[11px] font-headline font-black uppercase text-gray-700 mb-1">
                  Password Requirements:
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-bold">
                  <div
                    className={`flex items-center gap-1.5 ${
                      rules.minLength ? 'text-green-700' : 'text-gray-500'
                    }`}
                  >
                    {rules.minLength ? (
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                    <span>8+ Characters</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      rules.hasUppercase ? 'text-green-700' : 'text-gray-500'
                    }`}
                  >
                    {rules.hasUppercase ? (
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                    <span>1+ Uppercase</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      rules.hasLowercase ? 'text-green-700' : 'text-gray-500'
                    }`}
                  >
                    {rules.hasLowercase ? (
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                    <span>1+ Lowercase</span>
                  </div>

                  <div
                    className={`flex items-center gap-1.5 ${
                      rules.hasNumber ? 'text-green-700' : 'text-gray-500'
                    }`}
                  >
                    {rules.hasNumber ? (
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                    <span>1+ Number</span>
                  </div>

                  <div
                    className={`col-span-2 flex items-center gap-1.5 pt-1 border-t border-gray-200 ${
                      rules.passwordsMatch
                        ? 'text-green-700'
                        : confirmPassword
                        ? 'text-[#F4002C]'
                        : 'text-gray-500'
                    }`}
                  >
                    {rules.passwordsMatch ? (
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    )}
                    <span>Passwords match</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isFormValid || loading}
                className="w-full py-3 bg-[#FE4E1A] hover:bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-3 border-[#121316] shadow-[4px_4px_0_#121316] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    Updating Credentials...
                  </span>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" /> Confirm &amp; Reset Password <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="text-center pt-2 border-t border-gray-200">
          <Link to="/auth" className="text-xs font-headline font-black text-[#4717AE] hover:underline uppercase">
            ← Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
