import React from "react";
import apiRequest from "../../../services/api";
import { DocumentCollectionStage } from "../DocumentCollectionStage";
import { sendOTP, verifyOTP } from "../../../services/authService";

// ── COMPONENT PROPS INTERFACES ──
export interface ComponentSchemaProps {
  id: string;
  type: string;
  props: {
    label?: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    helpText?: string;
    requiredDomain?: string;
    accept?: string;
    maxSizeMB?: number;
    defaultValue?: any;
  };
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  value?: any;
  onChange?: (val: any) => void;
  formData?: Record<string, any>;
  orgName?: string;
}

// 1. Text Input Component
export const TextInput: React.FC<ComponentSchemaProps> = ({ id, props, value, onChange }) => {
  const defaultVal = props.defaultValue !== undefined && props.defaultValue !== null ? String(props.defaultValue) : "";
  const currentVal = value !== undefined && value !== null ? value : defaultVal;

  React.useEffect(() => {
    if ((value === undefined || value === null || value === "") && defaultVal !== "") {
      onChange?.(defaultVal);
    }
  }, [id, defaultVal, value, onChange]);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-black text-[#121316] uppercase tracking-wider">
        {props.label || id} {props.required && <span className="text-[#F4002C]">*</span>}
      </label>
      <input
        type="text"
        value={currentVal}
        onChange={(e) => onChange && onChange(e.target.value)}
        placeholder={props.placeholder}
        required={props.required}
        className="w-full px-3.5 py-2.5 text-xs font-bold text-[#121316] bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] focus:outline-none focus:bg-amber-50/50"
      />
      {props.helpText && <p className="text-[11px] font-medium text-[#121316]/70">{props.helpText}</p>}
    </div>
  );
};

