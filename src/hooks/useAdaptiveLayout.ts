import { useEffect, useState } from "react";

type AdaptiveLayoutProfile = {
  width: number;
  height: number;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isCompact: boolean;
  isShortViewport: boolean;
  isTouch: boolean;
  canHover: boolean;
  prefersReducedMotion: boolean;
};

const getProfile = (): AdaptiveLayoutProfile => {
  if (typeof window === "undefined") {
    return {
      width: 1280,
      height: 800,
      isPhone: false,
      isTablet: false,
      isDesktop: true,
      isCompact: false,
      isShortViewport: false,
      isTouch: false,
      canHover: true,
      prefersReducedMotion: false,
    };
  }

  const width = window.innerWidth;
  const height = window.innerHeight;
  const isPhone = width < 640;
  const isTablet = width >= 640 && width < 1024;
  const isDesktop = width >= 1024;
  const isTouch =
    window.matchMedia("(pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0;
  const canHover = window.matchMedia("(hover: hover)").matches;
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  return {
    width,
    height,
    isPhone,
    isTablet,
    isDesktop,
    isCompact: width < 768,
    isShortViewport: height < 760,
    isTouch,
    canHover,
    prefersReducedMotion,
  };
};

export const useAdaptiveLayout = () => {
  const [profile, setProfile] = useState<AdaptiveLayoutProfile>(() => getProfile());

  useEffect(() => {
    const updateProfile = () => setProfile(getProfile());

    updateProfile();
    window.addEventListener("resize", updateProfile);
    window.addEventListener("orientationchange", updateProfile);

    return () => {
      window.removeEventListener("resize", updateProfile);
      window.removeEventListener("orientationchange", updateProfile);
    };
  }, []);

  return profile;
};

export type { AdaptiveLayoutProfile };
