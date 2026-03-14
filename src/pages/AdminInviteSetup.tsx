import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { LegalConsents } from "../types/property";

const defaultConsents: LegalConsents = {
  termsAccepted: false,
  privacyAccepted: false,
  marketingConsent: false,
  dataProcessingConsent: false,
};

const AdminInviteSetup: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { completeAdminInviteSetup, loading } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [consents, setConsents] = useState<LegalConsents>(defaultConsents);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");

  const requiredConsentsAccepted =
    consents.termsAccepted && consents.privacyAccepted && consents.dataProcessingConsent;

  const passwordRuleStatus = useMemo(
    () => ({
      minLength: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    }),
    [password]
  );

  const passwordIsValid = Object.values(passwordRuleStatus).every(Boolean);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!token) {
      setError("This setup link is missing the invite token.");
      return;
    }

    if (!passwordIsValid) {
      setError(
        "Use at least 8 characters with an uppercase letter, lowercase letter, and number."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    if (!requiredConsentsAccepted) {
      setError("Accept the Terms, Privacy Policy, and Data Processing Consent to continue.");
      return;
    }

    try {
      await completeAdminInviteSetup({
        token,
        password,
        legalConsents: consents,
      });
      navigate("/browse", { replace: true });
    } catch (err: any) {
      setError(err?.message || "Account setup failed.");
    }
  };

  return (
    <div className="ui-page-shell">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <section className="grid gap-6 rounded-[2rem] border border-[#d7c5b6] bg-white p-6 shadow-[0_28px_80px_-48px_rgba(88,41,19,0.45)] lg:grid-cols-[1.05fr_0.95fr] lg:p-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e5d4c6] bg-[#fbf4ee] px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-[#8f5135]">
              Congratulations
            </div>
            <div className="space-y-3">
              <h1 className="font-display text-3xl text-[#1f160f] sm:text-4xl">
                You are in.
              </h1>
              <p className="max-w-xl text-sm leading-7 text-stone-600 sm:text-base">
                Set your password to activate your Agrisoko account. Once complete, you will go
                straight to the marketplace.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[#ece0d3] bg-[#fbf7f2] p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#6f3d27]">
                <CheckCircle2 className="h-4 w-4" />
                What happens next
              </div>
              <div className="space-y-3 text-sm text-stone-600">
                <p>1. Set your password and confirm your details.</p>
                <p>2. Agree to the marketplace terms and data handling terms.</p>
                <p>3. Start browsing listings and continue from there.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-[#eadccf] bg-[#fffdfb] p-5 shadow-[0_20px_60px_-50px_rgba(88,41,19,0.45)] sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f6ebe1] text-[#8f5135]">
                <LockKeyhole className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#1f160f]">Set your password</h2>
                <p className="text-sm text-stone-500">Secure your account and continue.</p>
              </div>
            </div>

            {error ? (
              <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">Password</span>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-2xl border border-[#d8c8bc] bg-white px-4 py-3 pr-12 text-sm text-stone-800 outline-none transition focus:border-[#8f5135] focus:ring-2 focus:ring-[#e9d5c4]"
                    placeholder="Use 8+ characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 flex items-center text-stone-500"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-stone-700">
                  Confirm password
                </span>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-2xl border border-[#d8c8bc] bg-white px-4 py-3 pr-12 text-sm text-stone-800 outline-none transition focus:border-[#8f5135] focus:ring-2 focus:ring-[#e9d5c4]"
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((current) => !current)}
                    className="absolute inset-y-0 right-3 flex items-center text-stone-500"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              <div className="rounded-2xl border border-[#efe2d6] bg-[#fbf7f2] px-4 py-3 text-xs text-stone-600">
                <div className="font-semibold uppercase tracking-[0.18em] text-[#8f5135]">
                  Password rules
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <PasswordRule ok={passwordRuleStatus.minLength} label="At least 8 characters" />
                  <PasswordRule ok={passwordRuleStatus.uppercase} label="One uppercase letter" />
                  <PasswordRule ok={passwordRuleStatus.lowercase} label="One lowercase letter" />
                  <PasswordRule ok={passwordRuleStatus.number} label="One number" />
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-[#efe2d6] bg-[#fffaf4] px-4 py-4">
                <ConsentCheckbox
                  checked={consents.termsAccepted}
                  label={
                    <>
                      I agree to the <Link className="text-[#8f5135] underline" to="/terms">Terms of Service</Link>.
                    </>
                  }
                  onChange={(checked) => setConsents((current) => ({ ...current, termsAccepted: checked }))}
                />
                <ConsentCheckbox
                  checked={consents.privacyAccepted}
                  label={
                    <>
                      I have read the <Link className="text-[#8f5135] underline" to="/privacy">Privacy Policy</Link>.
                    </>
                  }
                  onChange={(checked) => setConsents((current) => ({ ...current, privacyAccepted: checked }))}
                />
                <ConsentCheckbox
                  checked={consents.dataProcessingConsent}
                  label="I consent to Agrisoko processing my account data to operate the marketplace."
                  onChange={(checked) =>
                    setConsents((current) => ({ ...current, dataProcessingConsent: checked }))
                  }
                />
                <ConsentCheckbox
                  checked={consents.marketingConsent}
                  label="Send me product updates and marketplace messages."
                  onChange={(checked) => setConsents((current) => ({ ...current, marketingConsent: checked }))}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="ui-btn-primary w-full justify-center rounded-2xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Finishing setup..." : "Set password and continue"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

const PasswordRule = ({ ok, label }: { ok: boolean; label: string }) => (
  <div className={`rounded-xl border px-3 py-2 ${ok ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-[#eadccf] bg-white text-stone-500"}`}>
    {label}
  </div>
);

const ConsentCheckbox = ({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: React.ReactNode;
  onChange: (checked: boolean) => void;
}) => (
  <label className="flex items-start gap-3 text-sm text-stone-600">
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
      className="mt-1 h-4 w-4 rounded border-stone-300 text-[#8f5135] focus:ring-[#e9d5c4]"
    />
    <span>{label}</span>
  </label>
);

export default AdminInviteSetup;
