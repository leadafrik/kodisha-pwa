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
    contactPhone: user?.phone || "",
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
        contactPhone:
          formData.contactPhone.trim() !== ""
            ? formData.contactPhone.trim()
            : undefined,
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
    <div className="max-w-2xl mx-auto rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-700 font-semibold">Buy request</p>
        <h2 className="text-3xl font-bold text-slate-900 mt-2">Post a buy request</h2>
        <p className="text-sm text-slate-600 mt-2">
          Share exactly what you need. Verified sellers will reach out with offers.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2">
          <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            What are you looking to buy?
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., Fresh Maize, Irrigation Pipes"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required
          />
        </div>

        {/* Category */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="produce">Agricultural Produce</option>
              <option value="inputs">Farm Inputs</option>
              <option value="service">Agricultural Services</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Urgency
            </label>
            <select
              name="urgency"
              value={formData.urgency}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="low">Low - Can wait</option>
              <option value="medium">Medium - Within a week</option>
              <option value="high">High - Urgent</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe what you need. Include specifications, quality requirements, preferred timing..."
            rows={4}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            required
          />
        </div>

        {/* Product Type, Quantity, and Contact */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Type
            </label>
            <input
              type="text"
              name="productType"
              value={formData.productType}
              onChange={handleChange}
              placeholder="e.g., Hybrid maize"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Unit
            </label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact Phone <span className="text-xs text-slate-400">(Optional)</span>
          </label>
          <input
            type="tel"
            name="contactPhone"
            value={formData.contactPhone}
            onChange={handleChange}
            placeholder="+254712345678"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <p className="mt-1 text-xs text-slate-500">
            Add a reachable number so sellers can call you directly.
          </p>
        </div>

        {/* Budget */}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Budget (KES) <span className="text-xs text-slate-400">(Optional)</span>
            </label>
            <input
              type="text"
              name="min"
              value={formData.budget.min}
              onChange={handleBudgetChange}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g., 3000"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Budget (KES) <span className="text-xs text-slate-400">(Optional)</span>
            </label>
            <input
              type="text"
              name="max"
              value={formData.budget.max}
              onChange={handleBudgetChange}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="e.g., 12000"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Location */}
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">County</label>
            <select
              name="location.county"
              value={formData.location.county}
              onChange={(e) => {
                handleChange(e);
                // Reset constituency and ward when county changes
                setFormData(prev => ({
                  ...prev,
                  location: { county: e.target.value, constituency: "", ward: "" }
                }));
              }}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Constituency
            </label>
            <select
              name="location.constituency"
              value={formData.location.constituency}
              onChange={(e) => {
                handleChange(e);
                // Reset ward when constituency changes
                setFormData(prev => ({
                  ...prev,
                  location: { ...prev.location, ward: "" }
                }));
              }}
              disabled={!formData.location.county}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ward
            </label>
            <select
              name="location.ward"
              value={formData.location.ward}
              onChange={handleChange}
              disabled={!formData.location.constituency}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100"
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

        {/* Buttons */}
        <div className="flex flex-col-reverse gap-3 pt-2 md:flex-row">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? "Creating..." : "Post Buy Request"}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 border border-slate-300 text-slate-700 font-semibold py-3 rounded-lg transition hover:bg-slate-50"
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
