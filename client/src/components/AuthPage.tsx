import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import { StarDecoration } from "./icons/StarDecoration";
import { Header } from "../sections/Header";
import imageIcon from "../assets/image.webp";
import image1Icon from "../assets/image1.webp";
import imageCopyIcon from "../assets/imagecopy.webp";
import { UserRole } from "../types";
import { FooterContent } from "../sections/Footer/components/FooterContent";
import CollegeAutocomplete, {
  type CollegeSelection,
} from "./CollegeAutocomplete";

/* ─────────────────────────────────────────────
   SIMPLE SVG ICONS
───────────────────────────────────────────── */
const UserIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const MailIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
const LockIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const BuildingIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M8 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01" />
  </svg>
);
const GoogleIcon = ({ className }: { className?: string }) => (
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
const LinkedInIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      fill="#0A66C2"
    />
  </svg>
);

/* ─────────────────────────────────────────────
   NEO INPUT FIELD
───────────────────────────────────────────── */
interface NeoInputProps {
  icon: React.ReactNode;
  type: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: () => void;
  placeholder: string;
  required?: boolean;
  state?: "default" | "success" | "error";
  rightElement?: React.ReactNode;
}

const NeoInput = ({
  icon,
  type,
  value,
  onChange,
  onBlur,
  placeholder,
  required,
  state = "default",
  rightElement,
}: NeoInputProps) => {
  const borderColor =
    state === "success" ? "#0F534A" : state === "error" ? "#F4002C" : "#0F534A";
  const shadowColor =
    state === "success" ? "#16a34a" : state === "error" ? "#dc2626" : "#FF7F00";

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-dreamxec-primary-purple opacity-60">
        {icon}
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        className={`w-full pl-10 ${rightElement ? "pr-10" : "pr-3"} py-2.5 sm:py-3 text-sm font-medium text-dreamxec-primary-purple bg-white focus:outline-none transition-all`}
        style={{
          border: `3px solid ${borderColor}`,
          boxShadow: `3px 3px 0 ${shadowColor}`,
        }}
      />
      {rightElement && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   PASSWORD RULE ROW
───────────────────────────────────────────── */
const PasswordRule = ({
  met,
  label,
  touched,
  hasValue,
}: {
  met: boolean;
  label: string;
  touched: boolean;
  hasValue: boolean;
}) => (
  <div
    className={`flex items-center gap-1.5 text-xs font-bold ${!touched && !hasValue
        ? "text-gray-400"
        : met
          ? "text-green-600"
          : "text-red-500"
      }`}
  >
    {met ? (
      <svg
        className="w-3.5 h-3.5 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={3}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ) : (
      <svg
        className="w-3.5 h-3.5 flex-shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" strokeWidth={2.5} />
      </svg>
    )}
    <span>{label}</span>
  </div>
);

/* ─────────────────────────────────────────────
   PROPS
───────────────────────────────────────────── */
interface AuthPageProps {
  onLogin: (email: string, password: string, role?: any) => void;
  onSignup?: (
    name: string,
    email: string,
    password: string,
    role?: any,
    institution?: string,
    institutionMeta?: any,
  ) => void;
  onGoogleAuth?: (role?: any) => void;
  onForgotPassword?: (email: string) => void;
  currentUser?: { name: string; role: UserRole } | null;
  onHeaderLogin?: () => void;
  onLogout?: () => void;
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function AuthPage({
  onLogin,
  onSignup,
  onGoogleAuth,
  onForgotPassword,
  currentUser,
  onHeaderLogin,
  onLogout,
}: AuthPageProps) {
  const navigate = useNavigate();
  const [isSignup, setIsSignup] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showBackgroundImages, setShowBackgroundImages] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [passwordTouched, setPasswordTouched] = useState(false);

  const pv = {
    minLength: password.length >= 8,
    hasAlphabet: /[a-zA-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;'/`~]/.test(password),
  };
  const isPasswordValid =
    pv.minLength && pv.hasAlphabet && pv.hasNumber && pv.hasSpecialChar;

  const resetForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPasswordTouched(false);
  };

  useEffect(() => {
    const check = () => setShowBackgroundImages(window.innerWidth > 1360);
    check();
    window.addEventListener("resize", check);

    // Check for error parameter from OAuth redirect
    const urlParams = new URLSearchParams(window.location.search);
    const oauthError = urlParams.get("error");
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      toast.error(decodeURIComponent(oauthError));
      // Clean query string from browser
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return () => window.removeEventListener("resize", check);
  }, []);

  const handleGoogleAuth = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      if (onGoogleAuth) await onGoogleAuth("USER");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Google authentication failed",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      if (isForgotPassword) {
        if (!email.trim()) {
          toast.error("Please enter your email address");
          setIsSubmitting(false);
          return;
        }
        if (onForgotPassword) {
          await onForgotPassword(email);
          setIsForgotPassword(false);
          setEmail("");
        }
      } else if (isSignup) {
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          setIsSubmitting(false);
          return;
        }
        if (!isPasswordValid) {
          toast.error(
            "Password must be at least 8 characters and include alphabets, numbers, and a special character",
          );
          setIsSubmitting(false);
          return;
        }
        if (onSignup) {
          await onSignup(name, email, password);
        }
        resetForm();
        setIsSignup(false);
      } else {
        await onLogin(email, password);
        navigate("/select-profile");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = isForgotPassword
    ? !!email.trim()
    : isSignup
      ? !!(
        name.trim() &&
        email.trim() &&
        isPasswordValid &&
        password === confirmPassword
      )
      : !!(email.trim() && password);

  const pageTitle = isForgotPassword
    ? "Reset Password"
    : isSignup
      ? "Join DreamXec"
      : "Welcome Back";
  const pageSubtitle = isForgotPassword
    ? "Enter your email to receive a reset link"
    : isSignup
      ? "Create an account to start fundraising"
      : "Sign in to your account";

  return (
    <>
      <Header
        currentUser={currentUser}
        onLogin={onHeaderLogin}
        onLogout={onLogout}
      />

      <div className="min-h-screen bg-[#EBE7DF] bg-dot-grid relative overflow-hidden flex items-center justify-center py-6 sm:py-8 px-3 sm:px-4">
        {/* Decorative raw shapes */}
        <div className="hidden lg:block absolute top-20 left-8 pointer-events-none opacity-15">
          <div className="w-14 h-14 border-4 border-dreamxec-orange rotate-12" />
        </div>
        <div className="hidden lg:block absolute bottom-24 right-10 pointer-events-none opacity-15">
          <div className="w-10 h-10 bg-dreamxec-primary-green rotate-45" />
        </div>
        <div className="hidden lg:block absolute top-1/3 left-16 pointer-events-none opacity-10">
          <div className="w-6 h-6 bg-dreamxec-primary-purple" />
        </div>

        {/* Floating background images */}
        {showBackgroundImages && (
          <>
            <div className="absolute top-[12%] left-[2%] -z-20 opacity-70 animate-float-slow pointer-events-none">
              <img
                src={imageIcon}
                alt=""
                className="w-56 lg:w-64 h-auto object-contain"
                style={{
                  animationDelay: "0s",
                  filter: "drop-shadow(0 0 6px rgba(0,0,0,0.1))",
                  maxWidth: "280px",
                }}
              />
            </div>
            <div className="absolute bottom-[8%] left-[3%] -z-20 opacity-65 animate-float-fast pointer-events-none">
              <img
                src={image1Icon}
                alt=""
                className="w-60 lg:w-68 h-auto object-contain"
                style={{
                  animationDelay: "2s",
                  filter: "drop-shadow(0 0 6px rgba(0,0,0,0.1))",
                  maxWidth: "300px",
                }}
              />
            </div>
            <div className="absolute top-[12%] right-[2%] -z-20 opacity-70 animate-float-slow pointer-events-none">
              <img
                src={imageCopyIcon}
                alt=""
                className="w-56 lg:w-64 h-auto object-contain"
                style={{
                  animationDelay: "1.5s",
                  filter: "drop-shadow(0 0 6px rgba(0,0,0,0.1))",
                  maxWidth: "280px",
                }}
              />
            </div>
            <div className="absolute bottom-[8%] right-[3%] -z-20 opacity-65 animate-float-fast pointer-events-none">
              <img
                src={imageIcon}
                alt=""
                className="w-60 lg:w-68 h-auto object-contain"
                style={{
                  animationDelay: "3s",
                  filter: "drop-shadow(0 0 6px rgba(0,0,0,0.1))",
                  maxWidth: "300px",
                }}
              />
            </div>
          </>
        )}

        {/* ── MAIN CARD ── */}
        <div className="w-full max-w-2xl relative z-50 my-4">
          {/* Stacked shadow layers for depth */}
          <div
            className="bg-white relative"
            style={{
              border: "4px solid #0F534A",
              boxShadow: "8px 8px 0 #FE4E1A",
            }}
          >
            {/* Top tricolor bar */}
            <div className="flex h-2">
              <div className="flex-1 bg-dreamxec-primary-orange" />
              <div className="flex-1 bg-white border-y-2 border-dreamxec-primary-green" />
              <div className="flex-1 bg-[#9EFC5F]" />
            </div>

            <div className="p-5 sm:p-7 md:p-9">
              {/* ── Header ── */}
              <div className="text-center mb-6 sm:mb-7">
                <div className="flex items-center justify-center mb-2">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
                    {pageTitle}
                  </h1>
                </div>
                <p className="text-dreamxec-primary-purple/70 text-sm sm:text-base font-bold">
                  {pageSubtitle}
                </p>
              </div>



              {/* ── Social Auth ── */}
              {!isForgotPassword && onGoogleAuth && (
                <div className="mb-5 sm:mb-6">
                  {/* Divider */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-0.5 bg-dreamxec-primary-purple/20" />
                    <span className="text-[10px] sm:text-xs font-black text-dreamxec-primary-purple/50 uppercase tracking-widest">
                      Continue with
                    </span>
                    <div className="flex-1 h-0.5 bg-dreamxec-primary-purple/20" />
                  </div>

                  <div className="flex justify-center max-w-xs mx-auto mb-5">
                    {onGoogleAuth && (
                      <button
                        type="button"
                        onClick={handleGoogleAuth}
                        disabled={isSubmitting}
                        className="w-full flex items-center justify-center gap-2 py-2.5 font-black text-xs sm:text-sm text-dreamxec-primary-purple uppercase tracking-wide bg-white transition-all hover:translate-x-[-1px] hover:translate-y-[-1px] disabled:opacity-50"
                        style={{
                          border: "3px solid #0F534A",
                          boxShadow: "3px 3px 0 #0F534A",
                        }}
                      >
                        <GoogleIcon className="w-4 h-4" />
                        Google
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-0.5 bg-dreamxec-primary-purple/20" />
                    <span className="text-[10px] sm:text-xs font-black text-dreamxec-primary-purple/50 uppercase tracking-widest">
                      Or use email
                    </span>
                    <div className="flex-1 h-0.5 bg-dreamxec-primary-purple/20" />
                  </div>
                </div>
              )}

              {/* ── Success Message ── */}
              {successMessage && (
                <div
                  className="mb-4 p-3 flex items-center gap-2 bg-green-50 text-green-800 text-sm font-bold"
                  style={{
                    border: "3px solid #16a34a",
                    boxShadow: "3px 3px 0 #16a34a",
                  }}
                >
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  {successMessage}
                </div>
              )}

              {/* ── FORM ── */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  {isSignup && (
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-black text-dreamxec-primary-purple uppercase tracking-widest mb-2">
                        Full Name <span className="text-red-600">*</span>
                      </label>
                      <NeoInput
                        icon={<UserIcon className="w-4 h-4" />}
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                        required
                      />
                    </div>
                  )}

                  {/* Email */}
                  <div className={isSignup ? "sm:col-span-1" : "sm:col-span-2"}>
                    <label className="block text-xs font-black text-dreamxec-primary-purple uppercase tracking-widest mb-2">
                      Email Address <span className="text-red-600">*</span>
                    </label>
                    <NeoInput
                      icon={<MailIcon className="w-4 h-4" />}
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  {/* Password */}
                  {!isForgotPassword && (
                    <div
                      className={isSignup ? "sm:col-span-1" : "sm:col-span-2"}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-black text-dreamxec-primary-purple uppercase tracking-widest">
                          Password <span className="text-red-600">*</span>
                        </label>
                        {!isSignup && onForgotPassword && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsForgotPassword(true);
                              setError("");
                            }}
                            className="text-[10px] sm:text-xs font-black text-dreamxec-orange hover:text-dreamxec-primary-green transition-colors uppercase tracking-wide underline"
                          >
                            Forgot?
                          </button>
                        )}
                      </div>
                      <NeoInput
                        icon={<LockIcon className="w-4 h-4" />}
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={() => isSignup && setPasswordTouched(true)}
                        placeholder={
                          isSignup ? "Create strong password" : "Your password"
                        }
                        required
                        state={
                          isSignup && passwordTouched && !isPasswordValid
                            ? "error"
                            : isSignup && passwordTouched && isPasswordValid
                              ? "success"
                              : "default"
                        }
                        rightElement={
                          <button
                            type="button"
                            id="toggle-password-visibility"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="p-1 text-dreamxec-primary-purple/70 hover:text-dreamxec-primary-purple focus:outline-none transition-colors cursor-pointer"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            title={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        }
                      />
                      {/* Password rules */}
                      {isSignup && (
                        <div
                          className="mt-2.5 p-2.5 bg-gray-50"
                          style={{ border: "2px dashed #003366" }}
                        >
                          <p className="text-[10px] font-black text-dreamxec-primary-purple/60 uppercase tracking-widest mb-1.5">
                            Must include:
                          </p>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                            <PasswordRule
                              met={pv.minLength}
                              label="8+ chars"
                              touched={passwordTouched}
                              hasValue={!!password}
                            />
                            <PasswordRule
                              met={pv.hasAlphabet}
                              label="1+ letter"
                              touched={passwordTouched}
                              hasValue={!!password}
                            />
                            <PasswordRule
                              met={pv.hasNumber}
                              label="1+ number"
                              touched={passwordTouched}
                              hasValue={!!password}
                            />
                            <PasswordRule
                              met={pv.hasSpecialChar}
                              label="1+ special (!@#)"
                              touched={passwordTouched}
                              hasValue={!!password}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Confirm Password */}
                  {isSignup && (
                    <div className="sm:col-span-1">
                      <label className="block text-xs font-black text-dreamxec-primary-purple uppercase tracking-widest mb-2">
                        Confirm Password <span className="text-red-600">*</span>
                      </label>
                      <NeoInput
                        icon={<LockIcon className="w-4 h-4" />}
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        required
                        state={
                          confirmPassword && password !== confirmPassword
                            ? "error"
                            : confirmPassword && password === confirmPassword
                              ? "success"
                              : "default"
                        }
                        rightElement={
                          <button
                            type="button"
                            id="toggle-confirm-password-visibility"
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            className="p-1 text-dreamxec-primary-purple/70 hover:text-dreamxec-primary-purple focus:outline-none transition-colors cursor-pointer"
                            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                            title={showConfirmPassword ? "Hide password" : "Show password"}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        }
                      />
                      {confirmPassword && (
                        <div
                          className={`mt-1.5 flex items-center gap-1.5 text-xs font-bold ${password === confirmPassword ? "text-green-600" : "text-red-500"}`}
                        >
                          {password === confirmPassword ? (
                            <>
                              <svg
                                className="w-3.5 h-3.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              <span>Passwords match</span>
                            </>
                          ) : (
                            <>
                              <svg
                                className="w-3.5 h-3.5 flex-shrink-0"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                              <span>Do not match</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!isFormValid || isSubmitting}
                    className="w-full py-3 sm:py-3.5 font-black text-white uppercase tracking-widest text-sm sm:text-base transition-all"
                    style={{
                      background:
                        !isFormValid || isSubmitting
                          ? "#cbd5e1"
                          : "#FE4E1A",
                      border: "3px solid #0F534A",
                      boxShadow:
                        !isFormValid || isSubmitting
                          ? "2px 2px 0 #0F534A"
                          : "4px 4px 0 #0F534A",
                      cursor:
                        !isFormValid || isSubmitting
                          ? "not-allowed"
                          : "pointer",
                      opacity: isSubmitting ? 0.75 : 1,
                    }}
                  >
                    {isSubmitting
                      ? "⏳ Please wait..."
                      : isForgotPassword
                        ? "Send Reset Link"
                        : isSignup
                          ? "Create Account →"
                          : "Sign In →"}
                  </button>
                </div>
              </form>

              {/* ── Toggle Sign In / Sign Up ── */}
              <div className="mt-5 text-center">
                {isForgotPassword ? (
                  <p className="text-dreamxec-primary-purple text-sm font-bold">
                    Remember your password?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(false);
                        setError("");
                        setEmail("");
                      }}
                      className="text-dreamxec-orange hover:text-dreamxec-primary-green transition-colors underline font-black"
                    >
                      Back to Sign In
                    </button>
                  </p>
                ) : (
                  <p className="text-dreamxec-primary-purple text-sm font-bold">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => navigate("/register")}
                      className="text-dreamxec-orange hover:text-dreamxec-primary-green transition-colors underline font-black"
                    >
                      Sign Up →
                    </button>
                  </p>
                )}
              </div>

              {/* ── Bottom tricolor divider ── */}
              <div className="mt-5 mb-3 flex h-1">
                <div className="flex-1 bg-[#FF7F00]" />
                <div className="flex-1 bg-[#003366]" />
                <div className="flex-1 bg-[#0B9C2C]" />
              </div>

              {/* Footer note */}
              <p className="text-center text-xs font-bold text-dreamxec-primary-purple/50 uppercase tracking-wide">
                🚀 Unified Access to DreamXec Innovation, Campaigns &amp; Governance
              </p>
            </div>
          </div>
        </div>
      </div>

      <FooterContent />
    </>
  );
}
