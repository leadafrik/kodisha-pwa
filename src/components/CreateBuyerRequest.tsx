import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AlertCircle } from "lucide-react";
import { kenyaCounties, getConstituenciesByCounty, getWardsByConstituency } from "../data/kenyaCounties";
import { API_BASE_URL } from "../config/api";

const UNITS = ["kg", "tonnes", "bags", "units", "liters", "crates"];

interface CreateBuyerRequestProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CreateBuyerRequest: React.FC<CreateBuyerRequestProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "produce",
    productType: "",
    budget: { min: "", max: "", currency: "KES" },
    quantity: "",
    unit: "kg",
    location: { county: "", constituency: "", ward: "" },
    urgency: "medium",
    images: [] as string[],
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: { ...(prev[parent as keyof typeof formData] as any), [child]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      budget: { ...prev.budget, [name]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (!user) {
        setError("Please log in to create a buyer request");
        return;
      }

      if (!formData.title || !formData.description) {
        setError("Title and description are required");
        return;
      }

      const token = localStorage.getItem("kodisha_token");
      const budgetMin =
        formData.budget.min.trim() !== ""
          ? Number(formData.budget.min)
          : undefined;
      const budgetMax =
        formData.budget.max.trim() !== ""
          ? Number(formData.budget.max)
          : undefined;
      const quantityValue =
        formData.quantity.trim() !== "" ? Number(formData.quantity) : undefined;

      const payload = {
        ...formData,
        quantity: quantityValue,
        budget:
          budgetMin !== undefined || budgetMax !== undefined
            ? { min: budgetMin, max: budgetMax, currency: formData.budget.currency }
            : undefined,
      };

      const response = await fetch(`${API_BASE_URL}/buyer-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create buyer request");
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-emerald-100/80 bg-white/95 p-6 shadow-xl shadow-emerald-100/40 backdrop-blur sm:p-8">
      <div className="mb-8">
        <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
          Buy request
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mt-4">Post a buy request</h2>
        <p className="text-base text-slate-600 mt-2">
          Share exactly what you need. Verified sellers will reach out with offers that match your requirements.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-2">
              What are you looking to buy?
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Fresh Maize, Irrigation Pipes"
              className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
              required
            />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
              >
                <option value="produce">Agricultural Produce</option>
                <option value="inputs">Farm Inputs</option>
                <option value="service">Agricultural Services</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Urgency
              </label>
              <select
                name="urgency"
                value={formData.urgency}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
              >
                <option value="low">Low - Can wait</option>
                <option value="medium">Medium - Within a week</option>
                <option value="high">High - Urgent</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <label className="block text-sm font-semibold text-slate-800 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what you need. Include specifications, quality requirements, preferred timing..."
            rows={4}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
            required
          />
          <p className="mt-2 text-xs text-slate-500">
            Clear details help sellers respond with accurate pricing and availability.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Product Type
              </label>
              <input
                type="text"
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                placeholder="e.g., Hybrid maize"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Quantity
              </label>
              <input
                type="text"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g., 10"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Unit
              </label>
              <select
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
              >
                {UNITS.map((unit) => (
                  <option key={unit} value={unit}>
                    {unit}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Budget range</h3>
            <span className="text-xs text-slate-500">Optional</span>
          </div>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Min Budget (KES)
              </label>
              <input
                type="text"
                name="min"
                value={formData.budget.min}
                onChange={handleBudgetChange}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g., 3000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Max Budget (KES)
              </label>
              <input
                type="text"
                name="max"
                value={formData.budget.max}
                onChange={handleBudgetChange}
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g., 12000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Location</h3>
          <p className="mt-1 text-xs text-slate-500">
            Your location helps sellers plan delivery and confirm availability.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">County</label>
              <select
                name="location.county"
                value={formData.location.county}
                onChange={(e) => {
                  handleChange(e);
                  setFormData(prev => ({
                    ...prev,
                    location: { county: e.target.value, constituency: "", ward: "" }
                  }));
                }}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200"
              >
                <option value="">Select County</option>
                {kenyaCounties.map((county) => (
                  <option key={county.name} value={county.name}>
                    {county.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Constituency
              </label>
              <select
                name="location.constituency"
                value={formData.location.constituency}
                onChange={(e) => {
                  handleChange(e);
                  setFormData(prev => ({
                    ...prev,
                    location: { ...prev.location, ward: "" }
                  }));
                }}
                disabled={!formData.location.county}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-100"
              >
                <option value="">Select Constituency</option>
                {formData.location.county &&
                  getConstituenciesByCounty(formData.location.county).map((c) => (
                    <option key={c.label} value={c.label}>
                      {c.label}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">
                Ward
              </label>
              <select
                name="location.ward"
                value={formData.location.ward}
                onChange={handleChange}
                disabled={!formData.location.constituency}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-200 disabled:bg-slate-100"
              >
                <option value="">Select Ward</option>
                {formData.location.county && formData.location.constituency &&
                  getWardsByConstituency(formData.location.county, formData.location.constituency).map((w) => (
                    <option key={w.label} value={w.label}>
                      {w.label}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/60 transition hover:bg-emerald-700 disabled:bg-slate-300"
          >
            {loading ? "Creating..." : "Post Buy Request"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CreateBuyerRequest;
