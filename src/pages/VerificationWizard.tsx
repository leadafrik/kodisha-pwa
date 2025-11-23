import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../config/api";

/**
 * Simple, mobile-friendly verification wizard.
 * Steps:
 * 1. Identity (ID front, ID back, selfie)
 * 2. Land documents (title deed, land search / chief letter)
 * 3. Business documents (business permit, certificates, store / equipment photos)
 * 4. Review status
 *
 * This talks directly to the backend verification endpoints:
 *  - GET  /api/verification/status/:userId
 *  - POST /api/verification/upload/:type  (FormData: userId + file)
 */

type WizardStepKey = "identity" | "land" | "business" | "review";

interface StepConfig {
  key: WizardStepKey;
  label: string;
  description: string;
}

const allStepConfigs: StepConfig[] = [
  {
    key: "identity",
    label: "Identity",
    description: "Upload your national ID and a selfie to prove it is really you.",
  },
  {
    key: "land",
    label: "Land documents",
    description:
      "If you plan to SELL land, upload your title deed and either a land search report or chief's letter. Optional for rent/lease listings.",
  },
  {
    key: "business",
    label: "Business / service",
    description:
      "If you provide services or run an agrovet, upload your business permit and any certificates or shop/equipment photos.",
  },
  {
    key: "review",
    label: "Review",
    description: "Check your verification status and what is still pending.",
  },
];

interface VerificationStatusResponse {
  verification?: any;
  idData?: {
    idFront?: string;
    idBack?: string;
    selfie?: string;
    [key: string]: any;
  };
  documents?: Array<{
    type: string;
    url: string;
    description?: string;
    verified?: boolean;
    uploadedAt?: string;
  }>;
}

