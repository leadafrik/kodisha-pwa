import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import { PropertyFormData } from '../types/property';
import { kenyaCounties, getConstituenciesByCounty, getWardsByConstituency } from '../data/kenyaCounties';
import GoogleMapsLoader from '../components/GoogleMapsLoader';
import MapPicker from '../components/MapPicker';
import { initiatePaymentFlow } from '../utils/paymentHelpers';
import { API_BASE_URL } from '../config/api';

const DRAFT_STORAGE_KEY = 'listPropertyDraft';
const FIRST_LISTING_FREE_KEY = 'kodisha_first_listing_free_used';

type ListPropertyProps = {
  initialType?: 'rental';
};

type ListingPlanOption = {
  id: 'free' | 'basic' | 'verified' | 'premium';
  name: string;
  price: number;
  subtitle: string;
  note?: string;
  duration?: string;
};

const LISTING_PLAN_OPTIONS: ListingPlanOption[] = [
  {
    id: 'free',
    name: 'First Listing Free',
    price: 0,
    subtitle: 'One trial listing at no charge; verification still required.',
    note: 'First listing only',
    duration: '1 month',
  },
  {
    id: 'basic',
    name: 'Basic Listing',
    price: 49,
    subtitle: 'KSh 49 - One-week listing with verified badge.',
    duration: '1 week',
  },
  {
    id: 'verified',
    name: 'Verified Listing',
    price: 99,
    subtitle: 'KSh 99 - Three-week priority placement.',
    duration: '3 weeks',
  },
  {
    id: 'premium',
    name: 'Premium Boosted Listing',
    price: 199,
    subtitle: 'KSh 199 - Two-month featured exposure.',
    duration: '2 months',
  },
];

type BoostOption = {
  id: 'none' | 'daily' | 'weekly' | 'monthly';
  name: string;
  price: number;
  subtitle: string;
};

const BOOST_OPTIONS: BoostOption[] = [
  {
    id: 'none',
    name: 'Standard placement',
    price: 0,
    subtitle: 'Appears in the regular feed.',
  },
  {
    id: 'daily',
    name: 'KSh 50 / Day Boost',
    price: 50,
    subtitle: 'Top of feed for 24 hours.',
  },
  {
    id: 'weekly',
    name: 'KSh 150 / Week Boost',
    price: 150,
    subtitle: 'Featured land section for seven days.',
  },
  {
    id: 'monthly',
    name: 'KSh 499 / Month Boost',
    price: 499,
    subtitle: 'Premium banner and featured carousel for one month.',
  },
];

type VerificationTierOption = {
  id: 'none' | 'basic' | 'advanced' | 'business';
  name: string;
  price: number;
  subtitle: string;
};

const VERIFICATION_TIERS: VerificationTierOption[] = [
  {
    id: 'none',
    name: 'Standard verification',
    price: 0,
    subtitle: 'Manual checks by Kodisha; trust builds slowly.',
  },
  {
    id: 'basic',
    name: 'KSh 99 Basic Verification',
    price: 99,
    subtitle: 'ID + selfie verification to unlock trust badges.',
  },
  {
    id: 'advanced',
    name: 'KSh 199 Advanced Verification',
    price: 199,
    subtitle: 'Adds ownership proof so buyers trust faster.',
  },
  {
    id: 'business',
    name: 'KSh 399 Business Verification',
    price: 399,
    subtitle: 'Full business profile verification for premium trust.',
  },
];

type ListingPlanId = ListingPlanOption['id'];
type BoostOptionId = BoostOption['id'];
type VerificationTierId = VerificationTierOption['id'];

const formatKenyanPrice = (value: number) =>
  value === 0 ? 'Free' : `KSh ${value.toLocaleString()}`;

