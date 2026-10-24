import React, { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "../sections/Header";
import { FooterContent } from "../sections/Footer/components/FooterContent";
import {
  register,
  sendOTP,
  verifyOTP,
  checkEmailAvailability,
  initiateGoogleAuth,
  type RegisterData,
} from "../services/authService";

/* ── SVG ICONS ── */
const GoogleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

const LinkedInIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      fill="#0A66C2"
    />
  </svg>
);

const UserIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const MailIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const LockIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = ({ className = "w-4 h-4", show }: { className?: string; show?: boolean }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    {show ? (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ) : (
      <>
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
      </>
    )}
  </svg>
);

/* ── NEO INPUT COMPONENT ── */
interface NeoInputProps {
  icon?: React.ReactNode;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  state?: "default" | "success" | "error";
}

const NeoInput: React.FC<NeoInputProps> = ({
  icon,
  type,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  disabled,
  state = "default",
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const borderColor = state === "success" ? "#0F534A" : state === "error" ? "#F4002C" : "#121316";
  const shadowColor = state === "success" ? "#9EFC5F" : state === "error" ? "#F4002C" : "#FE4E1A";

  return (
    <div className="relative">
      {icon && (
        <div className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${disabled ? 'text-gray-400' : 'text-[#0F534A]'} opacity-75 pointer-events-none z-10`}>
          {icon}
        </div>
      )}
      <input
        type={inputType}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full ${icon ? "pl-10" : "pl-3.5"} ${isPassword ? "pr-10" : "pr-3.5"} py-3 text-sm font-headline font-bold ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-[#121316]'} focus:outline-none transition-all`}
        style={{
          border: `3px solid ${borderColor}`,
          boxShadow: disabled ? "none" : `4px 4px 0 ${shadowColor}`,
        }}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          disabled={disabled}
          className={`absolute right-3 top-1/2 -translate-y-1/2 ${disabled ? 'text-gray-400' : 'text-[#0F534A]'} opacity-80 hover:opacity-100 transition-opacity z-10`}
        >
          <EyeIcon show={showPassword} />
        </button>
      )}
    </div>
  );
};