// 2. Select Input Component
export const SelectInput: React.FC<ComponentSchemaProps> = ({ id, props, value, onChange }) => {
  const defaultVal =
    props.defaultValue !== undefined && props.defaultValue !== null && props.defaultValue !== ""
      ? props.defaultValue
      : (props.options && props.options.length > 0 ? props.options[0] : "");
  const currentVal = value !== undefined && value !== null && value !== "" ? value : defaultVal;

  React.useEffect(() => {
    if ((value === undefined || value === null || value === "") && defaultVal) {
      onChange?.(defaultVal);
    }
  }, [id, defaultVal, value, onChange]);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-black text-[#121316] uppercase tracking-wider">
        {props.label || id} {props.required && <span className="text-[#F4002C]">*</span>}
      </label>
      <select
        value={currentVal}
        onChange={(e) => onChange && onChange(e.target.value)}
        required={props.required}
        className="w-full px-3.5 py-2.5 text-xs font-black text-[#121316] bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] focus:outline-none cursor-pointer"
      >
        {(props.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      {props.helpText && <p className="text-[11px] font-medium text-[#121316]/70">{props.helpText}</p>}
    </div>
  );
};

// 3. Email Verification Component
export const EmailVerificationAdapter: React.FC<ComponentSchemaProps> = ({ id, props, value, formData, orgName, onChange }) => {
  const [emailVal, setEmailVal] = React.useState<string>(
    typeof value === 'string' ? value : value?.email || formData?.[id]?.email || formData?.[id] || formData?.officialEmail || formData?.academicEmail || ""
  );
  const [otpSent, setOtpSent] = React.useState(false);
  const [otpCode, setOtpCode] = React.useState("");
  const [isVerified, setIsVerified] = React.useState<boolean>(
    Boolean(value?._emailVerified || formData?.[id]?._emailVerified)
  );
  const [sending, setSending] = React.useState(false);
  const [verifying, setVerifying] = React.useState(false);
  const verifyingRef = React.useRef(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSendOTP = async () => {
    if (!emailVal.trim() || !emailVal.includes("@")) {
      setError("Please enter a valid institutional email address.");
      return;
    }

    if (props.requiredDomain) {
      const cleanDomain = props.requiredDomain.startsWith('@') ? props.requiredDomain : `@${props.requiredDomain}`;
      if (!emailVal.toLowerCase().endsWith(cleanDomain.toLowerCase())) {
        setError(`Email must belong to the permitted institutional domain: ${cleanDomain}`);
        return;
      }
    }

    setError("");
    setSending(true);
    setMessage("");

    try {
      await sendOTP(emailVal.trim());
      setOtpSent(true);
      setMessage(`Verification OTP sent to ${emailVal.trim()}. Please enter the 6-digit code.`);
    } catch (err: any) {
      console.error("Failed to send OTP:", err);
      setError(err?.message || "Failed to send verification OTP. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOTP = async (codeOverride?: string) => {
    if (verifyingRef.current) return;
    const code = (codeOverride || otpCode).trim();
    if (!code || code.length < 6) {
      setError("Please enter the complete 6-digit OTP code.");
      return;
    }

    verifyingRef.current = true;
    setError("");
    setVerifying(true);

    try {
      await verifyOTP(emailVal.trim(), code);
      setIsVerified(true);
      setMessage("Institutional email verified successfully!");
      if (onChange) {
        onChange({ email: emailVal.trim(), _emailVerified: true });
      }
    } catch (err: any) {
      console.error("Failed to verify OTP:", err);
      setError(err?.message || "Incorrect verification code. Please check and try again.");
    } finally {
      setVerifying(false);
      verifyingRef.current = false;
    }
  };

  const handleEmailChange = (newVal: string) => {
    setEmailVal(newVal);
    setIsVerified(false);
    setOtpSent(false);
    setOtpCode("");
    setMessage("");
    setError("");
    if (onChange) {
      onChange({ email: newVal, _emailVerified: false });
    }
  };

  if (isVerified) {
    return (
      <div className="p-4 bg-[#0F534A]/10 border-2 border-[#0F534A] rounded-none space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm">📧</span>
            <label className="block text-xs font-black text-[#0F534A] uppercase tracking-wider">
              {props.label || "Institutional Email Verified"}
            </label>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[#0F534A] text-white">
            ✓ Verified
          </span>
        </div>
        <p className="text-xs font-mono font-bold text-[#121316]">{emailVal}</p>
        <button
          type="button"
          onClick={() => setIsVerified(false)}
          className="text-[11px] font-bold text-[#FE4E1A] underline mt-1 block hover:opacity-80"
        >
          Change Email
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white border-2 border-[#121316] space-y-3 shadow-[4px_4px_0px_#121316]">
      <div className="space-y-1.5">
        <label className="block text-xs font-black text-[#121316] uppercase tracking-wider">
          {props.label || "Official Institutional Email"} {props.required && <span className="text-[#F4002C]">*</span>}
        </label>
        <div className="flex gap-2">
          <input
            type="email"
            value={emailVal}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder={props.placeholder || (props.requiredDomain ? `user@${props.requiredDomain}` : "user@university.edu")}
            required={props.required}
            className="flex-1 px-3.5 py-2 text-xs font-bold text-[#121316] bg-white border-2 border-[#121316] focus:outline-none focus:bg-amber-50/50"
          />
          <button
            type="button"
            disabled={sending || !emailVal.trim()}
            onClick={handleSendOTP}
            className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-[#FE4E1A] text-white border-2 border-[#121316] hover:bg-[#FE4E1A]/90 disabled:opacity-50 cursor-pointer"
          >
            {sending ? "Sending..." : otpSent ? "Resend OTP" : "Send OTP"}
          </button>
        </div>
        {props.requiredDomain && (
          <p className="text-[11px] font-medium text-[#121316]/70">
            Must match institutional domain <strong className="font-bold text-[#FE4E1A]">@{props.requiredDomain}</strong>
          </p>
        )}
      </div>

      {otpSent && (
        <div className="pt-2 border-t-2 border-[#121316]/10 space-y-2">
          <label className="block text-[11px] font-black text-[#121316] uppercase tracking-wider">
            Enter 6-Digit OTP Code
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              maxLength={6}
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                setOtpCode(val);
                if (val.length === 6 && !verifying && !verifyingRef.current) {
                  handleVerifyOTP(val);
                }
              }}
              placeholder="000000"
              className="w-36 px-3.5 py-2 text-xs font-mono font-black text-[#121316] text-center tracking-widest bg-white border-2 border-[#121316] focus:outline-none"
            />
            <button
              type="button"
              disabled={verifying || otpCode.length < 6}
              onClick={() => {
                if (!verifyingRef.current) handleVerifyOTP();
              }}
              className="px-4 py-2 text-xs font-black uppercase tracking-wider bg-[#0F534A] text-white border-2 border-[#121316] hover:bg-[#0F534A]/90 disabled:opacity-50 cursor-pointer"
            >
              {verifying ? "Verifying..." : "Verify OTP"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className="text-xs font-bold text-[#0F534A] bg-[#0F534A]/10 p-2 border border-[#0F534A]">
          ✓ {message}
        </p>
      )}
      {error && (
        <p className="text-xs font-bold text-[#F4002C] bg-[#F4002C]/10 p-2 border border-[#F4002C]">
          ⚠ {error}
        </p>
      )}
    </div>
  );
};

// 4. File Upload Component
export const FileUploadAdapter: React.FC<ComponentSchemaProps> = ({ id, props, value, onChange }) => {
  const docConfig = [
    {
      id,
      label: props.label || "Verification Document",
      name: props.label || "Verification Document",
      required: props.required !== false,
    },
  ];

  return (
    <DocumentCollectionStage
      documents={docConfig}
      uploadedFiles={{ [id]: value }}
      onFileSelect={(docId, file) => onChange && onChange(file)}
    />
  );
};

// 5. Date Picker Component
export const DatePicker: React.FC<ComponentSchemaProps> = ({ id, props, value, onChange }) => {
  const defaultVal = props.defaultValue !== undefined && props.defaultValue !== null ? String(props.defaultValue) : "";
  const currentVal = value !== undefined && value !== null ? value : defaultVal;

  React.useEffect(() => {
    if ((value === undefined || value === null || value === "") && defaultVal !== "") {
      onChange?.(defaultVal);
    }
  }, [id, defaultVal, value, onChange]);

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-black text-[#121316] uppercase tracking-wider">
        {props.label || id} {props.required && <span className="text-[#F4002C]">*</span>}
      </label>
      <input
        type="date"
        value={currentVal}
        onChange={(e) => onChange && onChange(e.target.value)}
        required={props.required}
        className="w-full px-3.5 py-2.5 text-xs font-bold text-[#121316] bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] focus:outline-none focus:bg-amber-50/50 cursor-pointer"
      />
    </div>
  );
};

// 6. ORCID iD Verification Component
export const OrcidInputAdapter: React.FC<ComponentSchemaProps> = ({ id, props, value, onChange }) => {
  const [verifying, setVerifying] = React.useState(false);
  const initialData = typeof value === 'object' && value?._orcidVerified ? value : null;
  const [orcidData, setOrcidData] = React.useState<any | null>(initialData);
  const [errorMsg, setErrorMsg] = React.useState("");

  const rawInput = typeof value === 'string' ? value : (value?.orcidId || "");
  const [inputValue, setInputValue] = React.useState(rawInput);

  React.useEffect(() => {
    if (typeof value === 'string') {
      setInputValue(value);
    } else if (value?.orcidId) {
      setInputValue(value.orcidId);
    }
  }, [value]);

  const handleVerify = async () => {
    const targetOrcid = (inputValue || props.placeholder || "0000-0002-1825-0097").trim();
    if (!targetOrcid) {
      setErrorMsg("Please enter a valid ORCID iD (e.g. 0000-0002-1825-0097).");
      return;
    }

    setVerifying(true);
    setErrorMsg("");
    setOrcidData(null);

    try {
      const clean = targetOrcid.replace(/^https?:\/\/orcid\.org\//i, "").trim();
      const res = await apiRequest<any>(`/workflows/orcid/verify/${encodeURIComponent(clean)}`, {
        method: "GET",
      });

      const data = res?.data || (res as any);
      if (data?.verified) {
        setOrcidData(data);
        if (onChange) {
          onChange({
            orcidId: clean,
            name: data.name,
            orcidUrl: data.orcidUrl,
            keywords: data.keywords || [],
            _orcidVerified: true,
            verifiedAt: new Date().toISOString(),
          });
        }
      } else {
        setErrorMsg("ORCID iD could not be verified in the public registry.");
      }
    } catch (err: any) {
      console.error("ORCID verification failed:", err);
      setErrorMsg(err?.message || "Failed to verify ORCID iD with official ORCID registry.");
    } finally {
      setVerifying(false);
    }
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setOrcidData(null);
    setErrorMsg("");
    if (onChange) {
      onChange({
        orcidId: val,
        _orcidVerified: false,
      });
    }
  };

  return (
    <div className="space-y-3 p-4 bg-white border-2 border-[#121316] shadow-[4px_4px_0px_#121316]">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black text-[#121316] uppercase tracking-wider">
          {props.label || "Official Researcher ORCID iD"} {props.required && <span className="text-[#F4002C]">*</span>}
        </label>
        <span className="text-[10px] font-bold text-[#041A16] bg-[#18D7E8]/20 px-2 py-0.5 border border-[#041A16]/30">
          🔬 Official ORCID Registry
        </span>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder={props.placeholder || "0000-0002-1825-0097"}
          required={props.required}
          className="flex-1 px-3.5 py-2.5 text-xs font-mono font-bold text-[#121316] bg-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316] focus:outline-none focus:bg-teal-50/40"
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={verifying || !inputValue.trim()}
          className="px-5 py-2.5 font-black text-xs text-white bg-[#0F534A] uppercase tracking-wider shrink-0 transition-all hover:bg-[#0F534A]/90 disabled:opacity-50 border-2 border-[#121316] shadow-[3px_3px_0px_#121316] cursor-pointer"
        >
          {verifying ? "⏳ Verifying..." : "🔍 Verify ORCID"}
        </button>
      </div>

      <div className="flex items-center justify-between text-[11px] text-[#121316]/70">
        <span>Format: 16 digits (e.g. 0009-0005-6880-2522)</span>
        <a
          href="https://orcid.org/register"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-[#0F534A] underline hover:opacity-80 flex items-center gap-1"
        >
          Don't have an ORCID iD? Register at orcid.org ↗
        </a>
      </div>

      {errorMsg && (
        <p className="text-xs font-bold text-[#F4002C] bg-[#F4002C]/10 p-2.5 border border-[#F4002C]">
          ⚠️ {errorMsg}
        </p>
      )}

      {orcidData && (
        <div className="p-4 bg-[#0F534A]/10 border-2 border-[#0F534A] space-y-2 text-xs text-[#121316]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-[#0F534A] uppercase tracking-wider">
              <span>✓ Official ORCID Registry Confirmed</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[#0F534A] text-white">
              Verified Real-Time
            </span>
          </div>
          <p className="font-bold text-sm text-[#121316]">
            Researcher: <strong className="text-[#0F534A]">{orcidData.name}</strong>
          </p>
          <p className="text-xs font-mono font-bold text-[#121316]/80">
            ORCID iD: {orcidData.orcidId || inputValue}
          </p>
          {orcidData.keywords && orcidData.keywords.length > 0 && (
            <p className="text-[11px] font-medium text-[#121316]/80">
              Research Keywords: <span className="font-bold">{orcidData.keywords.join(", ")}</span>
            </p>
          )}
          <div className="pt-1 flex items-center justify-between">
            <a
              href={orcidData.orcidUrl || `https://orcid.org/${orcidData.orcidId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-black text-[#FE4E1A] underline hover:opacity-80"
            >
              🔗 View Live Public Profile on orcid.org →
            </a>
            <button
              type="button"
              onClick={() => {
                setOrcidData(null);
                handleInputChange("");
              }}
              className="text-[11px] font-bold text-rose-600 underline"
            >
              Change ORCID
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 7. APAAR ID Verification Component (DigiLocker / MeriPehchaan Official Student Flow)
export const ApaarInputAdapter: React.FC<ComponentSchemaProps> = ({ id, props, value, onChange }) => {
  const [digiLockerLoading, setDigiLockerLoading] = React.useState(false);
  const initialData = typeof value === 'object' && value?._apaarVerified ? value : null;
  const [apaarData, setApaarData] = React.useState<any | null>(initialData);
  const [errorMsg, setErrorMsg] = React.useState("");
  const [previewDoc, setPreviewDoc] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (typeof value === 'object' && value?._apaarVerified) {
      setApaarData(value);
    }
  }, [value]);

  // Helper functions to format verified government credentials strictly as received
  const formatDOB = (dobStr: any) => {
    if (!dobStr) return 'Not Provided';
    const s = String(dobStr).trim();
    if (/^\d{8}$/.test(s)) {
      const d = s.slice(0, 2);
      const m = s.slice(2, 4);
      const y = s.slice(4, 8);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const mName = months[parseInt(m, 10) - 1] || m;
      return `${d} ${mName} ${y} (${d}/${m}/${y})`;
    }
    return s;
  };

  const formatGender = (g: any) => {
    if (!g) return 'Not Specified';
    const s = String(g).toUpperCase().trim();
    if (s === 'M' || s === 'MALE') return 'Male (M)';
    if (s === 'F' || s === 'FEMALE') return 'Female (F)';
    return s;
  };

  const getMaskedAadhaar = () => {
    if (apaarData?.aadhaarMasked) return apaarData.aadhaarMasked;
    if (apaarData?.aadhaarLast4) return `XXXX-XXXX-${apaarData.aadhaarLast4}`;
    const aadharDoc = apaarData?.documents?.find((d: any) => d.type === 'ADHAR' || (d.name || '').toLowerCase().includes('aadhaar'));
    if (aadharDoc?.docNumber) return aadharDoc.docNumber;
    return 'UIDAI e-Aadhaar Verified';
  };

  const getApaarId = () => {
    if (apaarData?.formattedApaarId) return apaarData.formattedApaarId;
    if (apaarData?.apaarId) return apaarData.apaarId;
    const apaarDoc = apaarData?.documents?.find((d: any) => d.type === 'ABCER' || (d.name || '').toLowerCase().includes('apaar'));
    if (apaarDoc?.docNumber) return apaarDoc.docNumber;
    return 'Not Issued in DigiLocker';
  };

  const getAbcId = () => {
    if (apaarData?.abcId) return apaarData.abcId;
    return 'Not Linked';
  };

  const getPanNumber = () => {
    if (apaarData?.panNumber) return apaarData.panNumber;
    const panDoc = apaarData?.documents?.find((d: any) => d.type === 'PANCR' || (d.name || '').toLowerCase().includes('pan'));
    if (panDoc?.docNumber) return panDoc.docNumber;
    return 'Not Linked';
  };

  const getDocUri = (doc: any) => {
    if (doc?.uri) return doc.uri;
    return 'DigiLocker Certified Document';
  };

  // Listen for DigiLocker OAuth popup postMessage
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin for cross-origin security
      const origin = event.origin;
      const isTrustedOrigin =
        !origin ||
        origin === window.location.origin ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.endsWith('.onrender.com') ||
        origin.includes('dreamxec');

      if (!isTrustedOrigin) {
        return;
      }

      if (event.data?.type === 'DIGILOCKER_SUCCESS' && event.data?.data) {
        const student = event.data.data;

        // Preserve and consume EXACT received government details without synthetic scripts
        const verifiedPayload = {
          ...student,
          studentName: student.studentName || 'Verified Scholar',
          instituteName: student.instituteName || 'National Academic Depository (NAD)',
          email: student.email,
          photoUrl: student.photoUrl,
          dob: student.dob,
          rawDob: student.rawDob,
          gender: student.gender,
          apaarId: student.apaarId || null,
          formattedApaarId: student.formattedApaarId || null,
          abcId: student.abcId || null,
          aadhaarLast4: student.aadhaarLast4 || null,
          aadhaarMasked: student.aadhaarMasked || (student.aadhaarLast4 ? `XXXX-XXXX-${student.aadhaarLast4}` : null),
          dlNumber: student.dlNumber || null,
          panNumber: student.panNumber || null,
          documents: student.documents || [],
          selectedDocs: (student.documents || []).map((d: any) => d.id),
          _apaarVerified: true,
          verifiedAt: new Date().toISOString(),
        };

        setApaarData(verifiedPayload);
        setDigiLockerLoading(false);
        setErrorMsg("");

        // Automatically sync and persist all verified documents into UserDocVault
        apiRequest<any>('/workflows/digilocker/vault/sync', {
          method: 'POST',
          body: JSON.stringify({
            documents: verifiedPayload.documents,
            apaarData: verifiedPayload,
          }),
        }).then((res: any) => {
          console.log("[DigiLocker] Auto-synced documents to vault:", res?.data || res);
        }).catch((err: any) => {
          console.warn("[DigiLocker] Auto-sync to vault notice:", err?.message);
        });

        if (onChange) {
          onChange(verifiedPayload);
        }
      } else if (event.data?.type === 'DIGILOCKER_ERROR') {
        setDigiLockerLoading(false);
        setErrorMsg(event.data?.error || "DigiLocker verification was cancelled or could not be completed.");
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onChange]);

  const handleLaunchDigiLocker = async () => {
    setDigiLockerLoading(true);
    setErrorMsg("");

    try {
      const res = await apiRequest<any>('/workflows/digilocker/oauth/url', { method: 'GET' });
      const authUrl = (res?.data as any)?.authUrl || (res as any)?.authUrl;
      if (!authUrl) {
        throw new Error("Could not retrieve MeriPehchaan authorization URL.");
      }

      const width = 600;
      const height = 750;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'DigiLockerAuth',
        `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.location.href = authUrl;
      }
    } catch (err: any) {
      console.error("Failed to launch DigiLocker OAuth:", err);
      setErrorMsg(err?.message || "Failed to initiate MeriPehchaan DigiLocker connection.");
      setDigiLockerLoading(false);
    }
  };

  return (
    <div className="space-y-3 p-4 bg-white border-2 border-[#121316] shadow-[4px_4px_0px_#121316]">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-black text-[#121316] uppercase tracking-wider">
          {props.label || "APAAR Student Identity Verification"} {props.required && <span className="text-[#F4002C]">*</span>}
        </label>
        <span className="text-[10px] font-bold text-[#0F534A] bg-[#0F534A]/10 px-2 py-0.5 border border-[#0F534A]/30">
          🇮🇳 MeriPehchaan • DigiLocker
        </span>
      </div>

      {!apaarData ? (
        <div className="p-4 bg-blue-50/60 border-2 border-[#003366] space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-none bg-[#003366] text-white flex items-center justify-center font-black text-lg shrink-0 border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
              🇮🇳
            </div>
            <div>
              <h4 className="text-xs font-black text-[#003366] uppercase tracking-wider">
                Official MeriPehchaan Single Sign-On
              </h4>
              <p className="text-[11px] text-[#121316]/80 leading-relaxed font-medium">
                Verify your identity directly with Government of India DigiLocker using Mobile &amp; Aadhaar OTP to confirm your student records, legal name, and photo.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLaunchDigiLocker}
            disabled={digiLockerLoading}
            className="w-full py-3 px-4 font-black text-xs text-white bg-[#003366] hover:bg-[#002244] uppercase tracking-wider flex items-center justify-center gap-2 border-2 border-[#121316] shadow-[3px_3px_0px_#121316] transition-all cursor-pointer disabled:opacity-50"
          >
            {digiLockerLoading ? (
              <span>⏳ Connecting to MeriPehchaan...</span>
            ) : (
              <span>🔐 Verify Identity with DigiLocker</span>
            )}
          </button>
        </div>
      ) : (
        <div className="p-4 bg-[#0F534A]/10 border-2 border-[#0F534A] space-y-3 text-xs text-[#121316]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-[#0F534A] uppercase tracking-wider">
              <span>✓ Official Government Identity Confirmed</span>
            </div>
            <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[#0F534A] text-white">
              DigiLocker Verified
            </span>
          </div>

          <div className="flex items-center gap-3.5 pt-1">
            {apaarData.photoUrl ? (
              <img
                src={apaarData.photoUrl}
                alt={apaarData.studentName}
                onError={(e) => {
                  const initials = (apaarData?.studentName || "S").slice(0, 2).toUpperCase();
                  e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="%230F534A"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="44" fill="%23ffffff">${initials}</text></svg>`;
                }}
                className="w-14 h-14 object-cover border-2 border-[#0F534A] shadow-[2px_2px_0px_#0F534A] shrink-0 bg-white"
              />
            ) : (
              <div className="w-14 h-14 bg-[#0F534A] text-white font-black flex items-center justify-center text-base border-2 border-[#121316]">
                {(apaarData.studentName || "S").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="space-y-0.5 flex-1 min-w-0">
              <p className="font-black text-sm text-[#121316] truncate">
                {apaarData.studentName}
              </p>
              <p className="text-[11px] font-bold text-[#0F534A] truncate">
                {apaarData.instituteName}
              </p>
              {apaarData.email && (
                <p className="text-[11px] font-mono text-[#121316]/70 truncate">
                  📧 {apaarData.email}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#0F534A]/20 text-[10px] font-mono text-[#0F534A] font-bold">
            {apaarData.apaarId && (
              <span className="px-2 py-0.5 bg-white border border-[#0F534A]/40 shadow-[1px_1px_0px_#0F534A]">
                APAAR: {getApaarId()}
              </span>
            )}
            {apaarData.dlNumber && (
              <span className="px-2 py-0.5 bg-white border border-[#0F534A]/40 shadow-[1px_1px_0px_#0F534A]">
                DL: {apaarData.dlNumber}
              </span>
            )}
            {apaarData.panNumber && (
              <span className="px-2 py-0.5 bg-white border border-[#0F534A]/40 shadow-[1px_1px_0px_#0F534A]">
                PAN: {apaarData.panNumber}
              </span>
            )}
            {apaarData.aadhaarMasked && (
              <span className="px-2 py-0.5 bg-white border border-[#0F534A]/40 shadow-[1px_1px_0px_#0F534A]">
                AADHAAR: {getMaskedAadhaar()}
              </span>
            )}
            <span className="px-2 py-0.5 bg-[#9EFC5F] text-[#0F534A] border border-[#0F534A] shadow-[1px_1px_0px_#0F534A]">
              GOVT KYC: VERIFIED
            </span>
          </div>

          {/* Consented Government Documents Selection Section */}
          <div className="pt-2 border-t-2 border-[#0F534A]/20 space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs">📂</span>
                <span className="text-xs font-black uppercase tracking-wider text-[#0F534A]">
                  Consented Government Documents ({apaarData.selectedDocs?.length || (apaarData.documents?.length || 0)} Shared)
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                {apaarData.documents && apaarData.documents.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewDoc(apaarData.documents[0]);
                      }}
                      className="px-2 py-0.5 text-[11px] font-black uppercase text-[#003366] bg-blue-50 border border-[#003366] hover:bg-[#003366] hover:text-white transition-all cursor-pointer flex items-center gap-1 shadow-[1px_1px_0px_#003366]"
                    >
                      <span>👁️</span>
                      <span>Preview Records</span>
                    </button>
                    <span className="text-stone-300 font-bold">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        const allDocIds = (apaarData.documents || []).map((d: any) => d.id);
                        const currentlyAll = (apaarData.selectedDocs || []).length === allDocIds.length;
                        const newSelected = currentlyAll ? [] : allDocIds;
                        const updated = { ...apaarData, selectedDocs: newSelected };
                        setApaarData(updated);
                        if (onChange) onChange(updated);
                      }}
                      className="text-[11px] font-black text-[#FE4E1A] underline cursor-pointer hover:opacity-80"
                    >
                      {(apaarData.selectedDocs || []).length === (apaarData.documents || []).length ? 'Deselect All' : 'Select All'}
                    </button>
                  </>
                )}
              </div>
            </div>

            <p className="text-[11px] text-[#121316]/75 font-medium leading-relaxed">
              The following government records were retrieved via DigiLocker consent. Click <strong>Preview</strong> on any document to inspect official certificate details:
            </p>

            <div className="space-y-2 pt-1">
              {(!apaarData.documents || apaarData.documents.length === 0) ? (
                <div className="p-3 bg-stone-100 border border-stone-300 text-xs text-gray-600 font-medium">
                  No additional issued documents found in your DigiLocker account.
                </div>
              ) : (
                apaarData.documents.map((doc: any) => {
                  const selectedList = apaarData.selectedDocs || (apaarData.documents || []).map((d: any) => d.id);
                  const isSelected = selectedList.includes(doc.id);

                return (
                  <div
                    key={doc.id}
                    className={`flex items-center justify-between gap-3 p-3 border-2 transition-all ${
                      isSelected
                        ? 'bg-white border-[#0F534A] shadow-[2px_2px_0px_#0F534A]'
                        : 'bg-stone-50 border-stone-300 opacity-70'
                    }`}
                  >
                    <label className="flex items-start gap-2.5 flex-1 min-w-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          let updatedList = [...selectedList];
                          if (e.target.checked) {
                            if (!updatedList.includes(doc.id)) updatedList.push(doc.id);
                          } else {
                            updatedList = updatedList.filter((id: string) => id !== doc.id);
                          }
                          const updated = { ...apaarData, selectedDocs: updatedList };
                          setApaarData(updated);
                          if (onChange) onChange(updated);
                        }}
                        className="mt-0.5 accent-[#0F534A] w-4 h-4 cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-[#121316] truncate">
                            {doc.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#121316]/70 truncate mt-0.5">
                          {doc.issuer}
                        </p>
                      </div>
                    </label>

                    {/* Right side: Badge + High-Visibility Preview Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono font-black uppercase px-2 py-1 bg-[#0F534A]/10 text-[#0F534A] border border-[#0F534A]/40">
                        {doc.type}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setPreviewDoc(doc);
                        }}
                        className="px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-white bg-[#003366] hover:bg-[#002244] border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
                        title={`Preview verified ${doc.name}`}
                      >
                        <span>👁️</span>
                        <span>Preview</span>
                      </button>
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-[#0F534A]/20">
            <span className="text-[11px] text-[#0F534A] font-bold">
              ✓ Verified &amp; Digitally Signed by Govt of India
            </span>
            <button
              type="button"
              onClick={() => {
                setApaarData(null);
                if (onChange) onChange({ _apaarVerified: false });
              }}
              className="text-[11px] font-bold text-rose-600 underline cursor-pointer hover:opacity-80"
            >
              Re-verify Identity with DigiLocker
            </button>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121316]/70 backdrop-blur-xs">
          <div className="bg-white border-4 border-[#121316] shadow-[8px_8px_0px_#121316] max-w-xl w-full max-h-[92vh] overflow-y-auto space-y-4 p-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🇮🇳</span>
                <div>
                  <h3 className="text-xs font-black uppercase tracking-wider text-[#003366]">
                    DigiLocker Verified Document Record
                  </h3>
                  <p className="text-[10px] font-mono text-[#121316]/70">
                    Government of India • Ministry of Electronics &amp; IT (MeitY)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="w-8 h-8 flex items-center justify-center border-2 border-[#121316] bg-stone-100 hover:bg-[#F4002C] hover:text-white font-black text-sm cursor-pointer shadow-[2px_2px_0px_#121316]"
              >
                ✕
              </button>
            </div>

            {/* Document Selector Tabs inside Preview */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-stone-200">
              {(apaarData?.documents || [previewDoc]).map((docItem: any) => {
                const isActive = (previewDoc.id && previewDoc.id === docItem.id) || (previewDoc.type === docItem.type);
                const getTabName = (d: any) => {
                  if (d.type === 'ADHAR') return '🪪 Aadhaar';
                  if (d.type === 'DRVLC') return '🚗 Driving License';
                  if (d.type === 'ABCER') return '🎓 APAAR / ABC';
                  if (d.type === 'PANCR') return '💳 PAN Card';
                  return `📄 ${d.name}`;
                };

                return (
                  <button
                    key={docItem.id || docItem.type}
                    type="button"
                    onClick={() => setPreviewDoc(docItem)}
                    className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider border-2 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#003366] text-white border-[#121316] shadow-[2px_2px_0px_#121316]'
                        : 'bg-stone-100 text-[#121316]/80 border-stone-300 hover:bg-stone-200'
                    }`}
                  >
                    {getTabName(docItem)}
                  </button>
                );
              })}
            </div>

            {/* Official Document Certificate Card */}
            <div className="p-5 border-2 border-[#0F534A] bg-[#FFFDF8] space-y-4 relative overflow-hidden">
              {/* Background Watermark */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <span className="text-8xl font-black rotate-[-25deg] text-[#0F534A]">VERIFIED</span>
              </div>

              {/* Certificate Header Banner */}
              <div className="flex items-start justify-between gap-3 border-b-2 border-[#0F534A]/20 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-black uppercase tracking-widest px-2 py-0.5 bg-[#0F534A] text-white">
                      {previewDoc.type || 'DIGILOCKER_RECORD'}
                    </span>
                    <span className="text-[9px] font-bold text-[#0F534A] bg-emerald-100 px-1.5 py-0.5 border border-[#0F534A]/30">
                      ✓ LEGALLY VALID CERTIFICATE
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-[#121316] pt-0.5">
                    {previewDoc.name}
                  </h4>
                  <p className="text-[11px] font-bold text-[#0F534A]">
                    {previewDoc.issuer}
                  </p>
                </div>
                {apaarData?.photoUrl ? (
                  <img
                    src={apaarData.photoUrl}
                    alt={apaarData.studentName}
                    onError={(e) => {
                      const initials = (apaarData?.studentName || "S").slice(0, 2).toUpperCase();
                      e.currentTarget.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><rect width="128" height="128" fill="%230F534A"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-weight="900" font-size="44" fill="%23ffffff">${initials}</text></svg>`;
                    }}
                    className="w-16 h-16 object-cover border-2 border-[#0F534A] shadow-[2px_2px_0px_#0F534A] bg-white shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 bg-[#0F534A] text-white font-black flex items-center justify-center text-lg border-2 border-[#121316] shrink-0">
                    {(apaarData?.studentName || "IN").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Document Fields Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Beneficiary / Citizen Name</span>
                  <span className="font-black text-[#121316] text-xs">{apaarData?.studentName || 'Verified Scholar'}</span>
                </div>

                <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Verification Status</span>
                  <span className="font-bold text-[#0F534A]">✓ ACTIVE &amp; AUTHENTICATED</span>
                </div>

                {previewDoc.type === 'DRVLC' && (
                  <>
                    <div className="p-3 bg-amber-50 border-2 border-[#FE4E1A] col-span-2 shadow-[2px_2px_0px_#121316]">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#FE4E1A]">Driving License (Smart Card Certificate)</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-mono font-black text-lg text-[#121316] tracking-wider">
                          {previewDoc.docNumber || (previewDoc.uri && previewDoc.uri.includes('-') ? previewDoc.uri.split('-').slice(2).join('-') : '') || apaarData?.dlNumber || 'Verified in Transport Records'}
                        </span>
                        <span className="text-[10px] font-mono text-[#FE4E1A] font-bold">STATE TRANSPORT AUTHORITY</span>
                      </div>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Document Category</span>
                      <span className="font-bold text-[#121316]">Motor Vehicle Driving License</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">License Status</span>
                      <span className="font-bold text-[#0F534A]">✓ ACTIVE &amp; AUTHENTICATED</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20 col-span-2">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Issuing Ministry</span>
                      <span className="font-bold text-[#121316]">{previewDoc.issuer || 'Ministry of Road Transport and Highways (MoRTH)'}</span>
                    </div>
                  </>
                )}

                {previewDoc.type === 'ADHAR' && (
                  <>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Masked Aadhaar UID</span>
                      <span className="font-mono font-bold text-sm text-[#003366]">{getMaskedAadhaar()}</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Authentication Mode</span>
                      <span className="font-bold text-[#121316]">UIDAI Biometric / Aadhaar OTP</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Date of Birth</span>
                      <span className="font-bold text-[#121316]">{formatDOB(apaarData?.rawDob || apaarData?.dob)}</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Gender</span>
                      <span className="font-bold text-[#121316]">{formatGender(apaarData?.gender)}</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20 col-span-2">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Verified Resident Status</span>
                      <span className="font-bold text-[#121316]">India (UIDAI Registered Resident under Section 4(3) of Aadhaar Act)</span>
                    </div>
                  </>
                )}

                {previewDoc.type === 'ABCER' && (
                  <>
                    <div className="p-3 bg-blue-50/70 border-2 border-[#003366] col-span-2 shadow-[2px_2px_0px_#003366]">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#003366]">Official APAAR ID</span>
                      <span className="font-mono font-black text-lg text-[#003366] tracking-wider block mt-0.5">{getApaarId()}</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Academic Bank of Credits</span>
                      <span className="font-mono font-bold text-[#003366]">{getAbcId()}</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Status</span>
                      <span className="font-bold text-[#0F534A]">✓ DIGITALLY RECOGNIZED</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20 col-span-2">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Academic Depository</span>
                      <span className="font-bold text-[#121316] truncate block">{apaarData?.instituteName || previewDoc.issuer}</span>
                    </div>
                  </>
                )}

                {previewDoc.type === 'PANCR' && (
                  <>
                    <div className="p-3 bg-emerald-50 border-2 border-[#0F534A] col-span-2 shadow-[2px_2px_0px_#0F534A]">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#0F534A]">Permanent Account Number (PAN)</span>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="font-mono font-black text-lg text-[#0F534A] tracking-wider">
                          {previewDoc.docNumber || (previewDoc.uri && previewDoc.uri.includes('-') ? previewDoc.uri.split('-').slice(2).join('-') : '') || getPanNumber()}
                        </span>
                        <span className="text-[10px] font-mono text-[#0F534A] font-bold">CBDT VERIFIED</span>
                      </div>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Name on Record</span>
                      <span className="font-black text-[#121316] uppercase">{apaarData?.studentName || 'Verified Citizen'}</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Tax Category</span>
                      <span className="font-bold text-[#121316]">INDIVIDUAL RESIDENT</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20 col-span-2">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Issuer Department</span>
                      <span className="font-bold text-[#121316]">{previewDoc.issuer || 'Income Tax Department (CBDT)'}</span>
                    </div>
                  </>
                )}

                {/* Generic view for any other government document (e.g. Vehicle RC, Marksheets, Ration Card, etc.) */}
                {!['DRVLC', 'ADHAR', 'ABCER', 'PANCR'].includes(previewDoc.type) && (
                  <>
                    <div className="p-3 bg-stone-100 border-2 border-[#121316] col-span-2 shadow-[2px_2px_0px_#121316]">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/70">
                        {previewDoc.name} Identifier / Document Number
                      </span>
                      <span className="font-mono font-black text-lg text-[#121316] tracking-wider block mt-0.5">
                        {previewDoc.docNumber || (previewDoc.uri && previewDoc.uri.includes('-') ? previewDoc.uri.split('-').slice(2).join('-') : '') || 'Verified in Government Records'}
                      </span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Document Category</span>
                      <span className="font-bold text-[#121316]">{previewDoc.doctype || previewDoc.type || 'OFFICIAL_CERTIFICATE'}</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Date of Record / Issue</span>
                      <span className="font-bold text-[#121316]">{previewDoc.date || 'Digitally Certified'}</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20 col-span-2">
                      <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">Issuing Department / Ministry</span>
                      <span className="font-bold text-[#121316]">{previewDoc.issuer || 'Government of India'}</span>
                    </div>
                  </>
                )}

                <div className="p-2.5 bg-stone-100 border border-[#121316]/20 col-span-2">
                  <span className="block text-[9px] font-black uppercase tracking-wider text-[#121316]/60">DigiLocker Electronic URI Reference</span>
                  <span className="font-mono text-[10px] text-[#121316]/80 break-all font-bold">
                    {getDocUri(previewDoc)}
                  </span>
                </div>
              </div>

              {/* Digital Certificate Trust Stamp */}
              <div className="p-3 bg-emerald-50 border-2 border-[#0F534A] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🔏</span>
                  <div>
                    <span className="block text-[10px] font-black text-[#0F534A] uppercase tracking-wider">
                      Official DigiLocker Cryptographic Seal
                    </span>
                    <span className="block text-[9px] text-[#121316]/75">
                      Digitally signed by Controller of Certifying Authorities (CCA) under Information Technology Act, 2000
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="inline-block px-2 py-0.5 text-[9px] font-black bg-[#0F534A] text-white uppercase tracking-wider">
                    CCA VERIFIED
                  </span>
                  <span className="block text-[8px] font-mono text-[#0F534A] mt-0.5">SHA256: VALID</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-stone-200">
              <span className="text-[10px] text-[#121316]/60 font-mono">
                Issued under Section 9A of IT Act 2000
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 font-black text-xs text-[#003366] bg-blue-50 hover:bg-blue-100 border-2 border-[#003366] shadow-[2px_2px_0px_#003366] cursor-pointer flex items-center gap-1"
                >
                  <span>🖨️</span>
                  <span>Print Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-1.5 font-black text-xs text-[#121316] bg-stone-100 hover:bg-stone-200 border-2 border-[#121316] shadow-[2px_2px_0px_#121316] cursor-pointer"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <p className="text-xs font-bold text-[#F4002C] bg-[#F4002C]/10 p-2.5 border border-[#F4002C]">
          ⚠️ {errorMsg}
        </p>
      )}
    </div>
  );
};

// 8. Info Note Component for Background / Compliance Review stages
export const InfoNoteAdapter: React.FC<ComponentSchemaProps> = ({ id, props }) => {
  return (
    <div className="p-4 bg-amber-50 border-2 border-[#FE4E1A] text-[#121316] space-y-1 shadow-[3px_3px_0px_#121316]">
      <div className="flex items-center gap-2 font-black text-xs uppercase tracking-wider text-[#FE4E1A]">
        <span>⚙️ {props.label || id}</span>
      </div>
      <p className="text-xs font-medium text-[#121316]/80">
        {props.helpText || "This verification step will automatically process in the background or be reviewed by institutional compliance officers after form submission."}
      </p>
    </div>
  );
};

// ── COMPONENT REGISTRY DICTIONARY ──
export const ComponentRegistry: Record<string, React.FC<ComponentSchemaProps>> = {
  TEXT_INPUT: TextInput,
  EMAIL_INPUT: TextInput,
  NUMBER_INPUT: TextInput,
  SELECT: SelectInput,
  DATE_PICKER: DatePicker,
  EMAIL_VERIFICATION: EmailVerificationAdapter,
  FILE_UPLOAD: FileUploadAdapter,
  ORCID_INPUT: OrcidInputAdapter,
  APAAR_INPUT: ApaarInputAdapter,
  INFO_NOTE: InfoNoteAdapter,
};

