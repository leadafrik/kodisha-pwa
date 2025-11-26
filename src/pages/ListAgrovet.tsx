import React, { useState, useEffect } from 'react';
import { useProperties } from '../contexts/PropertyContext';
import { Link } from 'react-router-dom';
import { kenyaCounties, getConstituenciesByCounty, getWardsByConstituency } from '../data/kenyaCounties';
import { initiatePaymentFlow } from '../utils/paymentHelpers';
import { PAYMENTS_ENABLED } from '../config/featureFlags';

interface AgrovetFormData {
  name: string;
  description: string;
  county: string;
  constituency: string;
  ward: string;
  town: string;
  approximateLocation: string;
  contact: string;
  openingHours: string;
  deliveryAvailable: boolean;
  
  // Categories
  products: boolean;
  animalHealth: boolean;
  cropProtection: boolean;
  equipment: boolean;
  
  // Specific Services
  seeds: string;
  fertilizers: string;
  animalFeeds: string;
  dewormers: boolean;
  vaccines: boolean;
  antibiotics: boolean;
  vitaminSupplements: boolean;
  artificialInsemination: boolean;
  pesticides: boolean;
  herbicides: boolean;
  fungicides: boolean;
  sprayers: boolean;
  waterPumps: boolean;
  protectiveGear: boolean;
  farmTools: boolean;
  
  // Photos
  photos: string[];
}

type ListingPlanOption = {
  id: "annual";
  name: string;
  price: number;
  subtitle: string;
  duration: string;
};

const LISTING_PLAN_OPTIONS: ListingPlanOption[] = [
  {
    id: "annual",
    name: "Standard Listing",
    price: 0,
    subtitle: "Post your agrovet listing with all essential features included.",
    duration: "Active until removed",
  },
  /* Future pricing - commented out during free launch phase
  {
    id: "annual",
    name: "Annual Subscription",
    price: 599,
    subtitle: "KSh 599/year — recurring exposure plus boosts.",
    duration: "12 months",
  },
  */
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
    subtitle: "Carousel coverage for a month.",
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
    subtitle: "Adds business/ownership proof.",
  },
  {
    id: "business",
    name: "KSh 399 Business Verification",
    price: 399,
    subtitle: "Full business profile verification.",
  },
  */
];

type ListingPlanId = ListingPlanOption["id"];
type BoostOptionId = BoostOption["id"];
type VerificationTierId = VerificationTierOption["id"];

const formatKenyanPrice = (value: number) =>
  value === 0 ? "Free" : `KSh ${value.toLocaleString()}`;

