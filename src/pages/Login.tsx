import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { kenyaCounties } from "../data/kenyaCounties";

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

    try {
      await register({
        name: signupData.name,
        phone: signupData.email || undefined,
        email: signupData.email || undefined,
        password: signupData.password,
        type: signupData.userType,
        county: signupData.county,
      });
      await requestEmailOtp(signupData.email);
      setOtpEmail(signupData.email);
      setMode("otp-signup");
      setInfo(
        "We sent a 6-digit code to your email (check spam too). If you don't see it, request again."
      );
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    }
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
      setInfo("We sent a code to your email (check spam). Enter it with your new password.");
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
      <div className="space-y-1">
        <label className="block text-sm text-gray-700">Email or Phone</label>
        <input
          type="text"
          value={loginData.emailOrPhone}
          onChange={(e) =>
            setLoginData((prev) => ({ ...prev, emailOrPhone: e.target.value }))
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="you@example.com or phone"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm text-gray-700">Password</label>
        <input
          type="password"
          value={loginData.password}
          onChange={(e) =>
            setLoginData((prev) => ({ ...prev, password: e.target.value }))
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Your password"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
      <div className="flex items-center justify-between text-sm text-gray-600">
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className="text-green-700 font-semibold hover:underline"
        >
          New to Kodisha? Sign up
        </button>
        <button
          type="button"
          onClick={() => switchMode("forgot")}
          className="hover:underline"
        >
          Forgot password?
        </button>
      </div>
    </form>
  );

  const renderSignup = () => (
    <form onSubmit={handleSignup} className="space-y-3">
      <div>
        <label className="block text-sm text-gray-700">Full Name *</label>
        <input
          type="text"
          name="name"
          value={signupData.name}
          onChange={(e) =>
            setSignupData((prev) => ({ ...prev, name: e.target.value }))
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="e.g. Wanjiru Kamau"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-700">Email *</label>
        <input
          type="email"
          name="email"
          value={signupData.email}
          onChange={(e) =>
            setSignupData((prev) => ({ ...prev, email: e.target.value }))
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="you@example.com"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-700">Password *</label>
          <input
            type="password"
            name="password"
            value={signupData.password}
            onChange={(e) =>
              setSignupData((prev) => ({ ...prev, password: e.target.value }))
            }
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="At least 6 characters"
            required
          />
        </div>
        <div>
          <label className="block text-sm text-gray-700">Confirm *</label>
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
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
        </div>
      </div>
      <div>
        <label className="block text-sm text-gray-700">Role</label>
        <select
          name="userType"
          value={signupData.userType}
          onChange={(e) =>
            setSignupData((prev) => ({
              ...prev,
              userType: e.target.value as any,
            }))
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="buyer">Land Buyer / Renter</option>
          <option value="seller">Land Seller / Landlord</option>
          <option value="service_provider">Service Provider</option>
        </select>
      </div>
      <div>
        <label className="block text-sm text-gray-700">County *</label>
        <select
          name="county"
          value={signupData.county}
          onChange={(e) =>
            setSignupData((prev) => ({ ...prev, county: e.target.value }))
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        >
          <option value="">Select County</option>
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
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-300 disabled:opacity-60"
      >
        {loading ? "Creating your account..." : "Sign Up"}
      </button>
      <div className="text-sm text-center text-gray-600">
        Already have an account?{" "}
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="text-green-700 font-semibold hover:underline"
        >
          Back to login
        </button>
      </div>
    </form>
  );

  const renderOtpSignup = () => (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800">Verify your email</h3>
        <p className="text-sm text-gray-600">
          We sent a 6-digit code to <span className="font-semibold">{otpEmail}</span>. Enter it to finish sign up.
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="6-digit code"
        />
        <button
          type="button"
          onClick={handleVerifySignupOtp}
          disabled={loading}
          className="w-full bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-black transition disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Verify & Continue"}
        </button>
        <button
          type="button"
          onClick={() => requestEmailOtp(otpEmail)}
          className="text-sm text-green-700 font-semibold hover:underline self-start"
        >
          Resend code
        </button>
      </div>
      <div className="text-sm text-center text-gray-600">
        Wrong email?{" "}
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className="text-green-700 font-semibold hover:underline"
        >
          Edit details
        </button>
      </div>
    </div>
  );

  const renderForgot = () => (
    <form onSubmit={handleForgot} className="space-y-4">
      <div className="space-y-1">
        <label className="block text-sm text-gray-700">Email</label>
        <input
          type="email"
          value={resetPassword.email}
          onChange={(e) =>
            setResetPassword((prev) => ({ ...prev, email: e.target.value }))
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="you@example.com"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60"
      >
        {loading ? "Sending code..." : "Send reset code"}
      </button>
      <div className="text-sm text-center text-gray-600">
        Remembered your password?{" "}
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="text-green-700 font-semibold hover:underline"
        >
          Back to login
        </button>
      </div>
    </form>
  );

  const renderOtpReset = () => (
    <form onSubmit={handleResetPassword} className="space-y-3">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800">Reset password</h3>
        <p className="text-sm text-gray-600">
          Enter the code sent to <span className="font-semibold">{otpEmail}</span> and your new password.
        </p>
      </div>
      <div className="space-y-1">
        <label className="block text-sm text-gray-700">Email code</label>
        <input
          type="text"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="6-digit code"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm text-gray-700">New password</label>
        <input
          type="password"
          value={resetPassword.newPassword}
          onChange={(e) =>
            setResetPassword((prev) => ({
              ...prev,
              newPassword: e.target.value,
            }))
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="At least 6 characters"
        />
      </div>
      <div className="space-y-1">
        <label className="block text-sm text-gray-700">Confirm password</label>
        <input
          type="password"
          value={resetPassword.confirmPassword}
          onChange={(e) =>
            setResetPassword((prev) => ({
              ...prev,
              confirmPassword: e.target.value,
            }))
          }
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Repeat new password"
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => requestEmailOtp(otpEmail)}
          className="text-green-700 font-semibold hover:underline"
        >
          Resend code
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 text-white px-4 py-2 rounded-lg font-semibold hover:bg-black transition disabled:opacity-60"
        >
          {loading ? "Resetting..." : "Reset & Sign In"}
        </button>
      </div>
      <div className="text-sm text-center text-gray-600">
        Back to{" "}
        <button
          type="button"
          onClick={() => switchMode("login")}
          className="text-green-700 font-semibold hover:underline"
        >
          login
        </button>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-800 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6 space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "login"
              ? "Welcome back"
              : mode === "signup"
              ? "Create your account"
              : mode === "forgot"
              ? "Reset your password"
              : "Verify code"}
          </h1>
          <p className="text-sm text-gray-600">
            One compact flow: login, sign up, OTP, and password reset.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="rounded-lg bg-green-50 text-green-700 px-4 py-3 text-sm">
            {info}
          </div>
        )}

        {mode === "login" && renderLogin()}
        {mode === "signup" && renderSignup()}
        {mode === "otp-signup" && renderOtpSignup()}
        {mode === "forgot" && renderForgot()}
        {mode === "otp-reset" && renderOtpReset()}
      </div>
    </div>
  );
};

export default Login;
