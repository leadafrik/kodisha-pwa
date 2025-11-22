import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

type Mode = "login" | "register";

const counties = [
  "Baringo",
  "Bomet",
  "Bungoma",
  "Busia",
  "Elgeyo-Marakwet",
  "Embu",
  "Garissa",
  "Homa Bay",
  "Isiolo",
  "Kajiado",
  "Kakamega",
  "Kericho",
  "Kiambu",
  "Kilifi",
  "Kirinyaga",
  "Kisii",
  "Kisumu",
  "Kitui",
  "Kwale",
  "Laikipia",
  "Lamu",
  "Machakos",
  "Makueni",
  "Mandera",
  "Marsabit",
  "Meru",
  "Migori",
  "Mombasa",
  "Murang'a",
  "Nairobi",
  "Nakuru",
  "Nandi",
  "Narok",
  "Nyamira",
  "Nyandarua",
  "Nyeri",
  "Samburu",
  "Siaya",
  "Taita-Taveta",
  "Tana River",
  "Tharaka-Nithi",
  "Trans Nzoia",
  "Turkana",
  "Uasin Gishu",
  "Vihiga",
  "Wajir",
  "West Pokot",
];

const Login: React.FC = () => {
  const {
    requestEmailOtp,
    verifyEmailOtp,
    register,
    loading,
  } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "buyer" as "buyer" | "seller" | "service_provider",
    county: "",
  });

  const handleSendCode = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim()) {
      setError("Enter your email to receive a code.");
      return;
    }
    try {
      await requestEmailOtp(email.trim());
      setCodeSent(true);
      setInfo("Code sent to your email. Enter it below to continue.");
    } catch (err: any) {
      setError(err?.message || "Failed to send code.");
    }
  };

  const handleVerifyCode = async () => {
    setError(null);
    setInfo(null);
    if (!email.trim() || !code.trim()) {
      setError("Enter both email and code.");
      return;
    }
    try {
      await verifyEmailOtp(email.trim(), code.trim());
      navigate("/profile");
    } catch (err: any) {
      setError(err?.message || "Invalid code.");
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

      // Immediately trigger email OTP flow and stay on this screen
      setEmail(formData.email);
      await handleSendCode();
      setMode("login");
      setInfo("Account created. Enter the code we sent to your email.");
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
            <h1 className="text-3xl font-bold text-gray-800">
              Kodisha Access
            </h1>
            <p className="text-gray-600">
              Login with email OTP or create a new account
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
          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="you@example.com"
              />
            </div>
            {codeSent && (
              <div>
                <label className="block text-gray-700 mb-2">
                  Enter OTP Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="6-digit code"
                />
              </div>
            )}
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleSendCode}
                disabled={loading}
                className="flex-1 bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60"
              >
                {codeSent ? "Resend Code" : "Send Code"}
              </button>
              {codeSent && (
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={loading}
                  className="flex-1 bg-gray-800 text-white py-3 rounded-lg font-semibold hover:bg-gray-900 transition disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Prefer phone OTP? Use the app or ask support to switch your account
              to phone-based login.
            </p>
          </div>
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
              <label className="block text-gray-700 mb-2">
                What best describes you?
              </label>
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
                {counties.map((county) => (
                  <option key={county} value={county}>
                    {county}
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
      </div>
    </div>
  );
};

export default Login;
