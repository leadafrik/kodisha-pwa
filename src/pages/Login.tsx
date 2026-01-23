import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { kenyaCounties } from "../data/kenyaCounties";
import { formatKenyanPhone } from "../utils/security";
import GoogleLoginButton from "../components/GoogleLoginButtonV2";
import FacebookLoginButton from "../components/FacebookLoginButtonV2";

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
    requestSmsOtp,
    verifySmsOtp,
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

  // OTP State
  const [otpCode, setOtpCode] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [otpType, setOtpType] = useState<"email" | "phone">("email");
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
      setError("Email or phone number is required.");
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

    const input = signupData.emailOrPhone.trim();
    const isEmail = input.includes("@");

    let email: string | undefined;
    let phone: string | undefined;

    if (isEmail) {
      email = input.toLowerCase();
    } else {
      phone = formatKenyanPhone(input);
    }

    try {
      // Register user
      await register({
        name: signupData.name,
        email: email,
        phone: phone,
        password: signupData.password,
        type: signupData.userType,
        county: signupData.county,
        legalConsents: {
          termsAccepted: true,
          privacyAccepted: true,
          marketingConsent: false,
          dataProcessingConsent: true,
        },
      });

      // Registration successful, request OTP
      try {
        if (email) {
          await requestEmailOtp(email);
          setOtpEmail(email);
          setOtpType("email");
          setInfo("✅ Verification code sent to your email. Check inbox and spam folder.");
        } else {
          await requestSmsOtp(phone || "");
          setOtpEmail(phone || "");
          setOtpType("phone");
          setInfo("✅ Verification code sent to your phone via SMS.");
        }

        setMode("otp-verify");
        startOtpTimer();
      } catch (otpErr: any) {
        // Registration succeeded but OTP send failed
        setError(
          `Account created! But OTP send failed: ${otpErr?.message || "Please try again."}. You can log in directly.`
        );
      }
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
      if (otpType === "email") {
        await verifyEmailOtp(otpEmail, otpCode.trim());
      } else {
        await verifySmsOtp(otpEmail, otpCode.trim());
      }

      navigate(redirectTo);
    } catch (err: any) {
      setError(err?.message || "Invalid code. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    resetMessages();

    try {
      if (otpType === "email") {
        await requestEmailOtp(otpEmail);
        setInfo("✅ Code resent to your email.");
      } else {
        await requestSmsOtp(otpEmail);
        setInfo("✅ Code resent to your phone.");
      }
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
      setError("Enter your email or phone number.");
      return;
    }

    try {
      const input = resetData.emailOrPhone.trim();
      const isEmail = input.includes("@");
      await requestEmailOtp(isEmail ? input : resetData.emailOrPhone);
      setOtpEmail(input);
      setOtpType(isEmail ? "email" : "phone");
      setMode("otp-reset");
      startOtpTimer();
      setInfo("✅ Reset code sent. Check your email or SMS.");
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
      setInfo("✅ Password reset successfully. Please log in.");
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
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-500">Or sign in with email</span>
        </div>
      </div>

      {/* Email/Phone */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">
          Email or Phone Number
        </label>
        <input
          type="text"
          value={loginData.emailOrPhone}
          onChange={(e) => setLoginData({ ...loginData, emailOrPhone: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100
            placeholder:text-gray-400 transition-colors"
          placeholder="your.email@example.com or +254712345678"
        />
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
      <div>
        <label className="block text-sm font-medium text-gray-700">Full Name *</label>
        <input
          type="text"
          value={signupData.name}
          onChange={(e) => setSignupData({ ...signupData, name: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email or Phone *</label>
        <input
          type="text"
          value={signupData.emailOrPhone}
          onChange={(e) => setSignupData({ ...signupData, emailOrPhone: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Email or 0712345678"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Password *</label>
        <input
          type="password"
          value={signupData.password}
          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Min 6 characters"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
        <input
          type="password"
          value={signupData.confirmPassword}
          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Confirm password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Role *</label>
        <select
          value={signupData.userType}
          onChange={(e) => setSignupData({ ...signupData, userType: e.target.value as "buyer" | "seller" })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
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
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">Select county</option>
          {kenyaCounties.map((county, idx) => (
            <option key={idx} value={county.name}>
              {formatCountyName(county.name)}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? "Creating account..." : "Create Account"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode("login");
          resetMessages();
        }}
        className="w-full text-center text-green-700 font-semibold hover:underline"
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
        <label className="block text-sm font-medium text-gray-700">Email or Phone</label>
        <input
          type="text"
          value={resetData.emailOrPhone}
          onChange={(e) => setResetData({ ...resetData, emailOrPhone: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Email or phone number"
        />
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Logo & Branding */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Agrisoko</h1>
            <p className="text-sm text-gray-500 mt-1">
              {mode === "signup"
                ? "Join Kenya's Leading Agricultural Marketplace"
                : "Welcome to Agrisoko"}
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            {/* Messages */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {info && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 font-medium">{info}</p>
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
          <div className="mt-8 space-y-2 text-center text-xs text-gray-500">
            <div className="flex items-center justify-center gap-4">
              <span>Secure & Encrypted</span>
              <span>Verified Sellers</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Product</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/about" className="text-sm text-gray-600 hover:text-blue-600">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="/features" className="text-sm text-gray-600 hover:text-blue-600">
                    Features
                  </a>
                </li>
                <li>
                  <a href="/pricing" className="text-sm text-gray-600 hover:text-blue-600">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Company</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/blog" className="text-sm text-gray-600 hover:text-blue-600">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="/careers" className="text-sm text-gray-600 hover:text-blue-600">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-sm text-gray-600 hover:text-blue-600">
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/terms" className="text-sm text-gray-600 hover:text-blue-600">
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/privacy" className="text-sm text-gray-600 hover:text-blue-600">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/cookies" className="text-sm text-gray-600 hover:text-blue-600">
                    Cookie Policy
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Support</h3>
              <ul className="space-y-2">
                <li>
                  <a href="/help" className="text-sm text-gray-600 hover:text-blue-600">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="/status" className="text-sm text-gray-600 hover:text-blue-600">
                    Status
                  </a>
                </li>
                <li>
                  <a href="/feedback" className="text-sm text-gray-600 hover:text-blue-600">
                    Feedback
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              © 2026 Agrisoko. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://facebook.com/agrisoko" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Facebook</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a href="https://twitter.com/agrisoko" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-gray-600">
                <span className="sr-only">Twitter</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8.29 20c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-7.655 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
