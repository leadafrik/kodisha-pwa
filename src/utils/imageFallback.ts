import React from "react";

export const FALLBACK_IMAGE =
  "data:image/svg+xml;utf8," +
  "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'>" +
  "<rect width='800' height='600' fill='%23f1f5f9'/>" +
  "<text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' " +
  "font-family='Arial, sans-serif' font-size='28' fill='%2394a3b8'>" +
  "Image unavailable</text></svg>";

export const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
  const target = event.currentTarget;
  if (target.dataset.fallbackApplied === "true") {
    return;
  }
  target.dataset.fallbackApplied = "true";
  target.src = FALLBACK_IMAGE;
  target.alt = "Image unavailable";
};
