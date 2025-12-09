import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE_URL } from "../config/api";
import { Upload, CheckCircle, AlertCircle, Shield } from "lucide-react";

const IDVerificationUpload: React.FC = () => {
  const { user } = useAuth();
  const [step, setStep] = useState<"info" | "documents" | "review" | "submitted">("info");
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Debug logging
  React.useEffect(() => {
    console.log('IDVerificationUpload mounted, user:', user);
  }, [user]);

  try {
    if (!user) {
      console.warn('IDVerificationUpload: No user found, returning null');
      return null;
    }

    const isAlreadyVerified =
      user.verification?.idVerified && user.verification?.selfieVerified;

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

  const handleSubmit = async () => {
    if (!idFile || !selfieFile) {
      setError("Please upload both ID and selfie documents");
      return;
    }

    try {
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
      setStep("submitted");
      setIdFile(null);
      setSelfieFile(null);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield size={32} />
            <h1 className="text-3xl font-bold">Identity Verification</h1>
          </div>
          <p className="text-green-100">
            Verify your identity to increase trust and unlock premium features
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {isAlreadyVerified ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-900 mb-2">Verified!</h2>
              <p className="text-green-800 mb-4">
                Your identity has been verified. This badge will display on your profile and listings.
              </p>
              <div className="inline-flex px-6 py-2 rounded-lg bg-green-600 text-white font-semibold">
                ✓ ID Verified
              </div>
            </div>
          ) : step === "info" ? (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <h3 className="font-bold text-blue-900 mb-3">Why Get Verified?</h3>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-center gap-2">
                    <span className="text-xl">⭐</span>
                    <span>Display an "ID Verified" badge on your profile and listings</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>Build trust with buyers and sellers</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-xl">📈</span>
                    <span>Higher visibility in search results</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>Priority support from Agrisoko team</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h3 className="font-bold text-gray-900 mb-3">What We Need</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">1. Valid ID Document</p>
                    <p className="text-sm text-gray-600">
                      National ID, Passport, or Driver's License (clear photo)
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">2. Selfie with ID</p>
                    <p className="text-sm text-gray-600">
                      A photo of you holding your ID document (so we know it's really you)
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex gap-3">
                <AlertCircle className="text-yellow-700 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold">Privacy & Security</p>
                  <p>Your documents are encrypted and only reviewed by our admin team. We never share or sell your data.</p>
                </div>
              </div>

              <button
                onClick={() => setStep("documents")}
                className="w-full px-6 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 transition"
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
                        className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition"
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
                        className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg cursor-pointer hover:bg-green-700 transition"
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
                  className="flex-1 px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 disabled:bg-gray-400 transition"
                >
                  Review & Submit
                </button>
              </div>
            </div>
          ) : step === "review" ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Review Your Documents</h2>

              {idFile && (
                <div>
                  <p className="font-semibold text-gray-900 mb-3">ID Document</p>
                  <img
                    src={URL.createObjectURL(idFile)}
                    alt="ID"
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
                  className="flex-1 px-6 py-3 rounded-lg bg-green-600 text-white font-bold hover:bg-green-700 disabled:bg-gray-400 transition flex items-center justify-center gap-2"
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
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto" />
              <h2 className="text-2xl font-bold text-gray-900">Documents Submitted!</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Your identity documents have been received. Our admin team will review them within
                1-2 business days. You'll be notified once verification is complete.
              </p>
              <button
                onClick={() => setStep("info")}
                className="px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition"
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
