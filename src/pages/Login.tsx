import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { kenyaCounties } from "../data/kenyaCounties";
import LegalAcceptanceModal from "../components/LegalAcceptanceModal";

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

  const [loginData, setLoginData] = useState({
    emailOrPhone: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "buyer" as "buyer" | "seller" | "service_provider",
    county: "",
  });

  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [resetPassword, setResetPassword] = useState({
    email: "",
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

  const switchMode = (next: Mode) => {
    resetMessages();
    setMode(next);
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

    if (!signupData.name.trim() || !signupData.email.trim() || !signupData.county) {
      setError("Please fill in name, email, and county.");
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

    try {
      await register({
        name: pendingSignupData.name,
        phone: pendingSignupData.email || undefined,
        email: pendingSignupData.email || undefined,
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
      setPendingSignupData(null);
      await requestEmailOtp(pendingSignupData.email);
      setOtpEmail(pendingSignupData.email);
      setMode("otp-signup");
      startOtpTimer();
      setInfo(
        "We sent a 6-digit code to your email. Check your inbox and spam folder."
      );
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
    if (!resetPassword.email.trim()) {
      setError("Enter your email to receive a code.");
      return;
    }
    try {
      await requestEmailOtp(resetPassword.email.trim());
      setOtpEmail(resetPassword.email.trim());
      setMode("otp-reset");
      startOtpTimer();
      setInfo("We sent a code to your email. Enter it with your new password.");
    } catch (err: any) {
      setError(err?.message || "Failed to send reset code.");
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
          New to Kodisha? Sign up
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
        <label className="block text-sm font-medium text-gray-700">Email *</label>
        <input
          type="email"
          name="email"
          value={signupData.email}
          onChange={(e) =>
            setSignupData((prev) => ({ ...prev, email: e.target.value }))
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          placeholder="you@example.com"
          required
        />
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
          <option value="buyer">Land Buyer / Renter</option>
          <option value="seller">Land Seller / Landlord</option>
          <option value="service_provider">Service Provider</option>
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
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">Verify your email</h3>
        <p className="text-sm text-gray-600">
          We sent a 6-digit code to <span className="font-semibold text-gray-800">{otpEmail}</span>
        </p>
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
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          value={resetPassword.email}
          onChange={(e) =>
            setResetPassword((prev) => ({ ...prev, email: e.target.value }))
          }
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
          placeholder="you@example.com"
        />
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
          Enter the code sent to <span className="font-semibold text-gray-800">{otpEmail}</span> and your new password.
        </p>
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
