import React, { useState, useEffect } from "react";
import { useProperties } from "../contexts/PropertyContext";
import { ServiceFormData } from "../types/property";
import { Link } from "react-router-dom";
import {
  kenyaCounties,
  getConstituenciesByCounty,
  getWardsByConstituency,
} from "../data/kenyaCounties";

type ServiceType = "equipment" | "professional_services";

const ListService: React.FC = () => {
  const { addService } = useProperties();
  const [formData, setFormData] = useState<ServiceFormData>({
    type: "equipment",
    name: "",
    description: "",
    county: "",
    constituency: "",
    ward: "",
    contact: "",
    services: [],
    pricing: "",
    experience: "",
    operatorIncluded: false,
    approximateLocation: "",
    alternativeContact: "",
    email: "",
    businessHours: "",
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [constituencies, setConstituencies] = useState<
    { value: string; label: string }[]
  >([]);
  const [wards, setWards] = useState<{ value: string; label: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [businessPermitFile, setBusinessPermitFile] = useState<File | null>(null);

  const serviceOptions: Record<ServiceType, string[]> = {
    equipment: [
      "Tractor Hire & Ploughing",
      "Combine Harvester",
      "Planting Equipment",
      "Spraying Equipment",
      "Irrigation Systems",
      "Water Pumps",
      "Transport Trailers",
      "Tillers & Cultivators",
      "Greenhouse Equipment",
      "Solar Systems",
      "Fencing Equipment",
      "Harvesting Machinery",
      "Post-Harvest Equipment",
    ],
    professional_services: [
      "Land Survey & Boundary Marking",
      "Soil Testing & Analysis",
      "Agricultural Consulting",
      "Farm Planning & Design",
      "Legal Services",
      "Title Processing & Transfers",
      "Farm Management",
      "Valuation Services",
      "Irrigation Design",
      "Greenhouse Construction",
      "Farm Infrastructure",
      "Environmental Assessment",
    ],
  };

  const typeLabels: Record<ServiceType, string> = {
    equipment: "Equipment Hire",
    professional_services: "Professional Services",
  };

  const typeDescriptions: Record<ServiceType, string> = {
    equipment: "Rent out farm machinery and equipment",
    professional_services: "Offer expert agricultural services",
  };

  const getServiceOptions = (type: string): string[] => {
    return serviceOptions[type as ServiceType] || [];
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 10 - selectedImages.length);
      setSelectedImages((prev) => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (formData.county) {
      const countyConstituencies = getConstituenciesByCounty(formData.county);
      setConstituencies(countyConstituencies);
      setFormData((prev) => ({
        ...prev,
        constituency: "",
        ward: "",
      }));
      setWards([]);
    } else {
      setConstituencies([]);
      setWards([]);
    }
  }, [formData.county]);

  useEffect(() => {
    if (formData.county && formData.constituency) {
      const constituencyWards = getWardsByConstituency(
        formData.county,
        formData.constituency
      );
      setWards(constituencyWards);
      setFormData((prev) => ({
        ...prev,
        ward: "",
      }));
    } else {
      setWards([]);
    }
  }, [formData.county, formData.constituency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!idFrontFile || !idBackFile || !selfieFile) {
        alert("Please upload ID front, ID back, and a selfie with your ID to list a service.");
        setSubmitting(false);
        return;
      }

      const submitData = new FormData();

      submitData.append("type", formData.type);
      submitData.append("name", formData.name.trim());
      submitData.append("description", formData.description.trim());
      submitData.append("county", formData.county);
      submitData.append("constituency", formData.constituency);
      submitData.append("ward", formData.ward);
      submitData.append("contact", formData.contact.trim());
      submitData.append("services", selectedServices.join(","));

      if (formData.approximateLocation) {
        submitData.append(
          "approximateLocation",
          formData.approximateLocation.trim()
        );
      }

      if (formData.alternativeContact) {
        submitData.append("alternativeContact", formData.alternativeContact);
      }
      if (formData.email) {
        submitData.append("email", formData.email);
      }
      if (formData.businessHours) {
        submitData.append("businessHours", formData.businessHours);
      }

      if (formData.type === "equipment") {
        if (formData.pricing) submitData.append("pricing", formData.pricing);
        submitData.append(
          "operatorIncluded",
          (formData.operatorIncluded || false).toString()
        );
      } else if (formData.type === "professional_services") {
        if (formData.pricing) submitData.append("pricing", formData.pricing);
        if (formData.experience)
          submitData.append("experience", formData.experience);
        if (formData.qualifications)
          submitData.append("qualifications", formData.qualifications);
      }

      selectedImages.forEach((image) => {
        submitData.append("images", image);
      });

      submitData.append("idFront", idFrontFile);
      submitData.append("idBack", idBackFile);
      submitData.append("selfie", selfieFile);
      if (businessPermitFile) {
        submitData.append("businessPermit", businessPermitFile);
      }

      await addService(submitData as any);
      alert("Service listed successfully! It will appear after verification.");

      setFormData({
        type: "equipment",
        name: "",
        description: "",
        county: "",
        constituency: "",
        ward: "",
        contact: "",
        services: [],
        pricing: "",
        experience: "",
        operatorIncluded: false,
        approximateLocation: "",
        alternativeContact: "",
        email: "",
        businessHours: "",
      });
      setSelectedServices([]);
      setSelectedImages([]);
      setConstituencies([]);
      setWards([]);
      setIdFrontFile(null);
      setIdBackFile(null);
      setSelfieFile(null);
      setBusinessPermitFile(null);
    } catch (error) {
      alert("Error listing service. Please try again.");
      console.error("Submission error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const value =
      e.target.type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });

    if (e.target.name === "type") {
      setSelectedServices([]);
    }
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service)
        ? prev.filter((s) => s !== service)
        : [...prev, service]
    );
  };

  const countiesForDropdown = kenyaCounties.map((county) => ({
    value: county.name.toLowerCase(),
    label: county.name,
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          List Equipment or Professional Service
        </h1>
        <p className="text-gray-600">
          Offer farm equipment hire or professional agricultural services to
          farmers
        </p>
        <div className="flex gap-4 mt-4">
          <Link
            to="/list-property"
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            List Land Instead
          </Link>
          <Link
            to="/list-agrovet"
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            List Agrovet Instead
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Service Type </label>
            <div className="grid grid-cols-2 gap-4">
              {(["equipment", "professional_services"] as ServiceType[]).map(
                (type) => (
                  <label
                    key={type}
                    className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-gray-200 hover:border-green-500"
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={formData.type === type}
                      onChange={handleChange}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-semibold text-lg">
                        {typeLabels[type]}
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {typeDescriptions[type]}
                      </div>
                    </div>
                  </label>
                )
              )}
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Description </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder={
                formData.type === "equipment"
                  ? "Describe your equipment, conditions, availability, and why farmers should choose you..."
                  : "Describe your expertise, qualifications, experience, and services offered..."
              }
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">
              {formData.type === "equipment"
                ? "Company/Equipment Owner Name *"
                : "Service Provider Name *"}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder={
                formData.type === "equipment"
                  ? "e.g., FarmTech Equipment Hire"
                  : "e.g., Kenya Land Surveyors Ltd"
              }
              required
            />
          </div>

          {formData.type === "equipment" && (
            <div className="md:col-span-2 border-l-4 border-orange-500 pl-4 bg-orange-50 rounded-r-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Equipment Photos (Optional)
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Add photos of your equipment to attract more customers. Maximum
                10 photos, 5MB each.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="service-image-upload"
                />
                <label htmlFor="service-image-upload" className="cursor-pointer">
                  <p className="font-semibold text-gray-700">
                    Upload Equipment Photos
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Click to select images or drag and drop
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Up to 10 images - JPG, PNG, GIF - Max 5MB each
                  </p>
                </label>
              </div>

              {selectedImages.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Selected images ({selectedImages.length}/10):
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {selectedImages.map((file, index) => (
                      <div
                        key={index}
                        className="relative bg-gray-100 rounded-lg p-2"
                      >
                        <div className="text-xs text-gray-700 max-w-24 truncate">
                          {file.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                        >
                          
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {formData.type === "equipment" && (
            <div className="md:col-span-2 border-l-4 border-blue-500 pl-4 bg-blue-50 rounded-r-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">Equipment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Pricing Information *
                  </label>
                  <input
                    type="text"
                    name="pricing"
                    value={formData.pricing || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., KSh 2,500 per hour, KSh 15,000 per day"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="operatorIncluded"
                    checked={formData.operatorIncluded || false}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="text-gray-700">Operator Included</label>
                </div>
              </div>
            </div>
          )}

          {formData.type === "professional_services" && (
            <div className="md:col-span-2 border-l-4 border-purple-500 pl-4 bg-purple-50 rounded-r-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">
                Professional Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 5+ years, Since 2010"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Pricing Model</label>
                  <input
                    type="text"
                    name="pricing"
                    value={formData.pricing || ""}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Project-based, Hourly rate, Free consultation"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="md:col-span-2">
            <h3 className="font-semibold text-gray-800 mb-4">Service Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">County *</label>
                <select
                  name="county"
                  value={formData.county}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                >
                  <option value="">Select County</option>
                  {countiesForDropdown.map((county) => (
                    <option key={county.value} value={county.value}>
                      {county.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Constituency *</label>
                <select
                  name="constituency"
                  value={formData.constituency}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={!formData.county}
                >
                  <option value="">
                    {formData.county ? "Select Constituency" : "Select County First"}
                  </option>
                  {constituencies.map((constituency) => (
                    <option key={constituency.value} value={constituency.value}>
                      {constituency.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">Ward *</label>
                <select
                  name="ward"
                  value={formData.ward}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                  disabled={!formData.constituency}
                >
                  <option value="">
                    {formData.constituency ? "Select Ward" : "Select Constituency First"}
                  </option>
                  {wards.map((ward) => (
                    <option key={ward.value} value={ward.value}>
                      {ward.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-gray-700 mb-2">
                Specific Location/Address *
              </label>
              <input
                type="text"
                name="approximateLocation"
                value={formData.approximateLocation}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Near main road, Industrial area, Opposite market"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                This helps farmers find your service location
              </p>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">
              {formData.type === "equipment"
                ? "Equipment & Services Offered *"
                : "Professional Services Offered *"}
            </label>
            <p className="text-sm text-gray-500 mb-3">
              Select all that apply to your business
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getServiceOptions(formData.type).map((service: string) => (
                <label
                  key={service}
                  className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                    className="mr-3"
                  />
                  <span className="font-medium">{service}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-2 border-l-4 border-green-500 pl-4 bg-green-50 rounded-r-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="contact"
                  value={formData.contact}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 0712 345 678"
                  pattern="[0-9]{10}"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  This number will be visible to potential customers
                </p>
              </div>

              <div>
                <label className="block text-gray-700 mb-2">
                  Alternative Phone (Optional)
                </label>
                <input
                  type="tel"
                  name="alternativeContact"
                  value={formData.alternativeContact || ""}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="e.g., 0700 123 456"
                  pattern="[0-9]{10}"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Additional contact number
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-gray-700 mb-2">Email Address (Optional)</label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., contact@yourbusiness.com"
              />
              <p className="text-sm text-gray-500 mt-1">
                For official communications
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-gray-700 mb-2">Business Hours (Optional)</label>
              <input
                type="text"
                name="businessHours"
                value={formData.businessHours || ""}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., Mon-Fri: 8AM-6PM, Sat: 9AM-1PM"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-2">
            Identity & Business Verification (Required)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload clear photos of your ID front and back, plus a selfie holding your ID. Business permit is optional but boosts trust.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">ID Front *</label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">ID Back *</label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setIdBackFile(e.target.files?.[0] || null)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Selfie with ID *</label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-gray-700 mb-2">
                Business Permit (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBusinessPermitFile(e.target.files?.[0] || null)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-800 text-sm">
            Verified listings appear after review. Farmers will contact you
            directly for bookings and inquiries. Photos and clear pricing help
            build trust.
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3 rounded-lg font-semibold text-lg transition duration-300 mt-6 ${
            submitting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          }`}
        >
          {submitting ? "Listing Service..." : "List Service"}
        </button>
      </form>
    </div>
  );
};

export default ListService;



