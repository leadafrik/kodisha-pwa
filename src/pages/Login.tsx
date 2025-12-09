import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { kenyaCounties } from "../data/kenyaCounties";
import LegalAcceptanceModal from "../components/LegalAcceptanceModal";
import { isValidKenyanPhone, formatKenyanPhone } from "../utils/security";

// Build: SMS verification only (Nov 29, 2025)
type Mode = "login" | "signup" | "otp-signup" | "forgot" | "otp-reset";

const formatCountyName = (name: string) =>
  name
    .split(/([-\s])/)
    .map((part) => {
      if (part === "-" || part === " ") return part;
      const lower = part.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");

const Login: React.FC = () => {
  const {
    login,
    requestEmailOtp,
    verifyEmailOtp,
    resetPasswordWithEmail,
    register,
    loading,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("next") || "/profile";

  const [mode, setMode] = useState<Mode>("login");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [pendingSignupData, setPendingSignupData] = useState<any>(null);
  const [checkingEmailOrPhone, setCheckingEmailOrPhone] = useState(false);
  const [emailOrPhoneExists, setEmailOrPhoneExists] = useState(false);

  const [loginData, setLoginData] = useState({
    emailOrPhone: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    emailOrPhone: "",
    password: "",
    confirmPassword: "",
    userType: "buyer" as "buyer" | "seller",
    county: "",
  });

  const [otpEmail, setOtpEmail] = useState("");
  const [otpType, setOtpType] = useState<'email' | 'phone'>('email');
  const [otpCode, setOtpCode] = useState("");
  const [resetPassword, setResetPassword] = useState({
    emailOrPhone: "",
    newPassword: "",
    confirmPassword: "",
  });

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  // OTP Timer effect
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (otpTimer === 0 && (mode === "otp-signup" || mode === "otp-reset")) {
      setCanResendOtp(true);
    }
  }, [otpTimer, mode]);

  const startOtpTimer = () => {
    setOtpTimer(60);
    setCanResendOtp(false);
  };

  // Check if email/phone already exists in database
  const checkEmailOrPhoneExists = async (emailOrPhone: string) => {
    if (!emailOrPhone.trim()) {
      setEmailOrPhoneExists(false);
      return;
    }

    setCheckingEmailOrPhone(true);
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL || 'http://localhost:5000/api'}/auth/check-exists`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailOrPhone: emailOrPhone.trim() }),
        }
      );
      const data = await response.json();
      setEmailOrPhoneExists(data.exists || false);
    } catch (err) {
      console.error('Error checking email/phone:', err);
      setEmailOrPhoneExists(false);
    } finally {
      setCheckingEmailOrPhone(false);
    }
  };

  // Debounced check (runs after user stops typing)
  useEffect(() => {
    if (mode === 'signup') {
      const timer = setTimeout(() => {
        checkEmailOrPhoneExists(signupData.emailOrPhone);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [signupData.emailOrPhone, mode]);

  const switchMode = (next: Mode) => {
    resetMessages();
    setMode(next);
    setEmailOrPhoneExists(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!loginData.emailOrPhone.trim() || !loginData.password.trim()) {
      setError("Enter your email/phone and password.");
      return;
    }
    try {
      await login(loginData.emailOrPhone.trim(), loginData.password.trim());
      navigate(redirectTo);
    } catch (err: any) {
      setError(err?.message || "Login failed. Check your credentials.");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!signupData.name.trim() || !signupData.county) {
      setError("Please fill in name and county.");
      return;
    }
    
    if (!signupData.emailOrPhone.trim()) {
      setError("Email or phone number is required.");
      return;
    }

    // Detect if input is email or phone
    const input = signupData.emailOrPhone.trim();
    const isEmail = input.includes('@');
    const isPhone = isValidKenyanPhone(input);

    if (!isEmail && !isPhone) {
      setError("Please enter a valid email or Kenyan phone number.");
      return;
    }
    
    if (!signupData.password || signupData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Show legal acceptance modal before registration
    setPendingSignupData(signupData);
    setShowLegalModal(true);
  };

  const handleLegalAcceptance = async (consents: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    marketingConsent: boolean;
    dataProcessingConsent: boolean;
  }) => {
    if (!pendingSignupData) return;

    const input = pendingSignupData.emailOrPhone.trim();
    const isEmail = input.includes('@');
    
    let email = undefined;
    let phone = undefined;

    if (isEmail) {
      email = input;
    } else {
      // Normalize to +254 format
      phone = formatKenyanPhone(input);
    }

    try {
      await register({
        name: pendingSignupData.name,
        phone: phone,
        email: email,
        password: pendingSignupData.password,
        type: pendingSignupData.userType,
        county: pendingSignupData.county,
        legalConsents: {
          termsAccepted: consents.termsAccepted,
          privacyAccepted: consents.privacyAccepted,
          marketingConsent: consents.marketingConsent,
          dataProcessingConsent: consents.dataProcessingConsent,
        },
      });
      setShowLegalModal(false);
      
      // Send OTP based on what was provided
      if (email) {
        await requestEmailOtp(email);
        setOtpEmail(email);
        setOtpType('email');
        setInfo(
          "✅ Code sent to your email. Please check your inbox and spam folder."
        );
      } else {
        // Send SMS verification code
        try {
          await requestEmailOtp(phone || '');
          setOtpEmail(phone || '');
          setOtpType('phone');
          setInfo(
            "✅ Verification code sent to your phone via SMS."
          );
        } catch (smsError: any) {
          // If SMS fails, inform user
          if (smsError?.message?.includes('Failed')) {
            setError("SMS verification is currently unavailable. Please try again later or use email verification instead.");
            setShowLegalModal(true); // Show form again to let user try with email
          } else {
            throw smsError;
          }
        }
      }
      
      setPendingSignupData(null);
      setMode("otp-signup");
      startOtpTimer();
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
      setShowLegalModal(false);
    }
  };

  const handleLegalCancel = () => {
    setShowLegalModal(false);
    setPendingSignupData(null);
  };

  const handleVerifySignupOtp = async () => {
    resetMessages();
    if (!otpEmail.trim() || !otpCode.trim()) {
      setError("Enter both email and code.");
      return;
    }
    try {
      await verifyEmailOtp(otpEmail.trim(), otpCode.trim());
      navigate(redirectTo);
    } catch (err: any) {
      setError(err?.message || "Invalid code.");
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!resetPassword.emailOrPhone.trim()) {
      setError("Enter your email or phone number to receive a code.");
      return;
    }

    const input = resetPassword.emailOrPhone.trim();
    const isEmail = input.includes('@');
    const isPhone = /^0?\d{9,10}$/.test(input);

    if (!isEmail && !isPhone) {
      setError("Please enter a valid email or 10-digit phone number.");
      return;
    }

    try {
      await requestEmailOtp(input);
      setOtpEmail(input);
      setOtpType(isEmail ? 'email' : 'phone');
      setMode("otp-reset");
      startOtpTimer();
      if (isEmail) {
        setInfo("✅ Code sent to your email. Check your inbox and spam folder.");
      } else {
        setInfo("✅ Code sent to your phone via SMS.");
      }
    } catch (err: any) {
      // If SMS fails, inform user to try email instead
      if (err?.message?.includes('Failed') && !isEmail) {
        setError(null);
        setInfo("⚠️ SMS verification is currently unavailable. Please go back and request a code using your email address instead.");
      } else if (err?.message?.includes('Failed')) {
        // Email OTP also failed
        setError("Could not send verification code. Please try again.");
      } else {
        setError(err?.message || "Failed to send reset code.");
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!otpEmail || !otpCode) {
      setError("Enter your email code.");
      return;
    }
    if (!resetPassword.newPassword || resetPassword.newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (resetPassword.newPassword !== resetPassword.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    try {
      await resetPasswordWithEmail({
        email: otpEmail,
        code: otpCode.trim(),
        newPassword: resetPassword.newPassword,
      });
      navigate(redirectTo);
    } catch (err: any) {
      setError(err?.message || "Failed to reset password.");
    }
  };

  const renderLogin = () => (
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Email or Phone</label>
        <input
          type="text"
          value={loginData.emailOrPhone}
          onChange={(e) =>
            setLoginData((prev) => ({ ...prev, emailOrPhone: e.target.value }))
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          placeholder="Email or phone number"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={loginData.password}
          onChange={(e) =>
            setLoginData((prev) => ({ ...prev, password: e.target.value }))
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          placeholder="Your password"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 active:bg-green-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className="text-green-700 font-semibold hover:text-green-800 hover:underline transition"
        >
          New to Mamamboga Digital? Sign up
        </button>
        <button
          type="button"
          onClick={() => switchMode("forgot")}
          className="text-green-700 font-semibold hover:text-green-800 hover:underline transition"
        >
          Forgot password?
        </button>
      </div>
    </form>
  );

  const renderSignup = () => (
    <form onSubmit={handleSignup} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">Full Name *</label>
        <input
          type="text"
          name="name"
          value={signupData.name}
          onChange={(e) =>
            setSignupData((prev) => ({ ...prev, name: e.target.value }))
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          placeholder="e.g. Wanjiru Kamau"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700">Email or Phone Number *</label>
        <div className="relative">
          <input
            type="text"
            name="emailOrPhone"
            value={signupData.emailOrPhone}
            onChange={(e) =>
              setSignupData((prev) => ({ ...prev, emailOrPhone: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            placeholder="you@example.com or 0712345678"
          />
          {checkingEmailOrPhone && (
            <div className="absolute right-3 top-3">
              <svg className="animate-spin h-5 w-5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
        </div>
        
        {emailOrPhoneExists && signupData.emailOrPhone.trim() && (
          <div className="mt-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm">
            <p className="text-blue-900 font-medium mb-2">
              📝 Account already exists with this email/phone
            </p>
            <p className="text-blue-800 text-xs mb-3">
              It looks like you already have an account. Please sign in instead to access your account.
            </p>
            <button
              type="button"
              onClick={() => {
                setLoginData({ emailOrPhone: signupData.emailOrPhone, password: '' });
                switchMode('login');
              }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition text-sm"
            >
              ✓ Sign In Instead
            </button>
          </div>
        )}
        
        {!emailOrPhoneExists && signupData.emailOrPhone.trim() && !checkingEmailOrPhone && (
          <p className="text-xs text-green-600 mt-2 font-medium">✓ Email/phone is available</p>
        )}
        
        <p className="text-xs text-gray-500 mt-2">We'll send a verification code to your email or SMS</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700">Password *</label>
          <input
            type="password"
            name="password"
            value={signupData.password}
            onChange={(e) =>
              setSignupData((prev) => ({ ...prev, password: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            placeholder="At least 6 characters"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm *</label>
          <input
            type="password"
            name="confirmPassword"
            value={signupData.confirmPassword}
            onChange={(e) =>
              setSignupData((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
            placeholder="Repeat password"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Role</label>
        <select
          name="userType"
          value={signupData.userType}
          onChange={(e) =>
            setSignupData((prev) => ({
              ...prev,
              userType: e.target.value as any,
            }))
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white"
        >
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">County *</label>
        <select
          name="county"
          value={signupData.county}
          onChange={(e) =>
            setSignupData((prev) => ({ ...prev, county: e.target.value }))
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition bg-white"
          required
        >
          <option value="">Select your county</option>
          {[...kenyaCounties]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((county) => (
              <option key={county.code} value={county.name}>
                {formatCountyName(county.name)}
              </option>
            ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 active:bg-green-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Creating your account..." : "Sign Up"}
      </button>
      <div className="text-sm text-center text-gray-600">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="text-green-700 font-semibold hover:text-green-800 hover:underline transition"
        >
          Back to login
        </button>
      </div>
    </form>
  );

  const renderOtpSignup = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto">
          {otpType === 'email' ? (
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 00.948-.684l1.498-4.493a1 1 0 011.502-.684l1.498 4.493a1 1 0 00.948.684H19a2 2 0 012 2v2a2 2 0 01-2 2H5a2 2 0 01-2-2V5z" />
            </svg>
          )}
        </div>
        <h3 className="text-lg font-semibold text-gray-800">
          {otpType === 'email' ? 'Verify your email' : 'Verify your phone'}
        </h3>
        <p className="text-sm text-gray-600">
          We sent a 6-digit code to {otpType === 'email' ? 'your email' : 'your phone'}: <span className="font-semibold text-gray-800">{otpEmail}</span>
        </p>
        {otpType === 'email' && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded p-2 mt-2">
            💡 Tip: If you don't see the email, check your spam/junk folder.
          </p>
        )}
        {otpType === 'phone' && (
          <p className="text-xs text-blue-600 bg-blue-50 rounded p-2 mt-2">
            💡 Code sent via SMS. Check your messages.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          inputMode="numeric"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl font-semibold tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          placeholder="000000"
        />
        <button
          type="button"
          onClick={handleVerifySignupOtp}
          disabled={loading || otpCode.length !== 6}
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 active:bg-green-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
        <button
          type="button"
          onClick={() => {
            requestEmailOtp(otpEmail);
            startOtpTimer();
            setOtpCode("");
            setInfo("New code sent to your email.");
          }}
          disabled={!canResendOtp || loading}
          className="text-sm font-semibold text-green-700 hover:text-green-800 disabled:text-gray-400 disabled:cursor-not-allowed transition"
        >
          {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend code"}
        </button>
      </div>
      <div className="text-sm text-center text-gray-600">
        Wrong email?{" "}
        <button
          type="button"
          onClick={() => {
            switchMode("signup");
            setOtpTimer(0);
            setCanResendOtp(true);
            setOtpCode("");
          }}
          className="text-green-700 font-semibold hover:text-green-800 hover:underline transition"
        >
          Edit details
        </button>
      </div>
    </div>
  );

  const renderForgot = () => (
    <form onSubmit={handleForgot} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Email or Phone Number</label>
        <input
          type="text"
          value={resetPassword.emailOrPhone}
          onChange={(e) =>
            setResetPassword((prev) => ({ ...prev, emailOrPhone: e.target.value }))
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          placeholder="you@example.com or 0712345678"
        />
        <p className="text-xs text-gray-500 mt-1">We'll send a code to verify your identity</p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 active:bg-green-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Sending code..." : "Send reset code"}
      </button>
      <div className="text-sm text-center text-gray-600">
        Remembered your password?{" "}
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="text-green-700 font-semibold hover:text-green-800 hover:underline transition"
        >
          Back to login
        </button>
      </div>
    </form>
  );

  const renderOtpReset = () => (
    <form onSubmit={handleResetPassword} className="space-y-3">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mx-auto">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Reset password</h3>
        <p className="text-sm text-gray-600">
          Enter the code sent to {otpType === 'email' ? 'your email' : 'your phone'}: <span className="font-semibold text-gray-800">{otpEmail}</span> and your new password.
        </p>
        {otpType === 'email' && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded p-2">
            💡 Tip: If you don't see the email, check your spam/junk folder.
          </p>
        )}
        {otpType === 'phone' && (
          <p className="text-xs text-blue-600 bg-blue-50 rounded p-2 mt-2">
            💡 Code sent via SMS. Check your text messages.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Verification code</label>
        <input
          type="text"
          inputMode="numeric"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          maxLength={6}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-center text-2xl font-semibold tracking-widest focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          placeholder="000000"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">New password</label>
        <input
          type="password"
          value={resetPassword.newPassword}
          onChange={(e) =>
            setResetPassword((prev) => ({
              ...prev,
              newPassword: e.target.value,
            }))
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          placeholder="Min. 6 characters"
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Confirm password</label>
        <input
          type="password"
          value={resetPassword.confirmPassword}
          onChange={(e) =>
            setResetPassword((prev) => ({
              ...prev,
              confirmPassword: e.target.value,
            }))
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          placeholder="Repeat new password"
        />
      </div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => {
            requestEmailOtp(otpEmail);
            startOtpTimer();
            setOtpCode("");
            setInfo("New code sent to your email.");
          }}
          disabled={!canResendOtp || loading}
          className="text-sm font-semibold text-green-700 hover:text-green-800 disabled:text-gray-400 disabled:cursor-not-allowed transition"
        >
          {otpTimer > 0 ? `Resend in ${otpTimer}s` : "Resend code"}
        </button>
        <button
          type="submit"
          disabled={loading || otpCode.length !== 6}
          className="bg-green-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-green-700 active:bg-green-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Resetting..." : "Reset & Sign In"}
        </button>
      </div>
      <div className="text-sm text-center text-gray-600">
        Back to{" "}
        <button
          type="button"
          onClick={() => {
            switchMode("login");
            setOtpTimer(0);
            setCanResendOtp(true);
            setOtpCode("");
          }}
          className="text-green-700 font-semibold hover:text-green-800 hover:underline transition"
        >
          login
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {mode === "login"
                ? "Welcome back"
                : mode === "signup"
                ? "Create your account"
                : mode === "forgot"
                ? "Reset your password"
                : "Verify your email"}
            </h1>
            <p className="text-sm text-gray-500 font-medium">
              {mode === "login"
                ? "Sign in to your account"
                : mode === "signup"
                ? "Join our community"
                : mode === "forgot"
                ? "Recover your account"
                : "Complete your registration"}
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm font-medium flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          )}
          {info && (
            <div className="rounded-lg bg-green-50 border border-green-200 text-green-700 px-4 py-3 text-sm font-medium flex items-start gap-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{info}</span>
            </div>
          )}

          {mode === "login" && renderLogin()}
          {mode === "signup" && renderSignup()}
          {mode === "otp-signup" && renderOtpSignup()}
          {mode === "forgot" && renderForgot()}
          {mode === "otp-reset" && renderOtpReset()}
        </div>

        <div className="mt-6 text-center text-sm text-gray-600 space-y-2">
          <div className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 111.414 1.414L7.414 9l3.293 3.293a1 1 0 01-1.414 1.414l-4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-xs">Your data is encrypted and secure</span>
          </div>
        </div>
      </div>

      {/* Legal Acceptance Modal */}
      <LegalAcceptanceModal
        isOpen={showLegalModal}
        onAccept={handleLegalAcceptance}
        onCancel={handleLegalCancel}
        loading={loading}
      />
    </div>
  );
};

export default Login;
