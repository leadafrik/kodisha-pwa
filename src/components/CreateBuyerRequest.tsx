import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useAdaptiveLayout } from "../hooks/useAdaptiveLayout";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  kenyaCounties,
  getConstituenciesByCounty,
  getWardsByConstituency,
} from "../data/kenyaCounties";
import { API_BASE_URL, ensureValidAccessToken } from "../config/api";
import { validatePhone } from "../utils/formValidation";

const UNITS = ["kg", "tonnes", "bags", "units", "liters", "crates"];
const DRAFT_STORAGE_KEY = "kodisha_buyer_request_draft_v3";

type RequestCategory = "produce" | "inputs" | "service";
type UrgencyLevel = "low" | "medium" | "high";
type Step = 1 | 2 | 3;

interface BuyerRequestFormData {
  title: string;
  description: string;
  category: RequestCategory;
  productType: string;
  budget: {
    min: string;
    max: string;
    currency: "KES";
  };
  quantity: string;
  unit: string;
  contactPhone: string;
  location: {
    county: string;
    constituency: string;
    ward: string;
  };
  urgency: UrgencyLevel;
  images: string[];
}

interface CreateBuyerRequestProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface DemandTemplate {
  id: string;
  label: string;
  category: RequestCategory;
  title: string;
  productType: string;
  description: string;
  quantity: string;
  unit: string;
  urgency: UrgencyLevel;
  budgetMin?: string;
  budgetMax?: string;
}

interface StepErrors {
  title?: string;
  description?: string;
  quantity?: string;
  budget?: string;
  county?: string;
  contactPhone?: string;
}

const DEMAND_TEMPLATES: DemandTemplate[] = [
  {
    id: "maize",
    label: "Bulk Maize",
    category: "produce",
    title: "Need dry maize for immediate purchase",
    productType: "Dry maize",
    description:
      "Looking for clean, dry maize in bulk. Must be well sorted and ready for pickup within 3 days.",
    quantity: "50",
    unit: "bags",
    urgency: "high",
    budgetMin: "180000",
    budgetMax: "230000",
  },
  {
    id: "fertilizer",
    label: "Farm Inputs",
    category: "inputs",
    title: "Need NPK fertilizer for planting season",
    productType: "NPK fertilizer",
    description:
      "Looking for trusted suppliers with verified fertilizer stock and delivery options to my county.",
    quantity: "30",
    unit: "bags",
    urgency: "medium",
    budgetMin: "90000",
    budgetMax: "140000",
  },
  {
    id: "transport",
    label: "Transport Service",
    category: "service",
    title: "Need produce transport service",
    productType: "Farm produce transport",
    description:
      "Need reliable transport service for farm produce with clear pricing and availability this week.",
    quantity: "1",
    unit: "units",
    urgency: "medium",
  },
];

const STEPS: Array<{ id: Step; label: string; caption: string }> = [
  { id: 1, label: "Demand", caption: "What you need" },
  { id: 2, label: "Specs", caption: "Quantity and budget" },
  { id: 3, label: "Post", caption: "Location and contact" },
];

