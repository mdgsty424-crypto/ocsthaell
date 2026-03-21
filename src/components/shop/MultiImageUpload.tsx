import React, { useState } from 'react';
import { UploadCloud, X } from 'lucide-react';

interface MultiImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
}

export default function MultiImageUpload({ images, onChange }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    const newImages = [...images];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', 'ml_default'); // Assuming preset is set up

      try {
        const res = await fetch('https://api.cloudinary.com/v1_1/dxiolmmdv/image/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        newImages.push(data.secure_url);
      } catch (err) {
        console.error('Upload failed', err);
      }
    }
    onChange(newImages);
    setUploading(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {images.map((img, index) => (
          <div key={index} className="relative aspect-square">
            <img src={img} alt="Product" className="w-full h-full object-cover rounded-lg" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, i) => i !== index))}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <label className="border-2 border-dashed border-gray-700 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-brand-blue">
          <UploadCloud className="text-gray-500" />
          <span className="text-xs text-gray-500">Upload</span>
          <input type="file" multiple accept="image/*" onChange={handleUpload} className="hidden" />
        </label>
      </div>
      {uploading && <p className="text-sm text-brand-blue">Uploading...</p>}
    </div>
  );
}
