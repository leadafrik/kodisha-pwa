import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2, CheckCircle2, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { kenyaCounties } from "../data/kenyaCounties";
import {
  BulkAccessStatusResponse,
  BulkApplicationInput,
  BulkRole,
  getMyBulkAccessStatus,
  submitBulkApplication,
} from "../services/bulkApplicationsService";

const INSTITUTION_TYPES = [
  { value: "farm", label: "Farm" },
  { value: "cooperative", label: "Cooperative" },
  { value: "restaurant", label: "Restaurant" },
  { value: "hotel", label: "Hotel" },
  { value: "hospital", label: "Hospital" },
  { value: "school", label: "School" },
  { value: "processor", label: "Processor" },
  { value: "distributor", label: "Distributor" },
  { value: "retailer", label: "Retailer" },
  { value: "ngo", label: "NGO" },
  { value: "government", label: "Government" },
  { value: "other", label: "Other" },
] as const;

const DELIVERY_COVERAGE = [
  { value: "countrywide", label: "Countrywide" },
  { value: "within_county", label: "Within county" },
  { value: "negotiable", label: "Negotiable" },
] as const;

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "as_needed", label: "As needed" },
] as const;

const ROLE_OPTIONS = [
  { value: "buyer", label: "Bulk buyer" },
  { value: "seller", label: "Bulk seller" },
] as const;

const statusLabel = (status: string) => {
  if (status === "approved") return "Approved";
  if (status === "pending") return "Pending review";
  if (status === "rejected") return "Needs update";
  return "Not applied";
};

