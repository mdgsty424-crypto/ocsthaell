import React, { useState } from 'react';
import { UploadCloud, X, File } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase';

interface FileUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function FileUpload({ value, onChange, label = 'File' }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!storage) {
      setError('Firebase Storage is not initialized.');
      return;
    }

    // Check file size limit (500MB)
    const maxSizeMB = 500;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(`File is too large. Maximum size for APKs is ${maxSizeMB}MB.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    const storageRef = ref(storage, `apks/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(progress));
      },
      (error) => {
        setError(error.message);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        onChange(downloadURL);
        setUploading(false);
      }
    );
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
      
      <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-brand-blue transition-colors bg-gray-50 overflow-hidden">
        {!uploading && (
          <input
            type="file"
            accept=".apk"
            onChange={handleUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        )}
        <div className="flex flex-col items-center justify-center space-y-3 relative z-10">
          {uploading ? (
            <div className="w-full max-w-xs">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 overflow-hidden">
                <div className="bg-brand-blue h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          ) : (
            <>
              <UploadCloud className="w-10 h-10 text-gray-400" />
              <p className="text-sm text-gray-500">Click or drag APK file to upload</p>
            </>
          )}
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {value && !uploading && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <File className="w-5 h-5 text-brand-blue" />
            <span className="text-sm text-gray-700 truncate max-w-[200px]">{value.split('/').pop()}</span>
          </div>
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
