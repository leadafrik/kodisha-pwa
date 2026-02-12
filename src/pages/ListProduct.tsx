import React, { useEffect, useMemo, useState } from "react";
import { useProperties } from "../contexts/PropertyContext";
import { useAuth } from "../contexts/AuthContext";
import { kenyaCounties, getConstituenciesByCounty, getWardsByConstituency } from "../data/kenyaCounties";
import { API_BASE_URL } from "../config/api";

type ProductCategory = "produce" | "livestock" | "inputs";

type ListProductProps = {
  initialCategory?: ProductCategory;
};

const formatPrice = (v: number) => `KSh ${v.toLocaleString()}`;

const ListProduct: React.FC<ListProductProps> = ({ initialCategory = "produce" }) => {
  const { addProduct } = useProperties();
  const { user } = useAuth();
  const [category, setCategory] = useState<ProductCategory>(initialCategory);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("kg");
  const [contact, setContact] = useState("");
  const [county, setCounty] = useState("");
  const [constituency, setConstituency] = useState("");
  const [ward, setWard] = useState("");
  const [approximateLocation, setApproximateLocation] = useState("");
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [subscribed, setSubscribed] = useState(false);
  const [premiumBadge, setPremiumBadge] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [constituencies, setConstituencies] = useState<{ value: string; label: string }[]>([]);
  const [wards, setWards] = useState<{ value: string; label: string }[]>([]);
  
  // Verification document states
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState(false);

  const commission = useMemo(() => {
    const numPrice = Number(price) || 0;
    return Math.max(numPrice * 0.005, 49);
  }, [price]);

  // Pre-fill contact with user's phone
  useEffect(() => {
    if (user?.phone && !contact) {
      setContact(user.phone);
    }
  }, [user, contact]);

  useEffect(() => {
    if (county) {
      const data = getConstituenciesByCounty(county);
      setConstituencies(data);
      setConstituency("");
      setWard("");
      setWards([]);
    } else {
      setConstituencies([]);
      setConstituency("");
      setWard("");
      setWards([]);
    }
  }, [county]);

  useEffect(() => {
    if (county && constituency) {
      const data = getWardsByConstituency(county, constituency);
      setWards(data);
      setWard("");
    } else {
      setWards([]);
    }
  }, [county, constituency]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - selectedImages.length);
      setSelectedImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeImage = (idx: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const idVerified =
    user?.verification?.status === "approved" || !!user?.verification?.idVerified;
  const selfieVerified = idVerified;
  const idDocsNeeded = !idVerified;
  const selfieNeeded = !selfieVerified;

  const uploadVerificationDoc = async (type: string, file: File) => {
    const token = localStorage.getItem('kodisha_token');
    const userId = (user as any)?._id || (user as any)?.id;
    if (!token) {
      throw new Error('You must be logged in to upload verification documents.');
    }
    if (!userId) {
      throw new Error('Missing user id for verification uploads.');
    }

    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/verification/upload/${type}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = await response.json();
    if (!response.ok || json.success === false) {
      throw new Error(json.message || 'Failed to upload document');
    }
    return json;
  };

  const ensureDocsUploaded = async () => {
    const uploads: Array<{ type: string; file: File }> = [];

    if (!idVerified) {
      if (idFrontFile) uploads.push({ type: 'id-front', file: idFrontFile });
      if (idBackFile) uploads.push({ type: 'id-back', file: idBackFile });
    }
    if (!selfieVerified && selfieFile) {
      uploads.push({ type: 'selfie', file: selfieFile });
    }

    if (uploads.length === 0) return;

    setDocUploading(true);
    try {
      for (const u of uploads) {
        await uploadVerificationDoc(u.type, u.file);
      }
    } finally {
      setDocUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to list products.");
      return;
    }
    
    // Check if verification documents are provided
    if (!idVerified && (!idFrontFile || !idBackFile)) {
      alert("Please upload both sides of your National ID (front and back).");
      return;
    }
    if (!selfieVerified && !selfieFile) {
      alert("Please upload a selfie holding your ID.");
      return;
    }

    setUploading(true);
    try {
      // Upload verification documents first if needed
      try {
        await ensureDocsUploaded();
      } catch (err: any) {
        alert(err.message || "Failed to upload verification documents.");
        setUploading(false);
        return;
      }

      const form = new FormData();
      form.append("title", title.trim());
      form.append("description", description.trim());
      form.append("category", category);
      form.append("price", price);
      if (quantity) form.append("quantity", quantity);
      if (unit) form.append("unit", unit);
      form.append("contact", contact.trim());
      form.append("county", county);
      form.append("constituency", constituency);
      form.append("ward", ward);
      form.append("approximateLocation", approximateLocation.trim());
      form.append("subscriptionActive", subscribed ? "true" : "false");
      form.append("premiumBadge", premiumBadge ? "true" : "false");
      form.append("premiumBadgePrice", premiumBadge ? "199" : "0");

      selectedImages.forEach((img) => form.append("images", img));

      await addProduct(form);
      alert("Product listed successfully! An admin will review and verify it shortly.");
      
      // Reset form fields
      setTitle("");
      setDescription("");
      setPrice("");
      setQuantity("");
      setUnit("kg");
      setContact("");
      setCounty("");
      setConstituency("");
      setWard("");
      setApproximateLocation("");
      setSelectedImages([]);
      setSubscribed(false);
      setPremiumBadge(false);
      
      // Reset document upload fields
      setIdFrontFile(null);
      setIdBackFile(null);
      setSelfieFile(null);
    } catch (err: any) {
      console.error("Product submit error", err);
      alert(err?.message || "Failed to list product.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Essential details</p>
          <h2 className="text-xl font-semibold text-gray-900">What you are selling</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="produce">Produce/Harvest</option>
              <option value="livestock">Livestock</option>
              <option value="inputs">Inputs</option>
            </select>
          </label>
          <label className="space-y-1 text-sm text-gray-700 md:col-span-2">
            <span className="font-semibold text-gray-900">Title *</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              placeholder="e.g., 10 bags of maize, 2 heifers"
            />
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Price (KSh) *</span>
            <input
              type="number"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <p className="text-xs text-gray-500">
              Free for 3 months; afterwards {formatPrice(commission)} commission applies.
            </p>
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Quantity</span>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Unit</span>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="kg">kg</option>
              <option value="tonne">tonne</option>
              <option value="piece">piece</option>
              <option value="bag">bag</option>
              <option value="litre">litre</option>
            </select>
          </label>
        </div>
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Description *</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            placeholder="Grade, condition, delivery terms..."
          />
        </label>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Location</p>
          <h3 className="text-lg font-semibold text-gray-900">Where buyers meet you</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-semibold text-gray-900">County *</span>
            <select
              value={county}
              onChange={(e) => setCounty(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Select County</option>
              {kenyaCounties
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((c) => (
                  <option key={c.code} value={c.name.toLowerCase()}>
                    {c.name}
                  </option>
                ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Constituency *</span>
            <select
              value={constituency}
              onChange={(e) => setConstituency(e.target.value)}
              required
              disabled={!county}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Select</option>
              {constituencies.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Ward *</span>
            <select
              value={ward}
              onChange={(e) => setWard(e.target.value)}
              required
              disabled={!constituency}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Select</option>
              {wards.map((w) => (
                <option key={w.value} value={w.value}>
                  {w.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Reference point</span>
          <input
            value={approximateLocation}
            onChange={(e) => setApproximateLocation(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            placeholder="Near main road, market, stage..."
          />
        </label>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Contact</p>
          <h3 className="text-lg font-semibold text-gray-900">How buyers reach you</h3>
        </div>
        <label className="space-y-1 text-sm text-gray-700">
          <span className="font-semibold text-gray-900">Phone *</span>
          <input
            type="tel"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            placeholder="07xx..."
            pattern="[0-9]{10}"
          />
        </label>
        <div className="rounded-xl border border-dashed border-gray-200 bg-orange-50/60 p-4 text-sm text-gray-700">
          <p className="font-semibold text-orange-700">Listing status</p>
          <p className="text-xs">
            Free for 3 months; afterwards {formatPrice(commission)} commission applies (min KSh 49).
          </p>
        </div>
      </section>

      <details className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm" open>
        <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-gray-800">
          Optional boosts
          <span className="text-xs text-gray-500 transition-all group-open:rotate-45">+</span>
        </summary>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={subscribed}
              onChange={(e) => setSubscribed(e.target.checked)}
            />
            <span>Annual subscription (soon)</span>
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={premiumBadge}
              onChange={(e) => setPremiumBadge(e.target.checked)}
            />
            <span>Premium badge (+KSh 199)</span>
          </label>
        </div>
      </details>

      <details
        className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
        open={!idVerified || !selfieVerified}
      >
        <summary className="flex cursor-pointer items-center justify-between text-sm font-semibold text-gray-800">
          {idVerified && selfieVerified ? "Verification complete" : "Upload verification docs"}
          <span className="text-xs text-gray-500 transition-all group-open:rotate-45">+</span>
        </summary>
        <div className="mt-4 space-y-3">
          {idVerified && selfieVerified ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-100 bg-green-50 p-3 text-sm text-green-800">
              <svg className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 00-1.414-1.414L9 10.172 5.707 6.879a1 1 0 00-1.414 1.414l4 4a1 1 0 001.414 0l6.586-6.586z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Your documents are verified. Future listings skip uploads.</span>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1 text-sm text-gray-700">
                <span className="font-semibold text-gray-900">ID (Front){idDocsNeeded ? " *" : ""}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  required={!idVerified}
                />
              </label>
              <label className="space-y-1 text-sm text-gray-700">
                <span className="font-semibold text-gray-900">ID (Back){idDocsNeeded ? " *" : ""}</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setIdBackFile(e.target.files?.[0] || null)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  required={!idVerified}
                />
              </label>
              <label className="space-y-1 text-sm text-gray-700 md:col-span-2">
                <span className="font-semibold text-gray-900">Selfie with ID{selfieNeeded ? " *" : ""}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                  required={!selfieVerified}
                />
              </label>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Docs are reviewed by admin. Once approved future listings skip this step.
          </p>
        </div>
        {docUploading && (
          <p className="mt-2 text-xs text-gray-600">Uploading documents...</p>
        )}
      </details>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">Images</p>
          <h3 className="text-lg font-semibold text-gray-900">Add photos (up to 5)</h3>
        </div>
        <div className="space-y-3">
          <div className="border-2 border-dashed border-gray-300 rounded-xl px-4 py-6 text-center transition hover:border-orange-400">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="product-images-upload"
            />
            <label htmlFor="product-images-upload" className="cursor-pointer text-sm font-semibold text-gray-700">
              Click to upload or drag & drop
            </label>
            <p className="text-xs text-gray-500">5MB per photo.</p>
          </div>
          {selectedImages.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedImages.map((file, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-xs">
                  <span className="truncate max-w-[140px]">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="rounded-full bg-white px-2 text-red-600 shadow-sm"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <button
        type="submit"
        disabled={uploading || docUploading}
        className={`w-full rounded-2xl px-6 py-3 text-lg font-semibold transition ${
          uploading || docUploading ? "bg-gray-300 text-gray-600" : "bg-orange-600 text-white hover:bg-orange-700"
        }`}
      >
        {docUploading ? "Uploading documents..." : uploading ? "Listing product..." : "Publish listing"}
      </button>
      <p className="text-xs text-center text-gray-500">
        {idVerified && selfieVerified
          ? "Identity verified. Free listings for 3 months, then 2.5% commission applies."
          : "ID + selfie verification required. Admin reviews once then you skip future uploads."}
      </p>
    </form>
  );
};

export default ListProduct;
