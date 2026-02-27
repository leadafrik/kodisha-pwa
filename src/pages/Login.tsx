import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { kenyaCounties } from "../data/kenyaCounties";
import GoogleLoginButton from "../components/GoogleLoginButtonV2";
import FacebookLoginButton from "../components/FacebookLoginButtonV2";

type Mode = "login" | "signup" | "otp-verify" | "forgot" | "otp-reset";
type PasswordFieldKey = "login" | "signup" | "signupConfirm" | "resetNew" | "resetConfirm";

const formatCountyName = (name: string) =>
  name
    .split(/([-\s])/)
    .map((part) => {
      if (part === "-" || part === " ") return part;
      const lower = part.toLowerCase();
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join("");

const defaultPasswordVisibility: Record<PasswordFieldKey, boolean> = {
  login: false,
  signup: false,
  signupConfirm: false,
  resetNew: false,
  resetConfirm: false,
};

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
  const requestedMode = searchParams.get("mode");
  const inviteCodeFromQuery = (
    searchParams.get("invite") ||
    searchParams.get("ref") ||
    searchParams.get("code") ||
    ""
  )
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const countyFromQuery = searchParams.get("county")?.trim() || "";
  const defaultUserType: "buyer" | "seller" = searchParams.get("role") === "seller" ? "seller" : "buyer";

  // UI State
  const [mode, setMode] = useState<Mode>("login");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<PasswordFieldKey, boolean>>(
    () => ({ ...defaultPasswordVisibility }),
  );

  const togglePasswordVisibility = (field: PasswordFieldKey) => {
    setVisiblePasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

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
    county: countyFromQuery,
    inviteCode: inviteCodeFromQuery,
  });

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

  useEffect(() => {
    if (requestedMode === "signup") {
      setMode("signup");
    } else if (requestedMode === "login") {
      setMode("login");
    }
  }, [requestedMode]);

  const resetMessages = () => {
    setError(null);
    setInfo(null);
  };

  const startOtpTimer = () => {
    setOtpTimer(60);
    setCanResendOtp(false);
  };

  // ==================== LOGIN ====================
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (!loginData.emailOrPhone.trim() || !loginData.password.trim()) {
      setError("Enter your email and password.");
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

    if (!signupData.county) {
      setError("Please select your county.");
      return;
    }

    const input = signupData.emailOrPhone.trim();
    if (!input.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    const email = input.toLowerCase();

    try {
      await register({
        name: signupData.name,
        email: email,
        phone: undefined,
        password: signupData.password,
        type: defaultUserType,
        county: signupData.county,
        inviteCode: signupData.inviteCode.trim() || undefined,
        legalConsents: {
          termsAccepted: true,
          privacyAccepted: true,
          marketingConsent: false,
          dataProcessingConsent: true,
        },
      });

      try {
        await login(email, signupData.password);
        navigate(redirectTo);
        return;
      } catch {
        // Fallback to OTP verification if immediate login is unavailable.
      }

      setOtpEmail(email);
      setInfo("Account created. Enter the verification code from your email to continue.");
      setMode("otp-verify");
      startOtpTimer();
    } catch (err: any) {
      const message = err?.message || "Signup failed. Please try again.";

      if (/verification|otp|code|created/i.test(message)) {
        try {
          await login(email, signupData.password);
          navigate(redirectTo);
          return;
        } catch {
          // Keep original error if fallback login fails.
        }
      }

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
            className="text-sm"
          />
          <FacebookLoginButton
            onSuccess={() => navigate(redirectTo)}
            onError={(error) => setError(error)}
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

      {/* Email */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
        <input
          type="text"
          value={loginData.emailOrPhone}
          onChange={(e) => setLoginData({ ...loginData, emailOrPhone: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
            placeholder:text-gray-400 transition-colors"
          placeholder="name@example.com"
        />
        <p className="mt-2 text-xs text-gray-500">
          Use your email address to sign in.
        </p>
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
        <div className="relative">
          <input
            type={visiblePasswords.login ? "text" : "password"}
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm
              focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
              placeholder:text-gray-400 transition-colors"
            placeholder="Enter your password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={visiblePasswords.login ? "Hide password" : "Show password"}
            onClick={() => togglePasswordVisibility("login")}
          >
            {visiblePasswords.login ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
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
    <form onSubmit={handleSignupSubmit} className="space-y-4">
      <div className="space-y-2">
        <p className="text-center text-xs font-semibold text-gray-500 uppercase tracking-widest">
          Fastest signup
        </p>
        <GoogleLoginButton
          onSuccess={() => navigate(redirectTo)}
          onError={(error) => setError(error)}
          className="text-sm w-full"
        />
        <p className="text-center text-xs text-gray-500">No forms. No password. Instant access.</p>
        <FacebookLoginButton
          onSuccess={() => navigate(redirectTo)}
          onError={(error) => setError(error)}
          className="text-sm w-full"
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or use email (about 10 seconds)</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Full name *</label>
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
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Password *</label>
          <div className="relative">
            <input
              type={visiblePasswords.signup ? "text" : "password"}
              value={signupData.password}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Min 6 characters"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label={visiblePasswords.signup ? "Hide password" : "Show password"}
              onClick={() => togglePasswordVisibility("signup")}
            >
              {visiblePasswords.signup ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className="md:col-span-2">
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
      </div>

      <p className="text-xs text-gray-500">
        Account first. Complete the rest of your profile after signup.
      </p>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create Free Account"}
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
        <div className="relative">
          <input
            type={visiblePasswords.resetNew ? "text" : "password"}
            value={resetData.newPassword}
            onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Min 6 characters"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={visiblePasswords.resetNew ? "Hide password" : "Show password"}
            onClick={() => togglePasswordVisibility("resetNew")}
          >
            {visiblePasswords.resetNew ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
        <div className="relative">
          <input
            type={visiblePasswords.resetConfirm ? "text" : "password"}
            value={resetData.confirmPassword}
            onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Confirm password"
          />
          <button
            type="button"
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label={visiblePasswords.resetConfirm ? "Hide password" : "Show password"}
            onClick={() => togglePasswordVisibility("resetConfirm")}
          >
            {visiblePasswords.resetConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
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

  const modeTitle =
    mode === "signup"
      ? "Create your free Agrisoko account in 10 seconds"
      : mode === "forgot"
        ? "Reset your password"
        : mode === "otp-verify"
          ? "Verify your email"
          : mode === "otp-reset"
            ? "Set a new password"
            : "Welcome back";

  const modeSubtitle =
    mode === "signup"
      ? "Start with your account now. You can complete your profile later."
      : mode === "forgot" || mode === "otp-reset"
        ? "Use your email address to regain secure access."
        : mode === "otp-verify"
          ? "Enter the code we sent to complete your account setup."
          : "Sign in securely to continue.";

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />

      <div className="px-4 py-8 md:py-12">
        <div className="mx-auto grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <aside className="hidden lg:flex flex-col justify-between rounded-3xl border border-emerald-200/70 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 p-10 text-white shadow-2xl">
            <div>
              <img src="/logo.svg" alt="" aria-hidden="true" className="h-12 w-12 rounded-xl bg-white/10 p-1" />
              <h1 className="mt-5 text-4xl font-bold leading-tight">Agrisoko</h1>
              <p className="mt-2 text-sm text-emerald-100">
                Trusted agricultural commerce for East Africa.
              </p>
            </div>
            <div className="space-y-4 text-sm text-emerald-50/95">
              <p>Faster onboarding, verified sellers, and secure sign-in.</p>
              <div className="grid grid-cols-2 gap-3 text-xs font-medium">
                <span className="rounded-full bg-white/15 px-3 py-1">Verified profiles</span>
                <span className="rounded-full bg-white/15 px-3 py-1">Secure login</span>
                <span className="rounded-full bg-white/15 px-3 py-1">Buyer protection</span>
                <span className="rounded-full bg-white/15 px-3 py-1">Instant messaging</span>
              </div>
            </div>
          </aside>

          <section className="w-full max-w-md mx-auto lg:max-w-none">
            <div className="mb-4 rounded-2xl border border-emerald-100 bg-white/90 p-4 backdrop-blur lg:hidden">
              <div className="flex items-center gap-3">
                <img src="/logo.svg" alt="" aria-hidden="true" className="h-10 w-10 rounded-xl bg-emerald-50 p-1" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Agrisoko</p>
                  <p className="text-xs text-slate-600">Trusted agricultural commerce for East Africa.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-6 shadow-xl backdrop-blur md:p-8">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">Secure Access</p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">{modeTitle}</h2>
                <p className="mt-1 text-sm text-slate-600">{modeSubtitle}</p>
              </div>

              {error && (
                <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-medium text-red-700">{error}</p>
                </div>
              )}

              {info && (
                <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm font-medium text-emerald-700">{info}</p>
                </div>
              )}

              {mode === "login" && renderLogin()}
              {mode === "signup" && renderSignup()}
              {mode === "otp-verify" && renderOtpVerify()}
              {mode === "forgot" && renderForgot()}
              {mode === "otp-reset" && renderOtpReset()}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">Secure and encrypted</span>
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">Verified sellers</span>
              <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">Private messaging</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;