export default function RegisterPage() {
  const navigate = useNavigate();

  // ── STEP STATE (Step 1 or Step 2) ──
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // ── FORM FIELDS ──
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── LIVE EMAIL CHECK STATE ──
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const emailCheckTimeout = useRef<any>(null);

  // ── OTP VERIFICATION STATE ──
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");

  // ── SUBMISSION STATE ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ── DPDP ACT 2023 MINOR VERIFICATION STATE ──
  const [isMinor, setIsMinor] = useState(false);
  const [guardianEmail, setGuardianEmail] = useState("");

  // ── PASSWORD RULES ──
  const passwordRules = {
    minLength: password.length >= 8,
    hasUpperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
  };
  const isPasswordValid = passwordRules.minLength && passwordRules.hasUpperLower && passwordRules.hasNumber;

  // ── DEBOUNCED LIVE EMAIL AVAILABILITY CHECK ──
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailAvailable(null);
    setIsEmailVerified(false);

    if (emailCheckTimeout.current) {
      clearTimeout(emailCheckTimeout.current);
    }

    if (newEmail.trim() && newEmail.includes("@") && newEmail.includes(".")) {
      setIsCheckingEmail(true);
      emailCheckTimeout.current = setTimeout(async () => {
        const res = await checkEmailAvailability(newEmail.trim());
        setIsCheckingEmail(false);
        setEmailAvailable(res.available);
      }, 450);
    } else {
      setIsCheckingEmail(false);
    }
  };

  // ── HANDLERS FOR EMAIL OTP VERIFICATION ──
  const handleSendOTP = async () => {
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address before requesting an OTP.");
      return;
    }
    if (emailAvailable === false) {
      setError("This email is already registered. Please log in instead.");
      return;
    }

    setError("");
    setSendingOtp(true);
    setOtpMessage("");

    try {
      await sendOTP(email.trim());
      setOtpSent(true);
      setOtpMessage(`OTP sent to ${email}. Check your inbox.`);
    } catch (err: any) {
      setError(err?.message || "Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async (codeToVerify?: string) => {
    const code = (typeof codeToVerify === "string" ? codeToVerify : otpCode).trim();
    if (!code || code.length < 6) {
      setError("Please enter the 6-digit OTP code sent to your email.");
      return;
    }

    setError("");
    setVerifyingOtp(true);

    try {
      await verifyOTP(email.trim(), code);
      setIsEmailVerified(true);
      setSuccessMessage("✅ Email verified successfully via OTP!");
      
      // Automatically advance to Step 2 after verification
      setTimeout(() => {
        setCurrentStep(2);
      }, 500);
    } catch (err: any) {
      setError(err?.message || "Incorrect OTP code. Please try again.");
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(val);
    if (val.length === 6 && !verifyingOtp && !isEmailVerified) {
      handleVerifyOTP(val);
    }
  };

  // ── PROCEED TO STEP 2 ──
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (emailAvailable === false) {
      setError("This email is already registered. Please sign in instead.");
      return;
    }
    if (!isEmailVerified) {
      setError("Please verify your email address via OTP to proceed.");
      return;
    }

    setCurrentStep(2);
  };

  // ── FINAL REGISTRATION SUBMIT ──
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!password) {
      setError("Please create a password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!isPasswordValid) {
      setError("Password does not meet required security criteria.");
      return;
    }

    setIsSubmitting(true);
    try {
      const registerData: RegisterData = {
        name,
        email,
        password,
        role: "USER",
        isMinor,
        guardianEmail: isMinor && guardianEmail.trim() ? guardianEmail.trim() : undefined,
      };

      await register(registerData);
      setSuccessMessage("🎉 Account created successfully! Launching your portal...");
      setTimeout(() => {
        window.location.href = "/onboarding/existing-org";
      }, 1000);
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Header />

      <div className="min-h-screen bg-[#0F534A] py-12 px-4 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Branded Badges */}
       
        <div className="absolute top-20 left-8 bg-[#FFDD33] text-[#121316] font-headline font-black text-xl px-4 py-2 border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] -rotate-6 opacity-80 pointer-events-none hidden sm:block">
          # IS ALL IT TAKES
        </div>
        <div className="absolute top-10 left-8 bg-[#FFDD33] text-[#121316] font-headline font-black text-xl px-4 py-2 border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] -rotate-6 opacity-80 pointer-events-none hidden sm:block">
          #BEINGCURIOUS
        </div>
        <div className="absolute bottom-30 left-10 bg-[#FE4E1A] text-white font-headline font-black text-xl px-4 py-2 border-3 border-[#121316] shadow-[4px_4px_0_#9EFC5F] -rotate-6 opacity-90 pointer-events-none hidden sm:block">
          SOCH SE SHURU KRO 
        </div>
      

        <div className="w-full max-w-2xl my-4 z-10">

          {/* STEP PROGRESS BAR */}
          <div className="mb-6 bg-white border-3 border-[#121316] shadow-[6px_6px_0_#FFDD33] p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-[#FE4E1A] text-white font-headline font-black text-sm flex items-center justify-center border-2 border-[#121316]">
                {currentStep}
              </span>
              <div>
                <p className="text-[10px] font-headline font-black uppercase text-[#4717AE] tracking-widest mb-0.5">
                  Registration Progress
                </p>
                <h2 className="text-sm font-headline font-black text-[#121316] uppercase tracking-wider">
                  {currentStep === 1 ? "Step 1: Email Verification" : "Step 2: Profile & Security Details"}
                </h2>
              </div>
            </div>

            {/* Step Bar Dots */}
            <div className="flex items-center gap-2">
              <div className={`h-3 rounded-full transition-all ${currentStep === 1 ? 'w-10 bg-[#FE4E1A]' : 'w-4 bg-[#9EFC5F]'}`} />
              <div className={`h-3 rounded-full transition-all ${currentStep === 2 ? 'w-10 bg-[#FE4E1A]' : 'w-4 bg-gray-300'}`} />
            </div>
          </div>

          {/* MAIN FORM CONTAINER */}
          <div
            className="bg-[#FCFBF7] relative p-6 sm:p-9"
            style={{
              border: "4px solid #121316",
              boxShadow: "10px 10px 0 #FE4E1A",
            }}
          >
            {/* Header Switcher */}
            <div className="flex items-center justify-between border-b-3 border-[#121316] pb-5 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
                  {currentStep === 1 ? "Verify Email" : "Personal & Account Details"}
                </h1>
                <p className="text-xs font-headline font-bold text-[#4717AE] mt-1">
                  {currentStep === 1
                    ? "Enter your email address & verify via OTP to proceed."
                    : "Enter your full name and create a password."}
                </p>
              </div>

              <Link
                to="/login"
                className="px-4 py-2 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs uppercase tracking-wider hover:bg-[#FE4E1A] hover:text-white transition-colors"
              >
                Sign In →
              </Link>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-900 text-xs font-headline font-black border-3 border-[#F4002C] shadow-[4px_4px_0_#F4002C] flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span>⚠️ {error}</span>
                </div>
                {(error.toLowerCase().includes("already exists") || error.toLowerCase().includes("already registered")) && (
                  <div className="mt-2 pt-2 border-t border-red-300">
                    <p className="mb-2 font-bold">An account already exists for this email address.</p>
                    <Link to="/login" className="inline-block px-4 py-2 bg-[#0F534A] text-white text-xs uppercase font-headline font-black tracking-widest hover:bg-[#4717AE]">
                      Sign In Now →
                    </Link>
                  </div>
                )}
              </div>
            )}
            {successMessage && (
              <div className="mb-6 p-4 bg-[#9EFC5F]/40 text-[#0F534A] text-xs font-headline font-black border-3 border-[#0F534A] shadow-[4px_4px_0_#0F534A]">
                <span>✅ {successMessage}</span>
              </div>
            )}

            {/* ════════════════════════════════════════
                STEP 1 ONLY: SOCIAL QUICK SIGNUP & EMAIL OTP
            ════════════════════════════════════════ */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* ── Social Quick Registration ── */}
                <div>
                  <div className="flex justify-center max-w-sm mx-auto mb-5">
                    <button
                      type="button"
                      onClick={() => initiateGoogleAuth('USER')}
                      className="w-full flex items-center justify-center gap-2.5 py-3 px-4 font-headline font-black text-xs sm:text-sm text-[#0F534A] uppercase tracking-wider bg-white hover:bg-gray-50 transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] cursor-pointer"
                      style={{
                        border: "3px solid #121316",
                        boxShadow: "4px 4px 0 #121316",
                      }}
                    >
                      <GoogleIcon className="w-4 h-4" />
                      Sign Up with Google
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-0.5 bg-[#121316]/20" />
                    <span className="text-[10px] sm:text-xs font-headline font-black text-[#0F534A]/70 uppercase tracking-widest">
                      Or register with Email &amp; OTP
                    </span>
                    <div className="flex-1 h-0.5 bg-[#121316]/20" />
                  </div>
                </div>

                <form onSubmit={handleProceedToStep2} className="space-y-6">

                {/* EMAIL ADDRESS WITH REAL-TIME AVAILABILITY CHECK */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-headline font-black text-[#0F534A] uppercase tracking-widest">
                      Email Address <span className="text-[#F4002C]">*</span>
                    </label>

                    {/* LIVE STATUS BADGE */}
                    {isCheckingEmail && (
                      <span className="text-[10px] font-headline font-black text-[#4717AE] bg-[#FFDD33] px-2 py-0.5 border border-[#121316] animate-pulse">
                        🔄 Checking availability...
                      </span>
                    )}
                    {!isCheckingEmail && emailAvailable === true && (
                      <span className="text-[10px] font-headline font-black text-[#0F534A] bg-[#9EFC5F] px-2 py-0.5 border border-[#121316]">
                        ✓ Email Available
                      </span>
                    )}
                    {!isCheckingEmail && emailAvailable === false && (
                      <span className="text-[10px] font-headline font-black text-white bg-[#F4002C] px-2 py-0.5 border border-[#121316]">
                        ✕ Email Already Registered
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <NeoInput
                        icon={<MailIcon />}
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="yourname@university.edu.in"
                        required
                        disabled={isEmailVerified}
                        state={
                          emailAvailable === true
                            ? "success"
                            : emailAvailable === false
                              ? "error"
                              : "default"
                        }
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSendOTP}
                      disabled={sendingOtp || isEmailVerified || emailAvailable === false || !email.includes("@")}
                      className="px-5 py-3 font-headline font-black text-xs text-white uppercase tracking-wider transition-all cursor-pointer disabled:cursor-not-allowed"
                      style={{
                        background: isEmailVerified ? "#0F534A" : sendingOtp ? "#9ca3af" : "#FE4E1A",
                        border: "3px solid #121316",
                        boxShadow: isEmailVerified ? "none" : "4px 4px 0 #121316",
                      }}
                    >
                      {isEmailVerified ? "✓ Verified" : sendingOtp ? "Sending..." : "Send OTP"}
                    </button>
                  </div>

                  {/* Email Check Alert Banner */}
                  {emailAvailable === false && (
                    <div className="mt-2 p-2.5 bg-red-100 text-[#F4002C] text-xs font-headline font-bold border-2 border-[#F4002C] flex items-center justify-between">
                      <span>An account with this email address already exists.</span>
                      <Link to="/login" className="px-3 py-1 bg-[#121316] text-white text-[10px] uppercase font-black tracking-widest hover:bg-[#FE4E1A]">
                        Sign In →
                      </Link>
                    </div>
                  )}
                </div>

                {/* OTP INPUT CARD */}
                {otpSent && !isEmailVerified && (
                  <div className="p-4 bg-[#FFDD33]/30 border-3 border-[#121316] shadow-[4px_4px_0_#121316] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-headline font-black text-[#0F534A] uppercase tracking-wider">
                        Enter 6-Digit Email OTP
                      </span>
                    </div>
                    {otpMessage && <p className="text-xs font-bold text-[#0F534A]">{otpMessage}</p>}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={otpCode}
                        onChange={handleOtpChange}
                        placeholder="6-Digit Code"
                        className="flex-1 px-3 py-2.5 text-sm font-mono font-black text-[#121316] bg-white border-3 border-[#121316] tracking-widest outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleVerifyOTP()}
                        disabled={verifyingOtp || otpCode.length < 6}
                        className="px-5 py-2.5 font-headline font-black text-xs text-white bg-[#0F534A] border-3 border-[#121316] shadow-[2px_2px_0_#121316] uppercase tracking-wider hover:bg-[#4717AE] cursor-pointer disabled:opacity-50"
                      >
                        {verifyingOtp ? "Verifying..." : "Verify ✓"}
                      </button>
                    </div>
                  </div>
                )}

                {isEmailVerified && (
                  <div className="p-3 bg-[#9EFC5F]/40 text-[#0F534A] text-xs font-headline font-black border-3 border-[#121316] flex items-center justify-between">
                    <span>✓ Email address verified securely via OTP</span>
                    <span className="bg-[#0F534A] text-white px-2 py-0.5 text-[10px] uppercase font-mono">VERIFIED</span>
                  </div>
                )}

                {/* CONTINUE TO STEP 2 BUTTON */}
                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={!isEmailVerified}
                    className={`px-8 py-4 font-headline font-black uppercase tracking-widest text-xs transition-all ${isEmailVerified
                        ? 'bg-[#FE4E1A] text-white border-3 border-[#121316] shadow-[6px_6px_0_#121316] hover:bg-[#F4002C] cursor-pointer'
                        : 'bg-gray-300 text-gray-500 border-3 border-gray-400 cursor-not-allowed'
                      }`}
                  >
                    Continue to Step 2 →
                  </button>
                </div>
              </form>
            </div>
            )}

            {/* ════════════════════════════════════════
                STEP 2 ONLY: NAME & PASSWORD
            ════════════════════════════════════════ */}
            {currentStep === 2 && (
              <form onSubmit={handleRegisterSubmit} className="space-y-6">

                {/* BACK TO STEP 1 BUTTON */}
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="text-xs font-headline font-black text-[#4717AE] uppercase tracking-widest hover:underline flex items-center gap-1 mb-2 cursor-pointer"
                >
                  ← Back to Step 1: Email Verification
                </button>

                {/* FULL NAME */}
                <div>
                  <label className="block text-xs font-headline font-black text-[#0F534A] uppercase tracking-widest mb-1.5">
                    Full Name <span className="text-[#F4002C]">*</span>
                  </label>
                  <NeoInput
                    icon={<UserIcon />}
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Vikram Sarabhai"
                    required
                  />
                </div>

                {/* PASSWORD CREATION */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-headline font-black text-[#0F534A] uppercase tracking-widest mb-1.5">
                      Create Password <span className="text-[#F4002C]">*</span>
                    </label>
                    <NeoInput
                      icon={<LockIcon />}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Strong Password"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-headline font-black text-[#0F534A] uppercase tracking-widest mb-1.5">
                      Confirm Password <span className="text-[#F4002C]">*</span>
                    </label>
                    <NeoInput
                      icon={<LockIcon />}
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter Password"
                      required
                    />
                  </div>
                </div>

                {/* PASSWORD REQUIREMENTS METER */}
                <div className="p-4 bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FFDD33] space-y-2">
                  <span className="text-xs font-headline font-black uppercase text-[#0F534A] block mb-1">
                    Security Requirements:
                  </span>
                  <div className={`flex items-center gap-2 text-xs font-headline font-bold ${passwordRules.minLength ? 'text-[#0F534A]' : 'text-gray-400'}`}>
                    <span>{passwordRules.minLength ? "✅" : "○"} At least 8 characters long</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-headline font-bold ${passwordRules.hasUpperLower ? 'text-[#0F534A]' : 'text-gray-400'}`}>
                    <span>{passwordRules.hasUpperLower ? "✅" : "○"} Combination of Uppercase &amp; Lowercase letters</span>
                  </div>
                  <div className={`flex items-center gap-2 text-xs font-headline font-bold ${passwordRules.hasNumber ? 'text-[#0F534A]' : 'text-gray-400'}`}>
                    <span>{passwordRules.hasNumber ? "✅" : "○"} Contains at least one number</span>
                  </div>
                </div>

                {/* STATUTORY CONSENT & AGE ATTESTATION */}
                <div className="p-3.5 bg-[#FFFDF8] border-2 border-[#121316] shadow-[3px_3px_0px_#121316] text-xs space-y-3">
                  <div className="flex items-start gap-2.5">
                    <input
                      id="reg-terms-consent"
                      type="checkbox"
                      required
                      className="w-4 h-4 mt-0.5 accent-[#FE4E1A] cursor-pointer"
                    />
                    <label htmlFor="reg-terms-consent" className="text-[11px] font-sans text-gray-700 leading-snug cursor-pointer">
                      I confirm that I am at least <strong>16 years of age</strong> and agree to the{" "}
                      <Link to="/terms-and-conditions" target="_blank" className="text-[#0F534A] underline font-bold">
                        Terms &amp; Conditions
                      </Link>{" "}
                      and{" "}
                      <Link to="/privacy-policy" target="_blank" className="text-[#0F534A] underline font-bold">
                        Privacy Policy (DPDP Act, 2023)
                      </Link>. If under 18, I confirm that my participation is endorsed by my institution / Faculty Guide and authorized by my parent or legal guardian.
                    </label>
                  </div>

                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-start gap-2.5">
                      <input
                        id="reg-minor-checkbox"
                        type="checkbox"
                        checked={isMinor}
                        onChange={(e) => setIsMinor(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-[#0F534A] cursor-pointer"
                      />
                      <label htmlFor="reg-minor-checkbox" className="text-[11px] font-sans font-bold text-[#0F534A] leading-snug cursor-pointer">
                        I am between 16 and 17 years of age (Minor under DPDP Act, 2023)
                      </label>
                    </div>

                    {isMinor && (
                      <div className="mt-2.5 p-3 bg-white border border-[#121316] shadow-[2px_2px_0px_#FFDD33] space-y-1.5">
                        <label className="text-[10px] font-headline font-black text-[#0F534A] uppercase tracking-wider block">
                          Parent or Legal Guardian Email Address *
                        </label>
                        <input
                          type="email"
                          value={guardianEmail}
                          onChange={(e) => setGuardianEmail(e.target.value)}
                          placeholder="parent.guardian@example.com"
                          required={isMinor}
                          className="w-full px-3 py-2 text-xs font-bold bg-[#FCFBF7] border-2 border-[#121316] focus:outline-none"
                        />
                        <p className="text-[10px] text-gray-500 leading-tight">
                          In compliance with Section 9 of the DPDP Act 2023, an informational notice of account creation will be sent to your guardian.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* FINAL SUBMIT BUTTON */}
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-5 py-3.5 bg-white text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-3 border-[#121316] hover:bg-[#FFDD33] cursor-pointer"
                  >
                    ← Back
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting || !name.trim() || !isPasswordValid || password !== confirmPassword}
                    className={`px-8 py-4 font-headline font-black text-white uppercase tracking-widest text-xs transition-all ${name.trim() && isPasswordValid && password === confirmPassword && !isSubmitting
                        ? 'bg-[#FE4E1A] border-3 border-[#121316] shadow-[6px_6px_0_#121316] hover:bg-[#F4002C] cursor-pointer'
                        : 'bg-gray-400 border-3 border-gray-500 cursor-not-allowed'
                      }`}
                  >
                    {isSubmitting ? "Creating Account..." : "Complete Registration & Launch →"}
                  </button>
                </div>
              </form>
            )}

            {/* FOOTER LINK */}
            <div className="mt-8 pt-5 border-t-3 border-[#121316]/20 text-center">
              <p className="text-xs font-headline font-bold text-[#0F534A]">
                Already have an active account?{" "}
                <Link to="/login" className="text-[#4717AE] underline font-headline font-black hover:text-[#FE4E1A] ml-1">
                  Sign In Here →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <FooterContent />
    </>
  );
}
