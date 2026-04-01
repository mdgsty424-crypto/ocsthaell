import React, { useState, useRef } from 'react';
import { UploadCloud, X, Link as LinkIcon, FileVideo, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  accept?: 'image/*' | 'video/*' | 'image/*,video/*';
}

export default function ImageUpload({ value, onChange, label = 'Media', accept = 'image/*' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'upload' | 'url'>('url');
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size limits
    const isVideo = file.type.startsWith('video/');
    const maxSizeMB = isVideo ? 300 : 20;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      setError(`File is too large. Maximum size for ${isVideo ? 'videos is 300MB' : 'photos is 20MB'}.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      const cloudName = 'dxiolmmdv';
      const apiKey = '842696479721211';
      const apiSecret = 'oWiNS3JZJio5VmsVD6w4tiD1qzM';
      
      const timestamp = Math.round((new Date()).getTime() / 1000);
      const signatureString = `timestamp=${timestamp}${apiSecret}`;
      
      // Generate SHA-1 signature
      const encoder = new TextEncoder();
      const data = encoder.encode(signatureString);
      const hashBuffer = await crypto.subtle.digest('SHA-1', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('api_key', apiKey);
      formData.append('timestamp', timestamp.toString());
      formData.append('signature', signature);

      const resourceType = isVideo ? 'video' : 'image';
      const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const responseData = JSON.parse(xhr.responseText);
          onChange(responseData.secure_url);
          setUploading(false);
        } else {
          const responseData = JSON.parse(xhr.responseText);
          setError(responseData.error?.message || 'Upload failed');
          setUploading(false);
        }
      });

      xhr.addEventListener('error', () => {
        setError('Upload failed. Please check your network connection.');
        setUploading(false);
      });

      xhr.addEventListener('abort', () => {
        setError('Upload cancelled.');
        setUploading(false);
      });

      xhr.open('POST', uploadUrl, true);
      xhr.send(formData);

    } catch (err: any) {
      console.error('Cloudinary upload error details:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
      }
      setError('Upload failed. Please check your Cloudinary configuration or use the URL mode.');
      setUploading(false);
    }
  };

  const cancelUpload = () => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  };

  const isVideoUrl = (url: string) => {
    return url.match(/\.(mp4|webm|ogg)$/i) || url.includes('/video/upload/');
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-gray-600 mb-2">{label}</label>
      
      <div className="flex space-x-4 mb-4">
        <button
          type="button"
          onClick={() => setMode('url')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'url' ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/50' : 'bg-gray-50 text-gray-500 hover:text-gray-700 border border-gray-200'}`}
        >
          <LinkIcon className="w-4 h-4 inline-block mr-2" /> URL
        </button>
        <button
          type="button"
          onClick={() => setMode('upload')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode === 'upload' ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/50' : 'bg-gray-50 text-gray-500 hover:text-gray-700 border border-gray-200'}`}
        >
          <UploadCloud className="w-4 h-4 inline-block mr-2" /> Upload
        </button>
      </div>

      {mode === 'url' ? (
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://res.cloudinary.com/..."
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue transition-colors"
        />
      ) : (
        <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-brand-blue transition-colors bg-gray-50 overflow-hidden">
          {!uploading && (
            <input
              type="file"
              accept={accept}
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
                <button type="button" onClick={cancelUpload} className="text-xs text-red-500 hover:text-red-700">
                  Cancel Upload
                </button>
              </div>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-gray-400" />
                <p className="text-sm text-gray-500">Click or drag media to upload to Cloudinary</p>
                <p className="text-xs text-gray-400">Max size: Photos 20MB, Videos 300MB</p>
              </>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {value && !uploading && (
        <div className="mt-4 relative inline-block max-w-full">
          {isVideoUrl(value) ? (
            <video src={value} controls className="h-32 rounded-lg object-cover border border-gray-200 shadow-sm" />
          ) : (
            <img src={value} alt="Preview" className="h-32 rounded-lg object-cover border border-gray-200 shadow-sm" referrerPolicy="no-referrer" />
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
