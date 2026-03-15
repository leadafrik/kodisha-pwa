import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2, CheckCircle2, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import {
  getConstituenciesByCounty,
  getWardsByConstituency,
  kenyaCounties,
} from "../data/kenyaCounties";
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
  const canRespondB2B = Boolean(
    status?.canRespondToB2BDemand || status?.canOfferToOpenDemand || status?.isAdmin
  );
  const constituencyOptions = useMemo(
    () => (form.address.county ? getConstituenciesByCounty(form.address.county) : []),
    [form.address.county]
  );
  const wardOptions = useMemo(
    () =>
      form.address.county && form.address.constituency
        ? getWardsByConstituency(form.address.county, form.address.constituency)
        : [],
    [form.address.county, form.address.constituency]
  );

  useEffect(() => {
    if (!form.address.county) {
      if (form.address.constituency || form.address.ward) {
        updateAddress("constituency", "");
        updateAddress("ward", "");
      }
      return;
    }

    const constituencyIsValid = getConstituenciesByCounty(form.address.county).some(
      (option) => option.value === form.address.constituency
    );
    if (!constituencyIsValid && form.address.constituency) {
      updateAddress("constituency", "");
      updateAddress("ward", "");
      return;
    }

    if (form.address.constituency && form.address.ward) {
      const wardIsValid = getWardsByConstituency(
        form.address.county,
        form.address.constituency
      ).some((option) => option.value === form.address.ward);
      if (!wardIsValid) {
        updateAddress("ward", "");
      }
    }
  }, [form.address.county, form.address.constituency, form.address.ward]);

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
      <main className="ui-page-shell px-4 py-12">
        <div className="ui-card mx-auto max-w-2xl p-8">
          <p className="ui-section-kicker">Bulk buying</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-900">
            Buyer approval starts after sign in
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            Sign in first to submit a bulk access application.
          </p>
          <div className="mt-6">
            <Link
              to={`/login?mode=signup&next=${encodeURIComponent("/bulk")}`}
              className="ui-btn-primary px-5 py-3 text-sm"
            >
              Sign in to continue
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="ui-page-shell px-4 py-10 text-stone-900">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="ui-hero-panel p-5 md:p-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F3C9BE] bg-[#FDF5F3] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A0452E]">
            <Building2 className="h-4 w-4" />
            Bulk buying access
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
            Apply once, then post institutional demand with confidence
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-stone-600">
            Agrisoko reviews bulk accounts manually so restaurants, schools, processors, and distributors can source from a trusted order board.
          </p>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            <div>
              <label className="ui-label">
                Application role
              </label>
              <select
                value={role}
                onChange={(event) => {
                  const nextRole = event.target.value as BulkRole;
                  setRole(nextRole);
                  updateField("role", nextRole);
                }}
                className="ui-input"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="ui-card-soft p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                Bulk buyer portal
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-900">{statusLabel(buyerStatus)}</p>
              <p className="mt-1 text-xs text-stone-600">
                Post procurement needs, compare bids, and move buyers to decision faster.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={canPostB2B ? "/bulk/orders/new" : "/bulk?role=buyer"}
                  className={`inline-flex rounded-xl px-3 py-2 text-xs font-semibold ${
                    canPostB2B
                      ? "bg-[#A0452E] text-white hover:bg-[#8B3525]"
                      : "border border-stone-200 bg-white text-stone-700 hover:bg-[#FDF5F3]"
                  }`}
                >
                  {canPostB2B ? "Post bulk order" : "Apply as buyer"}
                </Link>
                {canPostB2B && (
                  <Link
                    to="/bulk/orders?mine=true"
                    className="ui-btn-secondary px-3 py-2 text-xs"
                  >
                    Open buyer portal
                  </Link>
                )}
              </div>
            </div>

            <div className="ui-card-soft p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                Bulk seller portal
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-900">{statusLabel(sellerStatus)}</p>
              <p className="mt-1 text-xs text-stone-600">
                View awarded jobs, issue invoices, and track completion.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link
                  to={canRespondB2B ? "/bulk/seller/orders" : "/bulk?role=seller"}
                  className={`inline-flex rounded-xl px-3 py-2 text-xs font-semibold ${
                    canRespondB2B
                      ? "bg-[#A0452E] text-white hover:bg-[#8B3525]"
                      : "border border-stone-200 bg-white text-stone-700 hover:bg-[#FDF5F3]"
                  }`}
                >
                  {canRespondB2B ? "Open seller portal" : "Apply as seller"}
                </Link>
                {canRespondB2B && (
                  <Link
                    to="/bulk/orders"
                    className="ui-btn-secondary px-3 py-2 text-xs"
                  >
                    Browse open demand
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/bulk/orders"
              className="ui-btn-secondary px-3 py-2 text-xs"
            >
              Open demand board
            </Link>
            <Link
              to="/bulk/orders/new"
              className="ui-btn-secondary px-3 py-2 text-xs"
            >
              New order form
            </Link>
          </div>
        </section>

        <section className="ui-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-900">
                {role === "buyer" ? "Bulk buyer application" : "Bulk seller application"}
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Open the form only when you are ready to apply.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="ui-btn-ghost gap-1 px-3 py-2 text-sm"
            >
              {showForm ? "Hide application form" : "Open application form"}
              {showForm ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {loadingStatus && (
            <p className="mt-4 text-sm text-stone-500">Loading your current access status...</p>
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
            <div className="mt-4 rounded-xl border border-forest-100 bg-forest-50 px-4 py-3 text-sm text-forest-700">
              {notice}
            </div>
          )}

          {!showForm && (
            <p className="mt-4 rounded-xl border border-stone-200 bg-[#FAF7F2] px-4 py-3 text-sm text-stone-600">
              Form is hidden to keep this page clean. Use <strong>Open application form</strong> when ready.
            </p>
          )}

          {showForm && (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="ui-label">
                    Contact person
                  </label>
                  <input
                    value={form.contactName}
                    onChange={(e) => updateField("contactName", e.target.value)}
                    className="ui-input"
                    placeholder="Name of contact person"
                  />
                </div>
                <div>
                  <label className="ui-label">
                    Farm or institution name
                  </label>
                  <input
                    value={form.organizationName}
                    onChange={(e) => updateField("organizationName", e.target.value)}
                    className="ui-input"
                    placeholder="Farm / institution"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="ui-label">
                    Institution type
                  </label>
                  <select
                    value={form.institutionType}
                    onChange={(e) =>
                      updateField("institutionType", e.target.value as BulkApplicationInput["institutionType"])
                    }
                    className="ui-input"
                  >
                    {INSTITUTION_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="ui-label">
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
                    className="ui-input"
                  >
                    {DELIVERY_COVERAGE.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="ui-label">
                    County
                  </label>
                  <select
                    value={form.address.county}
                    onChange={(e) => updateAddress("county", e.target.value)}
                    className="ui-input"
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
                  <label className="ui-label">
                    Constituency
                  </label>
                  <select
                    value={form.address.constituency || ""}
                    onChange={(e) => updateAddress("constituency", e.target.value)}
                    className="ui-input"
                    disabled={!form.address.county}
                  >
                    <option value="">Select constituency</option>
                    {constituencyOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="ui-label">
                    Ward
                  </label>
                  <select
                    value={form.address.ward || ""}
                    onChange={(e) => updateAddress("ward", e.target.value)}
                    className="ui-input"
                    disabled={!form.address.county || !form.address.constituency}
                  >
                    <option value="">Select ward</option>
                    {wardOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="ui-label">
                  Street address
                </label>
                <input
                  value={form.address.streetAddress || ""}
                  onChange={(e) => updateAddress("streetAddress", e.target.value)}
                  className="ui-input"
                  placeholder="Street / area"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="ui-label">
                    Phone number
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) => updateField("phone", e.target.value)}
                    className="ui-input"
                    placeholder="+2547..."
                  />
                </div>
                <div>
                  <label className="ui-label">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField("email", e.target.value)}
                    className="ui-input"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="ui-label">
                  {role === "buyer" ? "Products you need" : "Products you sell"}
                </label>
                <textarea
                  value={productsInput}
                  onChange={(e) => setProductsInput(e.target.value)}
                  className="ui-input"
                  rows={3}
                  placeholder="Example: maize, onions, certified seeds"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="ui-label">
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
                    className="ui-input"
                  >
                    {FREQUENCY_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="ui-label">
                    Monthly volume
                  </label>
                  <input
                    value={form.monthlyVolume || ""}
                    onChange={(e) => updateField("monthlyVolume", e.target.value)}
                    className="ui-input"
                    placeholder="e.g. 20 tonnes"
                  />
                </div>
                <div>
                  <label className="ui-label">
                    Budget per order
                  </label>
                  <input
                    value={form.estimatedBudgetPerOrder || ""}
                    onChange={(e) => updateField("estimatedBudgetPerOrder", e.target.value)}
                    className="ui-input"
                    placeholder="e.g. KES 250,000"
                  />
                </div>
              </div>

              {role === "seller" && (
                <div>
                  <label className="ui-label">
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
                    className="ui-input"
                  />
                </div>
              )}

              <div>
                <label className="ui-label">
                  Additional notes
                </label>
                <textarea
                  value={form.notes || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  className="ui-input"
                  rows={3}
                  placeholder="Anything your onboarding team should know"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-[#FAF7F2] px-4 py-3">
                <div className="flex items-start gap-2 text-sm text-stone-600">
                  {activeRoleStatus === "approved" ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-forest-600" />
                  ) : (
                    <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                  )}
                  <span>
                    Current status for this role:{" "}
                    <strong className="text-stone-900">{statusLabel(activeRoleStatus)}</strong>
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="ui-btn-primary px-5 py-2 text-sm disabled:bg-stone-300"
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
