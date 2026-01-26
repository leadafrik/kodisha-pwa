import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { kenyaCounties, getConstituenciesByCounty, getWardsByConstituency } from "../data/kenyaCounties";
import { API_BASE_URL } from "../config/api";
import { AlertCircle, CheckCircle2, MapPin, Tag, Calendar, Camera, FileText } from "lucide-react";

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
  const verificationErrorMessage = "Please upload your ID and selfie before listing";
  const hasPendingIdVerification =
    !!user?.verification?.idVerificationPending || !!user?.verification?.idVerificationSubmitted;
  const isVerificationPending =
    hasPendingIdVerification && (!idVerified || !selfieVerified);
  const requiresVerification = (!idVerified || !selfieVerified) && !isVerificationPending;

  // Pre-fill contact
  useEffect(() => {
    if (user?.phone && !form.contact) {
      setForm((prev) => ({ ...prev, contact: user?.phone }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.phone]);

  useEffect(() => {
    if (user?._id) {
      refreshUser();
    }
  }, [user?._id, refreshUser]);

  // Check for draft on load
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    setHasDraft(!!draft);
  }, []);

  // Auto-save draft (excluding images)
  useEffect(() => {
    const shouldSave =
      form.listingType ||
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
    setHasDraft(true);
  }, [form]);

  // Update verification status
  useEffect(() => {
    if (user?.verification) {
      setIdVerified(!!user.verification.idVerified);
      setSelfieVerified(!!user.verification.selfieVerified);
    }
  }, [user]);

  useEffect(() => {
    if (
      (idVerified && selfieVerified) ||
      (hasPendingIdVerification && error === verificationErrorMessage)
    ) {
      setError("");
    }
  }, [idVerified, selfieVerified, hasPendingIdVerification, error, verificationErrorMessage]);

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

    if (form.step === 1) {
      if (!form.listingType) {
        setError("Please select whether you want to buy or sell");
        return false;
      }
      return true;
    }

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
      if ((!idVerified || !selfieVerified) && !hasPendingIdVerification) {
        setError(verificationErrorMessage);
        return false;
      }
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
    setForm((prev) => ({ ...prev, step: Math.max(1, prev.step - 1) }));
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
        setError(result.message || "Failed to create listing");
        setUploading(false);
        return;
      }

      // Success!
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
      alert("Listing created successfully! Awaiting admin review...");
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
      setForm((prev) => ({
        ...prev,
        ...parsed,
        images: [],
        step: Math.min(Math.max(Number(parsed.step) || 1, 1), 5),
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

  const handleSaveDraft = () => {
    const draft = { ...form, images: [] };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    setHasDraft(true);
    setNotice("Draft saved.");
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
                  List in minutes, close faster
                </h1>
                <p className="text-base text-slate-600 max-w-xl">
                  Share what you have, set clear prices, and connect directly with verified buyers across Kenya.
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm fade-rise">
                <p className="text-xs uppercase tracking-widest text-slate-500">Progress</p>
                <div className="mt-4 space-y-3">
                  {(["Type", "Category", "Location", "Details", "Verify"] as const).map((label, idx) => {
                    const step = idx + 1;
                    const isActive = form.step === step;
                    const isDone = form.step > step;
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
                          <p className="text-xs text-slate-500">Step {step} of 5</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-5 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full bg-emerald-600 transition-all"
                    style={{ width: `${(form.step / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 pb-16">
          <p className="mb-6 text-sm text-slate-500">Drafts save automatically on this device.</p>

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
            <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          )}
          {notice && !error && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-700">{notice}</p>
            </div>
          )}

        {/* Form Container */}
        <form onSubmit={form.step === 5 ? handleSubmit : (e) => e.preventDefault()}>
          {/* Step 1: Listing Type */}
          {form.step === 1 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">What do you want to do?</h2>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { type: "sell" as const, label: "Sell", icon: "", desc: "Sell your products" },
                  { type: "buy" as const, label: "Buy", icon: "", desc: "Post a buy request" },
                ].map(({ type, label, icon, desc }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      if (type === "buy") {
                        navigate("/request/new");
                        return;
                      }
                      setForm((prev) => ({
                        ...prev,
                        listingType: type,
                        step: Math.max(prev.step, 2),
                      }));
                      setError("");
                      setNotice("");
                    }}
                    className={`p-6 rounded-lg border-2 transition-all text-center ${
                      form.listingType === type
                        ? "border-green-600 bg-green-50"
                        : "border-gray-200 hover:border-green-300"
                    }`}
                  >
                    <div className="text-4xl mb-2">{icon}</div>
                    <p className="font-bold text-gray-900">{label}</p>
                    <p className="text-sm text-gray-600 mt-1">{desc}</p>
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-gray-500">
                Buying? You will be redirected to the buy request form for a cleaner flow.
              </p>
            </div>
          )}

          {/* Step 2: Category Selection */}
          {form.step === 2 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
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
                  <p className="text-xs text-gray-600 mt-1">Your phone number will be visible to potential buyers</p>
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
                      <p className="text-xs text-gray-600">PNG, JPG up to 5 images</p>
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
              </div>
            </div>
          )}

          {/* Step 5: Verification & Confirmation */}
          {form.step === 5 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Review & Confirm
              </h2>

              {/* Verification Status */}
              <div className="mb-6 space-y-3">
                <div className={`p-4 rounded-xl border ${
                  idVerified
                    ? "bg-emerald-50 border-emerald-200"
                    : isVerificationPending
                    ? "bg-amber-50 border-amber-200"
                    : "bg-red-50 border-red-200"
                }`}>
                  <p className={`flex items-center gap-2 font-semibold ${
                    idVerified
                      ? "text-emerald-700"
                      : isVerificationPending
                      ? "text-amber-700"
                      : "text-red-700"
                  }`}>
                    {idVerified ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    National ID verification
                  </p>
                  <p className={`text-sm mt-1 ${
                    idVerified
                      ? "text-emerald-600"
                      : isVerificationPending
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}>
                    {idVerified
                      ? "Verified"
                      : isVerificationPending
                      ? "Submitted - pending approval"
                      : "Required - please upload ID"}
                  </p>
                </div>

                <div className={`p-4 rounded-xl border ${
                  selfieVerified
                    ? "bg-emerald-50 border-emerald-200"
                    : isVerificationPending
                    ? "bg-amber-50 border-amber-200"
                    : "bg-red-50 border-red-200"
                }`}>
                  <p className={`flex items-center gap-2 font-semibold ${
                    selfieVerified
                      ? "text-emerald-700"
                      : isVerificationPending
                      ? "text-amber-700"
                      : "text-red-700"
                  }`}>
                    {selfieVerified ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    Selfie verification
                  </p>
                  <p className={`text-sm mt-1 ${
                    selfieVerified
                      ? "text-emerald-600"
                      : isVerificationPending
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}>
                    {selfieVerified
                      ? "Verified"
                      : isVerificationPending
                      ? "Submitted - pending approval"
                      : "Required - please upload selfie"}
                  </p>
                </div>
              </div>

              {requiresVerification ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <p className="text-amber-800 font-semibold mb-2">Complete your verification first</p>
                  <p className="text-amber-700 text-sm mb-4">
                    You must upload your ID and selfie before listing. Visit your profile to submit these documents.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/profile")}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700"
                  >
                    Go to Profile
                  </button>
                </div>
              ) : (
                <>
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

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={uploading}
                    className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all"
                  >
                    {uploading ? "Creating Listing..." : "Create Listing"}
                  </button>
                </>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-6">
            {form.step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="flex-1 border border-slate-300 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50"
              >
                Previous
              </button>
            )}
            {form.step < 5 && (
              <button
                type="button"
                onClick={handleSaveDraft}
                className="flex-1 border border-slate-300 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50"
              >
                Save draft
              </button>
            )}
            {form.step < 5 && (
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
