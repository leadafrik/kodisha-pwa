/**
 * Page Transitions & Micro-interactions
 * Smooth animations for better UX
 */

import React from "react";

/**
 * Page transition animations
 * Add to pages for smooth transitions between routes
 */
export const pageTransitionVariants = {
  hidden: {
    opacity: 0,
    y: 10,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.3,
      ease: "easeIn",
    },
  },
};

/**
 * Fade in animation
 */
export const fadeInVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

/**
 * Slide in animations
 */
export const slideInVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

/**
 * Scale animations
 */
export const scaleInVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

/**
 * Stagger container for animating lists
 */
export const staggerContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

/**
 * Stagger item (use inside stagger container)
 */
export const staggerItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

/**
 * Tailwind animation classes
 * Add these to your tailwind config or use inline
 */
export const animationClasses = {
  fadeIn: "animate-fade-in",
  slideInLeft: "animate-slide-in-left",
  slideInRight: "animate-slide-in-right",
  slideInTop: "animate-slide-in-top",
  scaleIn: "animate-scale-in",
  bounceIn: "animate-bounce-in",
  pulse: "animate-pulse",
  spin: "animate-spin",
};

/**
 * CSS for Tailwind config
 */
export const tailwindAnimationConfig = `
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInLeft {
  from {
    transform: translateX(-10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInRight {
  from {
    transform: translateX(10px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideInTop {
  from {
    transform: translateY(-10px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes scaleIn {
  from {
    transform: scale(0.95);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  70% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}
`;

/**
 * Page transition wrapper component
 */
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = "",
}) => {
  return <div className={`animate-fade-in ${className}`}>{children}</div>;
};

/**
 * Hover animation utilities
 */
export const hoverAnimationClasses = {
  scaleUp: "group-hover:scale-105 transition-transform duration-200",
  lift: "group-hover:shadow-lg group-hover:-translate-y-1 transition-all duration-200",
  highlight: "group-hover:bg-slate-50 transition-colors duration-150",
  colorShift: "group-hover:text-green-600 transition-colors duration-150",
};

/**
 * Button animation classes
 */
export const buttonAnimationClasses = {
  press: "active:scale-95 transition-transform duration-100",
  ripple: "relative overflow-hidden",
  glow: "hover:shadow-lg hover:shadow-green-500/50 transition-shadow duration-200",
  pulse: "hover:animate-pulse transition-opacity duration-200",
};

/**
 * Card animation classes
 */
export const cardAnimationClasses = {
  elevate: "hover:shadow-lg hover:-translate-y-1 transition-all duration-200",
  borderHighlight: "hover:border-green-300 transition-colors duration-200",
  bgShift: "hover:bg-slate-50 transition-colors duration-200",
};

export default {
  pageTransitionVariants,
  fadeInVariants,
  slideInVariants,
  scaleInVariants,
  staggerContainerVariants,
  staggerItemVariants,
  animationClasses,
  hoverAnimationClasses,
  buttonAnimationClasses,
  cardAnimationClasses,
};
