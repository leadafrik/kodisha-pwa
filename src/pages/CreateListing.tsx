import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAdaptiveLayout } from "../hooks/useAdaptiveLayout";
import { kenyaCounties, getConstituenciesByCounty, getWardsByConstituency } from "../data/kenyaCounties";
import { API_BASE_URL } from "../config/api";
import { AlertCircle, CheckCircle2, MapPin, Tag, Calendar, Camera, FileText } from "lucide-react";
import { ErrorAlert } from "../components/ui";

type ListingCategory = "produce" | "livestock" | "inputs" | "service";
type ListingType = "sell" | "buy";
type ProduceSubcategory = "crops" | "fruits" | "vegetables" | "grains" | "other";
type LivestockSubcategory = "cattle" | "poultry" | "goats" | "pigs" | "sheep" | "other";
type InputsSubcategory = "fertilizer" | "pesticides" | "seeds" | "tools" | "equipment" | "feeds" | "other";
type ServiceSubcategory = "equipment_rental" | "consulting" | "labor" | "transportation" | "processing" | "other";

interface ListingFormData {
  step: number;
  listingType: ListingType | null;
  category: ListingCategory | null;
  subcategory: ProduceSubcategory | LivestockSubcategory | InputsSubcategory | ServiceSubcategory | null;
  title: string;
  description: string;
  county: string;
  constituency: string;
  ward: string;
  approximateLocation: string;
  price: string;
  quantity: string;
  unit: string;
  availableFrom: string;
  images: File[];
  contact: string;
  subscribed: boolean;
  premiumBadge: boolean;
}

const PRODUCE_SUBCATEGORIES: ProduceSubcategory[] = ["crops", "fruits", "vegetables", "grains", "other"];
const LIVESTOCK_SUBCATEGORIES: LivestockSubcategory[] = ["cattle", "poultry", "goats", "pigs", "sheep", "other"];
const INPUTS_SUBCATEGORIES: InputsSubcategory[] = ["fertilizer", "pesticides", "seeds", "tools", "equipment", "feeds", "other"];
const SERVICE_SUBCATEGORIES: ServiceSubcategory[] = ["equipment_rental", "consulting", "labor", "transportation", "processing", "other"];

const UNITS = ["kg", "bag", "ton", "bunch", "dozen", "piece", "liter", "gallon", "box", "crate"];
const RECOMMENDED_UNIT_BY_CATEGORY: Record<ListingCategory, string> = {
  produce: "kg",
  livestock: "piece",
  inputs: "bag",
  service: "piece",
};

const CATEGORY_DESCRIPTIONS = {
  produce: "Agricultural products like crops, fruits, and vegetables",
  livestock: "Livestock including cattle, poultry, goats, and more",
  inputs: "Agricultural inputs: fertilizers, pesticides, seeds, tools, equipment",
  service: "Agricultural services including equipment rental, consulting, and labor",
};

const DRAFT_STORAGE_KEY = "kodisha_listing_draft_v1";

