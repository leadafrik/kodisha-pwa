/**
 * Empty State Components
 * Contextual empty states for different scenarios across the app
 * Provides guidance and encourages user action
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Heart,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  Plus,
  Filter,
} from "lucide-react";

interface EmptyStateProps {
  /** Icon component to display */
  icon?: React.ReactNode;
  /** Main heading text */
  title: string;
  /** Descriptive subtitle */
  description?: string;
  /** Primary action button */
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Secondary action button */
  secondaryAction?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  /** Custom icon styling */
  iconClassName?: string;
  /** Additional CSS class */
  className?: string;
}

/**
 * Generic empty state container
 * Use this as a base for any empty state scenario
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  iconClassName = "w-16 h-16 text-slate-300",
  className = "",
}) => (
  <div
    className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}
  >
    {icon && <div className={iconClassName}>{icon}</div>}
    <h3 className="mt-4 text-xl font-bold text-slate-900">{title}</h3>
    {description && (
      <p className="mt-2 text-sm text-slate-600 max-w-md">{description}</p>
    )}

    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:gap-3">
      {action && action.href ? (
        <Link
          to={action.href}
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition min-h-[44px]"
        >
          {action.label}
        </Link>
      ) : action ? (
        <button
          onClick={action.onClick}
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 transition min-h-[44px]"
        >
          {action.label}
        </button>
      ) : null}

      {secondaryAction && secondaryAction.href ? (
        <Link
          to={secondaryAction.href}
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition min-h-[44px]"
        >
          {secondaryAction.label}
        </Link>
      ) : secondaryAction ? (
        <button
          onClick={secondaryAction.onClick}
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition min-h-[44px]"
        >
          {secondaryAction.label}
        </button>
      ) : null}
    </div>
  </div>
);

/**
 * No listings empty state
 * Displayed when no products/services are found
 */
export const EmptyListings: React.FC<{
  hasFilters?: boolean;
  category?: string;
}> = ({ hasFilters = false, category = "" }) => (
  <EmptyState
    icon={<ShoppingBag className="w-16 h-16" />}
    iconClassName="w-16 h-16 text-amber-200"
    title={hasFilters ? "No listings match your filters" : "No listings yet"}
    description={
      hasFilters
        ? `Try adjusting your ${category ? category + " category" : "search"} filters or browsing other categories.`
        : "Start by creating a listing or browse other sellers' inventory."
    }
    action={{
      label: "Create Listing",
      href: "/create-listing",
    }}
    secondaryAction={{
      label: "Browse All",
      href: "/browse",
    }}
  />
);

/**
 * No search results empty state
 * Displayed when search returns no matches
 */
export const EmptySearchResults: React.FC<{ query: string }> = ({ query }) => (
  <EmptyState
    icon={<Search className="w-16 h-16" />}
    iconClassName="w-16 h-16 text-slate-300"
    title="No results found"
    description={`No listings match "${query}". Try different keywords or browse categories.`}
    secondaryAction={{
      label: "Clear Search",
      href: "/browse",
    }}
  />
);

/**
 * No saved listings empty state
 * Displayed when user has no favorites
 */
export const EmptyFavorites: React.FC = () => (
  <EmptyState
    icon={<Heart className="w-16 h-16" />}
    iconClassName="w-16 h-16 text-red-200"
    title="No saved listings yet"
    description="Save your favorite listings to view them later. Browse and click the heart icon."
    action={{
      label: "Browse Listings",
      href: "/browse",
    }}
  />
);

/**
 * No messages empty state
 * Displayed when user has no conversations
 */
export const EmptyMessages: React.FC = () => (
  <EmptyState
    icon={<MessageSquare className="w-16 h-16" />}
    iconClassName="w-16 h-16 text-blue-200"
    title="No messages yet"
    description="Start a conversation by contacting a seller or responding to an inquiry."
    action={{
      label: "Browse Listings",
      href: "/browse",
    }}
  />
);

/**
 * No notifications empty state
 * Displayed when user has no recent notifications
 */
export const EmptyNotifications: React.FC = () => (
  <EmptyState
    icon={<AlertCircle className="w-16 h-16" />}
    iconClassName="w-16 h-16 text-slate-200"
    title="All caught up!"
    description="You have no new notifications. Check back soon."
  />
);

/**
 * No data empty state (for analytics, charts, etc.)
 * Displayed when no data is available
 */
export const EmptyData: React.FC<{ entity?: string }> = ({
  entity = "data",
}) => (
  <EmptyState
    icon={<TrendingUp className="w-16 h-16" />}
    iconClassName="w-16 h-16 text-slate-200"
    title={`No ${entity} available`}
    description={`There's no ${entity} to display yet. Come back later as more ${entity} becomes available.`}
  />
);

/**
 * No sellers/users empty state
 * Displayed when browsing user lists
 */
export const EmptyUsers: React.FC = () => (
  <EmptyState
    icon={<TrendingUp className="w-16 h-16" />}
    iconClassName="w-16 h-16 text-slate-200"
    title="No users found"
    description="Try adjusting your search filters or browse all users."
    secondaryAction={{
      label: "Clear Filters",
      onClick: () => window.location.reload(),
    }}
  />
);

/**
 * Error state with retry
 * Displayed when something goes wrong
 */
export const ErrorEmptyState: React.FC<{
  title?: string;
  description?: string;
  onRetry?: () => void;
}> = ({
  title = "Something went wrong",
  description = "We encountered an error. Please try again.",
  onRetry,
}) => (
  <EmptyState
    icon={<AlertCircle className="w-16 h-16" />}
    iconClassName="w-16 h-16 text-red-200"
    title={title}
    description={description}
    action={
      onRetry
        ? {
            label: "Try Again",
            onClick: onRetry,
          }
        : undefined
    }
  />
);

/**
 * No inventory empty state
 * For user dashboard when they haven't listed anything
 */
export const EmptyInventory: React.FC<{ userType?: string }> = ({
  userType = "seller",
}) => (
  <EmptyState
    icon={<Plus className="w-16 h-16" />}
    iconClassName="w-16 h-16 text-green-200"
    title="No inventory yet"
    description={`Start by creating your first listing. Share what you're ${
      userType === "buyer" ? "looking for" : "selling"
    }.`}
    action={{
      label: `Create ${userType === "buyer" ? "Request" : "Listing"}`,
      href:
        userType === "buyer" ? "/request/new" : "/create-listing",
    }}
  />
);

/**
 * Filters clearing suggestion
 * For when filtered results are empty
 */
export const ClearFiltersState: React.FC<{
  onClear?: () => void;
}> = ({ onClear }) => (
  <EmptyState
    icon={<Filter className="w-16 h-16" />}
    iconClassName="w-16 h-16 text-slate-300"
    title="No results with current filters"
    description="Try removing some filters to see more listings."
    action={
      onClear
        ? {
            label: "Clear Filters",
            onClick: onClear,
          }
        : undefined
    }
  />
);

export default EmptyState;
