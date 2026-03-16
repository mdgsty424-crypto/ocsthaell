import React, { useState } from 'react';
import { UploadCloud, X, Link as LinkIcon } from 'lucide-react';

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = 'Image' }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'upload' | 'url'>('url');

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
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

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const responseData = await res.json();
      
      if (res.ok) {
        onChange(responseData.secure_url);
      } else {
        throw new Error(responseData.error?.message || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Cloudinary upload error:', err);
      setError('Upload failed. Please check your Cloudinary configuration or use the URL mode.');
    } finally {
      setUploading(false);
    }
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
        <div className="relative border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:border-brand-blue transition-colors bg-gray-50">
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            {uploading ? (
              <div className="w-8 h-8 border-2 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin"></div>
            ) : (
              <>
                <UploadCloud className="w-10 h-10 text-gray-400" />
                <p className="text-sm text-gray-500">Click or drag image to upload to Cloudinary</p>
              </>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

      {value && (
        <div className="mt-4 relative inline-block">
          <img src={value} alt="Preview" className="h-32 rounded-lg object-cover border border-gray-200 shadow-sm" referrerPolicy="no-referrer" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
