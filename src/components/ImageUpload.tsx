import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploadProps {
  onImagesChange: (files: File[]) => void;
  maxFiles?: number;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ onImagesChange, maxFiles = 5 }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onImagesChange(acceptedFiles.slice(0, maxFiles));
  }, [onImagesChange, maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: maxFiles
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400'
      }`}
    >
      <input {...getInputProps()} />
      <div className="text-gray-600">
        <div className="text-4xl mb-2">📷</div>
        <p className="font-semibold">
          {isDragActive ? 'Drop images here...' : 'Upload Property Images'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Drag & drop images here or click to select
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Up to {maxFiles} images • JPG, PNG, GIF • Max 5MB each
        </p>
      </div>
    </div>
  );
};

export default ImageUpload;