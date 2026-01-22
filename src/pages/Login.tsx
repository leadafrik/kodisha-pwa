import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { kenyaCounties } from "../data/kenyaCounties";
import { formatKenyanPhone } from "../utils/security";
import FacebookLoginButton from "../components/FacebookLoginButton";
import GoogleLoginButton from "../components/GoogleLoginButton";

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
    <form onSubmit={handleLogin} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <FacebookLoginButton
          onSuccess={() => navigate(redirectTo)}
          onError={(error) => setError(error)}
        />
        <GoogleLoginButton
          onSuccess={() => navigate(redirectTo)}
          onError={(error) => setError(error)}
        />
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with email/phone</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Email or Phone</label>
        <input
          type="text"
          value={loginData.emailOrPhone}
          onChange={(e) => setLoginData({ ...loginData, emailOrPhone: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Email or phone number"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          value={loginData.password}
          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Your password"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <div className="flex justify-between text-sm">
        <button
          type="button"
          onClick={() => {
            setMode("signup");
            resetMessages();
          }}
          className="text-green-700 font-semibold hover:underline"
        >
          New? Sign up
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("forgot");
            resetMessages();
          }}
          className="text-green-700 font-semibold hover:underline"
        >
          Forgot password?
        </button>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-600">Agrisoko</h1>
          <p className="text-gray-600 text-sm">
            {mode === "login" && "Sign in to your account"}
            {mode === "signup" && "Create your account"}
            {mode === "otp-verify" && "Verify your account"}
            {mode === "forgot" && "Reset your password"}
            {mode === "otp-reset" && "Set new password"}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {info && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
            <p className="text-green-800 text-sm">{info}</p>
          </div>
        )}

        {mode === "login" && renderLogin()}
        {mode === "signup" && renderSignup()}
        {mode === "otp-verify" && renderOtpVerify()}
        {mode === "forgot" && renderForgot()}
        {mode === "otp-reset" && renderOtpReset()}
      </div>
    </div>
  );
};

export default Login;
