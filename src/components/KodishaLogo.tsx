// components/KodishaLogo.tsx
import React from "react";

type Props = {
  size?: number;          // square px size
  className?: string;
  title?: string;
  ariaHidden?: boolean;
};

const KodishaLogo: React.FC<Props> = ({ size = 56, className = "", title = "Kodisha", ariaHidden = false }) => {
  const s = Math.max(32, size);
  const viewBox = "0 0 120 120";

  return (
    <svg
      className={className}
      width={s}
      height={s}
      viewBox={viewBox}
      role={ariaHidden ? "img" : "img"}
      aria-hidden={ariaHidden ? "true" : "false"}
      aria-label={ariaHidden ? undefined : title}
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <linearGradient id="kodi-grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#2fa66b" />
          <stop offset="100%" stopColor="#0f5132" />
        </linearGradient>

        <linearGradient id="sun-grad" x1="0" x2="1">
          <stop offset="0%" stopColor="#f7d27a" />
          <stop offset="100%" stopColor="#f0b03a" />
        </linearGradient>

        <clipPath id="circleClip">
          <circle cx="60" cy="60" r="56" />
        </clipPath>
      </defs>

      {/* base circular badge */}
      <g>
        <circle cx="60" cy="60" r="56" fill="url(#kodi-grad)" opacity="0.98" />
        {/* subtle inner ring */}
        <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
      </g>

      {/* Map of Kenya silhouette (simplified, stylized) */}
      <g clipPath="url(#circleClip)" transform="translate(6,6)">
        {/* simplified outline path — keeps small file size */}
        <path
          d="M33 18c2 0 6 1 8 0 3-1 6-2 8-2 3 0 7 1 10 0 2-1 5-1 7 0 2 1 4 3 5 5 1 2 1 5 2 7 1 3 3 6 3 9 0 3-1 5-2 7s-3 4-5 5c-2 2-5 3-7 4-3 1-6 2-9 3-3 1-5 2-8 3-3 1-5 2-8 3-2 1-4 3-6 3-2 0-4-1-6-1-3 0-5 1-8 1-3 0-6-1-8-3-3-2-4-6-5-9-1-3-1-6 0-9 1-3 3-6 5-8 2-2 5-4 8-5 3-1 6-2 9-3 2-1 5-1 7-1z"
          fill="#0b2f1d"
          opacity="0.14"
          transform="scale(1.05) translate(2,2)"
        />

        {/* more recognizable Kenya outline (accent shape) */}
        <path
          d="M46 26c6-1 12-1 18 2 3 1 6 3 8 6 2 3 3 7 3 11 0 5-2 9-5 12-3 3-7 5-11 6-4 1-9 1-13 2-3 1-6 2-9 3-2 0-4 1-5 0-1-1-1-3-1-5 0-3 1-6 2-8 1-3 3-6 5-8s5-3 8-4c3-1 6-1 8-2 3-1 5-3 5-6 0-3-2-5-4-6-2-1-5-1-7 0-1 0-2 0-3-1-1-1-1-3 0-4 1-2 3-3 5-3z"
          fill="#fff"
          opacity="0.08"
        />

        {/* Big stylized leaf + sprout (growth symbol) aligned over map */}
        <g transform="translate(18,14) scale(0.9)">
          <path
            d="M46.5 19.2c-7.8-5.3-20.6-6.1-31.7-2.1 2.6 0.7 6.1 2.1 9.8 4.7 6.9 4.5 11.1 10.7 13.6 15.2 0.9-3.8 1.1-8.9-0.3-12.8 3.3-1 6.3-2.6 8.6-5z"
            fill="url(#kodi-grad)"
            opacity="0.98"
          />
          <path
            d="M36 40c2-6 6-12 12-18-2 6-5 12-10 17-1 1-2 1-2 1z"
            fill="url(#kodi-grad)"
            opacity="1"
          />
          <circle cx="36" cy="6" r="3.2" fill="url(#sun-grad)" opacity="0.95" />
        </g>
      </g>

      {/* small leaf accent at bottom right (for app icon geometry) */}
      <path
        d="M88 86c-3 0-9-4-12-7 4-1 9-1 12 2 2 2 2 4 0 5z"
        fill="#f6d288"
        opacity="0.12"
      />
    </svg>
  );
};

export default KodishaLogo;
