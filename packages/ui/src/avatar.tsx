interface AvatarProps {
  src: string | null | undefined;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizes = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-14 w-14",
  xl: "h-20 w-20",
};

export function Avatar({ src, alt, size = "md", className = "" }: AvatarProps) {
  const initials = alt.slice(0, 2).toUpperCase();
  const sizeClass = sizes[size];

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} rounded-full object-cover ring-2 ring-lion-gold/30 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex items-center justify-center rounded-full bg-lion-dark-3 ring-2 ring-lion-gold/30 text-lion-gold font-bold text-sm ${className}`}
    >
      {initials}
    </div>
  );
}