const VerificationWizard: React.FC = () => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [status, setStatus] = useState<VerificationStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isLandOwner =
    user?.userType === "landowner" || user?.type === "seller";
  const isServiceProvider =
    user?.userType === "service provider" ||
    user?.type === "service_provider";

  const steps: StepConfig[] = useMemo(() => {
    const list: StepConfig[] = [];
    list.push(allStepConfigs.find((s) => s.key === "identity")!);
    if (isLandOwner) {
      list.push(allStepConfigs.find((s) => s.key === "land")!);
    }
    if (isServiceProvider) {
      list.push(allStepConfigs.find((s) => s.key === "business")!);
    }
    list.push(allStepConfigs.find((s) => s.key === "review")!);
    return list;
  }, [isLandOwner, isServiceProvider]);

  useEffect(() => {
    if (currentIndex > steps.length - 1) {
      setCurrentIndex(steps.length - 1);
    }
  }, [steps, currentIndex]);

  const currentStep = steps[currentIndex];

  const canGoBack = currentIndex > 0;
  const canGoNext = currentIndex < steps.length - 1;

  const goNext = () => {
    if (currentIndex < steps.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setError(null);
      setSuccessMessage(null);
    }
  };

  const fetchStatus = async () => {
    if (!user?._id) return;
    try {
      setStatusLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE_URL}/verification/status/${user._id}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to load verification status.");
      }
      setStatus({
        verification: data.verification,
        idData: data.idData,
        documents: data.documents,
      });
    } catch (err: any) {
      console.error("Failed to load verification status", err);
      setError(err.message || "Failed to load verification status.");
    } finally {
      setStatusLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  const uploadDocument = async (type: string, file: File | null) => {
    if (!file) {
      setError("Please choose a file first.");
      return;
    }
    if (!user?._id) {
      setError("You must be logged in to upload verification documents.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessMessage(null);

      const formData = new FormData();
      formData.append("userId", user._id as string);
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/verification/upload/${type}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to upload document.");
      }

      setSuccessMessage("Document uploaded successfully.");
      await fetchStatus();
    } catch (err: any) {
      console.error("Upload error", err);
      setError(err.message || "Failed to upload document.");
    } finally {
      setLoading(false);
    }
  };

  const renderIdentityStep = () => {
    const hasIdFront = !!status?.idData?.idFront;
    const hasIdBack = !!status?.idData?.idBack;
    const hasSelfie = !!status?.idData?.selfie;

    return (
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Please upload clear photos of your Kenyan national ID (front and back)
          and a selfie matching your ID. This helps keep Kodisha safe for
          everyone.
        </p>

        <UploadRow
          label="ID Front"
          hint="Clear image of the front side of your ID."
          uploaded={hasIdFront}
          onFileSelected={(file) => uploadDocument("id-front", file)}
          loading={loading}
        />

        <UploadRow
          label="ID Back"
          hint="Clear image of the back side of your ID."
          uploaded={hasIdBack}
          onFileSelected={(file) => uploadDocument("id-back", file)}
          loading={loading}
        />

        <UploadRow
          label="Selfie"
          hint="A selfie of you holding your ID or clearly showing your face."
          uploaded={hasSelfie}
          onFileSelected={(file) => uploadDocument("selfie", file)}
          loading={loading}
        />
      </div>
    );
  };

  const renderLandStep = () => {
    const docs = status?.documents || [];
    const hasTitleDeed = docs.some((d) => d.type === "land_title");
    const hasLandSearch = docs.some((d) => d.description === "land_search");
    const hasChiefLetter = docs.some((d) => d.description === "chief_letter");

    return (
      <div className="space-y-6">
        <p className="text-sm text-gray-600 mb-2">
          <strong className="font-semibold">For selling land:</strong> title
          deed is required, plus either a land search report or a stamped
          chief&apos;s letter.
        </p>
        <p className="text-xs text-gray-500">
          If you are only renting or leasing land, these documents are
          optional but increase your trust score and visibility.
        </p>

        <UploadRow
          label="Title Deed (required for selling)"
          hint="Clear photo/scan of the title deed."
          uploaded={hasTitleDeed}
          onFileSelected={(file) => uploadDocument("title-deed", file)}
          loading={loading}
        />

        <UploadRow
          label="Land Search Report"
          hint="Recent land search from the Ministry of Lands / eCitizen."
          uploaded={hasLandSearch}
          onFileSelected={(file) => uploadDocument("land-search", file)}
          loading={loading}
        />

        <UploadRow
          label="Chief's Letter"
          hint="Stamped letter from the chief confirming land ownership (especially for rural areas)."
          uploaded={hasChiefLetter}
          onFileSelected={(file) => uploadDocument("chief-letter", file)}
          loading={loading}
        />

        {isLandOwner && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-xs rounded-lg p-3">
            <p className="font-semibold mb-1">Important for land sellers</p>
            <p>
              Your land-for-sale listings will only go live after these
              ownership documents have been reviewed and approved.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderBusinessStep = () => {
    const docs = status?.documents || [];
    const hasBusinessPermit = docs.some((d) => d.type === "business_permit");
    const hasCertificate = docs.some(
      (d) => d.description === "service_certificate"
    );
    const hasStorePhoto = docs.some((d) => d.description === "store_photo");
    const hasEquipmentPhoto = docs.some(
      (d) => d.description === "equipment_photo"
    );

    return (
      <div className="space-y-6">
        <p className="text-sm text-gray-600 mb-2">
          If you are a service provider, agrovet, or equipment owner, upload
          your business documents so farmers can trust your services.
        </p>

        <UploadRow
          label="Business Permit"
          hint="Scanned or photographed business permit."
          uploaded={hasBusinessPermit}
          onFileSelected={(file) => uploadDocument("business-permit", file)}
          loading={loading}
        />

        <UploadRow
          label="Professional / Service Certificate"
          hint="Optional: e.g. agronomist, vet, surveyor certificate."
          uploaded={hasCertificate}
          onFileSelected={(file) => uploadDocument("service-certificate", file)}
          loading={loading}
        />

        <UploadRow
          label="Shop / Agrovet Photo"
          hint="Optional: clear photo of your shop front or inside."
          uploaded={hasStorePhoto}
          onFileSelected={(file) => uploadDocument("store-photo", file)}
          loading={loading}
        />

        <UploadRow
          label="Equipment Photo"
          hint="Optional: tractors, sprayers, ploughs, etc. you rent out."
          uploaded={hasEquipmentPhoto}
          onFileSelected={(file) => uploadDocument("equipment-photo", file)}
          loading={loading}
        />

        {isServiceProvider && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-lg p-3">
            <p className="font-semibold mb-1">Subscription & visibility</p>
            <p>
              Service providers operate on a subscription model. Your first
              month will be free, and verified profiles get better visibility
              in search results.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderReviewStep = () => {
    const v = status?.verification;
    const phoneVerified = !!v?.phoneVerified;
    const idVerified = !!v?.idVerified;
    const selfieVerified = !!v?.selfieVerified;
    const ownershipVerified = !!v?.ownershipVerified;
    const businessVerified = !!v?.businessVerified;
    const level = v?.verificationLevel ?? "basic";
    const trustScore = v?.trustScore ?? 0;
    const showLandStatus = isLandOwner || ownershipVerified;
    const showBusinessStatus = isServiceProvider || businessVerified;

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">
            Overall status
          </h3>
          <p className="text-sm text-gray-700">
            Level:{" "}
            <span className="font-semibold capitalize">{level}</span>
          </p>
          <p className="text-sm text-gray-700">
            Trust score:{" "}
            <span className="font-semibold">{trustScore}/100</span>
          </p>
          {v?.status && (
            <p className="text-xs text-gray-500 mt-1">
              Review status:{" "}
              <span className="font-semibold capitalize">
                {v.status.replace("_", " ")}
              </span>
            </p>
          )}
        </div>

        <div className="space-y-2 text-sm">
          <StatusRow label="Phone verified" ok={phoneVerified} />
          <StatusRow
            label="ID + Selfie verified"
            ok={idVerified && selfieVerified}
          />
          {showLandStatus && (
            <StatusRow
              label="Land ownership documents"
              ok={ownershipVerified}
              note="Required for selling land"
            />
          )}
          {showBusinessStatus && (
            <StatusRow
              label="Business / service verification"
              ok={businessVerified}
              note="Recommended for service providers & agrovets"
            />
          )}
        </div>

        <p className="text-xs text-gray-500">
          Once your documents are uploaded, an admin will review them. You
          will receive an update, and your listings will go live
          automatically if everything is approved.
        </p>
      </div>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-6 text-center space-y-3">
          <h2 className="text-xl font-semibold text-gray-800">
            Login required
          </h2>
          <p className="text-sm text-gray-600">
            You need to log in before you can complete verification.
          </p>
          <a
            href="/login"
            className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Go to login
          </a>
        </div>
      </div>
    );
  }

  const isApproved = status?.verification?.status === "approved";

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center px-4 py-8">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Account verification
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Help us keep Kodisha safe and trustworthy by completing the
          verification steps below.
        </p>
        <p className="text-[11px] text-gray-500 mb-4">
          Steps are tailored to your profile (seller vs service provider). You
          only see what applies to you.
        </p>

        {/* Progress indicator */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-medium text-gray-500 mb-2">
            {steps.map((s, index) => (
              <div key={s.key} className="flex-1 flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs mb-1 ${
                    index === currentIndex
                      ? "bg-green-600 text-white"
                      : index < currentIndex
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                <span
                  className={`hidden md:block ${
                    index === currentIndex
                      ? "text-green-700"
                      : "text-gray-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-green-600 h-1.5 transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / steps.length) * 100}%`,
              }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {currentStep.label}
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            {currentStep.description}
          </p>

          {statusLoading && (
            <div className="text-xs text-gray-500 mb-2">
              Loading your current verification status...
            </div>
          )}

          {error && (
            <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-3 text-xs text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {successMessage}
            </div>
          )}

          {currentStep.key === "identity" && renderIdentityStep()}
          {currentStep.key === "land" && renderLandStep()}
          {currentStep.key === "business" && renderBusinessStep()}
          {currentStep.key === "review" && renderReviewStep()}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className={`px-3 py-2 rounded-lg text-sm border ${
              canGoBack
                ? "border-gray-300 text-gray-700 hover:bg-gray-50"
                : "border-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Back
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchStatus}
              type="button"
              className="px-3 py-2 rounded-lg text-xs border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Refresh status
            </button>

            {currentStep.key !== "review" && (
              <button
                onClick={goNext}
                className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-60"
                disabled={loading}
              >
                Next
              </button>
            )}

            {currentStep.key === "review" && (
              <button
                type="button"
                disabled={!isApproved}
                className={`px-4 py-2 rounded-lg text-sm font-semibold ${
                  isApproved
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {isApproved
                  ? "You are fully verified"
                  : "Waiting for admin review"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface UploadRowProps {
  label: string;
  hint?: string;
  uploaded: boolean;
  loading?: boolean;
  onFileSelected: (file: File | null) => void;
}

const UploadRow: React.FC<UploadRowProps> = ({
  label,
  hint,
  uploaded,
  loading,
  onFileSelected,
}) => {
  const [localFile, setLocalFile] = useState<File | null>(null);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0] || null;
    setLocalFile(file);
  };

  const handleUploadClick = () => {
    onFileSelected(localFile);
  };

  return (
    <div className="border border-gray-200 rounded-lg p-3 flex flex-col md:flex-row md:items-center gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
          {label}
          {uploaded && (
            <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full bg-green-100 text-green-700">
              Uploaded
            </span>
          )}
        </p>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="text-xs"
        />
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={!localFile || loading}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
            !localFile || loading
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {loading ? "Uploading..." : uploaded ? "Replace" : "Upload"}
        </button>
      </div>
    </div>
  );
};

interface StatusRowProps {
  label: string;
  ok: boolean;
  note?: string;
}

const StatusRow: React.FC<StatusRowProps> = ({ label, ok, note }) => {
  return (
    <div className="flex items-start gap-2 text-xs text-gray-700">
      <span
        className={`mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
          ok ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
        }`}
      >
        {ok ? "OK" : "!"}
      </span>
      <div>
        <p className="font-medium">{label}</p>
        {note && <p className="text-[11px] text-gray-500">{note}</p>}
      </div>
    </div>
  );
};

export default VerificationWizard;

