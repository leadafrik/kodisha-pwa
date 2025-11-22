import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { kenyaCounties } from "../data/kenyaCounties";

type Mode = "login" | "register";

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
  const { login, requestEmailOtp, verifyEmailOtp, register, loading } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [otpStep, setOtpStep] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [loginData, setLoginData] = useState({
    emailOrPhone: "",
    password: "",
  });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "buyer" as "buyer" | "seller" | "service_provider",
    county: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!loginData.emailOrPhone.trim() || !loginData.password.trim()) {
      setError("Enter your email/phone and password.");
      return;
    }
    try {
      await login(loginData.emailOrPhone.trim(), loginData.password.trim());
      navigate("/profile");
    } catch (err: any) {
      setError(err?.message || "Login failed. Check your credentials.");
    }
  };

  const handleSendOtp = async (email: string) => {
    await requestEmailOtp(email);
    setOtpEmail(email);
    setOtpStep(true);
    setInfo("We sent a 6-digit code to your email. Enter it to finish sign up.");
  };

  const handleVerifyCode = async () => {
    setError(null);
    setInfo(null);
    if (!otpEmail.trim() || !otpCode.trim()) {
      setError("Enter both email and code.");
      return;
    }
    try {
      await verifyEmailOtp(otpEmail.trim(), otpCode.trim());
      navigate("/profile");
    } catch (err: any) {
      setError(err?.message || "Invalid code.");
    }
  };

  const handleResendOtp = async () => {
    setError(null);
    setInfo(null);
    if (!otpEmail) {
      setError("Enter your email first.");
      return;
    }
    try {
      await handleSendOtp(otpEmail);
    } catch (err: any) {
      setError(err?.message || "Failed to resend code.");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!formData.name.trim() || !formData.email.trim() || !formData.county) {
      setError("Please fill in name, email, and county.");
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      await register({
        name: formData.name,
        phone: formData.email || undefined, // temp: use email as phone surrogate
        email: formData.email || undefined,
        password: formData.password,
        type: formData.userType,
        county: formData.county,
      });

      await handleSendOtp(formData.email);
      // Stay on the registration view while verifying OTP so the user does not get bounced to login.
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-800 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Kodisha Access</h1>
            <p className="text-gray-600">
              Sign in with password, or create an account and verify once via email
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                mode === "login"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                mode === "register"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="mb-4 rounded-lg bg-green-50 text-green-700 px-4 py-3 text-sm">
            {info}
          </div>
        )}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Email or Phone</label>
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
            <div>
              <label className="block text-gray-700 mb-2">Password</label>
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
          </form>
        ) : (
          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. Wanjiru Kamau"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Password *</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="At least 6 characters"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Confirm Password *</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">What best describes you?</label>
              <select
                name="userType"
                value={formData.userType}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="buyer">Land Buyer / Renter</option>
                <option value="seller">Land Seller / Landlord</option>
                <option value="service_provider">Service Provider</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">County *</label>
              <select
                name="county"
                value={formData.county}
                onChange={handleChange}
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
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition duration-300 disabled:opacity-60"
              >
                {loading ? "Creating your account..." : "Create Account"}
              </button>
            </div>
          </form>
        )}

        {otpStep && (
          <div className="mt-6 border-t pt-6 bg-gray-50 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Verify your email</h3>
            <p className="text-sm text-gray-600 mb-4">
              We sent a code to <span className="font-semibold">{otpEmail}</span>. Enter it to finish sign up.
            </p>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="6-digit code"
              />
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={loading}
                className="px-6 py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </div>
            <div className="mt-3 flex flex-col md:flex-row md:items-center md:justify-between text-sm text-gray-600 gap-2">
              <span>Didn&apos;t get it? Check spam or resend.</span>
              <button
                type="button"
                onClick={handleResendOtp}
                className="text-green-700 font-semibold hover:underline"
              >
                Resend code
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;
