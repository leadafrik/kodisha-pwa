import React, { useState, useEffect, useRef, useMemo } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import GoogleLoginButton from "../components/GoogleLoginButtonV2";
import FacebookLoginButton from "../components/FacebookLoginButtonV2";
import { useAdaptiveLayout } from "../hooks/useAdaptiveLayout";
import { trackGoogleEvent, trackGooglePageView } from "../utils/cookieConsent";
import { trackTrafficClick } from "../utils/trafficAnalytics";
import { LegalConsents } from "../types/property";

type Mode = "login" | "signup" | "otp-verify" | "forgot" | "otp-reset";
type PasswordFieldKey = "login" | "signup" | "signupConfirm" | "resetNew" | "resetConfirm";
type SocialProvider = "google" | "facebook";

const defaultPasswordVisibility: Record<PasswordFieldKey, boolean> = {
  login: false,
  signup: false,
  signupConfirm: false,
  resetNew: false,
  resetConfirm: false,
};

const defaultSignupConsents: LegalConsents = {
  termsAccepted: false,
  privacyAccepted: false,
  marketingConsent: false,
  dataProcessingConsent: false,
};

const EMAIL_DOMAIN_TYPO_MAP: Record<string, string> = {
  "gamil.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmil.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "yaho.com": "yahoo.com",
  "yhoo.com": "yahoo.com",
  "yahoo.co": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "outlok.com": "outlook.com",
  "outllok.com": "outlook.com",
  "outlook.co": "outlook.com",
  "outlook.con": "outlook.com",
  "hotmial.com": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmail.co": "hotmail.com",
  "icloud.co": "icloud.com",
  "iclod.com": "icloud.com",
  "protonmai.com": "protonmail.com",
  "protonmail.co": "protonmail.com",
};

