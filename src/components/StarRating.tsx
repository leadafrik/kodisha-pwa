import React from 'react';

type Props = {
  value: number; // average rating 0-5, e.g., 4.5
  size?: number; // px size for stars
  showValue?: boolean; // show numeric value next to stars
};

// Renders 5 stars with support for half-star (0.5 increments)
export default function StarRating({ value, size = 18, showValue = true }: Props) {
  const clamped = Math.max(0, Math.min(5, Math.round(value * 2) / 2)); // clamp & round to 0.5

  // Determine per-star fill: 1 = full, 0.5 = half, 0 = empty
  const fills = Array.from({ length: 5 }, (_, i) => {
    const starIndex = i + 1;
    if (clamped >= starIndex) return 1;
    if (clamped >= starIndex - 0.5) return 0.5;
    return 0;
  });

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} aria-label={`Rating ${clamped} out of 5`}>
      {fills.map((f, idx) => (
        <Star key={idx} fill={f} size={size} />
      ))}
      {showValue && (
        <span style={{ marginLeft: 4, fontSize: size * 0.75 }}>{clamped.toFixed(1)}</span>
      )}
    </div>
  );
}

function Star({ fill, size }: { fill: 0 | 0.5 | 1; size: number }) {
  const fullColor = '#f5a623';
  const emptyColor = '#ddd';
  const width = size;
  const height = size;

  // For half-star, overlay a clipped rect to fill left half.
  return (
    <svg width={width} height={height} viewBox="0 0 24 24" aria-hidden="true">
      {/* base empty star */}
      <path
        d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.401 8.172L12 18.896 4.665 23.17l1.401-8.172L.132 9.211l8.2-1.193L12 .587z"
        fill={emptyColor}
      />
      {fill > 0 && (
        <clipPath id="halfClip">
          <rect x="0" y="0" width={fill === 0.5 ? 12 : 24} height="24" />
        </clipPath>
      )}
      {fill > 0 && (
        <path
          d="M12 .587l3.668 7.431 8.2 1.193-5.934 5.787 1.401 8.172L12 18.896 4.665 23.17l1.401-8.172L.132 9.211l8.2-1.193L12 .587z"
          fill={fullColor}
          clipPath={fill === 0.5 ? 'url(#halfClip)' : undefined}
        />
      )}
    </svg>
  );
}
