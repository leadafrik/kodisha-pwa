import React, { useState, useEffect } from "react";
import { useProperties } from "../contexts/PropertyContext";
import { useAuth } from "../contexts/AuthContext";
import { ServiceFormData } from "../types/property";
import {
  kenyaCounties,
  getConstituenciesByCounty,
  getWardsByConstituency,
} from "../data/kenyaCounties";
import { initiatePaymentFlow } from "../utils/paymentHelpers";

type ServiceType = "equipment" | "professional_services";

type ListServiceProps = {
  initialServiceType?: ServiceType;
};

type SubscriptionPlanOption = {
  id: "annual";
  name: string;
  price: number;
  subtitle: string;
  duration: string;
};

const LISTING_PLAN_OPTIONS: SubscriptionPlanOption[] = [
  {
    id: "annual",
    name: "Standard Listing",
    price: 0,
    subtitle: "Free for your first 3 months. After 3 months, 2.5% commission (minimum KSh 49).",
    duration: "Active until removed",
  },
];

type BoostOption = {
  id: "none" | "daily" | "weekly" | "monthly";
  name: string;
  price: number;
  subtitle: string;
};

const BOOST_OPTIONS: BoostOption[] = [
  {
    id: "none",
    name: "Standard Placement",
    price: 0,
    subtitle: "Your listing appears in the regular feed.",
  },
  /* Future boost options - commented out during free launch phase
  {
    id: "daily",
    name: "KSh 50 / Day Boost",
    price: 50,
    subtitle: "Top of feed for 24 hours.",
  },
  {
    id: "weekly",
    name: "KSh 150 / Week Boost",
    price: 150,
    subtitle: "Featured section for seven days.",
  },
  {
    id: "monthly",
    name: "KSh 499 / Month Boost",
    price: 499,
    subtitle: "Carousel banner for one month.",
  },
  */
];

type VerificationTierOption = {
  id: "none" | "basic" | "advanced" | "business";
  name: string;
  price: number;
  subtitle: string;
};

const VERIFICATION_TIERS: VerificationTierOption[] = [
  {
    id: "none",
    name: "Standard Verification",
    price: 0,
    subtitle: "All listings include manual verification by our team.",
  },
  /* Future verification tiers - commented out during free launch phase
  {
    id: "basic",
    name: "KSh 99 Basic Verification",
    price: 99,
    subtitle: "ID + selfie verification for trust badges.",
  },
  {
    id: "advanced",
    name: "KSh 199 Advanced Verification",
    price: 199,
    subtitle: "Ownership/business proof for faster trust.",
  },
  {
    id: "business",
    name: "KSh 399 Business Verification",
    price: 399,
    subtitle: "Full business profile verification.",
  },
  */
];

type ListingPlanId = SubscriptionPlanOption["id"];
type BoostOptionId = BoostOption["id"];
type VerificationTierId = VerificationTierOption["id"];

const formatKenyanPrice = (value: number) =>
  value === 0 ? "Free" : `KSh ${value.toLocaleString()}`;