const CATEGORY_STYLES: Record<RequestCategory, string> = {
  produce: "border-orange-200 bg-orange-50 text-orange-800",
  inputs: "border-sky-200 bg-sky-50 text-sky-800",
  service: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const getDefaultFormData = (county?: string, phone?: string): BuyerRequestFormData => ({
  title: "",
  description: "",
  category: "produce",
  productType: "",
  budget: { min: "", max: "", currency: "KES" },
  quantity: "",
  unit: "kg",
  contactPhone: phone || "",
  location: { county: county || "", constituency: "", ward: "" },
  urgency: "medium",
  images: [],
});

const hasMeaningfulDraft = (raw: string | null) => {
  if (!raw) return false;
  try {
    const parsed = JSON.parse(raw) as { formData?: Partial<BuyerRequestFormData> };
    const draft = parsed.formData;
    return Boolean(
      draft?.title ||
        draft?.description ||
        draft?.productType ||
        draft?.quantity ||
        draft?.budget?.min ||
        draft?.budget?.max ||
        draft?.location?.county ||
        draft?.contactPhone
    );
  } catch {
    return false;
  }
};

const scoreToLabel = (score: number) => {
  if (score >= 85) return "Outstanding";
  if (score >= 65) return "Strong";
  if (score >= 45) return "Good";
  return "Building";
};

export const CreateBuyerRequest: React.FC<CreateBuyerRequestProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const { isCompact } = useAdaptiveLayout();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fieldErrors, setFieldErrors] = useState<StepErrors>({});
  const [hasDraft, setHasDraft] = useState(false);
  const [formData, setFormData] = useState<BuyerRequestFormData>(() =>
    getDefaultFormData(user?.county, user?.phone)
  );

  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    setHasDraft(hasMeaningfulDraft(draft));
  }, []);

  useEffect(() => {
    if (!user?.phone && !user?.county) return;
    setFormData((prev) => {
      let changed = false;
      const nextLocation = { ...prev.location };
      let nextContactPhone = prev.contactPhone;

      if (!nextContactPhone && user?.phone) {
        nextContactPhone = user.phone;
        changed = true;
      }

      if (!nextLocation.county && user?.county) {
        nextLocation.county = user.county;
        changed = true;
      }

      if (!changed) return prev;
      return {
        ...prev,
        contactPhone: nextContactPhone,
        location: nextLocation,
      };
    });
  }, [user?.phone, user?.county]);

  useEffect(() => {
    const shouldSave = Boolean(
      formData.title.trim() ||
        formData.description.trim() ||
        formData.productType.trim() ||
        formData.quantity.trim() ||
        formData.budget.min.trim() ||
        formData.budget.max.trim() ||
        formData.location.county ||
        formData.location.constituency ||
        formData.location.ward ||
        formData.contactPhone.trim()
    );

    if (!shouldSave) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }

    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        step,
        formData,
      })
    );
  }, [formData, step]);

  const constituencies = useMemo(
    () =>
      formData.location.county
        ? getConstituenciesByCounty(formData.location.county)
        : [],
    [formData.location.county]
  );

  const wards = useMemo(
    () =>
      formData.location.county && formData.location.constituency
        ? getWardsByConstituency(
            formData.location.county,
            formData.location.constituency
          )
        : [],
    [formData.location.county, formData.location.constituency]
  );

  const suggestedTitle = useMemo(() => {
    const qty = formData.quantity.trim();
    const type = formData.productType.trim();
    const county = formData.location.county.trim();
    const categoryLabel =
      formData.category === "produce"
        ? "produce"
        : formData.category === "inputs"
        ? "farm inputs"
        : "agricultural service";
    const quantityLabel = qty ? `${qty} ${formData.unit}` : "bulk";
    const typeLabel = type || categoryLabel;
    const countyLabel = county ? ` in ${county}` : "";
    return `Need ${quantityLabel} ${typeLabel}${countyLabel}`;
  }, [
    formData.category,
    formData.productType,
    formData.quantity,
    formData.unit,
    formData.location.county,
  ]);

  const qualityScore = useMemo(() => {
    let score = 0;
    if (formData.title.trim().length >= 10) score += 20;
    if (formData.description.trim().length >= 80) score += 25;
    if (formData.productType.trim().length >= 2) score += 10;
    if (formData.quantity.trim()) score += 10;
    if (formData.budget.min.trim() || formData.budget.max.trim()) score += 10;
    if (formData.location.county) score += 15;
    if (formData.contactPhone.trim()) {
      score += validatePhone(formData.contactPhone).isValid ? 10 : 0;
    }
    return Math.min(score, 100);
  }, [formData]);

  const hasMeaningfulDemandInput = Boolean(
    formData.title.trim() ||
      formData.description.trim() ||
      formData.quantity.trim() ||
      formData.budget.min.trim() ||
      formData.budget.max.trim() ||
      formData.location.county
  );

  const clearFeedback = () => {
    setError("");
    setNotice("");
  };

  const setTopLevelField = <K extends keyof BuyerRequestFormData>(
    key: K,
    value: BuyerRequestFormData[K]
  ) => {
    if (hasDraft) setHasDraft(false);
    setFormData((prev) => ({ ...prev, [key]: value }));
    clearFeedback();
  };

  const setLocationField = (
    key: keyof BuyerRequestFormData["location"],
    value: string
  ) => {
    if (hasDraft) setHasDraft(false);
    setFormData((prev) => {
      if (key === "county") {
        return {
          ...prev,
          location: { county: value, constituency: "", ward: "" },
        };
      }
      if (key === "constituency") {
        return {
          ...prev,
          location: { ...prev.location, constituency: value, ward: "" },
        };
      }
      return {
        ...prev,
        location: { ...prev.location, [key]: value },
      };
    });
    clearFeedback();
  };

  const setBudgetField = (key: "min" | "max", value: string) => {
    if (!/^\d*$/.test(value)) return;
    if (hasDraft) setHasDraft(false);
    setFormData((prev) => ({
      ...prev,
      budget: { ...prev.budget, [key]: value },
    }));
    clearFeedback();
  };

  const getStepErrors = (targetStep: Step): StepErrors => {
    const nextErrors: StepErrors = {};

    if (targetStep === 1) {
      if (!formData.title.trim()) {
        nextErrors.title = "Add a short title for your demand.";
      } else if (formData.title.trim().length < 6) {
        nextErrors.title = "Title should be at least 6 characters.";
      }
    }

    if (targetStep === 2) {
      if (!formData.description.trim()) {
        nextErrors.description = "Describe exactly what you need.";
      } else if (formData.description.trim().length < 15) {
        nextErrors.description = "Add a bit more detail so sellers can quote accurately.";
      }

      if (formData.quantity.trim()) {
        const quantityValue = Number(formData.quantity);
        if (!Number.isFinite(quantityValue) || quantityValue <= 0) {
          nextErrors.quantity = "Quantity must be greater than zero.";
        }
      }

      const minValue = formData.budget.min.trim()
        ? Number(formData.budget.min)
        : undefined;
      const maxValue = formData.budget.max.trim()
        ? Number(formData.budget.max)
        : undefined;

      if (
        (minValue !== undefined && (!Number.isFinite(minValue) || minValue < 0)) ||
        (maxValue !== undefined && (!Number.isFinite(maxValue) || maxValue < 0))
      ) {
        nextErrors.budget = "Budget values must be valid positive numbers.";
      } else if (
        minValue !== undefined &&
        maxValue !== undefined &&
        maxValue < minValue
      ) {
        nextErrors.budget = "Max budget must be greater than min budget.";
      }
    }

    if (targetStep === 3) {
      if (!formData.location.county) {
        nextErrors.county = "Select your county.";
      }

      if (formData.contactPhone.trim()) {
        const phoneValidation = validatePhone(formData.contactPhone.trim());
        if (!phoneValidation.isValid) {
          nextErrors.contactPhone = phoneValidation.error || "Invalid phone number.";
        }
      }
    }

    return nextErrors;
  };

  const validateCurrentStep = () => {
    const nextErrors = getStepErrors(step);
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateBeforeSubmit = () => {
    const order: Step[] = [1, 2, 3];
    for (const current of order) {
      const nextErrors = getStepErrors(current);
      if (Object.keys(nextErrors).length > 0) {
        setStep(current);
        setFieldErrors(nextErrors);
        return false;
      }
    }
    setFieldErrors({});
    return true;
  };

  const handleApplyTemplate = (template: DemandTemplate) => {
    setFormData((prev) => ({
      ...prev,
      category: template.category,
      title: template.title,
      productType: template.productType,
      description: template.description,
      quantity: template.quantity,
      unit: template.unit,
      urgency: template.urgency,
      budget: {
        ...prev.budget,
        min: template.budgetMin || "",
        max: template.budgetMax || "",
      },
    }));
    setStep(2);
    setNotice(`Template "${template.label}" applied.`);
    setError("");
    setFieldErrors({});
  };

  const handleRestoreDraft = () => {
    const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!draftRaw) return;
    try {
      const parsed = JSON.parse(draftRaw) as {
        step?: number;
        formData?: Partial<BuyerRequestFormData>;
      };

      if (!parsed.formData) return;
      const restoredFormData = parsed.formData;

      const restoredCategory = restoredFormData.category;
      const restoredUrgency = restoredFormData.urgency;
      const nextCategory: RequestCategory =
        restoredCategory === "inputs" ||
        restoredCategory === "service" ||
        restoredCategory === "produce"
          ? restoredCategory
          : "produce";
      const nextUrgency: UrgencyLevel =
        restoredUrgency === "low" ||
        restoredUrgency === "high" ||
        restoredUrgency === "medium"
          ? restoredUrgency
          : "medium";

      setFormData((prev) => ({
        ...prev,
        ...restoredFormData,
        category: nextCategory,
        urgency: nextUrgency,
        budget: {
          ...prev.budget,
          ...(restoredFormData.budget || {}),
          currency: "KES",
        },
        location: {
          ...prev.location,
          ...(restoredFormData.location || {}),
        },
        images: [],
      }));
      const nextStep =
        typeof parsed.step === "number"
          ? (Math.min(Math.max(parsed.step, 1), 3) as Step)
          : 1;
      setStep(nextStep);
      setNotice("Draft restored.");
      setError("");
      setFieldErrors({});
      setHasDraft(false);
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
    setNotice("Draft discarded.");
    setError("");
  };

  const handleNextStep = () => {
    if (!validateCurrentStep()) return;
    setStep((prev) => (prev < 3 ? ((prev + 1) as Step) : 3));
    setFieldErrors({});
    clearFeedback();
  };

  const handlePrevStep = () => {
    setStep((prev) => (prev > 1 ? ((prev - 1) as Step) : 1));
    clearFeedback();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    try {
      if (!user) {
        setError("Please log in to create a buyer request.");
        return;
      }

      if (!validateBeforeSubmit()) {
        setError("Please complete the highlighted fields before posting.");
        return;
      }

      const token = await ensureValidAccessToken();
      if (!token) {
        setError("Session expired. Please log in again.");
        return;
      }

      const quantityValue = formData.quantity.trim()
        ? Number(formData.quantity.trim())
        : undefined;
      const minValue = formData.budget.min.trim()
        ? Number(formData.budget.min.trim())
        : undefined;
      const maxValue = formData.budget.max.trim()
        ? Number(formData.budget.max.trim())
        : undefined;

      const budgetPayload: { min?: number; max?: number; currency: "KES" } | undefined =
        minValue !== undefined || maxValue !== undefined
          ? {
              ...(minValue !== undefined ? { min: minValue } : {}),
              ...(maxValue !== undefined ? { max: maxValue } : {}),
              currency: "KES",
            }
          : undefined;

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        productType: formData.productType.trim() || undefined,
        contactPhone: formData.contactPhone.trim() || undefined,
        budget: budgetPayload,
        quantity: quantityValue,
        unit: quantityValue !== undefined ? formData.unit : undefined,
        location: {
          county: formData.location.county,
          constituency: formData.location.constituency || undefined,
          ward: formData.location.ward || undefined,
        },
        urgency: formData.urgency,
        images: [],
      };

      const response = await fetch(`${API_BASE_URL}/buyer-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok || !responseData?.success) {
        throw new Error(responseData?.message || "Failed to create buyer request.");
      }

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || "An error occurred while posting demand.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-emerald-100/80 bg-white/95 p-5 shadow-lg shadow-emerald-100/30 backdrop-blur sm:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
            Demand Studio
          </div>
          <h2 className="mt-3 text-2xl font-bold text-slate-900 sm:text-3xl">
            Post demand that attracts serious sellers
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Share what you need and get matched offers quickly.
          </p>
        </div>

        {hasMeaningfulDemandInput && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:min-w-[220px]">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Response strength
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">{qualityScore}</p>
              </div>
              <p className="text-sm font-semibold text-emerald-700">{scoreToLabel(qualityScore)}</p>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full bg-emerald-600 transition-all"
                style={{ width: `${qualityScore}%` }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mb-5 grid gap-2 sm:grid-cols-3">
        {STEPS.map((item) => {
          const isActive = step === item.id;
          const isDone = step > item.id;
          return (
            <div
              key={item.id}
              className={`rounded-2xl border px-3 py-3 transition ${
                isActive
                  ? "border-emerald-300 bg-emerald-50"
                  : isDone
                  ? "border-emerald-200 bg-emerald-50/60"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                  isActive || isDone ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  {item.id}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                  {(!isCompact || isActive) && (
                    <p className="text-xs text-slate-500">{item.caption}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {hasDraft && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="flex-1 text-sm font-semibold text-emerald-800">
            You have a saved draft on this device.
          </p>
          <button
            type="button"
            onClick={handleRestoreDraft}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Restore draft
          </button>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
          >
            Discard
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {notice && !error && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
          <CheckCircle2 size={20} className="mt-0.5 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()} className="space-y-5">
        {step === 1 && (
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Quick templates
              </p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {DEMAND_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleApplyTemplate(template)}
                    className="whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50"
                  >
                    {template.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              {(["produce", "inputs", "service"] as RequestCategory[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setTopLevelField("category", cat)}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${
                    formData.category === cat
                      ? CATEGORY_STYLES[cat]
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                  }`}
                >
                  <p className="font-semibold capitalize">{cat}</p>
                  {(!isCompact || formData.category === cat) && (
                    <p className="mt-0.5 text-xs opacity-80">
                      {cat === "produce"
                        ? "Crops, fruits, grains"
                        : cat === "inputs"
                        ? "Seeds, fertilizer, equipment"
                        : "Transport, labor, consulting"}
                    </p>
                  )}
                </button>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Demand title *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={(e) => setTopLevelField("title", e.target.value)}
                  maxLength={100}
                  placeholder="e.g., Need 20 bags of fresh onions this week"
                  className={`w-full rounded-xl border bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200 ${
                    fieldErrors.title ? "border-red-300" : "border-slate-200"
                  }`}
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className={`text-xs ${fieldErrors.title ? "text-red-600" : "text-slate-500"}`}>
                    {fieldErrors.title || "Keep it clear and specific."}
                  </p>
                  <span className="text-xs text-slate-500">{formData.title.length}/100</span>
                </div>
                {!formData.title.trim() && (
                  <button
                    type="button"
                    onClick={() => setTopLevelField("title", suggestedTitle)}
                    className="mt-2 text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Use suggestion: "{suggestedTitle}"
                  </button>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Product / service type
                </label>
                <input
                  type="text"
                  name="productType"
                  value={formData.productType}
                  onChange={(e) => setTopLevelField("productType", e.target.value)}
                  placeholder="e.g., Grade 1 potatoes, 5-ton truck transport"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Short and specific is best.
                </p>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Urgency
              </label>
              <div className="grid gap-2 sm:grid-cols-3">
                {([
                  { value: "low", label: "Low", desc: "Can wait" },
                  { value: "medium", label: "Medium", desc: "Within a week" },
                  { value: "high", label: "High", desc: "Urgent" },
                ] as Array<{ value: UrgencyLevel; label: string; desc: string }>).map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTopLevelField("urgency", item.value)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      formData.urgency === item.value
                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                    }`}
                  >
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-xs opacity-80">{item.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-800">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={(e) => setTopLevelField("description", e.target.value)}
                placeholder="Describe quantity, quality, timing, and key requirements."
                rows={5}
                maxLength={2000}
                className={`w-full rounded-xl border bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200 ${
                  fieldErrors.description ? "border-red-300" : "border-slate-200"
                }`}
              />
              <div className="mt-1 flex items-center justify-between">
                <p
                  className={`text-xs ${
                    fieldErrors.description ? "text-red-600" : "text-slate-500"
                  }`}
                >
                  {fieldErrors.description ||
                    "Add enough detail for accurate quotes."}
                </p>
                <span className="text-xs text-slate-500">{formData.description.length}/2000</span>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_180px_1fr]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Quantity
                </label>
                <input
                  type="text"
                  name="quantity"
                  value={formData.quantity}
                  onChange={(e) => {
                    if (!/^\d*\.?\d*$/.test(e.target.value)) return;
                    setTopLevelField("quantity", e.target.value);
                  }}
                  inputMode="decimal"
                  placeholder="e.g., 200"
                  className={`w-full rounded-xl border bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200 ${
                    fieldErrors.quantity ? "border-red-300" : "border-slate-200"
                  }`}
                />
                {fieldErrors.quantity && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.quantity}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">Unit</label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={(e) => setTopLevelField("unit", e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
                >
                  {UNITS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                  Better quotes
                </p>
                <p className="mt-1 text-sm text-emerald-800">
                  Quantity helps suppliers reply faster.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-800">Budget range</h3>
                <span className="text-xs text-slate-500">Optional</span>
              </div>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Min budget (KES)
                  </label>
                  <input
                    type="text"
                    name="min"
                    value={formData.budget.min}
                    onChange={(e) => setBudgetField("min", e.target.value)}
                    inputMode="numeric"
                    placeholder="e.g., 25000"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs font-semibold text-slate-600">
                    Max budget (KES)
                  </label>
                  <input
                    type="text"
                    name="max"
                    value={formData.budget.max}
                    onChange={(e) => setBudgetField("max", e.target.value)}
                    inputMode="numeric"
                    placeholder="e.g., 40000"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200"
                  />
                </div>
              </div>
              {fieldErrors.budget && (
                <p className="mt-2 text-xs text-red-600">{fieldErrors.budget}</p>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Where should suppliers deliver?</h3>
              <p className="text-sm text-slate-600">
                Location helps match you with nearby sellers.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">County *</label>
                <select
                  name="location.county"
                  value={formData.location.county}
                  onChange={(e) => setLocationField("county", e.target.value)}
                  className={`w-full rounded-xl border bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200 ${
                    fieldErrors.county ? "border-red-300" : "border-slate-200"
                  }`}
                >
                  <option value="">Select county</option>
                  {kenyaCounties.map((county) => (
                    <option key={county.name} value={county.name}>
                      {county.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.county && (
                  <p className="mt-1 text-xs text-red-600">{fieldErrors.county}</p>
                )}
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Constituency
                </label>
                <select
                  name="location.constituency"
                  value={formData.location.constituency}
                  onChange={(e) => setLocationField("constituency", e.target.value)}
                  disabled={!formData.location.county}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-100"
                >
                  <option value="">Select constituency</option>
                  {constituencies.map((constituency) => (
                    <option key={constituency.value} value={constituency.value}>
                      {constituency.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">Ward</label>
                <select
                  name="location.ward"
                  value={formData.location.ward}
                  onChange={(e) => setLocationField("ward", e.target.value)}
                  disabled={!formData.location.constituency}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-100"
                >
                  <option value="">Select ward</option>
                  {wards.map((ward) => (
                    <option key={ward.value} value={ward.value}>
                      {ward.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[1.25fr_0.75fr]">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Contact phone (optional)
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setTopLevelField("contactPhone", e.target.value)}
                  placeholder="+254712345678"
                  className={`w-full rounded-xl border bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200 ${
                    fieldErrors.contactPhone ? "border-red-300" : "border-slate-200"
                  }`}
                />
                <p
                  className={`mt-1 text-xs ${
                    fieldErrors.contactPhone ? "text-red-600" : "text-slate-500"
                  }`}
                >
                  {fieldErrors.contactPhone ||
                    "Optional, but helps with faster follow-up."}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Response speed
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900 capitalize">
                  {formData.urgency} priority
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {formData.urgency === "high"
                    ? "Urgent requests usually get fastest replies."
                    : formData.urgency === "medium"
                    ? "Balanced urgency for most requests."
                    : "Low urgency can attract more options."}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${CATEGORY_STYLES[formData.category]}`}
                >
                  {formData.category}
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                  {formData.urgency} priority
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900">
                {formData.title || "Untitled demand"}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {formData.description || "Add a short description so sellers know what to quote."}
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Quantity
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formData.quantity ? `${formData.quantity} ${formData.unit}` : "Not specified"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Budget
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formData.budget.min || formData.budget.max
                      ? `KES ${formData.budget.min || "-"} - ${formData.budget.max || "-"}`
                      : "Negotiable"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          className={`mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between ${
            isCompact ? "sticky bottom-3 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur" : ""
          }`}
        >
          <div className="flex gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Previous
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {step < 3 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 transition hover:bg-emerald-700"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 transition hover:bg-emerald-700 disabled:bg-slate-300"
              >
                {loading ? "Posting demand..." : "Post Demand"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateBuyerRequest;
