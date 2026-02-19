"use client";

import { useState } from "react";
import {
  Dumbbell,
  Salad,
  Quote,
  BookOpen,
  Upload,
  ImagePlus,
  X,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

type PostType = "workout" | "meal" | "quote" | "story";

const postTypes: {
  type: PostType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  borderColor: string;
}[] = [
  {
    type: "workout",
    label: "Workout",
    description: "Share your training session",
    icon: Dumbbell,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/30",
  },
  {
    type: "meal",
    label: "Meal",
    description: "Show your nutrition game",
    icon: Salad,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/30",
  },
  {
    type: "quote",
    label: "Quote",
    description: "Drop some wisdom",
    icon: Quote,
    color: "text-lion-gold",
    bgColor: "bg-lion-gold/10",
    borderColor: "border-lion-gold/30",
  },
  {
    type: "story",
    label: "Story",
    description: "Share your journey",
    icon: BookOpen,
    color: "text-purple-400",
    bgColor: "bg-purple-400/10",
    borderColor: "border-purple-400/30",
  },
];

export default function CreatePage() {
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const [caption, setCaption] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setPreviewUrl(null);
  };

  const isValid = selectedType && caption.trim().length > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-2 rounded-xl text-lion-gray-3 hover:text-lion-white hover:bg-lion-dark-3 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-lion-white">Create Post</h1>
            <p className="text-sm text-lion-gray-3">
              Share your progress with the community
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-lion-gold" />
        </div>
      </div>

      {/* Post Type Selector */}
      <div>
        <label className="text-sm font-semibold text-lion-gray-4 uppercase tracking-wider mb-3 block">
          Post Type
        </label>
        <div className="grid grid-cols-2 gap-3">
          {postTypes.map((pt) => {
            const Icon = pt.icon;
            const isSelected = selectedType === pt.type;

            return (
              <button
                key={pt.type}
                onClick={() => setSelectedType(pt.type)}
                className={`
                  relative p-4 rounded-xl border transition-all duration-300
                  text-left group overflow-hidden
                  ${
                    isSelected
                      ? `${pt.bgColor} ${pt.borderColor} shadow-lg`
                      : "bg-lion-dark-2 border-lion-gold/10 hover:border-lion-gold/20 hover:bg-lion-dark-3"
                  }
                `}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div
                    className={`absolute top-2 right-2 w-2 h-2 rounded-full ${pt.color.replace(
                      "text-",
                      "bg-"
                    )}`}
                  />
                )}

                <Icon
                  className={`w-6 h-6 mb-2 transition-colors duration-200 ${
                    isSelected ? pt.color : "text-lion-gray-3 group-hover:text-lion-gray-4"
                  }`}
                />
                <p
                  className={`text-sm font-semibold ${
                    isSelected ? "text-lion-white" : "text-lion-gray-4"
                  }`}
                >
                  {pt.label}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    isSelected ? "text-lion-gray-4" : "text-lion-gray-2"
                  }`}
                >
                  {pt.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Image Upload Area */}
      <div>
        <label className="text-sm font-semibold text-lion-gray-4 uppercase tracking-wider mb-3 block">
          Photo{" "}
          <span className="text-lion-gray-2 normal-case font-normal">
            (optional)
          </span>
        </label>

        {previewUrl ? (
          <div className="relative rounded-xl overflow-hidden border border-lion-gold/10">
            <img
              src={previewUrl}
              alt="Upload preview"
              className="w-full aspect-[4/3] object-cover"
            />
            <button
              onClick={removeImage}
              className="absolute top-3 right-3 p-2 rounded-full bg-lion-black/70 backdrop-blur-sm text-lion-white hover:bg-lion-black/90 transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative rounded-xl border-2 border-dashed transition-all duration-300
              flex flex-col items-center justify-center py-12 cursor-pointer
              ${
                isDragging
                  ? "border-lion-gold bg-lion-gold/5 scale-[1.01]"
                  : "border-lion-gold/20 hover:border-lion-gold/40 bg-lion-dark-2"
              }
            `}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div
              className={`
                w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
                ${
                  isDragging
                    ? "bg-lion-gold/20 shadow-gold-md"
                    : "bg-lion-dark-3"
                }
              `}
            >
              {isDragging ? (
                <Upload className="w-6 h-6 text-lion-gold animate-pulse" />
              ) : (
                <ImagePlus className="w-6 h-6 text-lion-gray-3" />
              )}
            </div>

            <p className="text-sm font-medium text-lion-gray-4 mb-1">
              {isDragging ? "Drop your image here" : "Drag and drop an image"}
            </p>
            <p className="text-xs text-lion-gray-2">
              or click to browse files
            </p>
            <p className="text-xs text-lion-gray-2 mt-2">
              PNG, JPG, WebP up to 10MB
            </p>
          </div>
        )}
      </div>

      {/* Caption */}
      <div>
        <label className="text-sm font-semibold text-lion-gray-4 uppercase tracking-wider mb-3 block">
          Caption
        </label>
        <div className="relative">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={
              selectedType === "quote"
                ? "Share a powerful quote or insight..."
                : selectedType === "workout"
                ? "Describe your workout, PRs, and what drove you today..."
                : selectedType === "meal"
                ? "What are you fueling your body with today?"
                : "Tell your story. Inspire someone..."
            }
            rows={5}
            maxLength={2000}
            className="input-dark resize-none text-sm leading-relaxed"
          />
          <div className="absolute bottom-3 right-3 text-xs text-lion-gray-2">
            {caption.length}/2000
          </div>
        </div>
      </div>

      {/* Tags hint */}
      <div className="flex items-center gap-2 text-xs text-lion-gray-2">
        <span className="text-lion-gold">#</span>
        Use hashtags in your caption to help others discover your post
      </div>

      {/* Submit */}
      <div className="flex gap-3 pt-2">
        <Link
          href="/"
          className="btn-ghost-gold flex-1 text-center text-sm"
        >
          Cancel
        </Link>
        <button
          disabled={!isValid}
          className={`
            flex-1 py-3 rounded-xl text-sm font-semibold
            transition-all duration-300
            ${
              isValid
                ? "btn-gold"
                : "bg-lion-dark-3 text-lion-gray-2 cursor-not-allowed"
            }
          `}
        >
          Share Your Gains
        </button>
      </div>
    </div>
  );
}