const ListAgrovet: React.FC = () => {
  const { addService } = useProperties();
  const [formData, setFormData] = useState<AgrovetFormData>({
    name: '',
    description: '',
    county: '',
    constituency: '',
    ward: '',
    town: '',
    approximateLocation: '',
    contact: '',
    openingHours: '',
    deliveryAvailable: false,
    
    // Categories
    products: false,
    animalHealth: false,
    cropProtection: false,
    equipment: false,
    
    // Services
    seeds: '',
    fertilizers: '',
    animalFeeds: '',
    dewormers: false,
    vaccines: false,
    antibiotics: false,
    vitaminSupplements: false,
    artificialInsemination: false,
    pesticides: false,
    herbicides: false,
    fungicides: false,
    sprayers: false,
    waterPumps: false,
    protectiveGear: false,
    farmTools: false,
    
    // Photos
    photos: []
  });

  const [constituencies, setConstituencies] = useState<{value: string; label: string}[]>([]);
  const [wards, setWards] = useState<{value: string; label: string}[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [businessPermitFile, setBusinessPermitFile] = useState<File | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<ListingPlanId>("annual");
  const [selectedBoost, setSelectedBoost] = useState<BoostOptionId>("none");
  const [selectedVerification, setSelectedVerification] =
    useState<VerificationTierId>("none");
  // Update constituencies when county changes
  useEffect(() => {
    if (formData.county) {
      const countyConstituencies = getConstituenciesByCounty(formData.county);
      setConstituencies(countyConstituencies);
      setFormData(prev => ({
        ...prev,
        constituency: '',
        ward: ''
      }));
      setWards([]);
    } else {
      setConstituencies([]);
      setWards([]);
    }
  }, [formData.county]);

  // Update wards when constituency changes
  useEffect(() => {
    if (formData.county && formData.constituency) {
      const constituencyWards = getWardsByConstituency(formData.county, formData.constituency);
      setWards(constituencyWards);
      setFormData(prev => ({
        ...prev,
        ward: ''
      }));
    } else {
      setWards([]);
    }
  }, [formData.county, formData.constituency]);

  const selectedPlanDetails =
    LISTING_PLAN_OPTIONS.find(plan => plan.id === selectedPlan) ||
    LISTING_PLAN_OPTIONS[0];
  const selectedBoostDetails =
    BOOST_OPTIONS.find(option => option.id === selectedBoost) || BOOST_OPTIONS[0];
  const selectedVerificationDetails =
    VERIFICATION_TIERS.find(tier => tier.id === selectedVerification) ||
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

  // Photo handling functions
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingPhotos(true);
    
    try {
      const newPhotos: string[] = [];
      
      // Convert files to base64
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert(`File ${file.name} is too large. Maximum size is 5MB.`);
          continue;
        }

        const base64 = await convertToBase64(file);
        newPhotos.push(base64);
      }

      // Add new photos to existing ones (limit to 8 photos)
      const updatedPhotos = [...formData.photos, ...newPhotos].slice(0, 8);
      
      setFormData(prev => ({
        ...prev,
        photos: updatedPhotos
      }));

      if (newPhotos.length < files.length) {
        alert('Some photos were not added due to size limits or maximum photo count reached.');
      }
    } catch (error) {
      alert('Error uploading photos. Please try again.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      if (!idFrontFile || !idBackFile || !selfieFile) {
        alert('Please upload ID front, ID back, and a selfie with your ID to list an agrovet.');
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

      // Convert to FormData for backend upload (uses professional endpoint until agrovet route exists)
      const submitData = new FormData();
      submitData.append('type', 'agrovet');
      submitData.append('name', formData.name);
      submitData.append('description', formData.description);
      submitData.append('county', formData.county);
      submitData.append('constituency', formData.constituency);
      submitData.append('ward', formData.ward);
      submitData.append('contact', formData.contact);
      submitData.append('services', getSelectedServices().join(','));
      submitData.append('listingPlan', selectedPlan);
      submitData.append('listingPlanPrice', String(effectivePlanPrice));
      submitData.append('boostOption', selectedBoost);
      submitData.append('boostPrice', String(boostPrice));
      submitData.append('verificationTier', selectedVerification);
      submitData.append('verificationPrice', String(verificationPrice));
      submitData.append('totalMonetizationFee', String(totalMonetizationFee));
      submitData.append('approximateLocation', formData.approximateLocation);

      submitData.append('idFront', idFrontFile);
      submitData.append('idBack', idBackFile);
      submitData.append('selfie', selfieFile);
      if (businessPermitFile) {
        submitData.append('businessPermit', businessPermitFile);
      }

      const result = await addService(submitData);

      const listingId =
        result?.data?._id || result?.data?.id || result?.service?._id || result?.service?.id;

      let paymentNote = "";
      if (PAYMENTS_ENABLED && totalMonetizationFee > 0 && listingId) {
        try {
          await initiatePaymentFlow({
            targetType: "agrovet",
            targetId: listingId,
            amount: totalMonetizationFee,
            summaryLabel: monetizationSummaryLabel,
          });
          paymentNote = " A payment request was sent to your phone.";
        } catch (error: any) {
          console.error("Agrovet payment failed", error);
          paymentNote = " MPesa request could not be initiated; try again via Payments.";
        }
      }

      const feeNote = !PAYMENTS_ENABLED
        ? 'Launch period: listing is free. No payment required.'
        : totalMonetizationFee > 0
          ? `${monetizationSummaryLabel} for ${formatKenyanPrice(totalMonetizationFee)}.${paymentNote}`
          : 'You used your free listing credit.';
      alert(
        `Agrovet listed successfully! It will appear after verification. ${feeNote}`
      );
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        county: '',
        constituency: '',
        ward: '',
        town: '',
        approximateLocation: '',
        contact: '',
        openingHours: '',
        deliveryAvailable: false,
        products: false,
        animalHealth: false,
        cropProtection: false,
        equipment: false,
        seeds: '',
        fertilizers: '',
        animalFeeds: '',
        dewormers: false,
        vaccines: false,
        antibiotics: false,
        vitaminSupplements: false,
        artificialInsemination: false,
        pesticides: false,
        herbicides: false,
        fungicides: false,
        sprayers: false,
        waterPumps: false,
        protectiveGear: false,
        farmTools: false,
        photos: []
      });
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
      alert('Error listing agrovet. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const getSelectedServices = (): string[] => {
    const services: string[] = [];
    
    // Products
    if (formData.seeds) services.push(`Seeds: ${formData.seeds}`);
    if (formData.fertilizers) services.push(`Fertilizers: ${formData.fertilizers}`);
    if (formData.animalFeeds) services.push(`Animal Feeds: ${formData.animalFeeds}`);
    
    // Animal Health
    if (formData.dewormers) services.push('Dewormers');
    if (formData.vaccines) services.push('Vaccines');
    if (formData.antibiotics) services.push('Antibiotics');
    if (formData.vitaminSupplements) services.push('Vitamin Supplements');
    if (formData.artificialInsemination) services.push('Artificial Insemination');
    
    // Crop Protection
    if (formData.pesticides) services.push('Pesticides');
    if (formData.herbicides) services.push('Herbicides');
    if (formData.fungicides) services.push('Fungicides');
    
    // Equipment
    if (formData.sprayers) services.push('Sprayers');
    if (formData.waterPumps) services.push('Water Pumps');
    if (formData.protectiveGear) services.push('Protective Gear');
    if (formData.farmTools) services.push('Farm Tools');
    
    return services;
  };

  const countiesForDropdown = kenyaCounties.map(county => ({
    value: county.name.toLowerCase(),
    label: county.name
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">List Your Agrovet</h1>
        <p className="text-gray-600">Connect with farmers by listing your agricultural products and services</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6 space-y-4 rounded-2xl border border-green-200 bg-green-50/40 p-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Listing Visibility Options</h2>
            {PAYMENTS_ENABLED ? (
              <p className="text-sm text-gray-600">Annual subscription unlocks boosted exposure; add optional verification and boosts.</p>
            ) : (
              <p className="text-sm text-green-700 font-semibold">Launch Offer: All plans and boosts are free while we onboard early partners.</p>
            )}
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
              <p className="mt-1 text-xs text-gray-500">{selectedVerificationDetails.subtitle}</p>
            </label>
          </div>
          <div className="rounded-lg border border-dashed border-green-200 bg-white p-3 text-sm text-gray-700">
            {PAYMENTS_ENABLED ? (
              <>
                <p className="font-semibold text-gray-900">Total commitment: {formatKenyanPrice(totalMonetizationFee)}</p>
                <p>Subscription lasts {selectedPlanDetails.duration}; renew from your profile when it expires.</p>
                <p className="text-xs text-gray-500">Payment will run after admin approval.</p>
              </>
            ) : (
              <p className="font-semibold text-green-700">Launch Period: No fees or payment processing yet—focus on accurate, high-quality agrovet data.</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Basic Information */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Agrovet Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., GreenFarm Agrovet"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Describe your agrovet, your specialties, and why farmers should choose you..."
              required
            />
          </div>

          {/* Agrovet Photos Section */}
          <div className="md:col-span-2 border-l-4 border-orange-500 pl-4 bg-orange-50 rounded-r-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">📸 Agrovet Photos (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Add photos of your agrovet storefront, products, or services to attract more customers. Maximum 8 photos, 5MB each.
            </p>
            
            {/* Photo Upload */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Upload Photos</label>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhotos || formData.photos.length >= 8}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-sm text-gray-500 mt-1">
                {uploadingPhotos ? 'Uploading...' : `Photos: ${formData.photos.length}/8`}
              </p>
            </div>

            {/* Photo Preview */}
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={photo} 
                      alt={`Agrovet ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg border"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Location with Dropdowns */}
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
              {countiesForDropdown.map(county => (
                <option key={county.value} value={county.value}>{county.label}</option>
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
              <option value="">{formData.county ? 'Select Constituency' : 'Select County First'}</option>
              {constituencies.map(constituency => (
                <option key={constituency.value} value={constituency.value}>{constituency.label}</option>
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
              <option value="">{formData.constituency ? 'Select Ward' : 'Select Constituency First'}</option>
              {wards.map(ward => (
                <option key={ward.value} value={ward.value}>{ward.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Town/Area</label>
            <input
              type="text"
              name="town"
              value={formData.town}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Kikuyu Town"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Approximate Location *</label>
            <input
              type="text"
              name="approximateLocation"
              value={formData.approximateLocation}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Near Kikuyu Market, next to petrol station"
              required
            />
          </div>

          {/* Service Categories */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-3">What do you offer? *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="products"
                  checked={formData.products}
                  onChange={handleChange}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">🛒 Products</div>
                  <div className="text-xs text-gray-500">Seeds, fertilizers, feeds</div>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="animalHealth"
                  checked={formData.animalHealth}
                  onChange={handleChange}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">💊 Animal Health</div>
                  <div className="text-xs text-gray-500">Dewormers, vaccines</div>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="cropProtection"
                  checked={formData.cropProtection}
                  onChange={handleChange}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">🌱 Crop Protection</div>
                  <div className="text-xs text-gray-500">Pesticides, herbicides</div>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  name="equipment"
                  checked={formData.equipment}
                  onChange={handleChange}
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">🔧 Equipment</div>
                  <div className="text-xs text-gray-500">Tools, sprayers, pumps</div>
                </div>
              </label>
            </div>
          </div>

          {/* Products Section */}
          {formData.products && (
            <div className="md:col-span-2 border-l-4 border-green-500 pl-4">
              <h3 className="font-semibold text-gray-800 mb-3">🛒 Products & Supplies</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Seeds Available</label>
                  <input
                    type="text"
                    name="seeds"
                    value={formData.seeds}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., maize, beans, vegetables"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fertilizers</label>
                  <input
                    type="text"
                    name="fertilizers"
                    value={formData.fertilizers}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., DAP, CAN, Urea"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Animal Feeds</label>
                  <input
                    type="text"
                    name="animalFeeds"
                    value={formData.animalFeeds}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g., dairy, poultry, pig"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Animal Health Section */}
          {formData.animalHealth && (
            <div className="md:col-span-2 border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-gray-800 mb-3">💊 Animal Health Services</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { name: 'dewormers', label: 'Dewormers' },
                  { name: 'vaccines', label: 'Vaccines' },
                  { name: 'antibiotics', label: 'Antibiotics' },
                  { name: 'vitaminSupplements', label: 'Vitamin Supplements' },
                  { name: 'artificialInsemination', label: 'AI Services' }
                ].map(service => (
                  <label key={service.name} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      name={service.name}
                      checked={formData[service.name as keyof AgrovetFormData] as boolean}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    {service.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Crop Protection Section */}
          {formData.cropProtection && (
            <div className="md:col-span-2 border-l-4 border-yellow-500 pl-4">
              <h3 className="font-semibold text-gray-800 mb-3">🌱 Crop Protection</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { name: 'pesticides', label: 'Pesticides' },
                  { name: 'herbicides', label: 'Herbicides' },
                  { name: 'fungicides', label: 'Fungicides' }
                ].map(service => (
                  <label key={service.name} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      name={service.name}
                      checked={formData[service.name as keyof AgrovetFormData] as boolean}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    {service.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Equipment Section */}
          {formData.equipment && (
            <div className="md:col-span-2 border-l-4 border-purple-500 pl-4">
              <h3 className="font-semibold text-gray-800 mb-3">🔧 Equipment & Tools</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'sprayers', label: 'Sprayers' },
                  { name: 'waterPumps', label: 'Water Pumps' },
                  { name: 'protectiveGear', label: 'Protective Gear' },
                  { name: 'farmTools', label: 'Farm Tools' }
                ].map(service => (
                  <label key={service.name} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      name={service.name}
                      checked={formData[service.name as keyof AgrovetFormData] as boolean}
                      onChange={handleChange}
                      className="mr-2"
                    />
                    {service.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Contact Phone *</label>
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
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Opening Hours</label>
            <input
              type="text"
              name="openingHours"
              value={formData.openingHours}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Mon-Sat: 8AM-6PM"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="deliveryAvailable"
              checked={formData.deliveryAvailable}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-gray-700">Delivery Available</label>
          </div>

        </div>

        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h3 className="font-semibold text-gray-800 mb-2">
            Identity & Business Verification (Required)
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload clear photos of your ID front and back, plus a selfie holding your ID. A business permit is optional but recommended.
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
              <label className="block text-gray-700 mb-2">Business Permit (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBusinessPermitFile(e.target.files?.[0] || null)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-sm">
            💡 <strong>Note:</strong> Your agrovet will be verified before appearing in search results. 
            {formData.photos.length > 0 && ' Photos help farmers trust your business.'}
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3 rounded-lg font-semibold text-lg transition duration-300 mt-6 ${
            submitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {submitting ? 'Listing Agrovet...' : 'List Agrovet'}
        </button>
      </form>
    </div>
  );
};

export default ListAgrovet;
