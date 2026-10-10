'use client';

import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, X, AlertCircle } from 'lucide-react';
import { formatFileSize } from '@/lib/utils';

interface ImageUploadProps {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  error?: string | null;
  disabled?: boolean;
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  selectedFile,
  onFileSelect,
  error,
  disabled = false,
  className = ''
}) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB limit
    disabled,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        onFileSelect(null);
        return;
      }
      
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
  });

  const removeFile = () => {
    onFileSelect(null);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
            isDragActive 
              ? 'border-blue-400 bg-blue-50' 
              : disabled
              ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600 mb-1">
            {isDragActive ? 'Drop image here' : 'Add image (optional)'}
          </p>
          <p className="text-xs text-gray-500">JPG, PNG, GIF • Max 10MB</p>
        </div>
      ) : (
        <div className="border border-blue-200 bg-blue-50 rounded-lg p-3">
          <div className="flex items-center">
            <ImageIcon className="h-5 w-5 text-blue-600 mr-2" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-blue-900 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-blue-700">
                {formatFileSize(selectedFile.size)}
              </p>
            </div>
            <button
              type="button"
              onClick={removeFile}
              className="text-blue-600 hover:text-blue-800 ml-2"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <p className="text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
