interface LionLogoProps {
  size?: number;
  /** Show the dark rounded-rect background behind the crown */
  withBackground?: boolean;
  className?: string;
}

/**
 * The GAINS crown logo — a geometric 3-point crown in gold (#F5C842)
 * on a near-black background. Matches public/icon.svg exactly.
 */
export function LionLogo({
  size = 48,
  withBackground = true,
  className = "",
}: LionLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GAINS logo"
    >
      {withBackground && (
        <rect width="100" height="100" rx="20" fill="#080808" />
      )}

      {/* Crown body — 3-point silhouette */}
      <polygon
        points="15,72 15,42 30,62 50,28 70,62 85,42 85,72"
        fill="#F5C842"
      />

      {/* Crown band (slightly darker gold) */}
      <rect x="13" y="70" width="74" height="14" rx="4" fill="#C8921A" />

      {/* Gem cutouts */}
      <circle cx="50" cy="77" r="5" fill="#080808" />
      <circle cx="28" cy="77" r="4" fill="#080808" />
      <circle cx="72" cy="77" r="4" fill="#080808" />

      {/* Gem sparkle highlights */}
      <circle cx="50" cy="77" r="2.5" fill="#F5C842" fillOpacity="0.5" />
      <circle cx="28" cy="77" r="2" fill="#F5C842" fillOpacity="0.5" />
      <circle cx="72" cy="77" r="2" fill="#F5C842" fillOpacity="0.5" />

      {/* Crown point caps */}
      <circle cx="15" cy="42" r="3.5" fill="#F5C842" />
      <circle cx="50" cy="28" r="4" fill="#F5C842" />
      <circle cx="85" cy="42" r="3.5" fill="#F5C842" />
    </svg>
  );
}
