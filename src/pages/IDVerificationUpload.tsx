import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../config/api";
import { Upload, CheckCircle, AlertCircle, Shield } from "lucide-react";
import { handleImageError } from "../utils/imageFallback";

const IDVerificationUpload: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<"info" | "documents" | "review" | "submitted">("info");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [latestVerification, setLatestVerification] = useState<{
    status?: string;
    submittedAt?: string;
  } | null>(null);

  try {
    if (!user) {
      return null;
    }

    const isAlreadyVerified =
      user.verification?.idVerified && user.verification?.selfieVerified;
    const steps = [
      { key: "info", label: "Overview" },
      { key: "documents", label: "Upload documents" },
      { key: "review", label: "Review" },
      { key: "submitted", label: "Submitted" },
    ];
    const currentStepIndex = Math.max(
      0,
      steps.findIndex((item) => item.key === step)
    );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "id" | "selfie") => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        setError(`File size must be less than 5MB`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError(`Please upload an image file`);
        return;
      }
      setError("");
      if (type === "id") setIdFile(file);
      else setSelfieFile(file);
    }
  };

  const loadLatestStatus = async () => {
    try {
      const token = localStorage.getItem("kodisha_token");
      const response = await fetch(`${API_BASE_URL}/verification/id/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (response.ok && data?.verification) {
        setLatestVerification({
          status: data.verification.status,
          submittedAt: data.verification.submittedAt,
        });
      }
    } catch {
      setLatestVerification(null);
    }
  };

  React.useEffect(() => {
    loadLatestStatus();
  }, []);

  React.useEffect(() => {
    if (latestVerification?.status && step !== "submitted") {
      setStep("submitted");
    }
  }, [latestVerification?.status, step]);

  const handleSubmit = async () => {
    if (!idFile || !selfieFile) {
      setError("Please upload both ID and selfie documents");
      return;
    }

    try {
      setError("");
      setSuccess("");
      setUploading(true);
      const formData = new FormData();
      formData.append("idDocument", idFile);
      formData.append("selfieDocument", selfieFile);

      // Upload to verification endpoint
      const response = await fetch(
        `${API_BASE_URL}/verification/id/submit-documents`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("kodisha_token")}`,
          },
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Upload failed");
      }

      setSuccess(
        "Documents submitted successfully! Admin review typically takes 1-2 business days."
      );
      await loadLatestStatus();
      setStep("submitted");
      setIdFile(null);
      setSelfieFile(null);
    } catch (err: any) {
      const message = err.message || "Upload failed";
      setError(message);
      if (message.toLowerCase().includes("pending") || message.toLowerCase().includes("approved")) {
        await loadLatestStatus();
        setStep("submitted");
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-emerald-800 text-white p-8">
          <div className="flex items-center gap-3 mb-3">
            <Shield size={30} />
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-100">
              Agrisoko Trust
            </p>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Identity Verification</h1>
          <p className="text-emerald-100 max-w-2xl">
            Submit your ID and selfie to display a verified badge, earn higher visibility, and build
            trust with buyers and sellers.
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {!isAlreadyVerified && (
            <div className="mb-8">
              <div className="flex flex-wrap gap-2">
                {steps.map((item, index) => {
                  const isActive = index <= currentStepIndex;
                  return (
                    <div
                      key={item.key}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                        isActive
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                          isActive ? "bg-emerald-600 text-white" : "bg-slate-300 text-white"
                        }`}
                      >
                        {index + 1}
                      </span>
                      {item.label}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {isAlreadyVerified ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
              <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-emerald-900 mb-2">Verified</h2>
              <p className="text-emerald-800 mb-5">
                Your identity has been verified. The badge is now visible on your profile and listings.
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-emerald-600 text-white font-semibold">
                <CheckCircle className="w-5 h-5" />
                ID Verified
              </div>
            </div>
          ) : step === "info" ? (
            <div className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-900 mb-4">Why get verified</h3>
                  <ul className="space-y-3 text-slate-700">
                    {[
                      "Display a verified badge on your profile and listings.",
                      "Increase buyer confidence and trust.",
                      "Higher visibility in marketplace search results.",
                      "Priority support from the Agrisoko team.",
                    ].map((benefit) => (
                      <li key={benefit} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl p-6">
                  <h3 className="font-bold text-slate-900 mb-4">What you will submit</h3>
                  <div className="space-y-4 text-sm text-slate-600">
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">1. Valid ID document</p>
                      <p>National ID, passport, or driver's license.</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">2. Selfie with ID</p>
                      <p>A clear photo of you holding the same document.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="text-amber-700 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-amber-800">
                  <p className="font-semibold">Privacy and security</p>
                  <p>
                    Documents are encrypted and reviewed only by our admin team. We never share or sell your data.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep("documents")}
                className="w-full px-6 py-3 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
              >
                Start Verification
              </button>
            </div>
          ) : step === "documents" ? (
            <div className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex gap-3">
                  <CheckCircle className="text-emerald-600 flex-shrink-0" size={20} />
                  <p className="text-emerald-800">{success}</p>
                </div>
              )}

              {/* ID Document */}
              <div>
                <label className="block font-bold text-gray-900 mb-3">
                  1. Valid ID Document (National ID, Passport, or Driver's License)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  {idFile ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Selected file:</p>
                      <p className="font-semibold text-gray-900 mb-4">{idFile.name}</p>
                      <img
                        src={URL.createObjectURL(idFile)}
                        alt="ID Preview"
                        onError={handleImageError}
                        className="w-full max-h-48 object-contain mx-auto mb-4"
                      />
                      <button
                        onClick={() => setIdFile(null)}
                        className="text-sm text-red-600 hover:text-red-700 font-semibold"
                      >
                        Remove and reselect
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">
                        Drag and drop or click to upload
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "id")}
                        className="hidden"
                        id="id-input"
                      />
                      <label
                        htmlFor="id-input"
                        className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 transition"
                      >
                        Select File
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG up to 5MB
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Selfie */}
              <div>
                <label className="block font-bold text-gray-900 mb-3">
                  2. Selfie with ID Document
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  {selfieFile ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Selected file:</p>
                      <p className="font-semibold text-gray-900 mb-4">{selfieFile.name}</p>
                      <img
                        src={URL.createObjectURL(selfieFile)}
                        alt="Selfie Preview"
                        onError={handleImageError}
                        className="w-full max-h-48 object-contain mx-auto mb-4"
                      />
                      <button
                        onClick={() => setSelfieFile(null)}
                        className="text-sm text-red-600 hover:text-red-700 font-semibold"
                      >
                        Remove and reselect
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600 mb-2">
                        Drag and drop or click to upload
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, "selfie")}
                        className="hidden"
                        id="selfie-input"
                      />
                      <label
                        htmlFor="selfie-input"
                        className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg cursor-pointer hover:bg-emerald-700 transition"
                      >
                        Select File
                      </label>
                      <p className="text-xs text-gray-500 mt-2">
                        PNG, JPG up to 5MB
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep("info")}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("review")}
                  disabled={!idFile || !selfieFile}
                  className="flex-1 px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:bg-gray-400 transition"
                >
                  Review & Submit
                </button>
              </div>
            </div>
          ) : step === "review" ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Review Your Documents</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
                  <AlertCircle className="text-red-600 flex-shrink-0" size={20} />
                  <p className="text-red-800">{error}</p>
                </div>
              )}

              {idFile && (
                <div>
                  <p className="font-semibold text-gray-900 mb-3">ID Document</p>
                  <img
                    src={URL.createObjectURL(idFile)}
                    alt="ID"
                    onError={handleImageError}
                    className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
                  />
                </div>
              )}

              {selfieFile && (
                <div>
                  <p className="font-semibold text-gray-900 mb-3">Selfie with ID</p>
                  <img
                    src={URL.createObjectURL(selfieFile)}
                    alt="Selfie"
                    onError={handleImageError}
                    className="w-full max-h-64 object-contain rounded-lg border border-gray-200"
                  />
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-semibold mb-2">Submitting will:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Send your documents for admin review</li>
                  <li>Typically take 1-2 business days to process</li>
                  <li>Display "ID Verified" badge once approved</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setStep("documents")}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-semibold text-gray-900 hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={uploading}
                  className="flex-1 px-6 py-3 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                      Uploading...
                    </>
                  ) : (
                    "Submit for Review"
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">Documents Submitted!</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Your identity documents have been received. Our admin team will review them within
                1-2 business days. You'll be notified once verification is complete.
              </p>
              {latestVerification && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Status:</span>{" "}
                    {latestVerification.status?.replace(/_/g, " ") || "pending"}
                  </p>
                  {latestVerification.submittedAt && (
                    <p className="mt-1">
                      <span className="font-semibold text-slate-900">Submitted:</span>{" "}
                      {new Date(latestVerification.submittedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              <button
                onClick={() => setStep("info")}
                className="px-6 py-3 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    );
  } catch (err: any) {
    console.error('Error rendering IDVerificationUpload:', err);
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Page</h2>
          <p className="text-red-800 mb-4">{err?.message || 'An unexpected error occurred'}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
};

export default IDVerificationUpload;
