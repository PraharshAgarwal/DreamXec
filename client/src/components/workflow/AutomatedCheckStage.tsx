import React, { useState } from "react";
import { sendOTP, verifyOTP } from "../../services/authService";

interface AutomatedCheckStageProps {
  validators?: string[];
  domainPattern?: string;
  email?: string;
  orgName?: string;
  onVerified?: (email: string) => void;
}

export const AutomatedCheckStage: React.FC<AutomatedCheckStageProps> = ({
  email: initialEmail = "",
  orgName = "",
  domainPattern,
  onVerified,
}) => {
  const [instEmail, setInstEmail] = useState(initialEmail);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSendMail = async () => {
    if (!instEmail.trim() || !instEmail.includes("@")) {
      setError("Please enter a valid institutional email address.");
      return;
    }

    if (domainPattern) {
      const cleanDomain = domainPattern.startsWith('@') ? domainPattern : `@${domainPattern}`;
      if (!instEmail.toLowerCase().endsWith(cleanDomain.toLowerCase())) {
        setError(`Email must belong to the permitted domain: ${cleanDomain}`);
        return;
      }
    }

    setError("");
    setSending(true);
    setMessage("");

    try {
      const res = await sendOTP(instEmail);
      setOtpSent(true);
      setMessage(`Verification OTP sent to ${instEmail}. Check your inbox or console.`);
      console.log(`📩 [Institutional Email Verification Mail Sent]: to ${instEmail}`);
    } catch (err: any) {
      console.error("Failed to send institutional email verification:", err);
      setError(err?.message || "Failed to send verification email. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyMail = async (codeToVerify?: string) => {
    const code = (typeof codeToVerify === "string" ? codeToVerify : otpCode).trim();
    if (!code || code.length < 6) {
      setError("Please enter the 6-digit OTP verification code.");
      return;
    }

    setError("");
    setVerifying(true);

    try {
      await verifyOTP(instEmail, code);
      setIsVerified(true);
      if (onVerified) onVerified(instEmail);
      console.log(`🤖 [Automated Verification Engine]: Institutional email domain ${instEmail} verified via mail OTP!`);
    } catch (err: any) {
      console.error("Institutional email OTP verification failed:", err);
      setError(err?.message || "Incorrect verification code. Please check and try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtpCode(val);
    if (val.length === 6 && !verifying && !isVerified) {
      handleVerifyMail(val);
    }
  };

  if (isVerified) {
    return (
      <div className="p-3 bg-[#0B9C2C]/10 flex items-center justify-between" style={{ border: "2px solid #0B9C2C" }}>
        <div className="flex items-center gap-2">
          <span className="text-sm">📧</span>
          <div>
            <span className="font-black text-xs text-[#003366] block">
              Official Institutional Email Verified ({orgName})
            </span>
            <span className="text-[11px] font-mono text-[#003366]/70">{instEmail}</span>
          </div>
        </div>
        <span className="px-2.5 py-1 text-[10px] font-black bg-[#0B9C2C] text-white">
          ✓ DOMAIN MAIL VERIFIED
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 bg-amber-50 space-y-3" style={{ border: "2px solid #003366" }}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-black text-xs text-[#003366] uppercase">
            📧 Institutional Email Verification for {orgName}
          </h4>
          <p className="text-[11px] font-medium text-[#003366]/70">
            Verify your official organizational email address via OTP mail verification.
          </p>
        </div>
        <span className="text-[10px] font-black bg-[#FF7F00] text-white px-2 py-0.5">
          REQUIRED MAIL VERIFICATION
        </span>
      </div>

      {error && (
        <div className="p-2 bg-red-50 text-red-700 text-xs font-bold" style={{ border: "1px solid #dc2626" }}>
          ⚠️ {error}
        </div>
      )}

      {message && (
        <div className="p-2 bg-green-50 text-green-800 text-xs font-bold" style={{ border: "1px solid #0B9C2C" }}>
          ✅ {message}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="email"
          value={instEmail}
          onChange={(e) => setInstEmail(e.target.value)}
          placeholder="your.name@institution.edu"
          className="flex-1 px-3 py-2 text-xs font-medium text-[#003366] bg-white focus:outline-none"
          style={{ border: "2px solid #003366" }}
        />
        <button
          type="button"
          onClick={handleSendMail}
          disabled={sending}
          className="px-4 py-2 font-black text-xs text-white bg-[#FF7F00] uppercase tracking-wider hover:bg-dreamxec-orange transition-all"
          style={{ border: "2px solid #003366" }}
        >
          {sending ? "Sending..." : "Send Verification Mail"}
        </button>
      </div>

      {otpSent && (
        <div className="p-3 bg-white space-y-2" style={{ border: "2px solid #003366" }}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black text-[#003366] uppercase">
              Enter 6-Digit Mail Verification Code
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={handleOtpChange}
              placeholder="6-Digit Code"
              className="flex-1 px-3 py-2 text-xs font-mono font-black text-[#003366] bg-white tracking-widest"
              style={{ border: "2px solid #003366" }}
            />
            <button
              type="button"
              onClick={() => handleVerifyMail()}
              disabled={verifying || otpCode.length < 6}
              className="px-4 py-2 font-black text-xs text-white bg-[#0B9C2C] uppercase tracking-wider disabled:opacity-50"
              style={{ border: "2px solid #003366" }}
            >
              {verifying ? "Verifying..." : "Verify Domain Mail ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