const ListService: React.FC<ListServiceProps> = ({ initialServiceType }) => {
  const { addService } = useProperties();
  const { user } = useAuth();
  const [formData, setFormData] = useState<ServiceFormData>({
    type: initialServiceType || "equipment",
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
  const [otherService, setOtherService] = useState<string>("");
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
  const [selectedPlan, setSelectedPlan] = useState<ListingPlanId>("annual");
  const [selectedBoost, setSelectedBoost] = useState<BoostOptionId>("none");
  const [selectedVerification, setSelectedVerification] =
    useState<VerificationTierId>("none");
  const idVerified = !!user?.verification?.idVerified;
  const selfieVerified = !!user?.verification?.selfieVerified;
  const hasPendingIdVerification =
    !!user?.verification?.idVerificationPending ||
    !!user?.verification?.idVerificationSubmitted;
  const isVerificationPending =
    hasPendingIdVerification && (!idVerified || !selfieVerified);
  const idDocsNeeded = !idVerified && !hasPendingIdVerification;
  const selfieNeeded = !selfieVerified && !hasPendingIdVerification;

  useEffect(() => {
    if (initialServiceType && initialServiceType !== formData.type) {
      setFormData((prev) => ({ ...prev, type: initialServiceType }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialServiceType]);

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

  const selectedPlanDetails =
    LISTING_PLAN_OPTIONS.find((plan) => plan.id === selectedPlan) ||
    LISTING_PLAN_OPTIONS[0];
  const selectedBoostDetails =
    BOOST_OPTIONS.find((option) => option.id === selectedBoost) ||
    BOOST_OPTIONS[0];
  const selectedVerificationDetails =
    VERIFICATION_TIERS.find((tier) => tier.id === selectedVerification) ||
    VERIFICATION_TIERS[0];

  const effectivePlanPrice = selectedPlanDetails.price;
  const boostPrice = selectedBoostDetails.price;
  const verificationPrice = selectedVerificationDetails.price;
  const totalMonetizationFee =
    effectivePlanPrice + boostPrice + verificationPrice;
  const boostLabel =
    selectedBoost !== "none" ? ` with ${selectedBoostDetails.name}` : "";
  const verificationLabel =
    selectedVerification !== "none"
      ? ` and ${selectedVerificationDetails.name}`
      : "";
  const monetizationSummaryLabel = `${selectedPlanDetails.name}${boostLabel}${verificationLabel}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (!idVerified && !hasPendingIdVerification && (!idFrontFile || !idBackFile || !selfieFile)) {
        alert("Please upload ID front, ID back, and a selfie with your ID to list a service.");
        setSubmitting(false);
        return;
      }

      if (totalMonetizationFee > 0 && typeof window !== "undefined") {
        const confirmMessage = `${monetizationSummaryLabel}. You will be billed ${formatKenyanPrice(
          totalMonetizationFee
        )} once your listing is approved. Continue?`;
        if (!window.confirm(confirmMessage)) {
          setSubmitting(false);
          return;
        }
      }

      const submitData = new FormData();

      submitData.append("type", formData.type);
      submitData.append("name", formData.name.trim());
      submitData.append("description", formData.description.trim());
      submitData.append("county", formData.county);
      submitData.append("constituency", formData.constituency);
      submitData.append("ward", formData.ward);
      submitData.append("contact", formData.contact.trim());
      // Include custom 'Other' text if provided
      const servicesToSubmit = selectedServices.includes("Other") && otherService.trim()
        ? [
            ...selectedServices.filter((s) => s !== "Other"),
            otherService.trim(),
          ]
        : selectedServices;
      submitData.append("services", servicesToSubmit.join(","));
      submitData.append("listingPlan", selectedPlan);
      submitData.append("listingPlanPrice", String(effectivePlanPrice));
      submitData.append("boostOption", selectedBoost);
      submitData.append("boostPrice", String(boostPrice));
      submitData.append("verificationTier", selectedVerification);
      submitData.append("verificationPrice", String(verificationPrice));
      submitData.append("planDuration", selectedPlanDetails.duration);
      submitData.append("totalMonetizationFee", String(totalMonetizationFee));

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

      if (idFrontFile) submitData.append("idFront", idFrontFile);
      if (idBackFile) submitData.append("idBack", idBackFile);
      if (selfieFile) submitData.append("selfie", selfieFile);
      if (businessPermitFile) {
        submitData.append("businessPermit", businessPermitFile);
      }

      const result = await addService(submitData as any);

      const serviceId =
        result?.data?._id || result?.data?.id || result?.service?._id || result?.service?.id;

      let paymentNote = "";
      if (totalMonetizationFee > 0 && serviceId) {
        try {
          await initiatePaymentFlow({
            targetType: "service",
            targetId: serviceId,
            amount: totalMonetizationFee,
            targetCategory: formData.type,
            summaryLabel: monetizationSummaryLabel,
          });
          paymentNote = " A payment request was sent to your phone.";
        } catch (error: any) {
          console.error("Service payment failed", error);
          paymentNote =
            " MPesa request could not be initiated; please try again once you have your phone ready.";
        }
      }

      const wasAutoVerified = !!(user?.verification?.idVerified && user?.verification?.selfieVerified);
      const publishMessage = wasAutoVerified
        ? 'Service listed and is now live.'
        : 'Service listed successfully! It will appear after verification.';
      const feeNote =
        totalMonetizationFee > 0
          ? `${monetizationSummaryLabel} for ${formatKenyanPrice(totalMonetizationFee)}.${paymentNote}`
          : 'You used your free listing credit.';
      alert(`${publishMessage} ${feeNote}`);

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
      setOtherService("");
      setSelectedImages([]);
      setConstituencies([]);
      setWards([]);
      setIdFrontFile(null);
      setIdBackFile(null);
      setSelfieFile(null);
      setBusinessPermitFile(null);
      setSelectedPlan("annual");
      setSelectedBoost("none");
      setSelectedVerification("none");
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
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6 space-y-4 rounded-2xl border border-green-200 bg-green-50/40 p-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Monetized Listing Options</h2>
            <p className="text-sm text-gray-600">
              Annual subscription for providers plus optional boosts and verification; your total commitment is shown below.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {LISTING_PLAN_OPTIONS.map((plan) => {
              const selected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  aria-pressed={selected}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? "border-green-600 bg-white shadow-sm"
                      : "border-gray-200 bg-white hover:border-green-500"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold uppercase tracking-wide text-green-600">
                      {plan.price === 0 ? "Free" : formatKenyanPrice(plan.price)}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-semibold text-gray-900">{plan.name}</p>
                  <p className="text-sm text-gray-500">{plan.subtitle}</p>
                </button>
              );
            })}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <label className="block text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Boost Option</span>
              <select
                name="boostOption"
                value={selectedBoost}
                onChange={(e) => setSelectedBoost(e.target.value as BoostOptionId)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {BOOST_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} - {formatKenyanPrice(option.price)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">{selectedBoostDetails.subtitle}</p>
            </label>
            <label className="block text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Verification Tier</span>
              <select
                name="verificationTier"
                value={selectedVerification}
                onChange={(e) =>
                  setSelectedVerification(e.target.value as VerificationTierId)
                }
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {VERIFICATION_TIERS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name} - {formatKenyanPrice(option.price)}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {selectedVerificationDetails.subtitle}
              </p>
            </label>
          </div>
          <div className="rounded-lg border border-dashed border-green-200 bg-white p-3 text-sm text-gray-700">
            <p className="font-semibold text-gray-900">
              Total commitment: {formatKenyanPrice(totalMonetizationFee)}
            </p>
            <p>
              Annual subscription stays active for {selectedPlanDetails.duration}. Renew from your profile when it expires.
            </p>
            <p className="text-xs text-gray-500">
              Payment (M-Pesa) is triggered after admin approval.
            </p>
          </div>
        </div>
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
              {/* Other option */}
              <div className="p-3 border rounded-lg">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes("Other")}
                    onChange={() => handleServiceToggle("Other")}
                    className="mr-3"
                  />
                  <span className="font-medium">Other</span>
                </label>
                {selectedServices.includes("Other") && (
                  <input
                    type="text"
                    value={otherService}
                    onChange={(e) => setOtherService(e.target.value)}
                    className="mt-2 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Describe other service (e.g., Bee Keeping Advisory)"
                  />
                )}
              </div>
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
            Identity & Business Verification
          </h3>
          
          {idVerified && selfieVerified ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-green-800 font-semibold">ID already verified</p>
                  <p className="text-sm text-green-700">Your identity documents have been verified by our team. You won't need to upload ID again for future service or agrovet listings.</p>
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>One-time verification:</strong> We verify IDs once to reduce fraud and impersonation. Your future listings will be published faster.
                </p>
              </div>
            </div>
          ) : isVerificationPending ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <span className="mt-0.5 text-amber-600">!</span>
                <div>
                  <p className="text-amber-800 font-semibold">Documents submitted</p>
                  <p className="text-sm text-amber-700">
                    Your ID and selfie are pending review. You can submit this listing now; it will stay pending until approved.
                  </p>
                </div>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>One-time verification:</strong> We verify IDs once to reduce fraud and impersonation. Your future listings will be published faster.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Why we verify:</strong> We verify IDs once to reduce fraud and impersonation. After approval, you skip ID uploads for future listings.
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Upload clear photos of your ID front and back, plus a selfie holding your ID.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">ID Front *</label>
                  <input
                    type="file"
                    accept="image/*"
                    required={idDocsNeeded}
                    onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">ID Back *</label>
                  <input
                    type="file"
                    accept="image/*"
                    required={idDocsNeeded}
                    onChange={(e) => setIdBackFile(e.target.files?.[0] || null)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Selfie with ID *</label>
                  <input
                    type="file"
                    accept="image/*"
                    required={selfieNeeded}
                    onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            </>
          )}
          
          <div className="mt-4">
            <label className="block text-gray-700 mb-2">
              Business Permit (Optional - Boosts Trust Score)
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBusinessPermitFile(e.target.files?.[0] || null)}
              className="w-full border rounded-lg px-3 py-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {user?.verification?.businessVerified 
                ? "Business permit verified. Upload a new one only if it has changed."
                : "Upload once to boost your trust score. You won't need to resubmit for future listings."}
            </p>
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



