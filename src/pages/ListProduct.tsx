import React, { useEffect, useMemo, useState } from "react";
import { useProperties } from "../contexts/PropertyContext";
import { useAuth } from "../contexts/AuthContext";
import { kenyaCounties, getConstituenciesByCounty, getWardsByConstituency } from "../data/kenyaCounties";
import { API_BASE_URL } from "../config/api";
import { AlertCircle } from "lucide-react";

type ProductCategory = "produce" | "livestock" | "inputs";

type ListProductProps = {
  initialCategory?: ProductCategory;
};

const formatPrice = (v: number) => `KSh ${v.toLocaleString()}`;

const ListProduct: React.FC<ListProductProps> = ({ initialCategory = "produce" }) => {
  const { addProduct } = useProperties();
  const { user, refreshUser } = useAuth();
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
    if (user?._id) {
      refreshUser();
    }
  }, [user?._id, refreshUser]);

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

  const idVerified = !!user?.verification?.idVerified;
  const selfieVerified = !!user?.verification?.selfieVerified;
  const hasPendingIdVerification =
    !!user?.verification?.idVerificationPending ||
    !!user?.verification?.idVerificationSubmitted;
  const isVerificationPending =
    hasPendingIdVerification && (!idVerified || !selfieVerified);
  const idDocsNeeded = !idVerified && !hasPendingIdVerification;
  const selfieNeeded = !selfieVerified && !hasPendingIdVerification;

  const uploadVerificationDoc = async (type: string, file: File) => {
    const token = localStorage.getItem('kodisha_token');
    if (!token) {
      throw new Error('You must be logged in to upload verification documents.');
    }

    const formData = new FormData();
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

    if (!idVerified && !hasPendingIdVerification) {
      if (idFrontFile) uploads.push({ type: 'id-front', file: idFrontFile });
      if (idBackFile) uploads.push({ type: 'id-back', file: idBackFile });
    }
    if (!selfieVerified && !hasPendingIdVerification && selfieFile) {
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
    if (!idVerified && !hasPendingIdVerification && (!idFrontFile || !idBackFile)) {
      alert("Please upload both sides of your National ID (front and back).");
      return;
    }
    if (!selfieVerified && !hasPendingIdVerification && !selfieFile) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            What are you listing?
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-700 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          >
            <option value="produce">Produce/Harvest</option>
            <option value="livestock">Livestock/Animals</option>
            <option value="inputs">Farm Inputs</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            placeholder="e.g., 10 bags of maize, 2 heifers, drip kit"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Price (KSh) *</label>
          <input
            type="number"
            min="0"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Free for 3 months. After that: {formatPrice(commission)} commission (2.5% of price, minimum KSh 49).
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Quantity</label>
          <input
            type="number"
            min="0"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Unit</label>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          >
            <option value="kg">Kg</option>
            <option value="tonne">Tonne</option>
            <option value="piece">Piece</option>
            <option value="bag">Bag</option>
            <option value="litre">Litre</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">Description *</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          placeholder="Condition, grade, delivery terms, etc."
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">County *</label>
          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
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
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Constituency *</label>
          <select
            value={constituency}
            onChange={(e) => setConstituency(e.target.value)}
            required
            disabled={!county}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          >
            <option value="">Select</option>
            {constituencies.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">Ward *</label>
          <select
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            required
            disabled={!constituency}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          >
            <option value="">Select</option>
            {wards.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-1">
          Specific Location/Address
        </label>
        <input
          value={approximateLocation}
          onChange={(e) => setApproximateLocation(e.target.value)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
          placeholder="e.g., Near main road, market, stage"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-1">
            Contact Phone *
          </label>
          <input
            type="tel"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            placeholder="07xx..."
            pattern="[0-9]{10}"
          />
        </div>
        <div className="flex items-center gap-4 bg-orange-50 rounded-lg border border-orange-100 px-3 py-3">
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">
              Listing Status
            </p>
            <p className="text-xs text-orange-700">
              New accounts enjoy free listings for the first 3 months. After that, a 2.5% commission applies (minimum KSh 49).
            </p>
          </div>
          {/* Future monetization options - commented out during free launch
          <div className="flex flex-col gap-2 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={subscribed}
                onChange={(e) => setSubscribed(e.target.checked)}
              />
              <span>Annual subscription</span>
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={premiumBadge}
                onChange={(e) => setPremiumBadge(e.target.checked)}
              />
              <span>Premium badge (+KSh 199)</span>
            </label>
          </div>
          */}
        </div>
      </div>

      {/* Verification Documents Section */}
      <div className="mb-6 space-y-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Verification Documents</h2>
            <p className="text-sm text-gray-600">
              Upload your ID and selfie once. Listings submitted before approval stay in pending verification until reviewed.
            </p>
          </div>
          {docUploading && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              Uploading docs...
            </span>
          )}
        </div>

        {idVerified && selfieVerified ? (
          <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-green-800 font-semibold">ID already verified</p>
              <p className="text-sm text-green-700">Your identity documents have been verified by our team.</p>
            </div>
          </div>
        ) : isVerificationPending ? (
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <p className="text-amber-800 font-semibold">Documents submitted</p>
              <p className="text-sm text-amber-700">
                Your ID and selfie are pending review. You can submit this listing now; it will stay pending until approved.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-gray-700">
              <span className="font-semibold text-gray-900">
                National ID (Front) {idDocsNeeded ? '*' : ''}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                required={idDocsNeeded}
              />
              <p className="mt-1 text-xs text-gray-500">
                Required for product listings unless already verified.
              </p>
            </label>

            <label className="block text-sm text-gray-700">
              <span className="font-semibold text-gray-900">
                National ID (Back) {idDocsNeeded ? '*' : ''}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setIdBackFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                required={idDocsNeeded}
              />
              <p className="mt-1 text-xs text-gray-500">
                Required for product listings unless already verified.
              </p>
            </label>

            <label className="block text-sm text-gray-700 md:col-span-2">
              <span className="font-semibold text-gray-900">
                Selfie holding ID {selfieNeeded ? '*' : ''}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                required={selfieNeeded}
              />
              <p className="mt-1 text-xs text-gray-500">
                Take a clear photo holding your ID next to your face. Required unless already verified.
              </p>
            </label>
          </div>
        )}

        <div className="bg-blue-100/50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-800">
            <strong>Note:</strong> These documents are reviewed by our admin team. Once verified, you won't need to upload them again for future listings.
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">
          Images (up to 5)
        </label>
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-orange-400 transition-colors">
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
          <p className="text-xs text-gray-500">Max 5 images, 5MB each.</p>
        </div>
        {selectedImages.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedImages.map((file, idx) => (
              <div key={idx} className="bg-gray-100 rounded-lg px-2 py-1 text-xs flex items-center gap-2">
                <span className="truncate max-w-[140px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  className="text-red-600 font-bold"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={uploading || docUploading}
        className={`w-full py-3 rounded-lg font-semibold text-lg transition duration-300 ${
          uploading || docUploading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700 text-white"
        }`}
      >
        {docUploading ? "Uploading Documents..." : uploading ? "Listing Product..." : "List Product"}
      </button>
      <p className="text-xs text-gray-500 text-center">
        {idVerified && selfieVerified
          ? "Your identity is verified. Free listings for 3 months, then 2.5% commission applies."
          : isVerificationPending
          ? "Documents submitted. This listing will stay pending until verification is approved."
          : "Upload ID + selfie once to submit; review is handled by admin."}
      </p>
    </form>
  );
};

export default ListProduct;