const getEmailTypoSuggestion = (email: string): string | null => {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf("@");
  if (atIndex <= 0 || atIndex === trimmed.length - 1) return null;
  const local = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);
  const correctedDomain = EMAIL_DOMAIN_TYPO_MAP[domain];
  if (!correctedDomain || correctedDomain === domain) return null;
  return `${local}@${correctedDomain}`;
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
  const { isPhone, isCompact } = useAdaptiveLayout();

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get("mode");
  const inviteCodeFromQuery = (
    searchParams.get("invite") ||
    searchParams.get("ref") ||
    searchParams.get("code") ||
    ""
  )
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
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
    confirmEmail: "",
    password: "",
    inviteCode: inviteCodeFromQuery,
  });
  const [signupConsents, setSignupConsents] = useState<LegalConsents>(
    defaultSignupConsents
  );
  const signupConsentRef = useRef<HTMLDivElement | null>(null);
  const [pendingSocialProvider, setPendingSocialProvider] = useState<SocialProvider | null>(null);
  const [showSignupConsentModal, setShowSignupConsentModal] = useState(false);
  const [socialStartSignals, setSocialStartSignals] = useState({
    google: 0,
    facebook: 0,
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
  const signupDefaultNext = "/create-listing?compact=1";
  const redirectTo =
    searchParams.get("next") ||
    (mode === "signup" || mode === "otp-verify" ? signupDefaultNext : "/profile");
  const requiredSignupConsentsAccepted =
    signupConsents.termsAccepted &&
    signupConsents.privacyAccepted &&
    signupConsents.dataProcessingConsent;
  const normalizedSignupEmail = signupData.emailOrPhone.trim().toLowerCase();
  const normalizedSignupConfirmEmail = signupData.confirmEmail.trim().toLowerCase();
  const emailTypoSuggestion = useMemo(
    () => getEmailTypoSuggestion(normalizedSignupEmail),
    [normalizedSignupEmail]
  );
  const emailMismatch =
    !!normalizedSignupConfirmEmail && normalizedSignupEmail !== normalizedSignupConfirmEmail;

  const promptConsentBeforeSocialSignup = (message: string) => {
    setError(null);
    setInfo(message);
  };

  const queueSocialSignup = (provider: SocialProvider, message: string) => {
    setPendingSocialProvider(provider);
    setShowSignupConsentModal(true);
    promptConsentBeforeSocialSignup(message);
  };

  const dismissSocialConsentModal = () => {
    setPendingSocialProvider(null);
    setShowSignupConsentModal(false);
  };

  const continuePendingSocialSignup = () => {
    if (!pendingSocialProvider || !requiredSignupConsentsAccepted) return;

    setInfo(
      pendingSocialProvider === "google"
        ? "Continuing with Google..."
        : "Continuing with Facebook..."
    );
    setSocialStartSignals((prev) => ({
      ...prev,
      [pendingSocialProvider]: prev[pendingSocialProvider] + 1,
    }));
    setShowSignupConsentModal(false);
    setPendingSocialProvider(null);
  };

  useEffect(() => {
    if (mode !== "signup") {
      setPendingSocialProvider(null);
      setShowSignupConsentModal(false);
    }
  }, [mode]);

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

  useEffect(() => {
    if (mode !== "signup") return;

    trackGooglePageView({
      pagePath: "/login?mode=signup",
      pageTitle: "Agrisoko Signup",
    });
    trackGoogleEvent("view_sign_up_page", {
      page_path: "/login?mode=signup",
    });
    trackTrafficClick({
      action: "funnel_signup_view",
      target: "/login",
    });
  }, [mode]);

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

    const signupPassword = signupData.password || "";
    const passwordIsStrongEnough =
      signupPassword.length >= 8 &&
      /[A-Z]/.test(signupPassword) &&
      /[a-z]/.test(signupPassword) &&
      /[0-9]/.test(signupPassword);

    if (!passwordIsStrongEnough) {
      setError("Use at least 8 characters with an uppercase letter, lowercase letter, and number.");
      return;
    }

    if (!requiredSignupConsentsAccepted) {
      setError("Accept the Terms, Privacy Policy, and Data Processing Consent to continue.");
      return;
    }

    const input = signupData.emailOrPhone.trim();
    if (!input.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    const email = input.toLowerCase();
    const confirmEmail = signupData.confirmEmail.trim().toLowerCase();

    if (!confirmEmail) {
      setError("Please confirm your email address.");
      return;
    }

    if (confirmEmail !== email) {
      setError("Email and confirm email do not match.");
      return;
    }

    if (emailTypoSuggestion && emailTypoSuggestion !== email) {
      setError(`Possible typo detected. Did you mean ${emailTypoSuggestion}?`);
      return;
    }

    try {
      await register({
        name: signupData.name,
        email: email,
        phone: undefined,
        password: signupData.password,
        type: defaultUserType,
        inviteCode: signupData.inviteCode.trim() || undefined,
        legalConsents: signupConsents,
      });
      trackGoogleEvent("sign_up", { method: "email" });
      trackTrafficClick({
        action: "funnel_signup_complete_email",
        target: "/login",
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
        <GoogleLoginButton
          onSuccess={() => {
            trackTrafficClick({
              action: "funnel_signin_google_success",
              target: redirectTo,
            });
            navigate(redirectTo);
          }}
          onError={(error) => setError(error)}
          className="text-sm w-full"
        />
        <div className="grid grid-cols-1 gap-3">
          <FacebookLoginButton
            onSuccess={() => {
              trackTrafficClick({
                action: "funnel_signin_facebook_success",
                target: redirectTo,
              });
              navigate(redirectTo);
            }}
            onError={(error) => setError(error)}
            className="text-sm w-full"
          />
        </div>
        <p className="text-center text-xs text-emerald-700">
          Fastest path: continue with Google.
        </p>
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
          className="ui-input placeholder:text-gray-400"
          placeholder="name@example.com"
        />
      </div>

      {/* Password */}
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-2">Password</label>
        <div className="relative">
          <input
            type={visiblePasswords.login ? "text" : "password"}
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            className="ui-input pr-10 placeholder:text-gray-400"
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
        className="ui-btn-primary w-full"
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
        className="block w-full text-center text-sm text-emerald-700 hover:text-emerald-800 hover:underline font-medium"
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
            className="font-semibold text-emerald-700 hover:text-emerald-800"
          >
            Create an account
          </button>
        </p>
      </div>
    </form>
  );

  const renderSignup = () => (
    <>
    <form onSubmit={handleSignupSubmit} className="space-y-4">
      <div className="space-y-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-4 py-3">
        <p className="text-center text-xs font-semibold text-emerald-700 uppercase tracking-widest">
          Quick signup
        </p>
        <p className="text-center text-sm text-emerald-900">
          Tap Google, Facebook, or email. Required consent is captured once.
        </p>
        <GoogleLoginButton
          legalConsents={signupConsents}
          onSuccess={() => {
            trackGoogleEvent("sign_up", { method: "google" });
            trackTrafficClick({
              action: "funnel_signup_complete_google",
              target: redirectTo,
            });
            navigate(redirectTo);
          }}
          onError={(error) => setError(error)}
          onBlocked={(message) => queueSocialSignup("google", message)}
          blockedReason={
            requiredSignupConsentsAccepted
              ? undefined
              : "Tick the 3 required consent boxes below. Google signup will continue automatically."
          }
          startSignal={socialStartSignals.google}
          className="text-sm w-full"
        />
        <FacebookLoginButton
          legalConsents={signupConsents}
          onSuccess={() => {
            trackGoogleEvent("sign_up", { method: "facebook" });
            trackTrafficClick({
              action: "funnel_signup_complete_facebook",
              target: redirectTo,
            });
            navigate(redirectTo);
          }}
          onError={(error) => setError(error)}
          onBlocked={(message) => queueSocialSignup("facebook", message)}
          blockedReason={
            requiredSignupConsentsAccepted
              ? undefined
              : "Tick the 3 required consent boxes below. Facebook signup will continue automatically."
          }
          startSignal={socialStartSignals.facebook}
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
            className="ui-input"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email *</label>
          <input
            type="email"
            value={signupData.emailOrPhone}
            onChange={(e) =>
              setSignupData({ ...signupData, emailOrPhone: e.target.value })
            }
            className="ui-input"
            placeholder="your.email@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm email *</label>
          <input
            type="email"
            value={signupData.confirmEmail}
            onChange={(e) =>
              setSignupData({ ...signupData, confirmEmail: e.target.value })
            }
            className="ui-input"
            placeholder="Re-enter your email"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Password *</label>
          <div className="relative">
            <input
              type={visiblePasswords.signup ? "text" : "password"}
              value={signupData.password}
              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
              className="ui-input pr-10"
              placeholder="Use 8+ characters"
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
      </div>

      {emailMismatch && (
        <p className="text-xs text-red-600">Email and confirm email do not match.</p>
      )}

      {emailTypoSuggestion && emailTypoSuggestion !== normalizedSignupEmail && (
        <div className="rounded-xl border border-[#c9d7c4] bg-[#edf4e9] px-3 py-2.5 text-sm text-[#435846]">
          <p className="font-semibold">Possible typo in email domain.</p>
          <button
            type="button"
            onClick={() =>
              setSignupData((prev) => ({
                ...prev,
                emailOrPhone: emailTypoSuggestion,
                confirmEmail: emailTypoSuggestion,
              }))
            }
            className="mt-1 text-sm font-semibold text-[#586f58] hover:text-[#4d6250]"
          >
            Use {emailTypoSuggestion}
          </button>
        </div>
      )}

      <div ref={signupConsentRef} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
          Required before signup
        </p>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={signupConsents.termsAccepted}
            onChange={(e) =>
              setSignupConsents((prev) => ({
                ...prev,
                termsAccepted: e.target.checked,
              }))
            }
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
          />
          <span>
            I agree to the <a href="/legal/terms" className="font-semibold text-emerald-700 hover:underline">Terms of Service</a>.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={signupConsents.privacyAccepted}
            onChange={(e) =>
              setSignupConsents((prev) => ({
                ...prev,
                privacyAccepted: e.target.checked,
              }))
            }
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
          />
          <span>
            I have read the <a href="/legal/privacy" className="font-semibold text-emerald-700 hover:underline">Privacy Policy</a>.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={signupConsents.dataProcessingConsent}
            onChange={(e) =>
              setSignupConsents((prev) => ({
                ...prev,
                dataProcessingConsent: e.target.checked,
              }))
            }
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
          />
          <span>
            I consent to Agrisoko processing my account and verification data to operate the marketplace and verify trust signals.
          </span>
        </label>
        <label className="flex items-start gap-3 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={signupConsents.marketingConsent}
            onChange={(e) =>
              setSignupConsents((prev) => ({
                ...prev,
                marketingConsent: e.target.checked,
              }))
            }
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
          />
          <span>Send me product updates and marketing messages.</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading || !requiredSignupConsentsAccepted}
        className="ui-btn-primary w-full"
      >
        {loading ? "Creating account..." : "Create Free Account"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode("login");
          resetMessages();
        }}
        className="ui-btn-ghost w-full"
      >
        Already have account? Sign in
      </button>
    </form>
    {showSignupConsentModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-slate-900/45"
          onClick={dismissSocialConsentModal}
        />
        <div className="relative z-10 w-full max-w-md rounded-3xl bg-white p-5 shadow-2xl">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Complete once
            </p>
            <h3 className="text-xl font-semibold text-slate-900">
              Finish the required consent boxes
            </h3>
            <p className="text-sm text-slate-600">
              Tick the required boxes, optionally choose marketing updates, then continue with{" "}
              {pendingSocialProvider === "facebook" ? "Facebook" : "Google"}.
            </p>
          </div>

          <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={signupConsents.termsAccepted}
                onChange={(e) =>
                  setSignupConsents((prev) => ({
                    ...prev,
                    termsAccepted: e.target.checked,
                  }))
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
              />
              <span>
                I agree to the{" "}
                <a href="/legal/terms" className="font-semibold text-emerald-700 hover:underline">
                  Terms of Service
                </a>
                .
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={signupConsents.privacyAccepted}
                onChange={(e) =>
                  setSignupConsents((prev) => ({
                    ...prev,
                    privacyAccepted: e.target.checked,
                  }))
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
              />
              <span>
                I have read the{" "}
                <a href="/legal/privacy" className="font-semibold text-emerald-700 hover:underline">
                  Privacy Policy
                </a>
                .
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={signupConsents.dataProcessingConsent}
                onChange={(e) =>
                  setSignupConsents((prev) => ({
                    ...prev,
                    dataProcessingConsent: e.target.checked,
                  }))
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
              />
              <span>
                I consent to Agrisoko processing my account and verification data to operate the marketplace and verify trust signals.
              </span>
            </label>
            <label className="flex items-start gap-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={signupConsents.marketingConsent}
                onChange={(e) =>
                  setSignupConsents((prev) => ({
                    ...prev,
                    marketingConsent: e.target.checked,
                  }))
                }
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
              />
              <span>Send me product updates and marketing messages.</span>
            </label>
          </div>

          <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={dismissSocialConsentModal}
              className="ui-btn-ghost min-h-[40px] rounded-full px-4 py-2"
            >
              Close
            </button>
            <button
              type="button"
              onClick={continuePendingSocialSignup}
              disabled={!requiredSignupConsentsAccepted}
              className="ui-btn-primary min-h-[40px] rounded-full px-4 py-2"
            >
              {pendingSocialProvider === "facebook" ? "Continue with Facebook" : "Continue with Google"}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
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
          className="ui-input text-center text-2xl tracking-widest"
          placeholder="000000"
          maxLength={6}
        />
      </div>

      <button
        type="submit"
        disabled={loading || !otpCode.trim()}
        className="ui-btn-primary w-full py-3"
      >
        {loading ? "Verifying..." : "Verify Code"}
      </button>

      <button
        type="button"
        onClick={handleResendOtp}
        disabled={!canResendOtp}
        className="ui-btn-ghost w-full"
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
          className="ui-input"
          placeholder="you@example.com"
        />
        <p className="mt-2 text-xs text-gray-500">
          For now, password resets are sent by email only.
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="ui-btn-primary w-full py-3"
      >
        {loading ? "Sending..." : "Send Reset Code"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode("login");
          resetMessages();
        }}
        className="ui-btn-ghost w-full"
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
          className="ui-input"
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
            className="ui-input pr-10"
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
            className="ui-input pr-10"
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
        className="ui-btn-primary w-full py-3"
      >
        {loading ? "Resetting..." : "Reset Password"}
      </button>

      <button
        type="button"
        onClick={handleResendOtp}
        disabled={!canResendOtp}
        className="ui-btn-ghost w-full text-sm"
      >
        {canResendOtp ? "Resend Code" : `Resend in ${otpTimer}s`}
      </button>
    </form>
  );

  const modeTitle =
    mode === "signup"
      ? isPhone
        ? "Create account"
        : "Create your free account"
      : mode === "forgot"
        ? "Reset your password"
        : mode === "otp-verify"
          ? "Verify your email"
          : mode === "otp-reset"
            ? "Set a new password"
            : "Welcome back";

  const modeSubtitle =
    mode === "signup"
      ? isPhone
        ? "About 10 seconds."
        : "Create your account in about 10 seconds."
      : mode === "forgot" || mode === "otp-reset"
        ? "Use your email address to regain secure access."
        : mode === "otp-verify"
          ? "Enter the code we sent to complete your account setup."
          : "Sign in securely to continue.";

  return (
    <div className="relative overflow-hidden bg-[#f8fbf6]">
      <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-[#d8e8d4]/50 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-72 w-72 rounded-full bg-[#e8f0e3]/70 blur-3xl" />

      <div className="px-4 py-8 md:py-12">
        <div className="mx-auto grid w-full max-w-6xl items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <aside className="hidden lg:flex flex-col justify-between rounded-3xl border border-[#c9d7c4] bg-[#6b856b] p-10 text-white shadow-sm">
            <div>
              <img src="/logo192.png" alt="" aria-hidden="true" className="h-12 w-12 rounded-xl bg-white/10 p-1" />
              <h1 className="mt-5 text-4xl font-bold leading-tight">Agrisoko</h1>
              <p className="mt-2 text-sm text-[#eef5eb]">
                Trusted agricultural marketplace across Kenya.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs font-medium text-emerald-50/95">
              <span className="rounded-full bg-white/15 px-3 py-1">Verified profiles</span>
              <span className="rounded-full bg-white/15 px-3 py-1">Secure login</span>
              <span className="rounded-full bg-white/15 px-3 py-1">Direct chat</span>
              <span className="rounded-full bg-white/15 px-3 py-1">Fast signup</span>
            </div>
          </aside>

          <section className="w-full max-w-md mx-auto lg:max-w-none">
            <div className="mb-4 rounded-2xl border border-emerald-100 bg-white/90 p-4 backdrop-blur lg:hidden">
              <div className="flex items-center gap-3">
                <img src="/logo192.png" alt="" aria-hidden="true" className="h-10 w-10 rounded-xl bg-emerald-50 p-1" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Agrisoko</p>
                  <p className="text-xs text-slate-600">Trusted agricultural marketplace across Kenya.</p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-5 shadow-xl backdrop-blur sm:p-6 md:p-8">
              <div className="mb-6">
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

            {!isCompact && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">Secure login</span>
                <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1">Verified profiles</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Login;

