import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { kenyaCounties } from "../data/kenyaCounties";
import GoogleLoginButton from "../components/GoogleLoginButtonV2";
import FacebookLoginButton from "../components/FacebookLoginButtonV2";
import { LegalConsents } from "../types/property";

type Mode = "login" | "signup" | "otp-verify" | "forgot" | "otp-reset";

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
    register,
    requestEmailOtp,
    verifyEmailOtp,
    resetPasswordWithEmail,
    loading,
  } = useAuth();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("next") || "/profile";

  // UI State
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Login State
  const [loginData, setLoginData] = useState({
    emailOrPhone: "",
    password: "",
  });

  // Signup State
  const [signupData, setSignupData] = useState({
    name: "",
    emailOrPhone: "",
    password: "",
    confirmPassword: "",
    userType: "buyer" as "buyer" | "seller",
    county: "",
  });
  const [signupConsents, setSignupConsents] = useState({
    privacyAccepted: false,
    marketingConsent: false,
  });

  const [showSocialConsent, setShowSocialConsent] = useState(false);
  const [socialConsentError, setSocialConsentError] = useState<string | null>(null);
  const [socialConsents, setSocialConsents] = useState({
    privacyAccepted: false,
    marketingConsent: false,
  });
  const socialConsentResolver = useRef<((consents: LegalConsents | null) => void) | null>(null);

  // OTP State (email only for now)
  const [otpCode, setOtpCode] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);
  const [canResendOtp, setCanResendOtp] = useState(true);

  // Password Reset State
  const [resetData, setResetData] = useState({
    emailOrPhone: "",
    code: "",
    newPassword: "",
    confirmPassword: "",
  });

  // OTP Timer
  useEffect(() => {
    if (otpTimer > 0) {
      const interval = setInterval(() => setOtpTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else if (otpTimer === 0 && (mode === "otp-verify" || mode === "otp-reset")) {
      setCanResendOtp(true);
    }
  }, [otpTimer, mode]);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const startOtpTimer = () => {
    setOtpTimer(60);
    setCanResendOtp(false);
  };

  const buildLegalConsents = (privacyAccepted: boolean, marketingConsent: boolean): LegalConsents => ({
    termsAccepted: privacyAccepted,
    privacyAccepted,
    dataProcessingConsent: privacyAccepted,
    marketingConsent,
  });

  const requestSocialConsents = async (): Promise<LegalConsents | null> => {
    return new Promise((resolve) => {
      socialConsentResolver.current = resolve;
      setSocialConsents({ privacyAccepted: false, marketingConsent: false });
      setSocialConsentError(null);
      setShowSocialConsent(true);
    });
  };

  const handleSocialConsentCancel = () => {
    setShowSocialConsent(false);
    setSocialConsentError(null);
    if (socialConsentResolver.current) {
      socialConsentResolver.current(null);
      socialConsentResolver.current = null;
    }
  };

  const handleSocialConsentConfirm = () => {
    if (!socialConsents.privacyAccepted) {
      setSocialConsentError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }

    const consents = buildLegalConsents(
      true,
      socialConsents.marketingConsent
    );

    setShowSocialConsent(false);
    setSocialConsentError(null);
    if (socialConsentResolver.current) {
      socialConsentResolver.current(consents);
      socialConsentResolver.current = null;
    }
  };

  // ==================== LOGIN ====================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!loginData.emailOrPhone.trim() || !loginData.password.trim()) {
      setError("Enter your email/phone and password.");
      return;
    }

    try {
      await login(loginData.emailOrPhone, loginData.password);
      navigate(redirectTo);
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
    }
  };

  // ==================== SIGNUP ====================
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    // Validation
    if (!signupData.name.trim()) {
      setError("Full name is required.");
      return;
    }

    if (!signupData.emailOrPhone.trim()) {
      setError("Email is required.");
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

    if (!signupData.county) {
      setError("Please select a county.");
      return;
    }
    if (!signupConsents.privacyAccepted) {
      setError("Please accept the Terms and Privacy Policy.");
      return;
    }

    const input = signupData.emailOrPhone.trim();
    if (!input.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    const email = input.toLowerCase();

    try {
      // Register user
      await register({
        name: signupData.name,
        email: email,
        phone: undefined,
        password: signupData.password,
        type: signupData.userType,
        county: signupData.county,
        legalConsents: {
          termsAccepted: signupConsents.privacyAccepted,
          privacyAccepted: signupConsents.privacyAccepted,
          marketingConsent: signupConsents.marketingConsent,
          dataProcessingConsent: signupConsents.privacyAccepted,
        },
      });

      // Registration successful; backend already sent email OTP
      setOtpEmail(email);
      setInfo("Verification code sent to your email. Check inbox and spam folder.");
      setMode("otp-verify");
      startOtpTimer();
    } catch (err: any) {
      setError(err?.message || "Signup failed. Please try again.");
    }
  };

  // ==================== OTP VERIFICATION ====================
  const handleOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!otpCode.trim()) {
      setError("Enter the verification code.");
      return;
    }

    try {
      await verifyEmailOtp(otpEmail, otpCode.trim());

      navigate(redirectTo);
    } catch (err: any) {
      setError(err?.message || "Invalid code. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    resetMessages();

    try {
      await requestEmailOtp(otpEmail);
      setInfo("Code resent to your email.");
      startOtpTimer();
    } catch (err: any) {
      setError(err?.message || "Failed to resend code.");
    }
  };

  // ==================== PASSWORD RESET ====================
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!resetData.emailOrPhone.trim()) {
      setError("Enter your email address.");
      return;
    }

    try {
      const input = resetData.emailOrPhone.trim();
      if (!input.includes("@")) {
        setError("Password reset is available by email only right now.");
        return;
      }
      await requestEmailOtp(input);
      setOtpEmail(input.toLowerCase());
      setMode("otp-reset");
      startOtpTimer();
      setInfo("Reset code sent. Check your email.");
    } catch (err: any) {
      setError(err?.message || "Failed to send reset code.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!resetData.code.trim()) {
      setError("Enter the reset code.");
      return;
    }

    if (!resetData.newPassword || resetData.newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (resetData.newPassword !== resetData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await resetPasswordWithEmail({
        email: otpEmail,
        code: resetData.code.trim(),
        newPassword: resetData.newPassword,
      });
      setMode("login");
      setInfo("Password reset successfully. Please log in.");
      setResetData({ emailOrPhone: "", code: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      setError(err?.message || "Failed to reset password.");
    }
  };

  // ==================== RENDER ====================

  const renderLogin = () => (
    <form onSubmit={handleLogin} className="space-y-6">
      {/* Social Login Section */}
      <div className="space-y-3">
        <p className="text-center text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Sign in with
        </p>
        <div className="grid grid-cols-2 gap-3">
          <GoogleLoginButton
            onSuccess={() => navigate(redirectTo)}
            onError={(error) => setError(error)}
            getLegalConsents={requestSocialConsents}
            className="text-sm"
          />
          <FacebookLoginButton
            onSuccess={() => navigate(redirectTo)}
            onError={(error) => setError(error)}
            getLegalConsents={requestSocialConsents}
            className="text-sm"
          />
        </div>
      </div>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or use email and password</span>
        </div>
      </div>

      {/* Email/Phone */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Email or Phone</label>
        <input
          type="text"
          value={loginData.emailOrPhone}
          onChange={(e) => setLoginData({ ...loginData, emailOrPhone: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
            placeholder:text-gray-400 transition-colors"
          placeholder="name@example.com or +254712345678"
        />
        <p className="mt-2 text-xs text-gray-500">
          Phone verification is not enabled yet. Use email for fastest access.
        </p>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
        <input
          type="password"
          value={loginData.password}
          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
            placeholder:text-gray-400 transition-colors"
          placeholder="Enter your password"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !loginData.emailOrPhone || !loginData.password}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300
          text-white font-semibold py-2.5 rounded-lg transition-colors duration-200 text-sm"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>

      {/* Forgot Password */}
      <button
        type="button"
        onClick={() => {
          setMode("forgot");
          resetMessages();
        }}
        className="block w-full text-center text-sm text-blue-600 hover:text-blue-700 hover:underline font-medium"
      >
        Forgot password?
      </button>

      {/* Sign Up Prompt */}
      <div className="border-t border-gray-200 pt-6">
        <p className="text-sm text-gray-700 text-center">
          New to Agrisoko?{" "}
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              resetMessages();
            }}
            className="font-semibold text-blue-600 hover:text-blue-700"
          >
            Create an account
          </button>
        </p>
      </div>
    </form>
  );

  const renderSignup = () => (
    <form onSubmit={handleSignupSubmit} className="space-y-3">
      <div className="space-y-3 pb-2">
        <p className="text-center text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Sign up with
        </p>
        <div className="grid grid-cols-2 gap-3">
          <GoogleLoginButton
            onSuccess={() => navigate(redirectTo)}
            onError={(error) => setError(error)}
            getLegalConsents={requestSocialConsents}
            className="text-sm"
          />
          <FacebookLoginButton
            onSuccess={() => navigate(redirectTo)}
            onError={(error) => setError(error)}
            getLegalConsents={requestSocialConsents}
            className="text-sm"
          />
        </div>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or create with email</span>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Full Name *</label>
        <input
          type="text"
          value={signupData.name}
          onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email *</label>
        <input
          type="email"
          value={signupData.emailOrPhone}
          onChange={(e) => setSignupData({ ...signupData, emailOrPhone: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="your.email@example.com"
        />
        <p className="text-xs text-gray-500 mt-1">Phone verification will be available soon.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Password *</label>
        <input
          type="password"
          value={signupData.password}
          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Min 6 characters"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
        <input
          type="password"
          value={signupData.confirmPassword}
          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Confirm password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Role *</label>
        <select
          value={signupData.userType}
          onChange={(e) => setSignupData({ ...signupData, userType: e.target.value as "buyer" | "seller" })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">County *</label>
        <select
          value={signupData.county}
          onChange={(e) => setSignupData({ ...signupData, county: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select county</option>
          {kenyaCounties.map((county, idx) => (
            <option key={idx} value={county.name}>
              {formatCountyName(county.name)}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 text-xs text-gray-600">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={signupConsents.privacyAccepted}
            onChange={(e) =>
              setSignupConsents((prev) => ({
                ...prev,
                privacyAccepted: e.target.checked,
              }))
            }
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>
            I agree to the{" "}
            <a className="text-blue-600 hover:underline" href="/legal/terms">
              Terms of Service
            </a>{" "}
            and{" "}
            <a className="text-blue-600 hover:underline" href="/legal/privacy">
              Privacy Policy
            </a>
            .
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={signupConsents.marketingConsent}
            onChange={(e) =>
              setSignupConsents((prev) => ({
                ...prev,
                marketingConsent: e.target.checked,
              }))
            }
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span>Send me product updates and marketing emails (optional).</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Sign Up with Email"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode("login");
          resetMessages();
        }}
        className="w-full text-center text-blue-600 font-semibold hover:underline"
      >
        Already have account? Sign in
      </button>
    </form>
  );

  const renderOtpVerify = () => (
    <form onSubmit={handleOtpVerify} className="space-y-4">
      <div className="text-center mb-4">
        <p className="text-gray-700">
          Verification code sent to <strong>{otpEmail}</strong>
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Verification Code *</label>
        <input
          type="text"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 text-center text-2xl tracking-widest"
          placeholder="000000"
          maxLength={6}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !otpCode.trim()}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? "Verifying..." : "Verify Code"}
      </button>

      <button
        type="button"
        onClick={handleResendOtp}
        disabled={!canResendOtp}
        className="w-full text-center text-green-700 font-semibold hover:underline disabled:opacity-60"
      >
        {canResendOtp ? "Resend Code" : `Resend in ${otpTimer}s`}
      </button>
    </form>
  );

  const renderForgot = () => (
    <form onSubmit={handleForgotRequest} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={resetData.emailOrPhone}
          onChange={(e) => setResetData({ ...resetData, emailOrPhone: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="you@example.com"
        />
        <p className="mt-2 text-xs text-gray-500">
          For now, password resets are sent by email only.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? "Sending..." : "Send Reset Code"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode("login");
          resetMessages();
        }}
        className="w-full text-center text-green-700 font-semibold hover:underline"
      >
        Back to Sign In
      </button>
    </form>
  );

  const renderOtpReset = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Reset Code</label>
        <input
          type="text"
          value={resetData.code}
          onChange={(e) => setResetData({ ...resetData, code: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="6-digit code"
          maxLength={6}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">New Password</label>
        <input
          type="password"
          value={resetData.newPassword}
          onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Min 6 characters"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
        <input
          type="password"
          value={resetData.confirmPassword}
          onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Confirm password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>

      <button
        type="button"
        onClick={handleResendOtp}
        disabled={!canResendOtp}
        className="w-full text-center text-green-700 font-semibold hover:underline disabled:opacity-60 text-sm"
      >
        {canResendOtp ? "Resend Code" : `Resend in ${otpTimer}s`}
      </button>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-stretch">
          {/* Brand Panel */}
          <div className="hidden md:flex flex-col justify-between rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 text-white p-10 shadow-xl">
            <div>
              <div className="inline-flex items-center justify-center w-12 h-12 bg-white/15 rounded-xl mb-6">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <h1 className="text-3xl font-bold leading-tight">Agrisoko</h1>
              <p className="text-sm text-emerald-100 mt-2">
                Trusted agricultural commerce for East Africa.
              </p>
            </div>
            <div className="space-y-4 text-sm text-emerald-50/90">
              <p>Faster onboarding, verified sellers, and secure sign-in.</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <span className="rounded-full bg-white/15 px-3 py-1">Verified profiles</span>
                <span className="rounded-full bg-white/15 px-3 py-1">Secure login</span>
                <span className="rounded-full bg-white/15 px-3 py-1">Buyer protection</span>
                <span className="rounded-full bg-white/15 px-3 py-1">Instant messaging</span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md mx-auto">
            {/* Logo & Branding */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-600 rounded-xl mb-4">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900">Agrisoko</h1>
              <p className="text-sm text-gray-500 mt-1">
                {mode === "signup"
                  ? "Create your account in minutes"
                  : "Welcome back"}
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {info && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <p className="text-sm text-emerald-700 font-medium">{info}</p>
              </div>
            )}

            {/* Render appropriate form */}
            {mode === "login" && renderLogin()}
            {mode === "signup" && renderSignup()}
            {mode === "otp-verify" && renderOtpVerify()}
            {mode === "forgot" && renderForgot()}
            {mode === "otp-reset" && renderOtpReset()}
          </div>

            {/* Trust Badges */}
            <div className="mt-6 space-y-2 text-center text-xs text-gray-500">
              <div className="flex items-center justify-center gap-4">
                <span>Secure and encrypted</span>
                <span>Verified sellers</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSocialConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Privacy & Marketing
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Please confirm before continuing with social sign in.
            </p>
            <div className="space-y-3 text-sm text-gray-700">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={socialConsents.privacyAccepted}
                  onChange={(e) =>
                    setSocialConsents((prev) => ({
                      ...prev,
                      privacyAccepted: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>
                  I agree to the{" "}
                  <a className="text-blue-600 hover:underline" href="/legal/terms">
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a className="text-blue-600 hover:underline" href="/legal/privacy">
                    Privacy Policy
                  </a>
                  .
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={socialConsents.marketingConsent}
                  onChange={(e) =>
                    setSocialConsents((prev) => ({
                      ...prev,
                      marketingConsent: e.target.checked,
                    }))
                  }
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>Send me product updates and marketing emails (optional).</span>
              </label>
            </div>
            {socialConsentError && (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {socialConsentError}
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={handleSocialConsentCancel}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSocialConsentConfirm}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <a href="/about" className="hover:text-blue-600">
                About Us
              </a>
              <a href="/browse" className="hover:text-blue-600">
                Browse Listings
              </a>
              <a href="/legal/terms" className="hover:text-blue-600">
                Terms of Service
              </a>
              <a href="/legal/privacy" className="hover:text-blue-600">
                Privacy Policy
              </a>
              <a href="mailto:kodisha.254.ke@gmail.com" className="hover:text-blue-600">
                Contact Support
              </a>
            </div>
            <p className="text-sm text-gray-500">(c) 2026 Agrisoko. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
