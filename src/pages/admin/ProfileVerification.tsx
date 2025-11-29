import React, { useState, useEffect } from 'react';
import {
  getPendingProfiles,
  verifyProfile,
  rejectProfile,
  getSellerDocuments,
  PendingProfile,
  SellerDocuments,
} from '../../services/adminVerificationService';

const AdminProfileVerification: React.FC = () => {
  const [profiles, setProfiles] = useState<PendingProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<PendingProfile | null>(null);
  const [documents, setDocuments] = useState<SellerDocuments | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  // Fetch pending profiles
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoading(true);
        setError(null);
        const { profiles, pages } = await getPendingProfiles(page);
        setProfiles(profiles);
        setTotalPages(pages);
        setSelectedProfile(null);
        setDocuments(null);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [page]);

  // Fetch documents when profile is selected
  useEffect(() => {
    if (!selectedProfile) return;

    const loadDocuments = async () => {
      try {
        const docs = await getSellerDocuments(selectedProfile._id);
        setDocuments(docs);
      } catch (err) {
        setError((err as Error).message);
      }
    };

    loadDocuments();
  }, [selectedProfile]);

  const handleVerify = async () => {
    if (!selectedProfile) return;

    try {
      await verifyProfile(selectedProfile._id);
      setSuccessMessage(`Profile verified for ${selectedProfile.fullName}`);
      setSelectedProfile(null);

      // Reload profiles
      const { profiles } = await getPendingProfiles(page);
      setProfiles(profiles);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleReject = async () => {
    if (!selectedProfile) return;

    try {
      await rejectProfile(selectedProfile._id, rejectReason);
      setSuccessMessage(
        `Profile rejected for ${selectedProfile.fullName}${rejectReason ? ': ' + rejectReason : ''}`
      );
      setSelectedProfile(null);
      setRejectReason('');
      setShowRejectForm(false);

      // Reload profiles
      const { profiles } = await getPendingProfiles(page);
      setProfiles(profiles);

      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Profile Verification</h1>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
          ✓ {successMessage}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          ✕ {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profiles List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Pending Profiles ({profiles.length})
            </h2>

            {loading && profiles.length === 0 && (
              <p className="text-gray-500">Loading...</p>
            )}

            {profiles.length === 0 && !loading && (
              <p className="text-gray-500">No pending profiles</p>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {profiles.map((profile) => (
                <button
                  key={profile._id}
                  onClick={() => setSelectedProfile(profile)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedProfile?._id === profile._id
                      ? 'bg-blue-100 border-l-4 border-blue-600'
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <p className="font-medium">{profile.fullName}</p>
                  <p className="text-sm text-gray-600">{profile.phone}</p>
                  <p className="text-xs text-yellow-600 mt-1">
                    ⏳ Pending Verification
                  </p>
                </button>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-3 py-1">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Details */}
        {selectedProfile ? (
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
              <div className="space-y-2">
                <p>
                  <strong>Name:</strong> {selectedProfile.fullName}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedProfile.phone}
                </p>
                {selectedProfile.email && (
                  <p>
                    <strong>Email:</strong> {selectedProfile.email}
                  </p>
                )}
                <p>
                  <strong>Location:</strong>{' '}
                  {[selectedProfile.county, selectedProfile.constituency]
                    .filter(Boolean)
                    .join(', ') || 'N/A'}
                </p>
                <p>
                  <strong>Fraud Flags:</strong>{' '}
                  <span className="text-red-600">
                    {selectedProfile.fraud?.flagsCount || 0}
                  </span>
                </p>
              </div>
            </div>

            {/* Documents */}
            {documents && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold mb-4">Documents</h2>

                {/* ID Documents */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-3">ID Documents</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* ID Front */}
                    {documents.idDocuments.idFront && (
                      <div>
                        <p className="text-sm font-medium mb-2">ID Front</p>
                        <a
                          href={documents.idDocuments.idFront}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          <img
                            src={documents.idDocuments.idFront}
                            alt="ID Front"
                            className="w-full h-40 object-cover rounded border border-gray-300"
                          />
                        </a>
                      </div>
                    )}

                    {/* ID Back */}
                    {documents.idDocuments.idBack && (
                      <div>
                        <p className="text-sm font-medium mb-2">ID Back</p>
                        <a
                          href={documents.idDocuments.idBack}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          <img
                            src={documents.idDocuments.idBack}
                            alt="ID Back"
                            className="w-full h-40 object-cover rounded border border-gray-300"
                          />
                        </a>
                      </div>
                    )}

                    {/* Selfie */}
                    {documents.idDocuments.selfie && (
                      <div>
                        <p className="text-sm font-medium mb-2">Selfie</p>
                        <a
                          href={documents.idDocuments.selfie}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          <img
                            src={documents.idDocuments.selfie}
                            alt="Selfie"
                            className="w-full h-40 object-cover rounded border border-gray-300"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Other Documents */}
                {documents.otherDocuments.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-3">Other Documents</h3>
                    <div className="space-y-2">
                      {documents.otherDocuments.map((doc: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded"
                        >
                          <div>
                            <p className="font-medium capitalize">
                              {doc.type.replace(/_/g, ' ')}
                            </p>
                            <p className="text-sm text-gray-500">
                              {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification Status */}
                <div className="bg-blue-50 border border-blue-200 p-3 rounded">
                  <p>
                    <strong>Verification Status:</strong>{' '}
                    {documents.verificationDetails.idVerified &&
                    documents.verificationDetails.selfieVerified
                      ? '✓ ID and Selfie Verified'
                      : '⏳ Pending'}
                  </p>
                  {documents.verificationDetails.notes && (
                    <p className="text-sm mt-2">
                      <strong>Notes:</strong> {documents.verificationDetails.notes}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Actions</h2>
              <div className="flex gap-3">
                <button
                  onClick={handleVerify}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  ✓ Verify Profile
                </button>
                <button
                  onClick={() => setShowRejectForm(!showRejectForm)}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  ✕ Reject Profile
                </button>
              </div>

              {/* Reject Form */}
              {showRejectForm && (
                <div className="mt-4 p-4 bg-red-50 rounded">
                  <label className="block text-sm font-medium mb-2">
                    Reason for rejection (optional)
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Explain why you're rejecting this profile..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded mb-3 focus:outline-none focus:ring-2 focus:ring-red-600"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleReject}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      Confirm Rejection
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectReason('');
                      }}
                      className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-gray-100 rounded-lg p-12 flex items-center justify-center">
            <p className="text-gray-500 text-lg">
              Select a profile to view details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProfileVerification;