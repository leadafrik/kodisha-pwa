import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  CirclePlus,
  ClipboardList,
  LayoutGrid,
  MessageSquare,
  User,
  Info,
  Menu,
  X,
  LogOut,
  Heart,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import NotificationCenter from "./NotificationCenter";

type NavItem = {
  label: string;
  to: string;
  icon?: LucideIcon;
  accent?: boolean;
};

const TOP_LEVEL_MOBILE_ROUTES = new Set([
  "/",
  "/browse",
  "/request",
  "/about",
  "/profile",
  "/messages",
  "/favorites",
]);

const pathMatches = (pathname: string, key: string) => {
  if (key === "/browse") {
    return (
      pathname === "/browse" ||
      pathname === "/listings" ||
      pathname === "/marketplace" ||
      pathname === "/find-services" ||
      pathname.startsWith("/listing/") ||
      pathname.startsWith("/listings/")
    );
  }

  if (key === "/request") {
    return pathname === "/request" || pathname.startsWith("/request/");
  }

  if (key === "/profile") {
    return (
      pathname === "/profile" ||
      pathname === "/favorites" ||
      pathname === "/notifications" ||
      pathname === "/profile/notifications" ||
      pathname === "/verify-phone" ||
      pathname === "/verify" ||
      pathname === "/verify-id"
    );
  }

  if (key === "/about") {
    return pathname === "/about" || pathname === "/contact" || pathname === "/help";
  }

  return pathname === key;
};

const getNavLinkClass = (active: boolean, accent = false) => {
  if (accent) {
    return active
      ? "inline-flex min-h-[44px] items-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm"
      : "inline-flex min-h-[44px] items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700";
  }

  return active
    ? "inline-flex min-h-[44px] items-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900"
    : "inline-flex min-h-[44px] items-center rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900";
};

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const isAdmin = user?.role === "admin" || user?.type === "admin";
  const sellTarget = user ? "/create-listing" : "/login?mode=signup&next=/create-listing";
  const signupTarget = "/login?mode=signup&next=/browse";

  const desktopNavItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { label: "Listings", to: "/browse" },
      { label: "Buy Requests", to: "/request" },
      { label: "Sell", to: sellTarget, accent: true },
    ];

    if (user) {
      items.push({ label: "Messages", to: "/messages" });
    }

    items.push({ label: "About", to: "/about" });
    return items;
  }, [sellTarget, user]);

  const mobileBottomItems = useMemo<NavItem[]>(() => {
    if (!user) return [];
    return [
      { label: "Listings", to: "/browse", icon: LayoutGrid },
      { label: "Requests", to: "/request", icon: ClipboardList },
      { label: "Sell", to: "/create-listing", icon: CirclePlus },
      { label: "Messages", to: "/messages", icon: MessageSquare },
      { label: "Account", to: "/profile", icon: User },
    ];
  }, [user]);

  const showMobileBottomNav =
    !!user && TOP_LEVEL_MOBILE_ROUTES.has(location.pathname) && !mobileOpen;

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!accountOpen) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        event.target instanceof Node &&
        !accountMenuRef.current.contains(event.target)
      ) {
        setAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [accountOpen]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [mobileOpen]);

  return (
    <>
      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="h-1 w-full bg-[#A0452E]" />
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between py-4">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="Agrisoko" className="h-10 w-10" />
              <span className="text-2xl font-extrabold tracking-tight text-slate-900">Agrisoko</span>
            </Link>

            <div className="hidden lg:flex lg:items-center lg:gap-2">
              {desktopNavItems.map((item) => {
                const active = pathMatches(location.pathname, item.to);
                return (
                  <Link key={item.label} to={item.to} className={getNavLinkClass(active, item.accent)}>
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="hidden lg:flex lg:items-center lg:gap-3">
              {user ? (
                <>
                  <NotificationCenter />
                  <div ref={accountMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setAccountOpen((prev) => !prev)}
                      className={getNavLinkClass(pathMatches(location.pathname, "/profile"))}
                      aria-expanded={accountOpen}
                      aria-haspopup="menu"
                    >
                      <span className="mr-2 inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-slate-200">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-semibold text-slate-700">
                            {user.name ? user.name[0].toUpperCase() : "U"}
                          </span>
                        )}
                      </span>
                      Account
                    </button>

                    {accountOpen && (
                      <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                          <p className="truncate text-sm font-semibold text-slate-900">{user.name || "User"}</p>
                          <p className="truncate text-xs text-slate-500">{user.email}</p>
                        </div>
                        <Link to="/profile" className="block px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                          Account
                        </Link>
                        <Link to="/favorites" className="block border-t border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                          Saved Listings
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" className="block border-t border-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                            Admin Console
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={logout}
                          className="flex w-full items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link to="/login" className={getNavLinkClass(pathMatches(location.pathname, "/login"))}>
                    Login
                  </Link>
                  <Link to={signupTarget} className={getNavLinkClass(false, true)}>
                    Create Free Account
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-slate-200 text-slate-900 transition hover:bg-slate-50 lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileOpen}
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/45 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-80 max-w-[88vw] overflow-y-auto bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Menu</p>
                <p className="mt-1 text-lg font-bold text-slate-900">Agrisoko</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-slate-200 text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              {desktopNavItems.map((item) => {
                const Icon =
                  item.label === "Listings"
                    ? LayoutGrid
                    : item.label === "Buy Requests"
                    ? ClipboardList
                    : item.label === "Sell"
                    ? CirclePlus
                    : item.label === "Messages"
                    ? MessageSquare
                    : Info;
                const active = pathMatches(location.pathname, item.to);

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`flex min-h-[52px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      item.accent
                        ? "bg-emerald-600 text-white hover:bg-emerald-700"
                        : active
                        ? "bg-slate-100 text-slate-900"
                        : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="my-6 border-t border-slate-200" />

            {user ? (
              <div className="space-y-2">
                <div className="rounded-2xl bg-slate-50 px-4 py-3">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.name || "User"}</p>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                </div>
                <Link to="/profile" className="flex min-h-[52px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <User className="h-5 w-5" />
                  Account
                </Link>
                <Link to="/favorites" className="flex min-h-[52px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  <Heart className="h-5 w-5" />
                  Saved Listings
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex min-h-[52px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    <Shield className="h-5 w-5" />
                    Admin Console
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="flex min-h-[52px] w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link to={signupTarget} className="flex min-h-[52px] items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  Create Free Account
                </Link>
                <Link to="/login" className="flex min-h-[52px] items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {showMobileBottomNav && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 shadow-[0_-12px_28px_-24px_rgba(15,23,42,0.5)] backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-2">
            {mobileBottomItems.map((item) => {
              const Icon = item.icon || LayoutGrid;
              const active = pathMatches(location.pathname, item.to);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition ${
                    active ? "text-emerald-700" : "text-slate-500"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-emerald-700" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
