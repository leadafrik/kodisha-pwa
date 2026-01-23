import React, { useState, useRef } from 'react';
import { uploadProfilePicture, deleteProfilePicture } from '../services/userService';

interface ProfilePictureUploadProps {
  currentPicture?: string;
  onUploadSuccess: (url: string) => void;
  onDeleteSuccess?: () => void;
}

const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentPicture,
  onUploadSuccess,
  onDeleteSuccess,
}) => {
  const [preview, setPreview] = useState<string | null>(currentPicture || null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const result = await uploadProfilePicture(file);
      onUploadSuccess(result.profilePicture);
      setSuccess('Profile picture updated successfully!');

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError((err as Error).message);
      setPreview(currentPicture || null);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    try {
      setDeleting(true);
      setError(null);
      setSuccess(null);

      await deleteProfilePicture();
      setPreview(null);
      setSuccess('Profile picture deleted successfully!');
      onDeleteSuccess?.();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 mb-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Profile Picture</h2>

      {/* Current/Preview Picture */}
      <div className="mb-4 flex justify-center">
        {preview ? (
          <img
            src={preview}
            alt="Profile preview"
            className="w-32 h-32 rounded-full object-cover border-4 border-slate-200"
          />
        ) : (
          <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center border-4 border-slate-200">
            <span className="text-slate-400">No picture</span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-4">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl mb-4">
          {success}
        </div>
      )}

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
        className="hidden"
      />

      {/* Upload Button */}
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        className="w-full px-4 py-2 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition mb-2"
      >
        {uploading ? 'Uploading...' : 'Upload Picture'}
      </button>

      {/* Delete Button */}
      {preview && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="w-full px-4 py-2 bg-red-600 text-white rounded-2xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
        >
          {deleting ? 'Deleting...' : 'Delete Picture'}
        </button>
      )}

      <p className="text-sm text-slate-500 mt-4">
        Supported formats: JPG, PNG, GIF. Maximum file size: 5MB.
      </p>
    </div>
  );
};

export default ProfilePictureUpload;
