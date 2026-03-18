import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useAdaptiveLayout } from "../hooks/useAdaptiveLayout";
import { kenyaCounties, getConstituenciesByCounty, getWardsByConstituency } from "../data/kenyaCounties";
import { API_BASE_URL, ensureValidAccessToken } from "../config/api";
import { PAYMENTS_ENABLED } from "../config/featureFlags";
import { CheckCircle2, MapPin, Tag, Calendar, Camera } from "lucide-react";
import { ErrorAlert } from "../components/ui";
import { trackTrafficClick } from "../utils/trafficAnalytics";
import GooglePlacesInput from "../components/GooglePlacesInput";
import {
  matchLocationCandidate,
  type GooglePlaceSelection,
} from "../utils/googleMaps";

type ListingCategory = "produce" | "livestock" | "inputs" | "service";
type ListingType = "sell" | "buy";
type ProduceSubcategory = "crops" | "fruits" | "vegetables" | "grains" | "other";
type LivestockSubcategory = "cattle" | "poultry" | "goats" | "pigs" | "sheep" | "other";
type InputsSubcategory = "fertilizer" | "pesticides" | "seeds" | "tools" | "equipment" | "feeds" | "other";
type ServiceSubcategory = "equipment_rental" | "consulting" | "labor" | "transportation" | "processing" | "other";
type DeliveryScope = "countrywide" | "within_county" | "negotiable";
type ListingEntryMode = "single" | "batch";

interface ListingFormData {
  step: number;
  listingType: ListingType | null;
  category: ListingCategory | null;
  subcategory: ProduceSubcategory | LivestockSubcategory | InputsSubcategory | ServiceSubcategory | null;
  title: string;
  description: string;
  county: string;
  constituency: string;
  ward: string;
  approximateLocation: string;
  latitude?: number;
  longitude?: number;
  price: string;
  quantity: string;
  unit: string;
  availableFrom: string;
  deliveryScope: DeliveryScope;
  images: File[];
  contact: string;
  subscribed: boolean;
  premiumBadge: boolean;
}

interface BatchListingItem {
  id: string;
  title: string;
  description: string;
  price: string;
  quantity: string;
  unit: string;
  deliveryScope: DeliveryScope;
  images: File[];
}

const PRODUCE_SUBCATEGORIES: ProduceSubcategory[] = ["crops", "fruits", "vegetables", "grains", "other"];
const LIVESTOCK_SUBCATEGORIES: LivestockSubcategory[] = ["cattle", "poultry", "goats", "pigs", "sheep", "other"];
const INPUTS_SUBCATEGORIES: InputsSubcategory[] = ["fertilizer", "pesticides", "seeds", "tools", "equipment", "feeds", "other"];
const SERVICE_SUBCATEGORIES: ServiceSubcategory[] = ["equipment_rental", "consulting", "labor", "transportation", "processing", "other"];
const DELIVERY_SCOPE_OPTIONS: Array<{ value: DeliveryScope; label: string; helper: string }> = [
  { value: "countrywide", label: "Countrywide", helper: "I can deliver across Kenya." },
  { value: "within_county", label: "Within county", helper: "Delivery is available only in my county." },
  { value: "negotiable", label: "Negotiable", helper: "Delivery can be discussed with buyer." },
];

const UNIT_SUGGESTIONS_BY_CATEGORY: Record<ListingCategory, string[]> = {
  produce: ["kg", "bag", "ton", "bunch", "dozen", "crate", "box", "liter", "piece", "other"],
  livestock: ["head", "animal", "pair", "herd", "piece", "other"],
  inputs: ["bag", "kg", "ton", "liter", "gallon", "piece", "box", "crate", "other"],
  service: ["hour", "day", "session", "job", "month", "acre", "piece", "other"],
};
const ALL_UNIT_SUGGESTIONS = Array.from(
  new Set(Object.values(UNIT_SUGGESTIONS_BY_CATEGORY).flat())
);
const RECOMMENDED_UNIT_BY_CATEGORY: Record<ListingCategory, string> = {
  produce: "kg",
  livestock: "head",
  inputs: "bag",
  service: "hour",
};

const CATEGORY_DESCRIPTIONS = {
  produce: "Agricultural products like crops, fruits, and vegetables",
  livestock: "Livestock including cattle, poultry, goats, and more",
  inputs: "Agricultural inputs: fertilizers, pesticides, seeds, tools, equipment",
  service: "Agricultural services including equipment rental, consulting, and labor",
};

const CATEGORY_OPTIONS: ListingCategory[] = ["produce", "livestock", "inputs", "service"];
const LISTING_PROGRESS_LABELS = ["Basics", "Publish"] as const;
const MAX_BATCH_ITEMS = 20;
const createBatchItem = (unit = "kg", deliveryScope: DeliveryScope = "negotiable"): BatchListingItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  description: "",
  price: "",
  quantity: "",
  unit,
  deliveryScope,
  images: [],
});

const DESCRIPTION_HINTS: Record<ListingCategory, { helper: string; placeholder: string }> = {
  produce: {
    helper: "Mention quality, variety, harvest stage, packaging, or freshness so buyers know what to expect.",
    placeholder: "Describe your produce clearly - variety, quality, freshness, packaging, and any delivery details.",
  },
  livestock: {
    helper: "Mention breed, age, health, feeding, and quantity to help serious buyers decide faster.",
    placeholder: "Describe your livestock - breed, age, health status, weight, and any key selling details.",
  },
  inputs: {
    helper: "List some of your key inputs, brands, pack sizes, or supplies so farmers can quickly see what you stock.",
    placeholder: "List some of your inputs - seeds, fertilizer, chemicals, feeds, tools, brands, or pack sizes.",
  },
  service: {
    helper: "Explain the service, coverage area, turnaround time, and what a customer should expect when they contact you.",
    placeholder: "Describe the service you offer, where you operate, and what customers can expect from you.",
  },
};

const DRAFT_STORAGE_KEY = "kodisha_listing_draft_v1";
const LAST_LOCATION_KEY = "agrisoko_last_listing_location_v1";
const LISTING_STARTED_TRACK_KEY = "agrisoko_funnel_listing_started_v2";
const MIN_FLOW_STEP = 2;
const MAX_FLOW_STEP = 3;

const CreateListing: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const { isCompact } = useAdaptiveLayout();
  const [form, setForm] = useState<ListingFormData>({
    step: MIN_FLOW_STEP,
    listingType: "sell",
    category: null,
    subcategory: null,
    title: "",
    description: "",
    county: "",
    constituency: "",
    ward: "",
    approximateLocation: "",
    latitude: undefined,
    longitude: undefined,
    price: "",
    quantity: "",
    unit: "kg",
    availableFrom: "",
    deliveryScope: "negotiable",
    images: [],
    contact: user?.phone || "",
    subscribed: false,
    premiumBadge: false,
  });

  const [constituencies, setConstituencies] = useState<{ value: string; label: string }[]>([]);
  const [wards, setWards] = useState<{ value: string; label: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [entryMode, setEntryMode] = useState<ListingEntryMode>("single");
  const [batchItems, setBatchItems] = useState<BatchListingItem[]>([createBatchItem("kg")]);
  const [idVerified, setIdVerified] = useState(false);
  const [selfieVerified, setSelfieVerified] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const verificationState = (user?.verification || {}) as {
    idVerificationPending?: boolean;
    idVerificationSubmitted?: boolean;
  };
  const hasPendingIdVerification =
    !!verificationState.idVerificationPending || !!verificationState.idVerificationSubmitted;
  const isVerificationPending =
    hasPendingIdVerification && (!idVerified || !selfieVerified);
  const isUnverifiedSeller = !idVerified || !selfieVerified;
  const showVerificationNudge = isUnverifiedSeller && !isVerificationPending;
  const verifyIdPath = "/verify-id?next=%2Fcreate-listing";
  const requestedCategory = useMemo(() => {
    const categoryParam = searchParams.get("category");
    if (
      categoryParam === "produce" ||
      categoryParam === "livestock" ||
      categoryParam === "inputs" ||
      categoryParam === "service"
    ) {
      return categoryParam as ListingCategory;
    }
    return null;
  }, [searchParams]);
  const hasPresetCategory = !!requestedCategory;
  const useCompactCategoryStep = true;

  // Pre-fill contact
  useEffect(() => {
    if (user?.phone && !form.contact) {
      setForm((prev) => ({ ...prev, contact: user?.phone }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.phone]);

  useEffect(() => {
    if (user?.county && !form.county) {
      setForm((prev) => ({ ...prev, county: user.county || "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.county]);

  // Prefill location from last listing (only when no draft is active)
  useEffect(() => {
    if (hasDraft) return;
    try {
      const raw = localStorage.getItem(LAST_LOCATION_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (!saved?.county) return;
      setForm((prev) => ({
        ...prev,
        county: prev.county || saved.county || "",
        constituency: prev.constituency || saved.constituency || "",
        ward: prev.ward || saved.ward || "",
        approximateLocation: prev.approximateLocation || saved.approximateLocation || "",
      }));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasDraft]);

  useEffect(() => {
    if (user?._id) {
      refreshUser();
    }
  }, [user?._id, refreshUser]);

  useEffect(() => {
    if (!user?._id) return;
    try {
      const trackedForUserId = sessionStorage.getItem(LISTING_STARTED_TRACK_KEY);
      if (trackedForUserId === user._id) return;
      sessionStorage.setItem(LISTING_STARTED_TRACK_KEY, user._id);
    } catch {
      // No-op
    }
    trackTrafficClick({
      action: "funnel_listing_started",
      target: "/create-listing",
    });
    trackTrafficClick({
      action: "funnel_create_listing_opened",
      target: "/create-listing",
    });
  }, [user?._id]);

  useEffect(() => {
    if (!requestedCategory) return;

    setForm((prev) => {
      if (prev.category === requestedCategory) return prev;
      return {
        ...prev,
        category: requestedCategory,
        subcategory: null,
        step: Math.max(prev.step, 2),
      };
    });
  }, [requestedCategory]);

  const hasMeaningfulDraft = (raw: string | null) => {
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      const parsedBatchItems = Array.isArray(parsed?.batchItems) ? parsed.batchItems : [];
      const hasBatchContent = parsedBatchItems.some(
        (item: any) =>
          item?.title ||
          item?.description ||
          item?.price ||
          item?.quantity
      );
      return Boolean(
        parsed?.category ||
          parsed?.subcategory ||
          parsed?.title ||
          parsed?.description ||
          parsed?.price ||
          parsed?.quantity ||
          hasBatchContent
      );
    } catch {
      return false;
    }
  };

  // Check for draft on load
  useEffect(() => {
    const draft = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!hasMeaningfulDraft(draft)) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
      return;
    }
    setHasDraft(true);
  }, []);

  // Auto-save draft (excluding images)
  useEffect(() => {
    const shouldSave =
      form.category ||
      form.subcategory ||
      form.title ||
      form.description ||
      form.county ||
      form.price ||
      form.quantity ||
      form.contact ||
      batchItems.some((item) => item.title || item.description || item.price || item.quantity);
    if (!shouldSave) return;
    const draft = {
      ...form,
      images: [],
      entryMode,
      batchItems: batchItems.map((item) => ({ ...item, images: [] })),
    };
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [form, batchItems, entryMode]);

  // Update verification status
  useEffect(() => {
    if (user?.verification) {
      setIdVerified(!!user.verification.idVerified);
      setSelfieVerified(!!user.verification.selfieVerified);
    }
  }, [user]);

  useEffect(() => {
    if (idVerified && selfieVerified) {
      setError("");
    }
  }, [idVerified, selfieVerified]);

  // Update constituencies when county changes
  useEffect(() => {
    if (form.county) {
      const data = getConstituenciesByCounty(form.county);
      setConstituencies(data);
      setForm((prev) => {
        const hasMatchingConstituency = data.some(
          (item) => item.value === prev.constituency
        );
        if (hasMatchingConstituency) return prev;
        return { ...prev, constituency: "", ward: "" };
      });
      if (!data.some((item) => item.value === form.constituency)) {
        setWards([]);
      }
    } else {
      setConstituencies([]);
      setWards([]);
    }
  }, [form.county, form.constituency]);

  // Update wards when constituency changes
  useEffect(() => {
    if (form.county && form.constituency) {
      const data = getWardsByConstituency(form.county, form.constituency);
      setWards(data);
      setForm((prev) => {
        const hasMatchingWard = data.some((item) => item.value === prev.ward);
        if (hasMatchingWard) return prev;
        return { ...prev, ward: "" };
      });
    } else {
      setWards([]);
    }
  }, [form.county, form.constituency]);

  const handlePlaceSelected = useCallback(
    (selection: GooglePlaceSelection) => {
      const matchedCounty = matchLocationCandidate(
        selection.county,
        kenyaCounties.map((county) => county.name)
      );

      const resolvedCounty = matchedCounty || form.county;
      const constituencyOptions = resolvedCounty
        ? getConstituenciesByCounty(resolvedCounty)
        : [];
      const matchedConstituency = matchLocationCandidate(
        selection.constituency,
        constituencyOptions
      );
      const wardOptions =
        resolvedCounty && matchedConstituency
          ? getWardsByConstituency(resolvedCounty, matchedConstituency)
          : [];
      const matchedWard = matchLocationCandidate(selection.ward, wardOptions);

      setForm((prev) => ({
        ...prev,
        county: resolvedCounty || prev.county,
        constituency: matchedConstituency || prev.constituency,
        ward: matchedWard || prev.ward,
        approximateLocation:
          selection.formattedAddress || selection.approximateLocation || prev.approximateLocation,
        latitude: selection.coordinates?.lat ?? prev.latitude,
        longitude: selection.coordinates?.lng ?? prev.longitude,
      }));
      setError("");
      setNotice(
        "Location auto-filled from Google Maps. Review county, constituency, and ward before publishing."
      );
    },
    [form.county]
  );

  const subcategoryOptions = useMemo(() => {
    switch (form.category) {
      case "produce":
        return PRODUCE_SUBCATEGORIES;
      case "livestock":
        return LIVESTOCK_SUBCATEGORIES;
      case "inputs":
        return INPUTS_SUBCATEGORIES;
      case "service":
        return SERVICE_SUBCATEGORIES;
      default:
        return [];
    }
  }, [form.category]);

  const commission = useMemo(() => {
    const price = Number(form.price) || 0;
    return Math.max(price * 0.005, 49);
  }, [form.price]);
  const isFreeLaunch = !PAYMENTS_ENABLED;

  const recommendedUnit = form.category
    ? RECOMMENDED_UNIT_BY_CATEGORY[form.category]
    : null;
  const progressStep = form.step >= MAX_FLOW_STEP ? 2 : 1;
  const progressPercent = Math.round((progressStep / LISTING_PROGRESS_LABELS.length) * 100);
  const currentProgressLabel = LISTING_PROGRESS_LABELS[progressStep - 1];
  const descriptionCopy = form.category
    ? DESCRIPTION_HINTS[form.category]
    : {
        helper: "Add the details a buyer needs to trust the listing quickly.",
        placeholder: "Describe what you are listing clearly and practically.",
      };

  const batchReadiness = useMemo(() => {
    const itemCount = batchItems.length;
    const readyCount = batchItems.filter((item) => {
      const hasBaseFields =
        item.title.trim().length >= 6 &&
        item.description.trim().length >= 20 &&
        !!item.price;
      const hasQuantity =
        form.category === "inputs" || form.category === "service"
          ? true
          : !!item.quantity;
      const hasImages = item.images.length > 0;
      return hasBaseFields && hasQuantity && hasImages;
    }).length;
    return { itemCount, readyCount };
  }, [batchItems, form.category]);


  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - form.images.length);
      setForm((prev) => ({ ...prev, images: [...prev.images, ...newImages] }));
    }
  };

  const removeImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const updateBatchItem = (itemId: string, updater: (item: BatchListingItem) => BatchListingItem) => {
    setBatchItems((prev) =>
      prev.map((item) => (item.id === itemId ? updater(item) : item))
    );
  };

  const handleBatchImageUpload = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    updateBatchItem(itemId, (item) => {
      const imagesToAdd = Array.from(files).slice(0, 5 - item.images.length);
      return { ...item, images: [...item.images, ...imagesToAdd] };
    });
  };

  const removeBatchImage = (itemId: string, imageIndex: number) => {
    updateBatchItem(itemId, (item) => ({
      ...item,
      images: item.images.filter((_, idx) => idx !== imageIndex),
    }));
  };

  const addBatchItem = () => {
    setError("");
    setNotice("");
    if (batchItems.length >= MAX_BATCH_ITEMS) {
      setError(`You can add up to ${MAX_BATCH_ITEMS} items per batch. Submit this batch, then add more.`);
      return;
    }
    const defaultUnit = recommendedUnit || form.unit || "kg";
    setBatchItems((prev) => [...prev, createBatchItem(defaultUnit, form.deliveryScope)]);
  };

  const removeBatchItem = (itemId: string) => {
    setBatchItems((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((item) => item.id !== itemId);
    });
  };

  const validateStep = (): boolean => {
    setError("");
    setNotice("");

    if (form.step === 2) {
      if (!form.category) {
        setError("Please select a category");
        return false;
      }
      if (!form.subcategory) {
        setError("Please select a subcategory");
        return false;
      }
      if (!form.county) {
        setError("Please select your county");
        return false;
      }
      if (!form.constituency) {
        setError("Please select your constituency");
        return false;
      }
      if (!form.ward) {
        setError("Please select your ward");
        return false;
      }
      return true;
    }

    if (form.step === 3) {
      if (!form.contact.trim()) {
        setError("Please enter a phone number");
        return false;
      }

      if (entryMode === "single") {
        if (!form.title.trim()) {
          setError("Please enter a title for your listing");
          return false;
        }
        if (!form.description.trim()) {
          setError("Please enter a description");
          return false;
        }
        if (!form.price) {
          setError("Please enter a price");
          return false;
        }
        if (form.category !== "inputs" && form.category !== "service" && !form.quantity) {
          setError("Please enter a quantity");
          return false;
        }
        if (form.listingType === "sell" && !form.images.length) {
          setError("Please upload at least one image");
          return false;
        }
        return true;
      }

      if (!batchItems.length) {
        setError("Add at least one item in your batch.");
        return false;
      }
      if (batchItems.length > MAX_BATCH_ITEMS) {
        setError(`A batch can contain up to ${MAX_BATCH_ITEMS} items.`);
        return false;
      }
      for (let i = 0; i < batchItems.length; i += 1) {
        const item = batchItems[i];
        const itemLabel = `Item ${i + 1}`;
        if (!item.title.trim()) {
          setError(`${itemLabel}: add a title.`);
          return false;
        }
        if (!item.description.trim()) {
          setError(`${itemLabel}: add a description.`);
          return false;
        }
        if (!item.price) {
          setError(`${itemLabel}: add a price.`);
          return false;
        }
        if (form.category !== "inputs" && form.category !== "service" && !item.quantity) {
          setError(`${itemLabel}: add a quantity.`);
          return false;
        }
        if (form.listingType === "sell" && item.images.length < 1) {
          setError(`${itemLabel}: upload at least one image.`);
          return false;
        }
      }
      return true;
    }

    return true;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setForm((prev) => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const handlePrevStep = () => {
    setError("");
    setNotice("");
    setForm((prev) => ({ ...prev, step: Math.max(MIN_FLOW_STEP, prev.step - 1) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep() || !user) return;

    setUploading(true);
    setError("");

    try {
      const token = await ensureValidAccessToken();
      if (!token) {
        setError("Session expired. Please log in again.");
        return;
      }

      const postSingleListing = async (payload: {
        title: string;
        description: string;
        price: string;
        quantity: string;
        unit: string;
        deliveryScope: DeliveryScope;
        images: File[];
      }) => {
        const formData = new FormData();
        formData.append("title", payload.title.trim());
        formData.append("description", payload.description.trim());
        formData.append("category", form.category!);
        formData.append("subcategory", form.subcategory!);
        formData.append("listingType", form.listingType!);
        formData.append("price", payload.price);
        formData.append("quantity", payload.quantity);
        formData.append("unit", payload.unit);
        formData.append("county", form.county);
        formData.append("constituency", form.constituency);
        formData.append("ward", form.ward);
        formData.append("approximateLocation", form.approximateLocation.trim());
        if (typeof form.latitude === "number" && typeof form.longitude === "number") {
          formData.append("latitude", String(form.latitude));
          formData.append("longitude", String(form.longitude));
        }
        formData.append("availableFrom", form.availableFrom);
        formData.append("deliveryScope", payload.deliveryScope);
        formData.append("contact", form.contact.trim());
        formData.append("subscriptionActive", form.subscribed ? "true" : "false");
        formData.append("premiumBadge", entryMode === "single" && form.premiumBadge ? "true" : "false");
        formData.append(
          "premiumBadgePrice",
          entryMode === "single" && form.premiumBadge && !isFreeLaunch ? "199" : "0"
        );
        payload.images.forEach((img) => formData.append("images", img));

        const response = await fetch(`${API_BASE_URL}/products`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        let result: any = null;
        try {
          result = await response.json();
        } catch {
          result = null;
        }

        if (!response.ok || !result?.success) {
          let errorMsg = result?.message || "Failed to create listing";
          if (response.status === 403) {
            errorMsg =
              "You do not have permission to publish right now. Please try again or contact support.";
          }
          if (response.status === 429 && result?.code === "UNVERIFIED_ACTIVE_CAP_REACHED") {
            errorMsg = result?.message || errorMsg;
          }
          return { ok: false as const, errorMsg };
        }

        return {
          ok: true as const,
          publishStatus: String(result?.data?.publishStatus || "").toLowerCase(),
        };
      };

      if (entryMode === "single") {
        const singleResult = await postSingleListing({
          title: form.title,
          description: form.description,
          price: form.price,
          quantity: form.quantity,
          unit: form.unit,
          deliveryScope: form.deliveryScope,
          images: form.images,
        });

        if (!singleResult.ok) {
          setError(singleResult.errorMsg);
          return;
        }

        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setHasDraft(false);
        try {
          localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({
            county: form.county,
            constituency: form.constituency,
            ward: form.ward,
            approximateLocation: form.approximateLocation,
          }));
        } catch { /* ignore */ }
        trackTrafficClick({
          action:
            singleResult.publishStatus === "active"
              ? "funnel_listing_published_single"
              : "funnel_listing_submitted_single_pending",
          target: "/browse",
        });
        if (singleResult.publishStatus === "active") {
          alert("Listing published successfully! It is now visible to buyers.");
        } else {
          alert(
            "Listing submitted successfully! It will go live after admin approval. Verify your ID + selfie to speed up future listings."
          );
        }
        navigate("/browse");
        return;
      }

      const failedItems: Array<{ item: BatchListingItem; errorMsg: string }> = [];
      let createdCount = 0;
      let activeCount = 0;

      for (const item of batchItems) {
        const batchResult = await postSingleListing({
          title: item.title,
          description: item.description,
          price: item.price,
          quantity: item.quantity,
          unit: item.unit,
          deliveryScope: item.deliveryScope,
          images: item.images,
        });
        if (!batchResult.ok) {
          failedItems.push({ item, errorMsg: batchResult.errorMsg });
          continue;
        }
        createdCount += 1;
        if (batchResult.publishStatus === "active") {
          activeCount += 1;
        }
      }

      if (createdCount === 0) {
        setError(failedItems[0]?.errorMsg || "Failed to create listings.");
        return;
      }

      if (failedItems.length > 0) {
        setBatchItems(
          failedItems.map((entry) => ({
            ...entry.item,
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          }))
        );
        setNotice(
          `${createdCount} listing(s) submitted successfully${activeCount ? `, ${activeCount} live now` : ""}.`
        );
        trackTrafficClick({
          action:
            activeCount > 0
              ? "funnel_listing_published_batch_partial"
              : "funnel_listing_submitted_batch_partial",
          target: "/create-listing",
        });
        setError(
          `${failedItems.length} item(s) still need updates before publishing. Fix the remaining cards and submit again.`
        );
        setForm((prev) => ({ ...prev, step: 4 }));
        return;
      }

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
      try {
        localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify({
          county: form.county,
          constituency: form.constituency,
          ward: form.ward,
          approximateLocation: form.approximateLocation,
        }));
      } catch { /* ignore */ }
      trackTrafficClick({
        action:
          activeCount > 0
            ? "funnel_listing_published_batch"
            : "funnel_listing_submitted_batch_pending",
        target: "/browse",
      });
      alert(
        `${createdCount} listing(s) submitted successfully${activeCount ? `, ${activeCount} are live now.` : "."}`
      );
      navigate("/browse");
    } catch (err: any) {
      setError(err.message || "An error occurred while creating your listing");
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="ui-page-shell flex items-center justify-center p-4">
        <div className="ui-card max-w-md p-8 text-center">
          <p className="ui-section-kicker">Create a listing</p>
          <h1 className="mt-2 text-2xl font-bold text-stone-900">Please log in</h1>
          <p className="mt-3 text-stone-600">You must be logged in to create a listing.</p>
          <button
            onClick={() => navigate("/login")}
            className="ui-btn-primary mt-6 px-6 py-2"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const handleRestoreDraft = () => {
    const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!draftRaw) return;
    try {
      const parsed = JSON.parse(draftRaw);
      const restoredStep = Math.min(
        Math.max(Number(parsed.step) || MIN_FLOW_STEP, MIN_FLOW_STEP),
        MAX_FLOW_STEP
      );
      const restoredEntryMode: ListingEntryMode =
        parsed?.entryMode === "batch" ? "batch" : "single";
      const restoredBatchItems: BatchListingItem[] = Array.isArray(parsed?.batchItems)
        ? parsed.batchItems.slice(0, MAX_BATCH_ITEMS).map((item: any) => ({
            ...createBatchItem(
              item?.unit || recommendedUnit || form.unit || "kg",
              item?.deliveryScope || "negotiable"
            ),
            title: String(item?.title || ""),
            description: String(item?.description || ""),
            price: String(item?.price || ""),
            quantity: String(item?.quantity || ""),
          }))
        : [createBatchItem(recommendedUnit || form.unit || "kg", form.deliveryScope)];
      setForm((prev) => ({
        ...prev,
        ...parsed,
        images: [],
        step: restoredStep,
      }));
      setEntryMode(restoredEntryMode);
      setBatchItems(restoredBatchItems.length ? restoredBatchItems : [createBatchItem(recommendedUnit || form.unit || "kg", form.deliveryScope)]);
      setHasDraft(false);
      setNotice("Draft restored. Continue where you left off.");
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraft(false);
    }
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraft(false);
    setNotice("Draft discarded.");
  };

  return (
    <div className="ui-page-shell">
      <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
        <section className="ui-hero-panel px-5 py-6 md:px-7 md:py-7">
          <div className="pointer-events-none absolute -top-20 left-1/3 h-64 w-64 rounded-full bg-[#F3C9BE]/55 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-0 h-64 w-64 rounded-full bg-[#E5F3E8]/85 blur-3xl" />
          <div className="relative grid gap-4 lg:grid-cols-[1.25fr_0.95fr] lg:items-start">
            <div className="space-y-2 anim-in">
              <p className="ui-section-kicker">Create a Listing</p>
              <h1 className="text-3xl text-stone-900 md:text-4xl">
                Create your listing in 2 minutes
              </h1>
              <p className="max-w-xl text-sm text-stone-600 md:text-base">
                Start with the essentials now. Improve trust and visibility after publishing.
              </p>
            </div>

            <div className="ui-card anim-in-2 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">Progress</p>
                  <p className="mt-1 text-sm font-semibold text-stone-900">{currentProgressLabel}</p>
                </div>
                <p className="text-sm font-semibold text-[#A0452E]">{progressPercent}%</p>
              </div>
              <div className="ui-progress-track mt-3">
                <div className="ui-progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
              <p className="mt-2 text-xs text-stone-500">
                Step {progressStep} of {LISTING_PROGRESS_LABELS.length}
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-5xl px-0 pt-6 pb-16">
          <p className="mb-6 text-sm text-stone-500">Drafts save automatically on this device.</p>

          {showVerificationNudge && (
            <div className="ui-accent-panel mb-6 flex flex-wrap items-center gap-3 p-4">
              <div className="flex-1">
                <p className="font-semibold text-[#72281A]">
                  Verification is optional for now, but it helps buyers trust your profile faster.
                </p>
                <p className="mt-1 text-sm text-stone-700">
                  Verification is optional. If you choose to upload your ID, Agrisoko handles that data in line with Kenya&apos;s Data Protection Act, 2019 and deletes the uploaded images promptly after admin review.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(verifyIdPath)}
                className="ui-btn-primary min-h-[38px] rounded-lg px-4 py-2 text-sm"
              >
                Verify to boost trust
              </button>
            </div>
          )}

          {isVerificationPending && (
            <div className="ui-success-panel mb-6 p-4">
              <p className="font-semibold text-forest-700">Verification submitted</p>
              <p className="mt-1 text-sm text-forest-700">
                Your ID review is in progress. You can keep posting while the trust badge is being reviewed.
              </p>
            </div>
          )}

          {hasDraft && (
            <div className="ui-accent-panel mb-6 flex flex-wrap items-center gap-3 p-4">
              <p className="flex-1 font-semibold text-stone-800">You have a saved draft. Want to continue?</p>
              <button
                type="button"
                onClick={handleRestoreDraft}
                className="ui-btn-primary min-h-[38px] rounded-lg px-4 py-2 text-sm"
              >
                Restore draft
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="ui-btn-secondary min-h-[38px] rounded-lg px-4 py-2 text-sm"
              >
                Discard
              </button>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <ErrorAlert
              message={error}
              onRetry={() => setError("")}
              className="mb-6"
            />
          )}
          {notice && !error && (
            <div className="ui-success-panel mb-6 flex gap-3 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-forest-600" />
              <p className="text-forest-700">{notice}</p>
            </div>
          )}

        {/* Form Container */}
        <form onSubmit={form.step === MAX_FLOW_STEP ? handleSubmit : (e) => e.preventDefault()}>
          {/* Step 2: Category Selection */}
          {form.step === 2 && (
            <div className="ui-card p-6">
              <div className="ui-accent-panel mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-[#72281A]">
                <span className="font-semibold">
                  Listing is set to Sell. Looking to buy instead?
                </span>
                <button
                  type="button"
                  onClick={() => navigate("/request/new")}
                  className="ui-btn-secondary min-h-[34px] rounded-lg px-3 py-1.5 text-xs"
                >
                  Post a buy request
                </button>
              </div>
              <h2 className="text-xl font-bold text-stone-900 mb-4">
                {hasPresetCategory
                  ? "Confirm your category"
                  : useCompactCategoryStep
                  ? "Choose category and subcategory"
                  : "What are you listing?"}
              </h2>
              {useCompactCategoryStep ? (
                <div className="ui-card-soft mb-6 p-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-stone-900">Category</label>
                      <select
                        value={form.category ?? ""}
                        onChange={(e) => {
                          const value = (e.target.value || null) as ListingCategory | null;
                          setForm((prev) => ({
                            ...prev,
                            category: value,
                            subcategory: null,
                          }));
                          setError("");
                          setNotice("");
                        }}
                        className="ui-input"
                      >
                        <option value="">Select a category...</option>
                        {CATEGORY_OPTIONS.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-stone-900">Subcategory</label>
                      <select
                        value={form.subcategory ?? ""}
                        onChange={(e) => {
                          const value = (e.target.value || null) as ListingFormData["subcategory"];
                          setForm((prev) => ({
                            ...prev,
                            subcategory: value,
                          }));
                          setError("");
                          setNotice("");
                        }}
                        className="ui-input"
                      >
                        <option value="">Select a subcategory...</option>
                        {subcategoryOptions.map((sub) => (
                          <option key={sub} value={sub}>
                            {sub}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {form.category && (
                    <p className="mt-3 text-sm text-stone-600">
                      {CATEGORY_DESCRIPTIONS[form.category]}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-4 mb-8">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          category: cat,
                          subcategory: null,
                          unit: RECOMMENDED_UNIT_BY_CATEGORY[cat] ?? prev.unit,
                          quantity: "",
                        }));
                        setError("");
                        setNotice("");
                      }}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        form.category === cat
                          ? "border-[#A0452E] bg-[#FDF5F3]"
                          : "border-stone-200 hover:border-[#E8A08E]"
                      }`}
                    >
                      <p className="font-bold text-stone-900">
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </p>
                      <p className="text-sm text-stone-600 mt-1">{CATEGORY_DESCRIPTIONS[cat]}</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="mt-6 border-t border-slate-200 pt-6">
                <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-stone-900">
                  <MapPin className="h-5 w-5" /> Where is it located?
                </h3>
                <GooglePlacesInput
                  label="Search exact place"
                  value={form.approximateLocation}
                  onChange={(value) =>
                    setForm((prev) => ({ ...prev, approximateLocation: value }))
                  }
                  onPlaceSelected={handlePlaceSelected}
                  helperText="Search a market, landmark, or address to auto-fill location, then confirm the county, constituency, and ward."
                  className="mb-4"
                />
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-stone-900">County *</label>
                    <select
                      value={form.county}
                      onChange={(e) => setForm((prev) => ({ ...prev, county: e.target.value }))}
                      className="ui-input"
                    >
                      <option value="">Select a county...</option>
                      {kenyaCounties.map((c) => (
                        <option key={c.code} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-stone-900">Constituency *</label>
                    <select
                      value={form.constituency}
                      onChange={(e) => setForm((prev) => ({ ...prev, constituency: e.target.value }))}
                      disabled={!form.county}
                      className="ui-input disabled:bg-slate-100"
                    >
                      <option value="">Select a constituency...</option>
                      {constituencies.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-stone-900">Ward *</label>
                    <select
                      value={form.ward}
                      onChange={(e) => setForm((prev) => ({ ...prev, ward: e.target.value }))}
                      disabled={!form.constituency}
                      className="ui-input disabled:bg-slate-100"
                    >
                      <option value="">Select a ward...</option>
                      {wards.map((w) => (
                        <option key={w.value} value={w.value}>
                          {w.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-stone-900">
                      Specific location (optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Near main road"
                      value={form.approximateLocation}
                      onChange={(e) => setForm((prev) => ({ ...prev, approximateLocation: e.target.value }))}
                      className="ui-input"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Listing Details */}
          {form.step === 3 && (
            <div className="ui-card p-6">
              <h2 className="text-xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                <Tag className="w-5 h-5" /> Listing Details
              </h2>

              <div className="space-y-5">
                <div className="ui-card-soft p-3">
                  <p className="text-sm font-semibold text-slate-900">Listing mode</p>
                  <p className="mt-1 text-xs text-slate-600">
                    Single is fastest for one item. Batch lets you publish up to {MAX_BATCH_ITEMS} items in one go.
                  </p>
                    <div className="mt-3 inline-flex rounded-lg border border-stone-200 bg-white p-1">
                    <button
                      type="button"
                      onClick={() => setEntryMode("single")}
                      className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                        entryMode === "single"
                          ? "bg-[#A0452E] text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Single
                    </button>
                    <button
                      type="button"
                      onClick={() => setEntryMode("batch")}
                      className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
                        entryMode === "batch"
                          ? "bg-[#A0452E] text-white"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      Batch
                    </button>
                  </div>
                </div>

                <div className="rounded-xl border border-[#F3C9BE] bg-[#FDF5F3] p-4">
                  <p className="text-sm font-semibold text-[#72281A]">
                    {entryMode === "single"
                      ? "Required to publish (about 30 seconds)"
                      : "Required per item in this batch"}
                  </p>
                  <p className="mt-1 text-xs text-[#8B3525]">
                    {entryMode === "single"
                      ? "Add a title, price, contact number, and at least one photo. You can optimize the rest after publishing."
                      : "Each item needs a title, description, price, and at least one photo. Location, category, and contact apply to all items."}
                  </p>
                </div>

                {/* Unit datalist — shared by single and batch unit inputs */}
                <datalist id="unit-suggestions">
                  {(form.category
                    ? UNIT_SUGGESTIONS_BY_CATEGORY[form.category]
                    : ALL_UNIT_SUGGESTIONS
                  ).map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>

                {entryMode === "single" ? (
                  <>
                    {/* Title */}
                    <div>
                      <label className="block text-sm font-semibold text-stone-900 mb-2">Title *</label>
                      <input
                        type="text"
                        placeholder="e.g., Fresh Tomatoes, Dairy Cow, Tractor"
                        value={form.title}
                        onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="ui-input"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-semibold text-stone-900 mb-2">Description *</label>
                      <p className="mb-2 text-xs text-stone-600">{descriptionCopy.helper}</p>
                      <textarea
                        placeholder={descriptionCopy.placeholder}
                        value={form.description}
                        onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                        rows={5}
                        className="ui-input"
                      />
                    </div>

                    {/* Price and Quantity */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-stone-900 mb-2">Price (KSh) *</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={form.price}
                          onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                          className="ui-input"
                        />
                        <p className="text-xs text-stone-600 mt-1">
                          {isFreeLaunch ? "Commission: Free for now" : `Commission: KSh ${commission.toFixed(0)}`}
                        </p>
                      </div>

                      <div>
                          <label className="block text-sm font-semibold text-stone-900 mb-2">
                            {form.category === "service" || form.category === "inputs" ? "Quantity" : "Quantity *"}
                          </label>
                          <div className="flex flex-col gap-1.5">
                            <input
                              type="number"
                              min="0"
                              placeholder={form.category === "livestock" ? "e.g. 5" : form.category === "service" ? "e.g. 1" : "Amount"}
                              value={form.quantity}
                              onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
                              className="ui-input font-semibold"
                            />
                            <input
                              type="text"
                              list="unit-suggestions"
                              placeholder="unit (kg, head, hour…)"
                              value={form.unit}
                              onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                              className="ui-input"
                            />
                          </div>
                          {(form.quantity || form.unit) && (
                            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-sm font-semibold text-stone-800">
                              {form.quantity || "?"}&nbsp;{form.unit || "?"}
                            </div>
                          )}
                          {(form.category === "service" || form.category === "inputs") && (
                            <p className="mt-1 text-xs text-stone-500">Optional — skip if not applicable.</p>
                          )}
                          <p className="mt-1 text-xs text-stone-400">Unit: kg, bag, head, hour — or type your own.</p>
                        </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="ui-card-soft flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">
                        {batchReadiness.readyCount}/{batchReadiness.itemCount} items ready
                      </p>
                      <button
                        type="button"
                        onClick={addBatchItem}
                        disabled={batchItems.length >= MAX_BATCH_ITEMS}
                        className="ui-btn-primary min-h-[38px] rounded-lg px-3 py-2 text-sm"
                      >
                        Add item
                      </button>
                    </div>

                    {batchItems.map((item, index) => (
                      <div key={item.id} className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900">Item {index + 1}</p>
                          {batchItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBatchItem(item.id)}
                              className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="mb-2 block text-sm font-semibold text-stone-900">Title *</label>
                            <input
                              type="text"
                              placeholder="e.g., Urea fertilizer 50kg"
                              value={item.title}
                              onChange={(e) =>
                                updateBatchItem(item.id, (current) => ({ ...current, title: e.target.value }))
                              }
                              className="ui-input"
                            />
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-stone-900">Description *</label>
                            <textarea
                              placeholder={descriptionCopy.placeholder}
                              value={item.description}
                              onChange={(e) =>
                                updateBatchItem(item.id, (current) => ({ ...current, description: e.target.value }))
                              }
                              rows={4}
                              className="ui-input"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="mb-2 block text-sm font-semibold text-stone-900">Price (KSh) *</label>
                              <input
                                type="number"
                                placeholder="0"
                                value={item.price}
                                onChange={(e) =>
                                  updateBatchItem(item.id, (current) => ({ ...current, price: e.target.value }))
                                }
                                className="ui-input"
                              />
                            </div>
                            <div>
                              <label className="mb-2 block text-sm font-semibold text-stone-900">
                                {form.category === "service" || form.category === "inputs" ? "Quantity" : "Quantity *"}
                              </label>
                              <div className="flex flex-col gap-1.5">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder={form.category === "livestock" ? "e.g. 5" : form.category === "service" ? "e.g. 1" : "Amount"}
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateBatchItem(item.id, (current) => ({
                                      ...current,
                                      quantity: e.target.value,
                                    }))
                                  }
                                  className="ui-input font-semibold"
                                />
                                <input
                                  type="text"
                                  list="unit-suggestions"
                                  placeholder="unit (kg, head, hour…)"
                                  value={item.unit}
                                  onChange={(e) =>
                                    updateBatchItem(item.id, (current) => ({ ...current, unit: e.target.value }))
                                  }
                                  className="ui-input"
                                />
                              </div>
                              {(item.quantity || item.unit) && (
                                <div className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-800">
                                  {item.quantity || "?"}&nbsp;{item.unit || "?"}
                                </div>
                              )}
                              {(form.category === "service" || form.category === "inputs") && (
                                <p className="mt-1 text-xs text-stone-500">Optional.</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-stone-900">
                              Delivery scope
                            </label>
                            <select
                              value={item.deliveryScope}
                              onChange={(e) =>
                                updateBatchItem(item.id, (current) => ({
                                  ...current,
                                  deliveryScope: e.target.value as DeliveryScope,
                                }))
                              }
                              className="ui-input"
                            >
                              {DELIVERY_SCOPE_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="mb-2 block text-sm font-semibold text-stone-900">
                              Upload images ({item.images.length}/5) *
                            </label>
                            <div className="rounded-lg border-2 border-dashed border-stone-300 p-4 text-center">
                              <input
                                id={`batch-image-input-${item.id}`}
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={(e) => handleBatchImageUpload(item.id, e)}
                                disabled={item.images.length >= 5}
                                className="hidden"
                              />
                              <label
                                htmlFor={`batch-image-input-${item.id}`}
                                className="cursor-pointer text-sm font-semibold text-stone-800"
                              >
                                Add photos for this item
                              </label>
                              <p className="mt-1 text-xs text-stone-600">PNG, JPG up to 5 images</p>
                            </div>
                            {item.images.length > 0 && (
                              <div className="mt-3 grid grid-cols-5 gap-2">
                                {item.images.map((img, imageIndex) => (
                                  <div key={`${item.id}-${imageIndex}`} className="relative group">
                                    <img
                                      src={URL.createObjectURL(img)}
                                      alt={`Item ${index + 1} preview ${imageIndex + 1}`}
                                      className="h-20 w-full rounded-lg object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => removeBatchImage(item.id, imageIndex)}
                                      className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 text-[11px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Available From */}
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    Delivery scope
                  </label>
                  <select
                    value={form.deliveryScope}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        deliveryScope: e.target.value as DeliveryScope,
                      }))
                    }
                    disabled={entryMode === "batch"}
                    className="ui-input"
                  >
                    {DELIVERY_SCOPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-stone-600">
                    {
                      DELIVERY_SCOPE_OPTIONS.find((option) => option.value === form.deliveryScope)
                        ?.helper
                    }{" "}
                    {entryMode === "batch"
                      ? "Batch mode uses each item's delivery scope."
                      : "Shown as a delivery tag on your listing."}
                  </p>
                </div>

                {/* Available From */}
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Available From (Optional)
                  </label>
                  <input
                    type="date"
                    value={form.availableFrom}
                    onChange={(e) => setForm((prev) => ({ ...prev, availableFrom: e.target.value }))}
                    className="ui-input"
                  />
                </div>

                {/* Contact Number */}
                <div>
                  <label className="block text-sm font-semibold text-stone-900 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    placeholder="+254712345678"
                    value={form.contact}
                    onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                    className="ui-input"
                  />
                  <p className="text-xs text-stone-600 mt-1">
                    Buyers contact you faster with this number.
                  </p>
                </div>

                {/* Images */}
                {entryMode === "single" && (
                  <div>
                    <label className="block text-sm font-semibold text-stone-900 mb-2">
                      <Camera className="w-4 h-4 inline mr-2" />
                      Upload Images ({form.images.length}/5) *
                    </label>
                    <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={form.images.length >= 5}
                        className="hidden"
                        id="imageInput"
                      />
                      <label htmlFor="imageInput" className="cursor-pointer">
                        <Camera className="w-8 h-8 mx-auto text-stone-400 mb-2" />
                        <p className="text-sm font-semibold text-stone-900">Upload photos</p>
                        <p className="text-xs text-stone-600">PNG, JPG up to 5 images.</p>
                      </label>
                    </div>

                    {/* Image Preview */}
                    {form.images.length > 0 && (
                      <div className="mt-4 grid grid-cols-5 gap-3">
                        {form.images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img
                              src={URL.createObjectURL(img)}
                              alt={`Preview ${idx + 1}`}
                              className="w-full h-24 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(idx)}
                              className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <span className="text-white text-xs font-semibold">Remove</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-xl border border-[#F3C9BE] bg-[#FDF5F3] p-4 text-sm text-[#72281A]">
                  {idVerified && selfieVerified ? (
                    <p className="font-semibold">
                      Profile verified. Your listing has stronger trust and can go live faster.
                    </p>
                  ) : (
                    <>
                      <p className="font-semibold">Verification is optional, but it improves buyer trust.</p>
                      <p className="mt-1 text-[#8B3525]">
                        You can publish now and verify later to rank higher.
                      </p>
                    </>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="ui-btn-primary w-full py-3 font-bold"
                >
                  {uploading
                    ? entryMode === "batch"
                      ? "Publishing batch..."
                      : "Publishing listing..."
                    : entryMode === "batch"
                    ? "Publish batch listings"
                    : "Publish listing"}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div
            className={`mt-6 flex flex-col gap-3 sm:flex-row sm:gap-4 ${isCompact ? "sticky bottom-3 z-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur" : ""}`}
          >
            {form.step > MIN_FLOW_STEP && (
              <button
                type="button"
                onClick={handlePrevStep}
                className="ui-btn-ghost flex-1 py-3"
              >
                Previous
              </button>
            )}
            {form.step < MAX_FLOW_STEP && (
              <button
                type="button"
                onClick={handleNextStep}
                className="ui-btn-primary flex-1 py-3"
              >
                Next
              </button>
            )}
          </div>
        </form>
      </div>
      </div>
    </div>
  );
};

export default CreateListing;