const ListProperty: React.FC<ListPropertyProps> = ({ initialType }) => {
  const { addProperty } = useProperties();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    price: '',
    size: '',
    sizeUnit: 'acres',
    county: '',
    constituency: '',
    ward: '',
    approximateLocation: '',
    soilType: 'loam',
    waterAvailability: 'rain-fed',
    previousCrops: '',
    organicCertified: false,
    availableFrom: '',
    availableTo: '',
    minLeasePeriod: '1',
    maxLeasePeriod: '12',
    preferredCrops: '',
    contact: '',
    type: initialType || 'rental'
  });
  
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [constituencies, setConstituencies] = useState<{value: string; label: string}[]>([]);
  const [wards, setWards] = useState<{value: string; label: string}[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ListingPlanId>('free');
  const [selectedBoost, setSelectedBoost] = useState<BoostOptionId>('none');
  const [selectedVerification, setSelectedVerification] = useState<VerificationTierId>('none');
  const [firstListingFreeUsed, setFirstListingFreeUsed] = useState(false);
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [titleDeedFile, setTitleDeedFile] = useState<File | null>(null);
  const [landSearchFile, setLandSearchFile] = useState<File | null>(null);
  const [chiefLetterFile, setChiefLetterFile] = useState<File | null>(null);
  const [docUploading, setDocUploading] = useState(false);

  const saveDraft = (data: PropertyFormData) => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save draft listing', err);
    }
  };

  const clearDraft = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (err) {
      console.error('Failed to clear draft listing', err);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error('Failed to restore draft listing', err);
    }
  }, []);

  // Force rental-only listings (disable sale for now)
  useEffect(() => {
    if (formData.type !== 'rental') {
      setFormData((prev) => ({ ...prev, type: 'rental' }));
    }
  }, [formData.type]);

  useEffect(() => {
    saveDraft(formData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  useEffect(() => {
    if (initialType && initialType !== formData.type) {
      setFormData((prev) => ({ ...prev, type: initialType }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialType]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(FIRST_LISTING_FREE_KEY);
    setFirstListingFreeUsed(stored === 'true');
  }, []);

  useEffect(() => {
    if (firstListingFreeUsed && selectedPlan === 'free') {
      setSelectedPlan('basic');
    }
  }, [firstListingFreeUsed, selectedPlan]);

  useEffect(() => {
    if (formData.county) {
      const countyConstituencies = getConstituenciesByCounty(formData.county);
      setConstituencies(countyConstituencies);
      setFormData((prev) => {
        const constituencyValid = countyConstituencies.some(
          (item) => item.value === prev.constituency
        );
        const nextConstituency = constituencyValid ? prev.constituency : '';
        const nextWard = constituencyValid ? prev.ward : '';
        if (nextConstituency === prev.constituency && nextWard === prev.ward) {
          return prev;
        }
        return { ...prev, constituency: nextConstituency, ward: nextWard };
      });
      if (!formData.constituency) {
        setWards([]);
      }
    } else {
      setConstituencies([]);
      setWards([]);
      setFormData((prev) => {
        if (prev.constituency === '' && prev.ward === '') return prev;
        return { ...prev, constituency: '', ward: '' };
      });
    }
  }, [formData.county, formData.constituency]);

  useEffect(() => {
    if (formData.county && formData.constituency) {
      const constituencyWards = getWardsByConstituency(formData.county, formData.constituency);
      setWards(constituencyWards);
      setFormData((prev) => {
        const wardValid = constituencyWards.some((item) => item.value === prev.ward);
        const nextWard = wardValid ? prev.ward : '';
        if (nextWard === prev.ward) {
          return prev;
        }
        return { ...prev, ward: nextWard };
      });
    } else {
      setWards([]);
      setFormData((prev) => {
        if (prev.ward === '') return prev;
        return { ...prev, ward: '' };
      });
    }
  }, [formData.county, formData.constituency]);

  const selectedPlanDetails =
    LISTING_PLAN_OPTIONS.find((plan) => plan.id === selectedPlan) || LISTING_PLAN_OPTIONS[0];
  const selectedBoostDetails =
    BOOST_OPTIONS.find((option) => option.id === selectedBoost) || BOOST_OPTIONS[0];
  const selectedVerificationDetails =
    VERIFICATION_TIERS.find((tier) => tier.id === selectedVerification) || VERIFICATION_TIERS[0];

  const firstListingFreeAvailable = !firstListingFreeUsed;
  const effectivePlanPrice =
    firstListingFreeAvailable && selectedPlan === 'free'
      ? 0
      : selectedPlanDetails.price;
  const boostPrice = selectedBoostDetails.price;
  const verificationPrice = selectedVerificationDetails.price;
  const totalMonetizationFee = effectivePlanPrice + boostPrice + verificationPrice;
  const boostLabel =
    selectedBoost !== 'none' ? ` with ${selectedBoostDetails.name}` : '';
  const verificationLabel =
    selectedVerification !== 'none'
      ? ` and ${selectedVerificationDetails.name}`
      : '';
  const monetizationSummaryLabel = `${selectedPlanDetails.name}${boostLabel}${verificationLabel}`;
  const idVerified = !!user?.verification?.idVerified;
  const selfieVerified = !!user?.verification?.selfieVerified;
  const hasIdDocs = idVerified || (idFrontFile !== null && idBackFile !== null);
  const hasSelfieDoc = selfieVerified || selfieFile !== null;
  const identityDocsSatisfied = hasIdDocs && hasSelfieDoc;

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

    // Rental-only: ownership docs optional, not enforced

    if (uploads.length === 0) return;

    setDocUploading(true);
    try {
      for (const item of uploads) {
        await uploadVerificationDoc(item.type, item.file);
      }
    } finally {
      setDocUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      alert("You must be logged in to list your farmland.");
      return;
    }

    if (!identityDocsSatisfied) {
      alert(
        "Please upload your ID front, ID back, and a selfie with your ID (or ensure your identity is already verified)."
      );
      return;
    }

    try {
      await ensureDocsUploaded();
    } catch (err: any) {
      alert(err.message || "Failed to upload verification documents.");
      return;
    }

    if (totalMonetizationFee > 0 && typeof window !== "undefined") {
      const confirmMessage = `${monetizationSummaryLabel}. You will be billed ${formatKenyanPrice(
        totalMonetizationFee
      )} once an admin approves your listing. Continue?`;
      if (!window.confirm(confirmMessage)) {
        return;
      }
    }

    setUploading(true);
    
    try {
      const submitData = new FormData();
      
      // Basic Information
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('price', formData.price);
      submitData.append('size', formData.size);
      submitData.append('sizeUnit', formData.sizeUnit || 'acres');
      
      // Location Information
      submitData.append('county', formData.county);
      submitData.append('constituency', formData.constituency);
      submitData.append('ward', formData.ward);
      submitData.append('approximateLocation', formData.approximateLocation.trim());
      
      // Agricultural Details
      submitData.append('soilType', formData.soilType);
      submitData.append('waterAvailability', formData.waterAvailability);
      submitData.append('previousCrops', formData.previousCrops);
      submitData.append('organicCertified', formData.organicCertified.toString());
      
      // Lease Details
      submitData.append('availableFrom', formData.availableFrom);
      submitData.append('availableTo', formData.availableTo);
      submitData.append('minLeasePeriod', formData.minLeasePeriod);
      submitData.append('maxLeasePeriod', formData.maxLeasePeriod);
      submitData.append('preferredCrops', formData.preferredCrops);
      
      // Contact & Type
      submitData.append('contact', formData.contact.trim());
      submitData.append('type', 'rental');
      submitData.append('listingPlan', selectedPlan);
      submitData.append('planDuration', selectedPlanDetails.duration || '');
      submitData.append('listingPlanPrice', String(effectivePlanPrice));
      submitData.append('boostOption', selectedBoost);
      submitData.append('boostPrice', String(boostPrice));
      submitData.append('verificationTier', selectedVerification);
      submitData.append('verificationPrice', String(verificationPrice));
      submitData.append('totalMonetizationFee', String(totalMonetizationFee));

      // Coordinates (if selected)
      if (formData.latitude) submitData.append("latitude", String(formData.latitude));
      if (formData.longitude) submitData.append("longitude", String(formData.longitude));

      
      // Images
      selectedImages.forEach((image) => {
        submitData.append('images', image);
      });

      const result = await addProperty(submitData);
      const listingId =
        result?.data?._id || result?.data?.id || result?.listing?._id || result?.listing?.id;

      if (!firstListingFreeUsed) {
        if (typeof window !== "undefined") {
          localStorage.setItem(FIRST_LISTING_FREE_KEY, "true");
        }
        setFirstListingFreeUsed(true);
      }

      let paymentNote = "";
      if (totalMonetizationFee > 0 && listingId) {
        try {
          await initiatePaymentFlow({
            targetType: "land",
            targetId: listingId,
            amount: totalMonetizationFee,
            summaryLabel: monetizationSummaryLabel,
          });
          paymentNote = " Tab to your phone to complete the STK push.";
        } catch (error: any) {
          console.error("Payment initiation failed", error);
          paymentNote =
            " We could not trigger the MPesa STK push; please try again from the Payments screen.";
        }
      }

      const feeNote =
        totalMonetizationFee > 0
          ? `${monetizationSummaryLabel} for a total of ${formatKenyanPrice(
              totalMonetizationFee
            )}.${paymentNote}`
          : "You used your free listing credit.";
      alert(
        `Property submitted! An admin will review and verify it shortly. ${feeNote}`
      );
      clearDraft();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        price: '',
        size: '',
        sizeUnit: 'acres',
        county: '',
        constituency: '',
        ward: '',
        approximateLocation: '',
        soilType: 'loam',
        waterAvailability: 'rain-fed',
        previousCrops: '',
        organicCertified: false,
        availableFrom: '',
        availableTo: '',
        minLeasePeriod: '1',
        maxLeasePeriod: '12',
        preferredCrops: '',
        contact: '',
        type: 'rental'
      });
      setSelectedImages([]);
      setConstituencies([]);
      setWards([]);
      setSelectedPlan('basic');
      setSelectedBoost('none');
      setSelectedVerification('none');
      setIdFrontFile(null);
      setIdBackFile(null);
      setSelfieFile(null);
      setTitleDeedFile(null);
      setLandSearchFile(null);
      setChiefLetterFile(null);
      navigate('/');
    } catch (error) {
      alert('Error listing property. Please try again.');
      console.error('Submission error:', error);
    } finally {
      setUploading(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - selectedImages.length);
      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const countiesForDropdown = kenyaCounties.map(county => ({
    value: county.name.toLowerCase(),
    label: county.name
  }));

  const soilTypes = [
    { value: 'clay', label: 'Clay' },
    { value: 'sandy', label: 'Sandy' },
    { value: 'loam', label: 'Loam' },
    { value: 'clay-loam', label: 'Clay Loam' },
    { value: 'sandy-loam', label: 'Sandy Loam' }
  ];

  const waterSources = [
    { value: 'river', label: 'River' },
    { value: 'well', label: 'Well' },
    { value: 'tap', label: 'Tap Water' },
    { value: 'rain-fed', label: 'Rain-fed' },
    { value: 'irrigation', label: 'Irrigation' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">List Your Farmland</h1>
      <p className="text-gray-600 mb-8">Connect with farmers across Kenya â€” list your land for rent/lease with clear pricing and trust signals.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6 space-y-4 rounded-2xl border border-green-200 bg-green-50/40 p-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Monetized Listing Options</h2>
            <p className="text-sm text-gray-600">
              First listing is free. Paid plans, boosts, and verification tiers add visibility and trust. The total payable after approval is shown below.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {LISTING_PLAN_OPTIONS.map((plan) => {
              const disabled = plan.id === 'free' && firstListingFreeUsed;
              const selected = selectedPlan === plan.id;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  disabled={disabled}
                  aria-pressed={selected}
                  className={`rounded-2xl border p-4 text-left transition ${
                    selected
                      ? 'border-green-600 bg-white shadow-sm'
                      : 'border-gray-200 bg-white hover:border-green-500'
                  } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold uppercase tracking-wide text-green-600">
                      {plan.price === 0 ? 'Free' : formatKenyanPrice(plan.price)}
                    </span>
                    {plan.note && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                        {plan.note}
                      </span>
                    )}
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
            <p className="font-semibold text-gray-900">
              Total payable after approval: {formatKenyanPrice(totalMonetizationFee)}
            </p>
            <p>
              {firstListingFreeAvailable
                ? 'Your first listing credit is still active; you only pay once you opt into a paid plan or boost.'
                : 'First listing credit used - this listing is covered by paid plans, boosts, and verification fees.'}
            </p>
            <p className="text-xs text-gray-500">
              Payment (M-Pesa STK push) triggers only after an admin approves the listing.
            </p>
          </div>
        </div>

        <div className="mb-6 space-y-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Verification Documents</h2>
              <p className="text-sm text-gray-600">
                Upload the documents needed for rent/lease. Ownership proofs are optional but improve trust and speed approvals.
              </p>
            </div>
            {docUploading && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                Uploading docs…
              </span>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm text-gray-700">
              <span className="font-semibold text-gray-900">
                National ID (Front) {idDocsNeeded ? '*' : ''}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setIdFrontFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required={!idVerified}
              />
              <p className="mt-1 text-xs text-gray-500">
                Required for rent/lease unless already verified.
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
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required={!idVerified}
              />
              <p className="mt-1 text-xs text-gray-500">
                Required for rent/lease unless already verified.
              </p>
            </label>

            <label className="block text-sm text-gray-700">
              <span className="font-semibold text-gray-900">
                Selfie holding ID {selfieNeeded ? '*' : ''}
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setSelfieFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required={!selfieVerified}
              />
              <p className="mt-1 text-xs text-gray-500">
                Needed for trust & fraud checks; already verified users can skip.
              </p>
            </label>

            <label className="block text-sm text-gray-700">
              <span className="font-semibold text-gray-900">
                Title Deed (optional)
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setTitleDeedFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required={false}
                disabled={false}
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional but increases trust for your lease listing.
              </p>
            </label>

            <label className="block text-sm text-gray-700">
              <span className="font-semibold text-gray-900">
                Land Search Report (optional)
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setLandSearchFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={false}
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional supporting document to further boost trust.
              </p>
            </label>

            <label className="block text-sm text-gray-700">
              <span className="font-semibold text-gray-900">
                Chief&apos;s Letter (optional alternative)
              </span>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setChiefLetterFile(e.target.files?.[0] || null)}
                className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={false}
              />
              <p className="mt-1 text-xs text-gray-500">
                Optional fallback if you don&apos;t have a land search document.
              </p>
            </label>
          </div>
          <p className="text-xs text-gray-600">
            We store these securely and auto-verify your profile so the listing can be approved without sending you away from this page.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Lease Type</label>
            <p className="text-sm text-gray-600">We currently accept Rent/Lease listings only.</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Farmland Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 5 Acre Farmland in Kiambu - Ready for Maize Season"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Describe the land, soil quality, accessibility, water sources, nearby markets, and any improvements..."
              required
            />
          </div>

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
            <label className="block text-gray-700 mb-2">Approximate Location *</label>
            <input
              type="text"
              name="approximateLocation"
              value={formData.approximateLocation}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Near Kikuyu Market, 2km from main road"
              required
            />
          </div>
          
          <GoogleMapsLoader>
            <div className="mb-4">
             <label className="block font-semibold mb-1 text-gray-800">
               Select Land Location on Map
             </label>

            <MapPicker
              onChange={(coords) => {
                setFormData((prev) => ({
                  ...prev,
                  latitude: coords.lat,
                  longitude: coords.lng,
                }));
             }}
           />

           <p className="text-xs text-gray-500 mt-1">
            Tap anywhere on the map to drop a pin.
           </p>
        </div>
      </GoogleMapsLoader>

          <div>
            <label className="block text-gray-700 mb-2">Soil Type *</label>
            <select
              name="soilType"
              value={formData.soilType}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              {soilTypes.map(soil => (
                <option key={soil.value} value={soil.value}>{soil.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Water Availability *</label>
            <select
              name="waterAvailability"
              value={formData.waterAvailability}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              {waterSources.map(water => (
                <option key={water.value} value={water.value}>{water.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Previous Crops (Optional)</label>
            <input
              type="text"
              name="previousCrops"
              value={formData.previousCrops}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Maize, Beans, Vegetables (comma separated)"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Preferred Crops (Optional)</label>
            <input
              type="text"
              name="preferredCrops"
              value={formData.preferredCrops}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Maize, Potatoes, Vegetables (comma separated)"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Available From *</label>
            <input
              type="date"
              name="availableFrom"
              value={formData.availableFrom}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Available To *</label>
            <input
              type="date"
              name="availableTo"
              value={formData.availableTo}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Min Lease Period (Months) *</label>
            <input
              type="number"
              name="minLeasePeriod"
              value={formData.minLeasePeriod}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              min="1"
              max="24"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Max Lease Period (Months) *</label>
            <input
              type="number"
              name="maxLeasePeriod"
              value={formData.maxLeasePeriod}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              min="1"
              max="24"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Price (KSh) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 15000"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Price per season</p>
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-gray-700 mb-2">Land Size *</label>
              <input
                type="number"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 5"
                step="0.1"
                min="0.1"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 mb-2">Unit</label>
              <select
                name="sizeUnit"
                value={formData.sizeUnit}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="acres">Acres</option>
                <option value="hectares">Hectares</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="organicCertified"
                checked={formData.organicCertified}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-gray-700">Organically Certified Farmland</span>
            </label>
          </div>

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
            <p className="text-sm text-gray-500 mt-1">Enter your 10-digit Kenyan phone number</p>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Farmland Images</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="text-3xl mb-2 font-bold text-green-500" aria-hidden="true">+</div>
                <p className="font-semibold text-gray-700">Upload Farmland Images</p>
                <p className="text-sm text-gray-500 mt-1">
                  Click to select images or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Up to 5 images - JPG, PNG, GIF - Max 5MB each
                </p>
              </label>
            </div>
            
            {selectedImages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Selected images ({selectedImages.length}/5):
                </p>
                <div className="flex gap-2 flex-wrap">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative bg-gray-100 rounded-lg p-2">
                      <div className="text-xs text-gray-700 max-w-24 truncate">
                        Image: {file.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        <button
          type="submit"
          disabled={uploading}
          className={`w-full py-3 rounded-lg font-semibold text-lg transition duration-300 mt-6 ${
            uploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {uploading ? 'Uploading...' : 'List Farmland'}
        </button>
      </form>
    </div>
  );
};

export default ListProperty;








