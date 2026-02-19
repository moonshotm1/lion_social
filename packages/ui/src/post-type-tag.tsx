import type { PostType } from "@lion/types";

const tagStyles: Record<PostType, { bg: string; label: string; emoji: string }> = {
  workout: { bg: "bg-red-500/20 text-red-400", label: "Workout", emoji: "" },
  meal: { bg: "bg-green-500/20 text-green-400", label: "Meal", emoji: "" },
  quote: { bg: "bg-purple-500/20 text-purple-400", label: "Quote", emoji: "" },
  story: { bg: "bg-blue-500/20 text-blue-400", label: "Story", emoji: "" },
};

interface PostTypeTagProps {
  type: PostType;
  className?: string;
}

export function PostTypeTag({ type, className = "" }: PostTypeTagProps) {
  const style = tagStyles[type];
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${style.bg} ${className}`}>
      <span>{style.emoji}</span>
      {style.label}
    </span>
  );
}
