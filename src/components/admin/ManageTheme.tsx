import React, { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Save,
  Palette,
  Type,
  LayoutTemplate,
  Image as ImageIcon,
  Upload,
  X,
  Layers,
  Sparkles,
} from "lucide-react";
import { db } from "../../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Cropper from "react-easy-crop";

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("No 2d context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return canvas.toDataURL("image/png");
}

export default function ManageTheme() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [theme, setTheme] = useState({
    primaryColor: "#0047ff",
    secondaryColor: "#00ffcc",
    backgroundColor: "#05070a",
    fontFamily: "Inter, sans-serif",
    headingFont: "Space Grotesk, sans-serif",
    logoUrl: "",
    logoZoom: 1,
    logoX: 0,
    logoY: 0,
    backgroundDesign: "gradient-blobs", // 'none', 'gradient-blobs', 'grid', 'particles'
    buttonAnimation: "glow", // 'none', 'glow', 'pulse', 'bounce'
  });

  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    const fetchTheme = async () => {
      try {
        const docRef = doc(db, "settings", "theme");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as any;
          setTheme((prev) => ({ ...prev, ...data }));
          if (data.logoUrl) {
            setImageSrc(data.logoUrl);
            setZoom(data.logoZoom || 1);
            setCrop({ x: data.logoX || 0, y: data.logoY || 0 });
          }
        }
      } catch (error) {
        console.error("Error fetching theme:", error);
      }
    };
    fetchTheme();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setTheme((prev) => ({ ...prev, [name]: value }));
  };

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    [],
  );

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImageSrc(reader.result as string),
      );
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      let finalLogoUrl = theme.logoUrl;
      if (imageSrc && croppedAreaPixels) {
        try {
          finalLogoUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
        } catch (e) {
          console.error("Error cropping image", e);
        }
      } else if (imageSrc && !croppedAreaPixels) {
        finalLogoUrl = imageSrc;
      } else if (!imageSrc) {
        finalLogoUrl = "";
      }

      const themeData = {
        ...theme,
        logoUrl: finalLogoUrl,
        logoZoom: zoom,
        logoX: crop.x,
        logoY: crop.y,
      };
      await setDoc(doc(db, "settings", "theme"), themeData);
      setMessage({
        type: "success",
        text: "Theme settings saved successfully!",
      });
    } catch (error) {
      console.error("Error saving theme:", error);
      setMessage({ type: "error", text: "Failed to save theme settings." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display font-bold text-brand-blue flex items-center">
          <Palette className="w-8 h-8 mr-3 text-brand-blue" />
          Design & Theme Management
        </h2>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center px-6 py-3 bg-gradient-brand text-white font-bold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5 mr-2" />
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message.text && (
        <div
          className={`p-4 rounded-xl ${message.type === "success" ? "bg-green-50 text-green-600 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Logo Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <ImageIcon className="w-5 h-5 mr-2 text-gray-400" /> Official Logo
          </h3>
          <div className="space-y-6">
            {!imageSrc ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center hover:border-brand-blue/50 transition-colors bg-gray-50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="w-12 h-12 text-gray-400 mb-4" />
                  <span className="text-gray-900 font-medium mb-2">
                    Click to upload logo
                  </span>
                  <span className="text-sm text-gray-500">
                    PNG, JPG, SVG up to 5MB
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative h-64 bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                  <Cropper
                    image={imageSrc}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                  />
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Zoom:</span>
                  <input
                    type="range"
                    value={zoom}
                    min={1}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1"
                  />
                  <button
                    onClick={() => {
                      setImageSrc(null);
                      setZoom(1);
                      setCrop({ x: 0, y: 0 });
                    }}
                    className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Palette className="w-5 h-5 mr-2 text-gray-400" /> Colors &
            Gradients
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Primary Color
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  name="primaryColor"
                  value={theme.primaryColor}
                  onChange={handleChange}
                  className="w-12 h-12 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  name="primaryColor"
                  value={theme.primaryColor}
                  onChange={handleChange}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Secondary Color (Gradient End)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  name="secondaryColor"
                  value={theme.secondaryColor}
                  onChange={handleChange}
                  className="w-12 h-12 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  name="secondaryColor"
                  value={theme.secondaryColor}
                  onChange={handleChange}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Background Color
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  name="backgroundColor"
                  value={theme.backgroundColor}
                  onChange={handleChange}
                  className="w-12 h-12 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  name="backgroundColor"
                  value={theme.backgroundColor}
                  onChange={handleChange}
                  className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-gray-900 focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-gray-100 shadow-sm rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Type className="w-5 h-5 mr-2 text-gray-400" /> Typography
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Body Font Family
              </label>
              <select
                name="fontFamily"
                value={theme.fontFamily}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue"
              >
                <option value="Inter, sans-serif">Inter</option>
                <option value="Roboto, sans-serif">Roboto</option>
                <option value="Open Sans, sans-serif">Open Sans</option>
                <option value="system-ui, sans-serif">System Default</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Heading Font Family
              </label>
              <select
                name="headingFont"
                value={theme.headingFont}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue"
              >
                <option value="Space Grotesk, sans-serif">Space Grotesk</option>
                <option value="Montserrat, sans-serif">Montserrat</option>
                <option value="Poppins, sans-serif">Poppins</option>
                <option value="Playfair Display, serif">
                  Playfair Display
                </option>
              </select>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="md:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-gray-400" /> Effects &
            Animations
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Background Design
              </label>
              <select
                name="backgroundDesign"
                value={theme.backgroundDesign}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue"
              >
                <option value="none">Solid Color</option>
                <option value="gradient-blobs">Gradient Blobs</option>
                <option value="grid">Cyber Grid</option>
                <option value="particles">Particles (Animated)</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Choose the global background style for the website.
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Button Animation Style
              </label>
              <select
                name="buttonAnimation"
                value={theme.buttonAnimation}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 focus:outline-none focus:border-brand-blue"
              >
                <option value="none">None</option>
                <option value="glow">Neon Glow</option>
                <option value="pulse">Pulse</option>
                <option value="bounce">Bounce on Hover</option>
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Select the default animation for primary buttons.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-2 bg-white border border-gray-100 shadow-sm rounded-2xl p-6"
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <LayoutTemplate className="w-5 h-5 mr-2 text-gray-400" /> Live
            Preview
          </h3>
          <div
            className="p-8 rounded-xl border border-gray-200"
            style={{
              backgroundColor: theme.backgroundColor,
              fontFamily: theme.fontFamily,
            }}
          >
            <h1
              className="text-4xl font-bold mb-4"
              style={{ fontFamily: theme.headingFont, color: "white" }}
            >
              The Future of Digital Ecosystems
            </h1>
            <p className="text-gray-300 mb-6 max-w-2xl text-lg">
              Experience a unified platform where communication, social
              networking, and online income seamlessly integrate.
            </p>
            <button
              className="px-8 py-3 rounded-full font-bold text-white border-0"
              style={{
                background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})`,
              }}
            >
              Get Started Now
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