const BulkApplications: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const roleParam = useMemo(() => {
    const parsed = new URLSearchParams(location.search).get("role");
    return parsed === "seller" ? "seller" : "buyer";
  }, [location.search]);

  const [role, setRole] = useState<BulkRole>(roleParam);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState<BulkAccessStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<BulkApplicationInput>({
    role: roleParam,
    contactName: user?.fullName || user?.name || "",
    organizationName: "",
    institutionType: "farm",
    address: {
      county: user?.county || "",
      constituency: "",
      ward: "",
      streetAddress: "",
    },
    phone: user?.phone || "",
    email: user?.email || "",
    products: [],
    yearsInAgriculture: undefined,
    deliveryCoverage: "within_county",
    procurementFrequency: "weekly",
    monthlyVolume: "",
    estimatedBudgetPerOrder: "",
    notes: "",
  });
  const [productsInput, setProductsInput] = useState("");

  useEffect(() => {
    setRole(roleParam);
    setForm((prev) => ({ ...prev, role: roleParam }));
  }, [roleParam]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    setLoadingStatus(true);
    setError("");
    getMyBulkAccessStatus()
      .then((data) => {
        if (!active) return;
        setStatus(data);
      })
      .catch((err: any) => {
        if (!active) return;
        setError(err?.message || "Unable to load bulk access status.");
      })
      .finally(() => {
        if (active) setLoadingStatus(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const buyerStatus = status?.buyerStatus || "not_applied";
  const sellerStatus = status?.sellerStatus || "not_applied";
  const activeRoleStatus = role === "buyer" ? buyerStatus : sellerStatus;
  const roleReviewNote =
    role === "buyer" ? status?.reviewNotes?.buyer : status?.reviewNotes?.seller;

  const canPostB2B = Boolean(status?.canPostB2BDemand || status?.isAdmin);
  const canRespondB2B = Boolean(status?.canRespondToB2BDemand || status?.isAdmin);

  const updateField = <K extends keyof BulkApplicationInput>(
    key: K,
    value: BulkApplicationInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateAddress = (key: keyof BulkApplicationInput["address"], value: string) => {
    setForm((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [key]: value,
      },
    }));
  };

  const validate = (): string | null => {
    if (!form.contactName.trim()) return "Contact name is required.";
    if (!form.organizationName.trim()) return "Farm or institution name is required.";
    if (!form.address.county.trim()) return "County is required.";
    if (!form.phone.trim()) return "Phone number is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!productsInput.trim()) return "Add products you buy or sell.";
    if (role === "seller" && (form.yearsInAgriculture === undefined || form.yearsInAgriculture < 0)) {
      return "Years in agriculture is required for bulk sellers.";
    }
    return null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const parsedProducts = productsInput
      .split(/\n|,/g)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);

    if (!parsedProducts.length) {
      setError("Add at least one product.");
      return;
    }

    try {
      setSubmitting(true);
      await submitBulkApplication({
        ...form,
        role,
        products: parsedProducts,
      });
      setNotice(
        "Application submitted. Our admin team will review and call the number provided."
      );
      const refreshed = await getMyBulkAccessStatus();
      setStatus(refreshed);
    } catch (err: any) {
      setError(err?.message || "Failed to submit bulk application.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Bulk buyers & sellers</h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in first to submit a bulk access application.
          </p>
          <div className="mt-6">
            <Link
              to={`/login?mode=signup&next=${encodeURIComponent("/bulk")}`}
              className="inline-flex items-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Sign in to continue
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
            <Building2 className="h-4 w-4" />
            Bulk buyers & sellers
          </div>
          <h1 className="mt-3 text-xl font-semibold sm:text-2xl">Bulk buyer/seller access</h1>
          <p className="mt-2 text-sm text-slate-600">
            We review each bulk account manually so institutional demand stays trusted.
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-[minmax(0,240px)_minmax(0,1fr)]">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                Role
              </label>
              <select
                value={role}
                onChange={(event) => {
                  const nextRole = event.target.value as BulkRole;
                  setRole(nextRole);
                  updateField("role", nextRole);
                }}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Buyer status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{statusLabel(buyerStatus)}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Seller status</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{statusLabel(sellerStatus)}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Bulk buyer portal</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{canPostB2B ? "Approved" : "Not approved yet"}</p>
              <p className="mt-1 text-xs text-slate-500">Post bulk requirements and manage bids.</p>
              <Link
                to={canPostB2B ? "/bulk/orders/new" : "/bulk?role=buyer"}
                className={`mt-2 inline-flex rounded-lg px-3 py-2 text-xs font-semibold ${
                  canPostB2B
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {canPostB2B ? "Post bulk order" : "Apply as buyer"}
              </Link>
            </div>
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Bulk seller portal</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">{canRespondB2B ? "Approved" : "Not approved yet"}</p>
              <p className="mt-1 text-xs text-slate-500">View bulk orders and submit bids.</p>
              <Link
                to={canRespondB2B ? "/bulk/seller/orders" : "/bulk?role=seller"}
                className={`mt-2 inline-flex rounded-lg px-3 py-2 text-xs font-semibold ${
                  canRespondB2B
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "border border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {canRespondB2B ? "Open seller portal" : "Apply as seller"}
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {role === "buyer" ? "Bulk buyer application" : "Bulk seller application"}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Open the form only when you are ready to apply.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              {showForm ? "Hide application form" : "Open application form"}
              {showForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {loadingStatus && (
            <p className="mt-4 text-sm text-slate-500">Loading your current access status...</p>
          )}

          {roleReviewNote && activeRoleStatus === "rejected" && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Admin note: {roleReviewNote}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}
          {notice && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {notice}
            </div>
          )}

          {!showForm && (
            <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              Form is hidden to keep this page clean. Use <strong>Open application form</strong> when ready.
            </p>
          )}

          {showForm && (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Contact person
                  </label>
                  <input
                    value={form.contactName}
                    onChange={(e) => updateField("contactName", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder="Name of contact person"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Farm or institution name
                  </label>
                  <input
                    value={form.organizationName}
                    onChange={(e) => updateField("organizationName", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder="Farm / institution"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Institution type
                  </label>
                  <select
                    value={form.institutionType}
                    onChange={(e) =>
                      updateField("institutionType", e.target.value as BulkApplicationInput["institutionType"])
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    {INSTITUTION_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Delivery coverage
                  </label>
                  <select
                    value={form.deliveryCoverage}
                    onChange={(e) =>
                      updateField(
                        "deliveryCoverage",
                        e.target.value as BulkApplicationInput["deliveryCoverage"]
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    {DELIVERY_COVERAGE.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    County
                  </label>
                  <select
                    value={form.address.county}
                    onChange={(e) => updateAddress("county", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    <option value="">Select county</option>
                    {kenyaCounties.map((county) => (
                      <option key={county.name} value={county.name}>
                        {county.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Street address
                  </label>
                  <input
                    value={form.address.streetAddress || ""}
                    onChange={(e) => updateAddress("streetAddress", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder="Street / area"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Phone number
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder="+2547..."
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  {role === "buyer" ? "Products you need" : "Products you sell"}
                </label>
                <textarea
                  value={productsInput}
                  onChange={(e) => setProductsInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  rows={3}
                  placeholder="Example: maize, onions, certified seeds"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Frequency
                  </label>
                  <select
                    value={form.procurementFrequency || "weekly"}
                    onChange={(e) =>
                      updateField(
                        "procurementFrequency",
                        e.target.value as BulkApplicationInput["procurementFrequency"]
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    {FREQUENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Monthly volume
                  </label>
                  <input
                    value={form.monthlyVolume || ""}
                    onChange={(e) => updateField("monthlyVolume", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder="e.g. 20 tonnes"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Budget per order
                  </label>
                  <input
                    value={form.estimatedBudgetPerOrder || ""}
                    onChange={(e) => updateField("estimatedBudgetPerOrder", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                    placeholder="e.g. KES 250,000"
                  />
                </div>
              </div>

              {role === "seller" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Years in agriculture
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.yearsInAgriculture ?? ""}
                    onChange={(e) =>
                      updateField(
                        "yearsInAgriculture",
                        e.target.value === "" ? undefined : Number(e.target.value)
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Additional notes
                </label>
                <textarea
                  value={form.notes || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  rows={3}
                  placeholder="Anything your onboarding team should know"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex items-start gap-2 text-sm text-slate-600">
                  {activeRoleStatus === "approved" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                  )}
                  <span>
                    Current status for this role:{" "}
                    <strong className="text-slate-900">{statusLabel(activeRoleStatus)}</strong>
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:bg-slate-300"
                >
                  {submitting ? "Submitting..." : "Submit application"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </main>
  );

};

export default BulkApplications;
