import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProperties } from '../contexts/PropertyContext';
import { useAuth } from '../contexts/AuthContext';
import { PropertyFormData } from '../types/property';
import { kenyaCounties, getConstituenciesByCounty, getWardsByConstituency } from '../data/kenyaCounties';
import { initiatePaymentFlow } from '../utils/paymentHelpers';
import { API_BASE_URL } from '../config/api';
import { PAYMENTS_ENABLED } from '../config/featureFlags';

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
    name: 'Standard Listing',
    price: 0,
    subtitle: 'Free for your first 3 months. After 3 months, 2.5% commission (minimum KSh 49).',
    note: 'Free → 2.5% after 90 days',
    duration: 'Active until sold/rented',
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
    name: 'Standard Placement',
    price: 0,
    subtitle: 'Your listing appears in the regular feed.',
  },
  /* Future boost options - commented out during free launch phase
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
  */
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
    name: 'Standard Verification',
    price: 0,
    subtitle: 'All listings include manual verification by our team.',
  },
  /* Future verification tiers - commented out during free launch phase
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
  */
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
  const wizardSteps = ['Visibility', 'Property', 'Land Details', 'Pricing & Media', 'Trust & Publish'];
  const defaultPlanId: ListingPlanId = LISTING_PLAN_OPTIONS[0]?.id ?? 'free';
  const hasBasicPlan = LISTING_PLAN_OPTIONS.some((plan) => plan.id === 'basic');
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
    const saleListingsPaused = process.env.REACT_APP_SALE_LISTINGS_PAUSED === 'true';
  const [uploading, setUploading] = useState(false);
  const [constituencies, setConstituencies] = useState<{value: string; label: string}[]>([]);
  const [wards, setWards] = useState<{value: string; label: string}[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ListingPlanId>(defaultPlanId);
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
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardError, setWizardError] = useState('');
  const [wizardInfo, setWizardInfo] = useState('');
  const [hasDraft, setHasDraft] = useState(false);

  const clampStep = (value?: number) => {
    const parsed = Number(value) || 1;
    return Math.min(Math.max(parsed, 1), wizardSteps.length);
  };

  const saveDraft = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          formData,
          selectedPlan,
          selectedBoost,
          selectedVerification,
          currentStep,
          updatedAt: new Date().toISOString(),
        })
      );
      setHasDraft(true);
    } catch (err) {
      console.error('Failed to save draft listing', err);
    }
  };

  const clearDraft = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
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
        if (parsed?.formData) {
          setFormData((prev) => ({ ...prev, ...parsed.formData }));
          if (parsed.selectedPlan) setSelectedPlan(parsed.selectedPlan as ListingPlanId);
          if (parsed.selectedBoost) setSelectedBoost(parsed.selectedBoost as BoostOptionId);
          if (parsed.selectedVerification) {
            setSelectedVerification(parsed.selectedVerification as VerificationTierId);
          }
          setCurrentStep(clampStep(parsed.currentStep));
          setWizardInfo('Draft restored from your last session.');
        } else {
          // Backward compatibility with older draft shape.
          setFormData((prev) => ({ ...prev, ...parsed }));
        }
        setHasDraft(true);
      }
    } catch (err) {
      console.error('Failed to restore draft listing', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Force rental-only listings (disable sale for now)
  useEffect(() => {
    if (formData.type !== 'rental') {
      setFormData((prev) => ({ ...prev, type: 'rental' }));
    }
  }, [formData.type]);

  useEffect(() => {
    saveDraft();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, selectedPlan, selectedBoost, selectedVerification, currentStep]);

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
    if (firstListingFreeUsed && selectedPlan === 'free' && hasBasicPlan) {
      setSelectedPlan('basic');
    }
  }, [firstListingFreeUsed, hasBasicPlan, selectedPlan]);

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
  const idVerified =
    user?.verification?.status === "approved" || !!user?.verification?.idVerified;
  const selfieVerified = idVerified;
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

    // Optional ownership docs improve trust score when provided.
    if (titleDeedFile) uploads.push({ type: 'title-deed', file: titleDeedFile });
    if (landSearchFile) uploads.push({ type: 'land-search', file: landSearchFile });
    if (chiefLetterFile) uploads.push({ type: 'chief-letter', file: chiefLetterFile });

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

  const getStepError = (step: number): string => {
    if (step === 1) return '';

    if (step === 2) {
      if (!formData.title.trim()) return 'Enter a clear farmland title before continuing.';
      if (!formData.description.trim()) return 'Add a short description before continuing.';
      if (!formData.county) return 'Select a county before continuing.';
      if (!formData.constituency) return 'Select a constituency before continuing.';
      if (!formData.ward) return 'Select a ward before continuing.';
      if (!formData.approximateLocation.trim()) return 'Add an approximate location before continuing.';
      return '';
    }

    if (step === 3) {
      if (!formData.soilType) return 'Select a soil type before continuing.';
      if (!formData.waterAvailability) return 'Select water availability before continuing.';
      if (!formData.availableFrom) return 'Add an available from date before continuing.';
      if (!formData.availableTo) return 'Add an available to date before continuing.';
      if (new Date(formData.availableFrom) > new Date(formData.availableTo)) {
        return 'Available to date must be after available from date.';
      }
      if (!formData.minLeasePeriod) return 'Add minimum lease period before continuing.';
      if (!formData.maxLeasePeriod) return 'Add maximum lease period before continuing.';
      if (Number(formData.minLeasePeriod) > Number(formData.maxLeasePeriod)) {
        return 'Maximum lease period must be greater than or equal to minimum lease period.';
      }
      return '';
    }

    if (step === 4) {
      if (!formData.price) return 'Enter the rental price before continuing.';
      if (!formData.size) return 'Enter land size before continuing.';
      if (!formData.contact.trim()) return 'Enter a contact phone before continuing.';
      const normalizedContact = formData.contact.replace(/\D/g, '');
      if (normalizedContact.length < 10) return 'Enter a valid 10-digit phone number.';
      if (selectedImages.length === 0) return 'Upload at least one farmland image before continuing.';
      return '';
    }

    return '';
  };

  const validateStep = (step = currentStep) => {
    const error = getStepError(step);
    setWizardError(error);
    return !error;
  };

  const validateAllSteps = () => {
    for (let step = 1; step <= 4; step += 1) {
      const error = getStepError(step);
      if (error) {
        setCurrentStep(step);
        setWizardError(error);
        return false;
      }
    }
    setWizardError('');
    return true;
  };

  const handleNextStep = () => {
    if (!validateStep(currentStep)) return;
    setWizardInfo('');
    setCurrentStep((prev) => clampStep(prev + 1));
  };

  const handlePrevStep = () => {
    setWizardError('');
    setCurrentStep((prev) => clampStep(prev - 1));
  };

  const handleDiscardDraft = () => {
    clearDraft();
    setWizardInfo('Saved draft removed from this device.');
  };

  const handleSaveDraftNow = () => {
    saveDraft();
    setWizardInfo('Draft saved on this device.');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardInfo('');

    if (!user) {
      alert("You must be logged in to list your farmland.");
      return;
    }

    if (!validateAllSteps()) {
      return;
    }

    let verificationUploadWarning = '';
    try {
      await ensureDocsUploaded();
    } catch (err: any) {
      verificationUploadWarning =
        err?.message || 'Verification documents were not uploaded. You can retry from your profile.';
      console.error('Verification upload warning:', err);
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
      if (PAYMENTS_ENABLED && totalMonetizationFee > 0 && listingId) {
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

      const feeNote = !PAYMENTS_ENABLED
        ? 'Launch period: listing is free. No payment required.'
        : totalMonetizationFee > 0
          ? `${monetizationSummaryLabel} for a total of ${formatKenyanPrice(totalMonetizationFee)}.${paymentNote}`
          : 'You used your free listing credit.';
      const trustStatus = idVerified
        ? 'Verified profile'
        : identityDocsSatisfied
          ? 'Verification documents submitted'
          : 'Unverified profile (listing remains visible with a pending trust badge)';
      alert(
        `Property submitted! An admin will review it shortly. Trust status: ${trustStatus}. ${feeNote}${
          verificationUploadWarning ? ` ${verificationUploadWarning}` : ''
        }`
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
      setSelectedPlan(defaultPlanId);
      setSelectedBoost('none');
      setSelectedVerification('none');
      setCurrentStep(1);
      setWizardError('');
      setWizardInfo('');
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

  const progressPercent = (currentStep / wizardSteps.length) * 100;

  const handleStepChipClick = (nextStep: number) => {
    const target = clampStep(nextStep);
    if (target === currentStep) return;
    if (target < currentStep) {
      setWizardError('');
      setCurrentStep(target);
      return;
    }

    for (let step = currentStep; step < target; step += 1) {
      const error = getStepError(step);
      if (error) {
        setWizardError(error);
        setCurrentStep(step);
        return;
      }
    }

    setWizardError('');
    setCurrentStep(target);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">List Your Farmland</h1>
      <p className="text-gray-600 mb-5">
        Connect with farmers across Kenya - list land for rent/lease with clear pricing and trust signals.
      </p>

      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-900">Step {currentStep} of {wizardSteps.length}</p>
          <p className="text-sm text-gray-600">{wizardSteps[currentStep - 1]}</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-green-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {wizardSteps.map((label, index) => {
            const step = index + 1;
            const isActive = currentStep === step;
            const isDone = currentStep > step;
            return (
              <button
                key={label}
                type="button"
                onClick={() => handleStepChipClick(step)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isActive
                    ? 'bg-green-600 text-white'
                    : isDone
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {step}. {label}
              </button>
            );
          })}
        </div>
      </div>

      {hasDraft && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm">
          <span className="text-blue-800">Draft is saved on this device.</span>
          <button
            type="button"
            onClick={handleSaveDraftNow}
            className="rounded-md border border-blue-200 bg-white px-2 py-1 text-blue-700 hover:bg-blue-100"
          >
            Save now
          </button>
          <button
            type="button"
            onClick={handleDiscardDraft}
            className="rounded-md border border-blue-200 bg-white px-2 py-1 text-blue-700 hover:bg-blue-100"
          >
            Discard draft
          </button>
        </div>
      )}

      {wizardError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {wizardError}
        </div>
      )}

      {wizardInfo && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {wizardInfo}
        </div>
      )}

      {saleListingsPaused && (
        <div className="mb-6 rounded-lg border-l-4 border-yellow-400 bg-yellow-50 text-yellow-800 px-4 py-3">
          Note: Listing land for sale is temporarily paused. You can still create rental/lease listings. Contact <a className="font-semibold underline" href="mailto:kodisha.254.ke@gmail.com">kodisha.254.ke@gmail.com</a> to be notified when sales reopen.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="bg-white rounded-lg shadow-md p-4 pb-24 md:p-6 md:pb-28">
        {currentStep === 1 && (
        <div className="mb-6 space-y-4 rounded-2xl border border-green-200 bg-green-50/40 p-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Listing Visibility Options</h2>
            {PAYMENTS_ENABLED ? (
              <p className="text-sm text-gray-600">First listing is free. Paid plans, boosts, and verification tiers add visibility and trust. The total payable after approval is shown below.</p>
            ) : (
              <p className="text-sm text-green-700 font-semibold">Launch Offer: All listing plans, boosts, and verification actions are currently free.</p>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {LISTING_PLAN_OPTIONS.map((plan) => {
              const disabled = plan.id === 'free' && firstListingFreeUsed && hasBasicPlan;
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
            {PAYMENTS_ENABLED ? (
              <>
                <p className="font-semibold text-gray-900">Total payable after approval: {formatKenyanPrice(totalMonetizationFee)}</p>
                <p>{firstListingFreeAvailable ? 'Your first listing credit is still active; you only pay once you opt into a paid plan or boost.' : 'First listing credit used - this listing is covered by paid plans, boosts, and verification fees.'}</p>
                <p className="text-xs text-gray-500">Payment triggers only after an admin approves the listing.</p>
              </>
            ) : (
              <p className="font-semibold text-green-700">Launch Period: No fees, no payment step. Focus on high-quality, accurate listings.</p>
            )}
          </div>
        </div>
        )}

        {currentStep === 5 && (
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

          {user?.verification?.idVerified && user?.verification?.selfieVerified ? (
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-green-800 font-semibold">✓ ID Already Verified</p>
                <p className="text-sm text-green-700">Your identity documents have been verified by our team.</p>
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
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Recommended for stronger trust badges and faster approval.
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
                />
                <p className="mt-1 text-xs text-gray-500">
                  Recommended for stronger trust badges and faster approval.
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
                />
                <p className="mt-1 text-xs text-gray-500">
                  Optional for publish; helps trust and fraud checks.
                </p>
              </label>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Optional Ownership Documents (Boosts Trust Score +20%)
            </h3>
            <p className="text-sm text-blue-800 mb-4">
              Upload any of these documents to significantly increase your listing's trust score and attract more serious buyers. These are optional even for verified users!
            </p>

            <div className="grid gap-4 md:grid-cols-3">
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
                <p className="mt-1 text-xs text-green-600 font-medium">
                  +20 trust points
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
                <p className="mt-1 text-xs text-green-600 font-medium">
                  +20 trust points
                </p>
              </label>

              <label className="block text-sm text-gray-700">
                <span className="font-semibold text-gray-900">
                  Chief&apos;s Letter (optional)
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setChiefLetterFile(e.target.files?.[0] || null)}
                  className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  disabled={false}
                />
                <p className="mt-1 text-xs text-green-600 font-medium">
                  +20 trust points
                </p>
              </label>
            </div>
          </div>

          <p className="text-xs text-gray-600">
            We store these securely and auto-verify your profile so the listing can be approved without sending you away from this page.
          </p>
        </div>
        )}

        {currentStep >= 2 && currentStep <= 4 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentStep === 2 && (
          <>
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
          </>
          )}

          {currentStep === 3 && (
          <>
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
          </>
          )}

          {currentStep === 4 && (
          <>
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
          </>
          )}

        </div>
        )}

        <div className="sticky bottom-0 z-10 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-semibold ${
                  currentStep === 1
                    ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                    : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSaveDraftNow}
                className="min-h-[44px] rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Save draft
              </button>
            </div>

            {currentStep < wizardSteps.length ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="min-h-[44px] rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Next step
              </button>
            ) : (
              <button
                type="submit"
                disabled={uploading || docUploading}
                className={`min-h-[44px] rounded-lg px-5 py-2 text-sm font-semibold ${
                  uploading || docUploading
                    ? 'cursor-not-allowed bg-gray-300 text-gray-600'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {uploading || docUploading ? 'Publishing...' : 'Publish listing'}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default ListProperty;








