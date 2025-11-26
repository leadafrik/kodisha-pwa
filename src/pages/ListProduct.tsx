import React, { useEffect, useMemo, useState } from "react";
import { useProperties } from "../contexts/PropertyContext";
import { useAuth } from "../contexts/AuthContext";
import { kenyaCounties, getConstituenciesByCounty, getWardsByConstituency } from "../data/kenyaCounties";

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

  const commission = useMemo(() => {
    const numPrice = Number(price) || 0;
    return Math.max(numPrice * 0.005, 49);
  }, [price]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("Please log in to list products.");
      return;
    }
    if (!user.verification?.idVerified || !user.verification?.selfieVerified) {
      alert("Please verify your ID and selfie before listing products.");
      return;
    }
    setUploading(true);
    try {
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
      alert("Product listed! Boosted/paid/verified listings show first in the marketplace.");
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
            Commission: {formatPrice(commission)} or waived with subscription.
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
              All product listings are currently free during our introductory phase.
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
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={uploading}
        className={`w-full py-3 rounded-lg font-semibold text-lg transition duration-300 ${
          uploading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-600 hover:bg-orange-700 text-white"
        }`}
      >
        {uploading ? "Listing..." : "List Product"}
      </button>
      <p className="text-xs text-gray-500 text-center">
        ID + selfie verification required. All listings are currently free during our introductory phase.
      </p>
    </form>
  );
};

export default ListProduct;