const CreateListing: React.FC = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { isCompact } = useAdaptiveLayout();
  const [form, setForm] = useState<ListingFormData>({
    step: 1,
    listingType: null,
    category: null,
    subcategory: null,
    title: "",
    description: "",
    county: "",
    constituency: "",
    ward: "",
    approximateLocation: "",
    price: "",
    quantity: "",
    unit: "kg",
    availableFrom: "",
    images: [],
    contact: user?.phone || "",
    subscribed: false,
    premiumBadge: false,
  });

  const [constituencies, setConstituencies] = useState<{ value: string; label: string }[]>([]);
  const [wards, setWards] = useState<{ value: string; label: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [idVerified, setIdVerified] = useState(false);
  const [selfieVerified, setSelfieVerified] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const verificationState = (user?.verification || {}) as {
    idVerificationPending?: boolean;
    idVerificationSubmitted?: boolean;
  };
  const hasPendingIdVerification =
    !!verificationState.idVerificationPending || !!verificationState.idVerificationSubmitted;
  const isVerificationPending =
    hasPendingIdVerification && (!idVerified || !selfieVerified);
  const isUnverifiedSeller = !idVerified || !selfieVerified;
  const showVerificationNudge = isUnverifiedSeller && !isVerificationPending;
  const verifyIdPath = "/verify-id?next=%2Fcreate-listing";

  // Pre-fill contact
  useEffect(() => {
    if (user?.phone && !form.contact) {
      setForm((prev) => ({ ...prev, contact: user?.phone }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.phone]);

  useEffect(() => {
    if (user?.county && !form.county) {
      setForm((prev) => ({ ...prev, county: user.county || "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.county]);

  useEffect(() => {
    if (user?._id) {
      refreshUser();
    }
  }, [user?._id, refreshUser]);

  useEffect(() => {
    if (form.step === 1 && !form.listingType) {
      setForm((prev) => ({ ...prev, listingType: "sell", step: 2 }));
    }
  }, [form.step, form.listingType]);

  const hasMeaningfulDraft = (raw: string | null) => {
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      return Boolean(
        parsed?.category ||
          parsed?.subcategory ||
          parsed?.title ||
          parsed?.description ||
          parsed?.county ||
          parsed?.price ||
          parsed?.quantity ||
          parsed?.contact
      );
    } catch {
      return false;
    }
  };

  // Check for draft on load
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!hasMeaningfulDraft(draft)) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
      return;
    }
    setHasDraft(true);
  }, []);

  // Auto-save draft (excluding images)
  useEffect(() => {
    const shouldSave =
      form.category ||
      form.subcategory ||
      form.title ||
      form.description ||
      form.county ||
      form.price ||
      form.quantity ||
      form.contact;
    if (!shouldSave) return;
    const draft = { ...form, images: [] };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [form]);

  // Update verification status
  useEffect(() => {
    if (user?.verification) {
      setIdVerified(!!user.verification.idVerified);
      setSelfieVerified(!!user.verification.selfieVerified);
    }
  }, [user]);

  useEffect(() => {
    if (idVerified && selfieVerified) {
      setError("");
    }
  }, [idVerified, selfieVerified]);

  // Update constituencies when county changes
  useEffect(() => {
    if (form.county) {
      const data = getConstituenciesByCounty(form.county);
      setConstituencies(data);
      setForm((prev) => ({ ...prev, constituency: "", ward: "" }));
      setWards([]);
    } else {
      setConstituencies([]);
      setWards([]);
    }
  }, [form.county]);

  // Update wards when constituency changes
  useEffect(() => {
    if (form.county && form.constituency) {
      const data = getWardsByConstituency(form.county, form.constituency);
      setWards(data);
      setForm((prev) => ({ ...prev, ward: "" }));
    } else {
      setWards([]);
    }
  }, [form.county, form.constituency]);

  const subcategoryOptions = useMemo(() => {
    switch (form.category) {
      case "produce":
        return PRODUCE_SUBCATEGORIES;
      case "livestock":
        return LIVESTOCK_SUBCATEGORIES;
      case "inputs":
        return INPUTS_SUBCATEGORIES;
      case "service":
        return SERVICE_SUBCATEGORIES;
      default:
        return [];
    }
  }, [form.category]);

  const commission = useMemo(() => {
    const price = Number(form.price) || 0;
    return Math.max(price * 0.005, 49);
  }, [form.price]);

  const recommendedUnit = form.category
    ? RECOMMENDED_UNIT_BY_CATEGORY[form.category]
    : null;

  const trustSignals = useMemo(
    () => [
      { label: "Clear title", done: form.title.trim().length >= 12 },
      { label: "Detailed description", done: form.description.trim().length >= 80 },
      { label: "Complete location", done: !!form.county && !!form.constituency && !!form.ward },
      { label: "Public contact added", done: !!form.contact.trim() },
      {
        label: "At least 3 photos",
        done: form.listingType === "buy" ? true : form.images.length >= 3,
      },
      { label: "ID + selfie verified", done: idVerified && selfieVerified },
    ],
    [
      form.title,
      form.description,
      form.county,
      form.constituency,
      form.ward,
      form.contact,
      form.listingType,
      form.images.length,
      idVerified,
      selfieVerified,
    ]
  );

  const trustCompletedCount = trustSignals.filter((signal) => signal.done).length;
  const trustScore = Math.round((trustCompletedCount / trustSignals.length) * 100);
  const trustNextAction = trustSignals.find((signal) => !signal.done)?.label;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - form.images.length);
      setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const validateStep = (): boolean => {
    setError("");
    setNotice("");

    if (form.step === 2) {
      if (!form.category) {
        setError("Please select a category");
        return false;
      }
      if (!form.subcategory) {
        setError("Please select a subcategory");
        return false;
      }
      return true;
    }

    if (form.step === 3) {
      if (!form.county) {
        setError("Please select your county");
        return false;
      }
      if (!form.constituency) {
        setError("Please select your constituency");
        return false;
      }
      if (!form.ward) {
        setError("Please select your ward");
        return false;
      }
      return true;
    }

    if (form.step === 4) {
      if (!form.title.trim()) {
        setError("Please enter a title for your listing");
        return false;
      }
      if (!form.description.trim()) {
        setError("Please enter a description");
        return false;
      }
      if (!form.price) {
        setError("Please enter a price");
        return false;
      }
      if (form.category !== "inputs" && !form.quantity) {
        setError("Please enter a quantity");
        return false;
      }
      if (!form.contact.trim()) {
        setError("Please enter a phone number");
        return false;
      }
      if (form.listingType === "sell" && !form.images.length) {
        setError("Please upload at least one image");
        return false;
      }
      return true;
    }

    if (form.step === 5) {
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setForm((prev) => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const handlePrevStep = () => {
    setError("");
    setNotice("");
    setForm((prev) => ({ ...prev, step: Math.max(2, prev.step - 1) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep() || !user) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("description", form.description.trim());
      formData.append("category", form.category!);
      formData.append("subcategory", form.subcategory!);
      formData.append("listingType", form.listingType!);
      formData.append("price", form.price);
      formData.append("quantity", form.quantity);
      formData.append("unit", form.unit);
      formData.append("county", form.county);
      formData.append("constituency", form.constituency);
      formData.append("ward", form.ward);
      formData.append("approximateLocation", form.approximateLocation.trim());
      formData.append("availableFrom", form.availableFrom);
      formData.append("contact", form.contact.trim());
      formData.append("subscriptionActive", form.subscribed ? "true" : "false");
      formData.append("premiumBadge", form.premiumBadge ? "true" : "false");
      formData.append("premiumBadgePrice", form.premiumBadge ? "199" : "0");

      form.images.forEach((img) => formData.append("images", img));

      const token = localStorage.getItem("kodisha_token");
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        let errorMsg = result.message || "Failed to create listing";
        
        if (response.status === 403) {
          errorMsg = "You do not have permission to publish right now. Please try again or contact support.";
        }
        
        setError(errorMsg);
        setUploading(false);
        return;
      }

      // Success!
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
      const publishStatus = String(result?.data?.publishStatus || "").toLowerCase();
      if (publishStatus === "active") {
        alert("Listing published successfully! It is now visible to buyers.");
      } else {
        alert(
          "Listing submitted successfully! It will go live after admin approval. Verify your ID + selfie to speed up future listings."
        );
      }
      navigate("/browse");
    } catch (err: any) {
      setError(err.message || "An error occurred while creating your listing");
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Log In</h1>
          <p className="text-gray-600 mb-6">You must be logged in to create a listing.</p>
          <button
            onClick={() => navigate("/login")}
            className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleRestoreDraft = () => {
    const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!draftRaw) return;
    try {
      const parsed = JSON.parse(draftRaw);
      const restoredStep = Math.min(Math.max(Number(parsed.step) || 2, 2), 5);
      setForm((prev) => ({
        ...prev,
        ...parsed,
        images: [],
        step: restoredStep,
      }));
      setHasDraft(false);
      setNotice("Draft restored. Continue where you left off.");
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
    setNotice("Draft discarded.");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Source+Sans+3:wght@400;600;700&display=swap');
        .listing-shell {
          font-family: "Source Sans 3", "Segoe UI", "Tahoma", sans-serif;
        }
        .listing-title {
          font-family: "Space Grotesk", "Segoe UI", "Tahoma", sans-serif;
        }
        .fade-rise {
          animation: fadeRise 0.7s ease both;
        }
        @keyframes fadeRise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="listing-shell">
        <section className="relative overflow-hidden">
          <div className="absolute -top-24 left-1/3 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

          <div className="max-w-6xl mx-auto px-4 pt-12 pb-8">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] items-center">
              <div className="space-y-4 fade-rise">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">Create a Listing</p>
                <h1 className="listing-title text-4xl md:text-5xl text-slate-900">
                  Create your listing in 2 minutes
                </h1>
                <p className="text-base text-slate-600 max-w-xl">
                  Start with the essentials now, then improve trust signals to attract more buyer inquiries.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm fade-rise">
                <p className="text-xs uppercase tracking-widest text-slate-500">Progress</p>
                <div className="mt-4 space-y-3">
                  {(["Category", "Location", "Details", "Verify"] as const).map((label, idx) => {
                    const step = idx + 1;
                    const progressStep = Math.max(1, Math.min(4, form.step - 1));
                    const isActive = progressStep === step;
                    const isDone = progressStep > step;
                    return (
                      <div key={label} className="flex items-center gap-3">
                        <div
                          className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold border ${
                            isActive
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : isDone
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-white text-slate-500"
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="h-4 w-4" /> : step}
                        </div>
                        <div>
                          <p className={`text-sm font-semibold ${isActive ? "text-slate-900" : "text-slate-600"}`}>
                            {label}
                          </p>
                          {!isCompact && (
                            <p className="text-xs text-slate-500">Step {step} of 4</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all"
                    style={{ width: `${(Math.max(1, Math.min(4, form.step - 1)) / 4) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 pb-16">
          <p className="mb-6 text-sm text-slate-500">
            {isCompact ? "Drafts save automatically." : "Drafts save automatically on this device."}
          </p>

          {showVerificationNudge && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center gap-3">
              <p className="text-amber-900 font-semibold flex-1">
                Verification is optional for now, but verified profiles build trust and go live faster.
              </p>
              <button
                type="button"
                onClick={() => navigate(verifyIdPath)}
                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-700"
              >
                Verify to boost trust
              </button>
            </div>
          )}

          {isVerificationPending && (
            <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-blue-900 font-semibold">Verification submitted</p>
              <p className="text-blue-700 text-sm mt-1">
                Your ID review is in progress. You can keep posting while the trust badge is being reviewed.
              </p>
            </div>
          )}

          {hasDraft && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
              <p className="text-emerald-800 font-semibold flex-1">You have a saved draft. Want to continue?</p>
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
              >
                Restore draft
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-4 py-2 rounded-lg border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-100"
              >
                Discard
              </button>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <ErrorAlert
              message={error}
              onRetry={() => setError("")}
              className="mb-6"
            />
          )}
          {notice && !error && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-700">{notice}</p>
            </div>
          )}

        {/* Form Container */}
        <form onSubmit={form.step === 5 ? handleSubmit : (e) => e.preventDefault()}>
          {/* Step 2: Category Selection */}
          {form.step === 2 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                <span className="font-semibold">
                  Listing is set to Sell. Looking to buy instead?
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/request/new")}
                  className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                >
                  Post a buy request
                </button>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-6">What are you listing?</h2>
              <div className="space-y-4 mb-8">
                {(["produce", "livestock", "inputs", "service"] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, category: cat, subcategory: null }));
                      setError("");
                      setNotice("");
                    }}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      form.category === cat
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <p className="font-bold text-gray-900">
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">{CATEGORY_DESCRIPTIONS[cat]}</p>
                  </button>
                ))}
              </div>

              {form.category && (
                <div>
                  <h3 className="font-bold text-gray-900 mb-4">Select a subcategory</h3>
                  <select
                    value={form.subcategory ?? ""}
                    onChange={(e) => {
                      const value = (e.target.value || null) as ListingFormData["subcategory"];
                      setForm((prev) => ({
                        ...prev,
                        subcategory: value,
                        step: value ? Math.max(prev.step, 3) : prev.step,
                      }));
                      setError("");
                      setNotice("");
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a subcategory...</option>
                    {subcategoryOptions.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Location */}
          {form.step === 3 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Where is it located?
              </h2>

              <div className="space-y-5">
                {/* County */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">County *</label>
                  <select
                    value={form.county}
                    onChange={(e) => setForm((prev) => ({ ...prev, county: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">Select a county...</option>
                    {kenyaCounties.map((c) => (
                      <option key={c.code} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Constituency */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Constituency *</label>
                  <select
                    value={form.constituency}
                    onChange={(e) => setForm((prev) => ({ ...prev, constituency: e.target.value }))}
                    disabled={!form.county}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select a constituency...</option>
                    {constituencies.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ward */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Ward *</label>
                  <select
                    value={form.ward}
                    onChange={(e) => setForm((prev) => ({ ...prev, ward: e.target.value }))}
                    disabled={!form.constituency}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                  >
                    <option value="">Select a ward...</option>
                    {wards.map((w) => (
                      <option key={w.value} value={w.value}>
                        {w.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Approximate Location */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Specific Location (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Near the marketplace, Main road"
                    value={form.approximateLocation}
                    onChange={(e) => setForm((prev) => ({ ...prev, approximateLocation: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Listing Details */}
          {form.step === 4 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Tag className="w-5 h-5" /> Listing Details
              </h2>

              <div className="space-y-5">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <p className="text-sm font-semibold text-emerald-900">Required to publish (about 30 seconds)</p>
                  <p className="mt-1 text-xs text-emerald-800">
                    Add a title, price, contact number, and at least one photo. You can optimize the rest after publishing.
                  </p>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Title *</label>
                  <input
                    type="text"
                    placeholder="e.g., Fresh Tomatoes, Dairy Cow, Tractor"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Description *</label>
                  <textarea
                    placeholder="Describe your product in detail - quality, condition, features, etc."
                    value={form.description}
                    onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Price and Quantity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">Price (KSh) *</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={form.price}
                      onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    {commission > 0 && (
                      <p className="text-xs text-gray-600 mt-1">
                        Commission: KSh {commission.toFixed(0)}
                      </p>
                    )}
                  </div>

                  {form.category !== "inputs" && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">Quantity *</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          placeholder="Amount"
                          value={form.quantity}
                          onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        />
                        <select
                          value={form.unit}
                          onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        >
                          {UNITS.map((u) => (
                            <option key={u} value={u}>
                              {u}
                            </option>
                          ))}
                        </select>
                      </div>
                      {recommendedUnit && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <p className="text-xs text-gray-600">
                            Recommended unit for this category: <span className="font-semibold">{recommendedUnit}</span>
                          </p>
                          {form.unit !== recommendedUnit && (
                            <button
                              type="button"
                              onClick={() => setForm((prev) => ({ ...prev, unit: recommendedUnit }))}
                              className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                            >
                              Use recommended
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Available From */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Available From (Optional)
                  </label>
                  <input
                    type="date"
                    value={form.availableFrom}
                    onChange={(e) => setForm((prev) => ({ ...prev, availableFrom: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+254712345678"
                    value={form.contact}
                    onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Buyers contact you faster with this number. Add a line you can answer quickly.
                  </p>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    <Camera className="w-4 h-4 inline mr-2" />
                    Upload Images ({form.images.length}/5) *
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={form.images.length >= 5}
                      className="hidden"
                      id="imageInput"
                    />
                    <label htmlFor="imageInput" className="cursor-pointer">
                      <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm font-semibold text-gray-900">Click to upload or drag and drop</p>
                      <p className="text-xs text-gray-600">PNG, JPG up to 5 images. Listings with photos get more buyer calls.</p>
                    </label>
                  </div>

                  {/* Image Preview */}
                  {form.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-5 gap-3">
                      {form.images.map((img, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={URL.createObjectURL(img)}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <span className="text-white text-xs font-semibold">Remove</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-emerald-900">
                      Listings with these details get more buyer chats
                    </p>
                    <p className="text-sm font-bold text-emerald-800">{trustScore}%</p>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-white overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all"
                      style={{ width: `${trustScore}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs text-emerald-800">
                    {trustNextAction
                      ? `Next high-impact action: ${trustNextAction}.`
                      : "Great setup. Your listing has strong trust signals."}
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {trustSignals.map((signal) => (
                      <p
                        key={signal.label}
                        className={`text-xs font-semibold ${
                          signal.done ? "text-emerald-700" : "text-slate-600"
                        }`}
                      >
                        [{signal.done ? "x" : " "}] {signal.label}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Verification & Confirmation */}
          {form.step === 5 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Review & Confirm
              </h2>

              {idVerified && selfieVerified ? (
                <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="flex items-center gap-2 font-semibold text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                    Profile verified
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    Your trust badge is active. This listing can go live immediately after you publish.
                  </p>
                </div>
              ) : (
                <div className="mb-6 space-y-3">
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="flex items-center gap-2 font-semibold text-amber-700">
                      {idVerified ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      National ID verification
                    </p>
                    <p className="text-sm mt-1 text-amber-700">
                      {idVerified
                        ? "Verified"
                        : isVerificationPending
                        ? "Submitted - pending approval"
                        : "Not verified yet - add ID to build trust faster"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                    <p className="flex items-center gap-2 font-semibold text-amber-700">
                      {selfieVerified ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                      Selfie verification
                    </p>
                    <p className="text-sm mt-1 text-amber-700">
                      {selfieVerified
                        ? "Verified"
                        : isVerificationPending
                        ? "Submitted - pending approval"
                        : "Not verified yet - add a selfie to increase buyer trust"}
                    </p>
                  </div>
                </div>
              )}

              {showVerificationNudge && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <p className="text-amber-800 font-semibold mb-2">Publish now, verify to rank higher</p>
                  <p className="text-amber-700 text-sm mb-4">
                    Your listing can still be submitted. Verification helps future listings go live faster and builds buyer trust.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(verifyIdPath)}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
                  >
                    Verify profile
                  </button>
                </div>
              )}

              {/* Listing Summary */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6 border border-gray-200">
                <h3 className="font-bold text-gray-900 mb-4">Listing Summary</h3>
                <div className="space-y-3 text-sm">
                  <p>
                    <span className="text-gray-600">Type:</span>
                    <span className="font-semibold text-gray-900 ml-2 capitalize">{form.listingType}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Category:</span>
                    <span className="font-semibold text-gray-900 ml-2 capitalize">
                      {form.category} - {form.subcategory}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Location:</span>
                    <span className="font-semibold text-gray-900 ml-2">
                      {form.ward}, {form.constituency}, {form.county}
                    </span>
                  </p>
                  <p>
                    <span className="text-gray-600">Title:</span>
                    <span className="font-semibold text-gray-900 ml-2">{form.title}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Price:</span>
                    <span className="font-semibold text-gray-900 ml-2">KSh {Number(form.price).toLocaleString()}</span>
                  </p>
                  {form.quantity && (
                    <p>
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-semibold text-gray-900 ml-2">
                        {form.quantity} {form.unit}
                      </span>
                    </p>
                  )}
                  <p>
                    <span className="text-gray-600">Images:</span>
                    <span className="font-semibold text-gray-900 ml-2">{form.images.length} uploaded</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Trust readiness:</span>
                    <span className="font-semibold text-gray-900 ml-2">{trustScore}%</span>
                  </p>
                </div>
              </div>

              {/* Premium Options */}
              <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-6">
                <h3 className="font-bold text-gray-900 mb-4">Boost Your Listing (Optional)</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.premiumBadge}
                    onChange={(e) => setForm((prev) => ({ ...prev, premiumBadge: e.target.checked }))}
                    className="w-5 h-5 text-green-600"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">Premium Badge (KSh 199)</p>
                    <p className="text-sm text-gray-600">Get a premium badge to stand out</p>
                  </div>
                </label>
              </div>

              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                <p className="font-semibold mb-2">Your listing will be:</p>
                <ul className="space-y-1">
                  <li>[x] Visible across Kenya</li>
                  <li>[x] Shown to active buyers</li>
                  <li>[x] Protected by verified profile signals</li>
                </ul>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
              >
                {uploading ? "Publishing listing..." : "Publish Listing - start receiving buyer inquiries"}
              </button>
            </div>
          )}

          {/* Navigation Buttons */}
          <div
            className={`mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4 ${isCompact ? "sticky bottom-3 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur" : ""}`}
          >
            {form.step > 2 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 border border-slate-300 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50"
              >
                Previous
              </button>
            )}
            {form.step < 5 && form.step !== 2 && (
              <button
                type="button"
                onClick={handleNextStep}
                className="flex-1 bg-emerald-600 text-white font-semibold py-3 rounded-xl hover:bg-emerald-700"
              >
                Next
              </button>
            )}
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default CreateListing;
