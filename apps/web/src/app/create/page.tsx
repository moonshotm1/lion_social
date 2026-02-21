"use client";

import { useState, useCallback } from "react";
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
  Plus,
  Minus,
  Trash2,
  Clock,
  Tag,
  Eye,
  Flame,
  Beef,
  Wheat,
  Droplets,
} from "lucide-react";
import Link from "next/link";
import { useCreatePost } from "@/hooks/use-create-post";

// ─── Types ────────────────────────────────────────────────────────────────────

type PostType = "workout" | "meal" | "quote" | "story";
type WeightUnit = "lbs" | "kg";
type MealType = "breakfast" | "lunch" | "dinner" | "snack";

interface WorkoutSet {
  reps: number;
  weight: number;
  unit: WeightUnit;
}

interface Exercise {
  name: string;
  sets: WorkoutSet[];
}

interface Ingredient {
  name: string;
  amount: string;
}

// ─── Post Type Config ─────────────────────────────────────────────────────────

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

const mealTypes: { value: MealType; label: string }[] = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

// ─── Helper: Image Upload Area ────────────────────────────────────────────────

function ImageUploadArea({
  previewUrl,
  onFileSelect,
  onRemove,
  label = "Photo",
  optional = true,
  aspectClass = "aspect-[4/3]",
}: {
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  label?: string;
  optional?: boolean;
  aspectClass?: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

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
    if (file && (file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      onFileSelect(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div>
      <label className="text-sm font-semibold text-lion-gray-4 uppercase tracking-wider mb-3 block">
        {label}{" "}
        {optional && (
          <span className="text-lion-gray-2 normal-case font-normal">(optional)</span>
        )}
      </label>

      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-lion-gold/10">
          <img
            src={previewUrl}
            alt="Upload preview"
            className={`w-full ${aspectClass} object-cover`}
          />
          <button
            type="button"
            onClick={onRemove}
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
            accept="image/*,video/*"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className={`
              w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
              ${isDragging ? "bg-lion-gold/20 shadow-gold-md" : "bg-lion-dark-3"}
            `}
          >
            {isDragging ? (
              <Upload className="w-6 h-6 text-lion-gold animate-pulse" />
            ) : (
              <ImagePlus className="w-6 h-6 text-lion-gray-3" />
            )}
          </div>
          <p className="text-sm font-medium text-lion-gray-4 mb-1">
            {isDragging ? "Drop your file here" : "Drag and drop an image or video"}
          </p>
          <p className="text-xs text-lion-gray-2">or click to browse files</p>
          <p className="text-xs text-lion-gray-2 mt-2">PNG, JPG, WebP, MP4 up to 10MB</p>
        </div>
      )}
    </div>
  );
}

// ─── Helper: Small Image Upload (for Before/After) ───────────────────────────

function SmallImageUpload({
  previewUrl,
  onFileSelect,
  onRemove,
  label,
}: {
  previewUrl: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  label: string;
}) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onFileSelect(file);
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  return (
    <div className="flex-1">
      <label className="text-xs font-semibold text-lion-gray-4 uppercase tracking-wider mb-2 block">
        {label}
      </label>
      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-lion-gold/10">
          <img
            src={previewUrl}
            alt={label}
            className="w-full aspect-[3/4] object-cover"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-lion-black/70 backdrop-blur-sm text-lion-white hover:bg-lion-black/90 transition-all duration-200"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative rounded-xl border-2 border-dashed transition-all duration-300
            flex flex-col items-center justify-center aspect-[3/4] cursor-pointer
            ${
              isDragging
                ? "border-lion-gold bg-lion-gold/5"
                : "border-lion-gold/20 hover:border-lion-gold/40 bg-lion-dark-2"
            }
          `}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <ImagePlus className="w-5 h-5 text-lion-gray-3 mb-2" />
          <p className="text-xs text-lion-gray-3">{label}</p>
        </div>
      )}
    </div>
  );
}

// ─── Helper: Section Card ─────────────────────────────────────────────────────

function SectionCard({
  title,
  children,
  required = false,
}: {
  title: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="rounded-xl border border-lion-gold/10 bg-lion-dark-2 p-5 space-y-4 transition-all duration-300">
      <h3 className="text-sm font-semibold text-lion-gold uppercase tracking-wider flex items-center gap-2">
        {title}
        {required && <span className="text-[10px] text-red-400 normal-case font-normal">*required</span>}
      </h3>
      {children}
    </div>
  );
}

// ─── Utility: read file as data URL ───────────────────────────────────────────

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(file);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  WORKOUT FORM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function WorkoutForm({
  title,
  setTitle,
  exercises,
  setExercises,
  duration,
  setDuration,
  caption,
  setCaption,
  imageUrl,
  onImageSelect,
  onImageRemove,
}: {
  title: string;
  setTitle: (v: string) => void;
  exercises: Exercise[];
  setExercises: (v: Exercise[]) => void;
  duration: string;
  setDuration: (v: string) => void;
  caption: string;
  setCaption: (v: string) => void;
  imageUrl: string | null;
  onImageSelect: (f: File) => void;
  onImageRemove: () => void;
}) {
  const addExercise = () => {
    setExercises([
      ...exercises,
      { name: "", sets: [{ reps: 0, weight: 0, unit: "lbs" }] },
    ]);
  };

  const removeExercise = (idx: number) => {
    setExercises(exercises.filter((_, i) => i !== idx));
  };

  const updateExerciseName = (idx: number, name: string) => {
    const updated = [...exercises];
    updated[idx] = { ...updated[idx], name };
    setExercises(updated);
  };

  const addSet = (exIdx: number) => {
    const updated = [...exercises];
    const lastSet = updated[exIdx].sets[updated[exIdx].sets.length - 1];
    updated[exIdx] = {
      ...updated[exIdx],
      sets: [
        ...updated[exIdx].sets,
        { reps: lastSet?.reps || 0, weight: lastSet?.weight || 0, unit: lastSet?.unit || "lbs" },
      ],
    };
    setExercises(updated);
  };

  const removeSet = (exIdx: number, setIdx: number) => {
    const updated = [...exercises];
    updated[exIdx] = {
      ...updated[exIdx],
      sets: updated[exIdx].sets.filter((_, i) => i !== setIdx),
    };
    setExercises(updated);
  };

  const updateSet = (exIdx: number, setIdx: number, field: keyof WorkoutSet, value: number | string) => {
    const updated = [...exercises];
    const sets = [...updated[exIdx].sets];
    sets[setIdx] = { ...sets[setIdx], [field]: value };
    updated[exIdx] = { ...updated[exIdx], sets };
    setExercises(updated);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Title */}
      <SectionCard title="Workout Details" required>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='e.g. "Leg Day", "Push Day", "5K Run"'
          className="input-dark text-sm"
        />

        {/* Duration */}
        <div>
          <label className="text-xs text-lion-gray-3 mb-1.5 block flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Duration (minutes)
          </label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="e.g. 60"
            min={0}
            className="input-dark text-sm w-32"
          />
        </div>
      </SectionCard>

      {/* Exercises */}
      <SectionCard title="Exercises">
        <div className="space-y-4">
          {exercises.map((exercise, exIdx) => (
            <div
              key={exIdx}
              className="rounded-lg border border-lion-gold/8 bg-lion-dark-3/50 p-4 space-y-3 transition-all duration-200"
            >
              {/* Exercise header */}
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-orange-400/15 flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-orange-400">{exIdx + 1}</span>
                </div>
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => updateExerciseName(exIdx, e.target.value)}
                  placeholder="Exercise name (e.g. Barbell Squat)"
                  className="input-dark text-sm flex-1 !py-2"
                />
                {exercises.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeExercise(exIdx)}
                    className="p-2 rounded-lg text-lion-gray-3 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                    title="Remove exercise"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Sets table header */}
              <div className="grid grid-cols-[40px_1fr_1fr_72px_36px] gap-2 px-1">
                <span className="text-[10px] text-lion-gray-2 uppercase tracking-wider font-semibold">Set</span>
                <span className="text-[10px] text-lion-gray-2 uppercase tracking-wider font-semibold">Reps</span>
                <span className="text-[10px] text-lion-gray-2 uppercase tracking-wider font-semibold">Weight</span>
                <span className="text-[10px] text-lion-gray-2 uppercase tracking-wider font-semibold">Unit</span>
                <span />
              </div>

              {/* Sets */}
              {exercise.sets.map((set, setIdx) => (
                <div
                  key={setIdx}
                  className="grid grid-cols-[40px_1fr_1fr_72px_36px] gap-2 items-center"
                >
                  {/* Set number */}
                  <div className="w-8 h-8 rounded-md bg-lion-dark-2 flex items-center justify-center">
                    <span className="text-xs font-semibold text-lion-gray-3">{setIdx + 1}</span>
                  </div>

                  {/* Reps */}
                  <input
                    type="number"
                    value={set.reps || ""}
                    onChange={(e) => updateSet(exIdx, setIdx, "reps", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    min={0}
                    className="input-dark text-sm !py-2 text-center"
                  />

                  {/* Weight */}
                  <input
                    type="number"
                    value={set.weight || ""}
                    onChange={(e) => updateSet(exIdx, setIdx, "weight", parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    min={0}
                    className="input-dark text-sm !py-2 text-center"
                  />

                  {/* Unit toggle */}
                  <button
                    type="button"
                    onClick={() =>
                      updateSet(exIdx, setIdx, "unit", set.unit === "lbs" ? "kg" : "lbs")
                    }
                    className="h-8 rounded-md bg-lion-dark-2 border border-lion-gold/10 text-xs font-semibold text-lion-gray-4 hover:border-lion-gold/30 hover:text-lion-gold transition-all duration-200"
                  >
                    {set.unit}
                  </button>

                  {/* Remove set */}
                  {exercise.sets.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeSet(exIdx, setIdx)}
                      className="w-8 h-8 rounded-md flex items-center justify-center text-lion-gray-2 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              ))}

              {/* Add set */}
              <button
                type="button"
                onClick={() => addSet(exIdx)}
                className="flex items-center gap-1.5 text-xs text-lion-gold/70 hover:text-lion-gold transition-colors duration-200 pt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Set
              </button>
            </div>
          ))}
        </div>

        {/* Add exercise */}
        <button
          type="button"
          onClick={addExercise}
          className="w-full py-3 rounded-xl border-2 border-dashed border-lion-gold/15 text-sm font-medium text-lion-gold/60 hover:border-lion-gold/30 hover:text-lion-gold hover:bg-lion-gold/5 transition-all duration-300 flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Exercise
        </button>
      </SectionCard>

      {/* Notes / Caption */}
      <SectionCard title="Notes / Caption">
        <div className="relative">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe your workout, PRs, and what drove you today..."
            rows={4}
            maxLength={2000}
            className="input-dark resize-none text-sm leading-relaxed"
          />
          <div className="absolute bottom-3 right-3 text-xs text-lion-gray-2">
            {caption.length}/2000
          </div>
        </div>
      </SectionCard>

      {/* Image upload */}
      <ImageUploadArea
        previewUrl={imageUrl}
        onFileSelect={onImageSelect}
        onRemove={onImageRemove}
        label="Photo / Video"
      />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MEAL FORM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MealForm({
  mealName,
  setMealName,
  mealType,
  setMealType,
  ingredients,
  setIngredients,
  calories,
  setCalories,
  protein,
  setProtein,
  carbs,
  setCarbs,
  fat,
  setFat,
  caption,
  setCaption,
  imageUrl,
  onImageSelect,
  onImageRemove,
}: {
  mealName: string;
  setMealName: (v: string) => void;
  mealType: MealType | null;
  setMealType: (v: MealType) => void;
  ingredients: Ingredient[];
  setIngredients: (v: Ingredient[]) => void;
  calories: string;
  setCalories: (v: string) => void;
  protein: string;
  setProtein: (v: string) => void;
  carbs: string;
  setCarbs: (v: string) => void;
  fat: string;
  setFat: (v: string) => void;
  caption: string;
  setCaption: (v: string) => void;
  imageUrl: string | null;
  onImageSelect: (f: File) => void;
  onImageRemove: () => void;
}) {
  const addIngredient = () => {
    setIngredients([...ingredients, { name: "", amount: "" }]);
  };

  const removeIngredient = (idx: number) => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  const updateIngredient = (idx: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[idx] = { ...updated[idx], [field]: value };
    setIngredients(updated);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Meal Details */}
      <SectionCard title="Meal Details" required>
        <input
          type="text"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          placeholder='e.g. "Post-Workout Shake", "Grilled Chicken Bowl"'
          className="input-dark text-sm"
        />

        {/* Meal type pills */}
        <div>
          <label className="text-xs text-lion-gray-3 mb-2 block">Meal Type</label>
          <div className="flex flex-wrap gap-2">
            {mealTypes.map((mt) => (
              <button
                key={mt.value}
                type="button"
                onClick={() => setMealType(mt.value)}
                className={`
                  px-4 py-2 rounded-full text-xs font-semibold transition-all duration-200 border
                  ${
                    mealType === mt.value
                      ? "bg-green-400/15 border-green-400/40 text-green-400 shadow-sm"
                      : "bg-lion-dark-3 border-lion-gold/10 text-lion-gray-3 hover:border-lion-gold/25 hover:text-lion-gray-4"
                  }
                `}
              >
                {mt.label}
              </button>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Ingredients */}
      <SectionCard title="Ingredients">
        <div className="space-y-2.5">
          {ingredients.map((ingredient, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={ingredient.name}
                onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                placeholder="Ingredient name"
                className="input-dark text-sm !py-2 flex-1"
              />
              <input
                type="text"
                value={ingredient.amount}
                onChange={(e) => updateIngredient(idx, "amount", e.target.value)}
                placeholder="Amount (e.g. 200g)"
                className="input-dark text-sm !py-2 w-36"
              />
              {ingredients.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeIngredient(idx)}
                  className="p-2 rounded-lg text-lion-gray-3 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200 shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addIngredient}
          className="flex items-center gap-1.5 text-xs text-lion-gold/70 hover:text-lion-gold transition-colors duration-200"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Ingredient
        </button>
      </SectionCard>

      {/* Macros */}
      <SectionCard title="Macros">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-lion-gray-3 mb-1.5 flex items-center gap-1.5 block">
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              Calories
            </label>
            <input
              type="number"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="0"
              min={0}
              className="input-dark text-sm !py-2"
            />
          </div>
          <div>
            <label className="text-xs text-lion-gray-3 mb-1.5 flex items-center gap-1.5 block">
              <Beef className="w-3.5 h-3.5 text-red-400" />
              Protein (g)
            </label>
            <input
              type="number"
              value={protein}
              onChange={(e) => setProtein(e.target.value)}
              placeholder="0"
              min={0}
              className="input-dark text-sm !py-2"
            />
          </div>
          <div>
            <label className="text-xs text-lion-gray-3 mb-1.5 flex items-center gap-1.5 block">
              <Wheat className="w-3.5 h-3.5 text-yellow-400" />
              Carbs (g)
            </label>
            <input
              type="number"
              value={carbs}
              onChange={(e) => setCarbs(e.target.value)}
              placeholder="0"
              min={0}
              className="input-dark text-sm !py-2"
            />
          </div>
          <div>
            <label className="text-xs text-lion-gray-3 mb-1.5 flex items-center gap-1.5 block">
              <Droplets className="w-3.5 h-3.5 text-blue-400" />
              Fat (g)
            </label>
            <input
              type="number"
              value={fat}
              onChange={(e) => setFat(e.target.value)}
              placeholder="0"
              min={0}
              className="input-dark text-sm !py-2"
            />
          </div>
        </div>
      </SectionCard>

      {/* Recipe / Notes */}
      <SectionCard title="Recipe / Notes">
        <div className="relative">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share the recipe, prep tips, or your thoughts on this meal..."
            rows={4}
            maxLength={2000}
            className="input-dark resize-none text-sm leading-relaxed"
          />
          <div className="absolute bottom-3 right-3 text-xs text-lion-gray-2">
            {caption.length}/2000
          </div>
        </div>
      </SectionCard>

      {/* Image upload */}
      <ImageUploadArea
        previewUrl={imageUrl}
        onFileSelect={onImageSelect}
        onRemove={onImageRemove}
        label="Photo"
      />
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  QUOTE FORM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function QuoteForm({
  quoteText,
  setQuoteText,
  quoteAuthor,
  setQuoteAuthor,
  caption,
  setCaption,
}: {
  quoteText: string;
  setQuoteText: (v: string) => void;
  quoteAuthor: string;
  setQuoteAuthor: (v: string) => void;
  caption: string;
  setCaption: (v: string) => void;
}) {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Quote input */}
      <SectionCard title="The Quote" required>
        <textarea
          value={quoteText}
          onChange={(e) => setQuoteText(e.target.value)}
          placeholder="Enter a powerful quote..."
          rows={4}
          maxLength={500}
          className="input-dark resize-none text-sm leading-relaxed"
        />
        <div className="flex justify-between items-center">
          <label className="text-xs text-lion-gray-3">Author / Source</label>
          <span className="text-xs text-lion-gray-2">{quoteText.length}/500</span>
        </div>
        <input
          type="text"
          value={quoteAuthor}
          onChange={(e) => setQuoteAuthor(e.target.value)}
          placeholder='e.g. "Marcus Aurelius", "Me"'
          className="input-dark text-sm"
        />
      </SectionCard>

      {/* Live Preview */}
      <SectionCard title="Preview">
        <div className="flex items-center gap-1.5 mb-2 text-xs text-lion-gray-3">
          <Eye className="w-3.5 h-3.5" />
          Live preview of your quote card
        </div>
        <div className="rounded-xl overflow-hidden border border-lion-gold/15 shadow-gold-sm">
          <div className="relative bg-gradient-to-br from-lion-dark-1 via-lion-dark-2 to-lion-black p-8 min-h-[220px] flex flex-col items-center justify-center text-center">
            {/* Decorative elements */}
            <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-lion-gold/25 rounded-tl-lg" />
            <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-lion-gold/25 rounded-br-lg" />

            {/* Large quote mark */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 text-6xl font-serif text-lion-gold/10 leading-none select-none">
              &ldquo;
            </div>

            {/* Quote text */}
            <p className="text-lion-white text-lg italic leading-relaxed max-w-md relative z-10 font-light px-4">
              {quoteText || (
                <span className="text-lion-gray-2">Your quote will appear here...</span>
              )}
            </p>

            {/* Author */}
            {(quoteAuthor || quoteText) && (
              <div className="mt-5 flex items-center gap-3 relative z-10">
                <div className="w-8 h-px bg-lion-gold/40" />
                <span className="text-sm text-lion-gold font-medium tracking-wide">
                  {quoteAuthor || "Unknown"}
                </span>
                <div className="w-8 h-px bg-lion-gold/40" />
              </div>
            )}

            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-lion-gold/3 to-transparent pointer-events-none" />
          </div>
        </div>
      </SectionCard>

      {/* Caption / Thoughts */}
      <SectionCard title="Your Thoughts">
        <div className="relative">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Share your thoughts on this quote, how it applies to your journey..."
            rows={4}
            maxLength={2000}
            className="input-dark resize-none text-sm leading-relaxed"
          />
          <div className="absolute bottom-3 right-3 text-xs text-lion-gray-2">
            {caption.length}/2000
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  STORY FORM
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function StoryForm({
  storyTitle,
  setStoryTitle,
  storyContent,
  setStoryContent,
  tags,
  setTags,
  caption,
  setCaption,
  beforeImageUrl,
  afterImageUrl,
  onBeforeImageSelect,
  onAfterImageSelect,
  onBeforeImageRemove,
  onAfterImageRemove,
}: {
  storyTitle: string;
  setStoryTitle: (v: string) => void;
  storyContent: string;
  setStoryContent: (v: string) => void;
  tags: string[];
  setTags: (v: string[]) => void;
  caption: string;
  setCaption: (v: string) => void;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  onBeforeImageSelect: (f: File) => void;
  onAfterImageSelect: (f: File) => void;
  onBeforeImageRemove: () => void;
  onAfterImageRemove: () => void;
}) {
  const [tagInput, setTagInput] = useState("");

  const addTag = () => {
    const trimmed = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (trimmed && !tags.includes(trimmed) && tags.length < 10) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && tagInput === "" && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Story Details */}
      <SectionCard title="Story Details" required>
        <input
          type="text"
          value={storyTitle}
          onChange={(e) => setStoryTitle(e.target.value)}
          placeholder='e.g. "My 6-Month Transformation", "How I Beat My Anxiety"'
          className="input-dark text-sm"
        />
      </SectionCard>

      {/* Story Content */}
      <SectionCard title="Your Story" required>
        <div className="relative">
          <textarea
            value={storyContent}
            onChange={(e) => setStoryContent(e.target.value)}
            placeholder="Tell your story. Be raw, be real, inspire someone. You can write as much as you want here..."
            rows={10}
            maxLength={10000}
            className="input-dark resize-none text-sm leading-relaxed"
          />
          <div className="absolute bottom-3 right-3 text-xs text-lion-gray-2">
            {storyContent.length}/10000
          </div>
        </div>
      </SectionCard>

      {/* Tags */}
      <SectionCard title="Tags">
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-400/10 border border-purple-400/25 text-xs font-medium text-purple-400"
            >
              <Tag className="w-3 h-3" />
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-0.5 hover:text-purple-300 transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagKeyDown}
            placeholder="Type a tag and press Enter"
            className="input-dark text-sm !py-2 flex-1"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!tagInput.trim()}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 ${
              tagInput.trim()
                ? "bg-purple-400/15 text-purple-400 hover:bg-purple-400/25"
                : "bg-lion-dark-3 text-lion-gray-2 cursor-not-allowed"
            }`}
          >
            Add
          </button>
        </div>
        <p className="text-[11px] text-lion-gray-2">
          Press Enter to add. Up to 10 tags. E.g. transformation, mental-health, journey
        </p>
      </SectionCard>

      {/* Before / After Images */}
      <SectionCard title="Before & After Photos">
        <p className="text-xs text-lion-gray-3 -mt-2 mb-1">
          Optionally share your transformation with side-by-side photos
        </p>
        <div className="flex gap-3">
          <SmallImageUpload
            previewUrl={beforeImageUrl}
            onFileSelect={onBeforeImageSelect}
            onRemove={onBeforeImageRemove}
            label="Before"
          />
          <SmallImageUpload
            previewUrl={afterImageUrl}
            onFileSelect={onAfterImageSelect}
            onRemove={onAfterImageRemove}
            label="After"
          />
        </div>
      </SectionCard>

      {/* Caption summary */}
      <SectionCard title="Caption Summary">
        <div className="relative">
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="A short summary or hook that appears with your story in the feed..."
            rows={3}
            maxLength={500}
            className="input-dark resize-none text-sm leading-relaxed"
          />
          <div className="absolute bottom-3 right-3 text-xs text-lion-gray-2">
            {caption.length}/500
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN PAGE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export default function CreatePage() {
  // ── Common ──
  const { createPost, isLoading: isSubmitting, error: postError } = useCreatePost();
  const [selectedType, setSelectedType] = useState<PostType | null>(null);

  // ── Workout state ──
  const [workoutTitle, setWorkoutTitle] = useState("");
  const [exercises, setExercises] = useState<Exercise[]>([
    { name: "", sets: [{ reps: 0, weight: 0, unit: "lbs" }] },
  ]);
  const [workoutDuration, setWorkoutDuration] = useState("");
  const [workoutCaption, setWorkoutCaption] = useState("");
  const [workoutImageUrl, setWorkoutImageUrl] = useState<string | null>(null);

  // ── Meal state ──
  const [mealName, setMealName] = useState("");
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: "", amount: "" }]);
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [mealCaption, setMealCaption] = useState("");
  const [mealImageUrl, setMealImageUrl] = useState<string | null>(null);

  // ── Quote state ──
  const [quoteText, setQuoteText] = useState("");
  const [quoteAuthor, setQuoteAuthor] = useState("");
  const [quoteCaption, setQuoteCaption] = useState("");

  // ── Story state ──
  const [storyTitle, setStoryTitle] = useState("");
  const [storyContent, setStoryContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [storyCaption, setStoryCaption] = useState("");
  const [beforeImageUrl, setBeforeImageUrl] = useState<string | null>(null);
  const [afterImageUrl, setAfterImageUrl] = useState<string | null>(null);

  // ── Image handlers ──
  const handleImageFile = useCallback(
    (setter: (url: string | null) => void) => async (file: File) => {
      const url = await readFileAsDataUrl(file);
      setter(url);
    },
    []
  );

  // ── Validation ──
  const isValid = (() => {
    if (!selectedType) return false;
    switch (selectedType) {
      case "workout":
        return workoutTitle.trim().length > 0;
      case "meal":
        return mealName.trim().length > 0;
      case "quote":
        return quoteText.trim().length > 0;
      case "story":
        return storyTitle.trim().length > 0 && storyContent.trim().length > 0;
      default:
        return false;
    }
  })();

  // ── Submit handler ──
  const handleSubmit = () => {
    if (!selectedType || !isValid) return;

    let caption = "";
    let metadata: Record<string, unknown> = {};
    // Exclude data: URLs — they can't be stored and would fail server validation
    const toServerUrl = (url: string | null | undefined) =>
      url && !url.startsWith("data:") ? url : undefined;

    switch (selectedType) {
      case "workout":
        caption = workoutCaption || workoutTitle;
        metadata = {
          title: workoutTitle,
          // Only include exercises that have a name filled in
          exercises: exercises.filter((ex) => ex.name.trim().length > 0),
          duration: parseInt(workoutDuration) || 0,
        };
        break;
      case "meal":
        caption = mealCaption || mealName;
        metadata = {
          name: mealName,
          mealType: mealType ?? "lunch",
          ingredients,
          macros: {
            calories: parseInt(calories) || 0,
            protein: parseInt(protein) || 0,
            carbs: parseInt(carbs) || 0,
            fat: parseInt(fat) || 0,
          },
        };
        break;
      case "quote":
        caption = quoteCaption || quoteText;
        metadata = { text: quoteText, author: quoteAuthor };
        break;
      case "story":
        caption = storyCaption || storyTitle;
        metadata = { title: storyTitle, content: storyContent, tags };
        break;
    }

    const imageUrl =
      selectedType === "workout"
        ? toServerUrl(workoutImageUrl)
        : selectedType === "meal"
        ? toServerUrl(mealImageUrl)
        : undefined;

    createPost({ type: selectedType, caption, imageUrl, metadata });
  };

  // ── Validation hints ──
  const validationHints = (() => {
    if (!selectedType) return null;
    switch (selectedType) {
      case "workout": {
        const missing: string[] = [];
        if (!workoutTitle.trim()) missing.push("workout title");
        return missing.length > 0 ? missing : null;
      }
      case "meal": {
        const missing: string[] = [];
        if (!mealName.trim()) missing.push("meal name");
        return missing.length > 0 ? missing : null;
      }
      case "quote": {
        const missing: string[] = [];
        if (!quoteText.trim()) missing.push("quote text");
        return missing.length > 0 ? missing : null;
      }
      case "story": {
        const missing: string[] = [];
        if (!storyTitle.trim()) missing.push("story title");
        if (!storyContent.trim()) missing.push("story content");
        return missing.length > 0 ? missing : null;
      }
      default:
        return null;
    }
  })();

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* ── Header ── */}
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

      {/* ── Step 1: Post Type Selector ── */}
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

      {/* ── Step 2: Type-Specific Form ── */}
      {selectedType && (
        <div className="border-t border-lion-gold/8 pt-6">
          {selectedType === "workout" && (
            <WorkoutForm
              title={workoutTitle}
              setTitle={setWorkoutTitle}
              exercises={exercises}
              setExercises={setExercises}
              duration={workoutDuration}
              setDuration={setWorkoutDuration}
              caption={workoutCaption}
              setCaption={setWorkoutCaption}
              imageUrl={workoutImageUrl}
              onImageSelect={handleImageFile(setWorkoutImageUrl)}
              onImageRemove={() => setWorkoutImageUrl(null)}
            />
          )}

          {selectedType === "meal" && (
            <MealForm
              mealName={mealName}
              setMealName={setMealName}
              mealType={mealType}
              setMealType={setMealType}
              ingredients={ingredients}
              setIngredients={setIngredients}
              calories={calories}
              setCalories={setCalories}
              protein={protein}
              setProtein={setProtein}
              carbs={carbs}
              setCarbs={setCarbs}
              fat={fat}
              setFat={setFat}
              caption={mealCaption}
              setCaption={setMealCaption}
              imageUrl={mealImageUrl}
              onImageSelect={handleImageFile(setMealImageUrl)}
              onImageRemove={() => setMealImageUrl(null)}
            />
          )}

          {selectedType === "quote" && (
            <QuoteForm
              quoteText={quoteText}
              setQuoteText={setQuoteText}
              quoteAuthor={quoteAuthor}
              setQuoteAuthor={setQuoteAuthor}
              caption={quoteCaption}
              setCaption={setQuoteCaption}
            />
          )}

          {selectedType === "story" && (
            <StoryForm
              storyTitle={storyTitle}
              setStoryTitle={setStoryTitle}
              storyContent={storyContent}
              setStoryContent={setStoryContent}
              tags={tags}
              setTags={setTags}
              caption={storyCaption}
              setCaption={setStoryCaption}
              beforeImageUrl={beforeImageUrl}
              afterImageUrl={afterImageUrl}
              onBeforeImageSelect={handleImageFile(setBeforeImageUrl)}
              onAfterImageSelect={handleImageFile(setAfterImageUrl)}
              onBeforeImageRemove={() => setBeforeImageUrl(null)}
              onAfterImageRemove={() => setAfterImageUrl(null)}
            />
          )}
        </div>
      )}

      {/* ── Step 3: Submit Section ── */}
      {selectedType && (
        <div className="border-t border-lion-gold/8 pt-6 space-y-4">
          {/* Validation hints */}
          {validationHints && (
            <div className="rounded-xl bg-lion-dark-2 border border-lion-gold/10 px-4 py-3 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-lion-gold/10 flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-xs text-lion-gold">!</span>
              </div>
              <p className="text-xs text-lion-gray-3 leading-relaxed">
                To post, fill in the required fields:{" "}
                <span className="text-lion-gray-4 font-medium">
                  {validationHints.join(", ")}
                </span>
              </p>
            </div>
          )}

          {/* Post error */}
          {postError && (
            <div className="rounded-xl bg-red-400/10 border border-red-400/20 px-4 py-3 text-sm text-red-400">
              {(postError as any)?.message ?? "Failed to create post. Are you signed in?"}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <Link
              href="/"
              className="btn-ghost-gold flex-1 text-center text-sm"
            >
              Cancel
            </Link>
            <button
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
              className={`
                flex-1 py-3 rounded-xl text-sm font-semibold
                transition-all duration-300
                ${
                  isValid && !isSubmitting
                    ? "btn-gold"
                    : "bg-lion-dark-3 text-lion-gray-2 cursor-not-allowed"
                }
              `}
            >
              {isSubmitting ? "Posting..." : "Share Your Gains"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
