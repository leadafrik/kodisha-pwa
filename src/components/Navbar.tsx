import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  CirclePlus,
  ChevronDown,
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
  Building2,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import NotificationCenter from "./NotificationCenter";
import { BULK_NAV_LINK_VISIBLE } from "../config/featureFlags";

type NavItem = {
  label: string;
  to: string;
  icon?: LucideIcon;
  accent?: boolean;
};

type NavDropdownItem = {
  label: string;
  to: string;
};

type NavDropdownKey = "browse" | "sell";

const shouldShowTopLevelMobileNav = (pathname: string) =>
  pathname === "/" ||
  pathname === "/b2b" ||
  pathname === "/bulk" ||
  pathname === "/about" ||
  pathname === "/profile" ||
  pathname === "/messages" ||
  pathname === "/favorites" ||
  pathname === "/request" ||
  pathname.startsWith("/bulk/") ||
  pathname.startsWith("/browse");

const pathMatches = (pathname: string, key: string) => {
  if (key === "/browse") {
    return (
      pathname === "/browse" ||
      pathname.startsWith("/browse/") ||
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

  if (key === "/b2b") {
    return pathname === "/b2b" || pathname.startsWith("/b2b/");
  }

  if (key === "/bulk") {
    return pathname === "/bulk" || pathname.startsWith("/bulk/");
  }

  return pathname === key;
};

const getSignupTarget = (nextPath: string) =>
  `/login?mode=signup&next=${encodeURIComponent(nextPath)}`;

const getNavLinkClass = (active: boolean, accent = false) => {
  if (accent) {
    return active
      ? "inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-xl bg-[#8B3525] px-4 py-2 text-sm font-semibold text-white shadow-sm"
      : "inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-xl bg-[#A0452E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8B3525]";
  }

  return active
    ? "inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-xl bg-[#FDF5F3] px-4 py-2 text-sm font-semibold text-[#A0452E]"
    : "inline-flex min-h-[44px] items-center justify-center whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-[#FDF5F3] hover:text-[#A0452E]";
};

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const desktopNavRef = useRef<HTMLDivElement | null>(null);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [openNavMenu, setOpenNavMenu] = useState<NavDropdownKey | null>(null);
  const [mobileExpandedMenu, setMobileExpandedMenu] = useState<NavDropdownKey | null>(null);
  const [mobileSellSheetOpen, setMobileSellSheetOpen] = useState(false);

  const isAdmin = user?.role === "admin" || user?.type === "admin";
  const signupTarget = getSignupTarget("/browse");
  const browseMenuItems = useMemo<NavDropdownItem[]>(
    () => [
      { label: "All Listings", to: "/browse" },
      { label: "Produce", to: "/browse/produce" },
      { label: "Livestock", to: "/browse/livestock" },
      { label: "Inputs", to: "/browse/inputs" },
      { label: "Services", to: "/browse/services" },
    ],
    []
  );
  const sellMenuItems = useMemo<NavDropdownItem[]>(
    () => [
      {
        label: "List Produce",
        to: user ? "/create-listing?category=produce" : getSignupTarget("/create-listing?category=produce"),
      },
      {
        label: "List Livestock",
        to: user ? "/create-listing?category=livestock" : getSignupTarget("/create-listing?category=livestock"),
      },
      {
        label: "List Inputs",
        to: user ? "/create-listing?category=inputs" : getSignupTarget("/create-listing?category=inputs"),
      },
      {
        label: "List Service",
        to: user ? "/create-listing?category=service" : getSignupTarget("/create-listing?category=service"),
      },
    ],
    [user]
  );

  const desktopNavItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [{ label: "Buy Requests", to: "/request" }];

    if (BULK_NAV_LINK_VISIBLE) {
      items.push({ label: "Bulk Buyer/Seller", to: "/bulk" });
    }

    if (user) {
      items.push({ label: "Messages", to: "/messages" });
    }

    items.push({ label: "About", to: "/about" });
    return items;
  }, [user]);

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
    !!user && shouldShowTopLevelMobileNav(location.pathname) && !mobileOpen;

  useEffect(() => {
    setMobileOpen(false);
    setAccountOpen(false);
    setOpenNavMenu(null);
    setMobileExpandedMenu(null);
    setMobileSellSheetOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!accountOpen) return undefined;

    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;

      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setAccountOpen(false);
      }

      if (desktopNavRef.current && !desktopNavRef.current.contains(event.target)) {
        setOpenNavMenu(null);
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
      <nav className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur-md">
        <div className="h-1 w-full bg-[#A0452E]" />
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between py-4">
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo192.png" alt="Agrisoko" className="h-10 w-10" />
              <span className="font-display text-2xl font-bold tracking-tight text-stone-900">Agrisoko</span>
            </Link>

            <div ref={desktopNavRef} className="hidden lg:flex lg:items-center lg:gap-2">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenNavMenu((prev) => (prev === "browse" ? null : "browse"))}
                  className={getNavLinkClass(pathMatches(location.pathname, "/browse"))}
                  aria-expanded={openNavMenu === "browse"}
                  aria-haspopup="menu"
                >
                  <span>Listings</span>
                  <ChevronDown className={`ml-2 h-4 w-4 transition ${openNavMenu === "browse" ? "rotate-180" : ""}`} />
                </button>
                {openNavMenu === "browse" && (
                  <div className="absolute left-0 mt-2 w-60 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
                    {browseMenuItems.map((item, index) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`block px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#FDF5F3] ${
                          index > 0 ? "border-t border-stone-100" : ""
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {desktopNavItems
                .filter((item) => item.to === "/request" || item.to === "/bulk")
                .map((item) => {
                const active = pathMatches(location.pathname, item.to);
                return (
                  <Link key={item.label} to={item.to} className={getNavLinkClass(active, item.accent)}>
                    {item.label}
                  </Link>
                );
              })}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenNavMenu((prev) => (prev === "sell" ? null : "sell"))}
                  className={getNavLinkClass(pathMatches(location.pathname, "/create-listing"))}
                  aria-expanded={openNavMenu === "sell"}
                  aria-haspopup="menu"
                >
                  <span>Sell</span>
                  <ChevronDown className={`ml-2 h-4 w-4 transition ${openNavMenu === "sell" ? "rotate-180" : ""}`} />
                </button>
                {openNavMenu === "sell" && (
                  <div className="absolute left-0 mt-2 w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
                    {sellMenuItems.map((item, index) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`block px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#FDF5F3] ${
                          index > 0 ? "border-t border-stone-100" : ""
                        }`}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {desktopNavItems
                .filter((item) => item.to !== "/request" && item.to !== "/bulk")
                .map((item) => {
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
                      <span className="mr-2 inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-stone-200">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt={user.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="font-semibold text-stone-700">
                            {user.name ? user.name[0].toUpperCase() : "U"}
                          </span>
                        )}
                      </span>
                      Account
                    </button>

                    {accountOpen && (
                      <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
                        <div className="border-b border-stone-200 bg-[#FAF7F2] px-4 py-3">
                          <p className="truncate text-sm font-semibold text-stone-900">{user.name || "User"}</p>
                          <p className="truncate text-xs text-stone-500">{user.email}</p>
                        </div>
                        <Link to="/profile" className="block px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#FDF5F3]">
                          Account
                        </Link>
                        <Link to="/favorites" className="block border-t border-stone-100 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#FDF5F3]">
                          Saved Listings
                        </Link>
                        {isAdmin && (
                          <Link to="/admin" className="block border-t border-stone-100 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#FDF5F3]">
                            Admin Console
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={logout}
                          className="flex w-full items-center gap-2 border-t border-stone-100 px-4 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
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
              className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl border border-stone-200 text-stone-900 transition hover:bg-[#FDF5F3] lg:hidden"
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
        <div className="fixed inset-0 z-50 bg-stone-950/40 lg:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute left-0 top-0 h-full w-80 max-w-[88vw] overflow-y-auto bg-white p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#A0452E]">Menu</p>
                <p className="mt-1 font-display text-lg font-bold text-stone-900">Agrisoko</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl border border-stone-200 text-stone-900"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="rounded-2xl border border-stone-200 bg-[#FAF7F2]">
                <button
                  type="button"
                  onClick={() => setMobileExpandedMenu((prev) => (prev === "browse" ? null : "browse"))}
                  className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    pathMatches(location.pathname, "/browse") ? "bg-[#FDF5F3] text-[#A0452E]" : "text-stone-700 hover:bg-[#FDF5F3]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <LayoutGrid className="h-5 w-5" />
                    Listings
                  </span>
                  <ChevronDown className={`h-4 w-4 transition ${mobileExpandedMenu === "browse" ? "rotate-180" : ""}`} />
                </button>
                {mobileExpandedMenu === "browse" && (
                  <div className="border-t border-stone-200 px-3 py-2">
                    {browseMenuItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="block rounded-xl px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-white"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {desktopNavItems
                .filter((item) => item.to === "/request" || item.to === "/bulk")
                .map((item) => {
                const Icon =
                  item.to === "/request"
                    ? ClipboardList
                    : item.to === "/bulk"
                    ? Building2
                    : item.label === "Messages"
                    ? MessageSquare
                    : Info;
                const active = pathMatches(location.pathname, item.to);

                return (
                  <Link
                    key={item.label}
                    to={item.to}
                    className={`flex min-h-[52px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      active ? "bg-[#FDF5F3] text-[#A0452E]" : "text-stone-700 hover:bg-[#FDF5F3]"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}

              <div className="rounded-2xl border border-stone-200 bg-[#FAF7F2]">
                <button
                  type="button"
                  onClick={() => setMobileExpandedMenu((prev) => (prev === "sell" ? null : "sell"))}
                  className={`flex min-h-[52px] w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    pathMatches(location.pathname, "/create-listing") ? "bg-[#FDF5F3] text-[#A0452E]" : "text-stone-700 hover:bg-[#FDF5F3]"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <CirclePlus className="h-5 w-5" />
                    Sell
                  </span>
                  <ChevronDown className={`h-4 w-4 transition ${mobileExpandedMenu === "sell" ? "rotate-180" : ""}`} />
                </button>
                {mobileExpandedMenu === "sell" && (
                  <div className="border-t border-stone-200 px-3 py-2">
                    {sellMenuItems.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="block rounded-xl px-3 py-2 text-sm font-semibold text-stone-700 transition hover:bg-white"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {desktopNavItems
                .filter((item) => item.to !== "/request" && item.to !== "/bulk")
                .map((item) => {
                  const Icon =
                    item.label === "Messages"
                      ? MessageSquare
                      : item.to === "/bulk"
                      ? Building2
                      : Info;
                  const active = pathMatches(location.pathname, item.to);

                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={`flex min-h-[52px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                      active ? "bg-[#FDF5F3] text-[#A0452E]" : "text-stone-700 hover:bg-[#FDF5F3]"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
            </div>

            <div className="my-6 border-t border-stone-200" />

            {user ? (
              <div className="space-y-2">
                <div className="rounded-2xl bg-[#FAF7F2] px-4 py-3">
                  <p className="truncate text-sm font-semibold text-stone-900">{user.name || "User"}</p>
                  <p className="truncate text-xs text-stone-500">{user.email}</p>
                </div>
                <Link to="/profile" className="flex min-h-[52px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#FDF5F3]">
                  <User className="h-5 w-5" />
                  Account
                </Link>
                <Link to="/favorites" className="flex min-h-[52px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#FDF5F3]">
                  <Heart className="h-5 w-5" />
                  Saved Listings
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="flex min-h-[52px] items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#FDF5F3]">
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
                <Link to={signupTarget} className="flex min-h-[52px] items-center justify-center rounded-2xl bg-[#A0452E] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8B3525]">
                  Create Free Account
                </Link>
                <Link to="/login" className="flex min-h-[52px] items-center justify-center rounded-2xl border border-stone-200 px-4 py-3 text-sm font-semibold text-stone-700 transition hover:bg-[#FDF5F3]">
                  Login
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {showMobileBottomNav && (
        <>
          {mobileSellSheetOpen && (
            <div className="fixed inset-0 z-40 bg-stone-950/30 lg:hidden" onClick={() => setMobileSellSheetOpen(false)} />
          )}
          {mobileSellSheetOpen && (
            <div className="fixed inset-x-0 bottom-20 z-50 mx-auto w-[calc(100%-1rem)] max-w-md rounded-3xl border border-stone-200 bg-white p-4 shadow-2xl lg:hidden">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#A0452E]">Sell</p>
                  <p className="text-sm font-semibold text-stone-900">Choose what you are listing</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileSellSheetOpen(false)}
                  className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl border border-stone-200 text-stone-700"
                  aria-label="Close sell options"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid gap-2">
                {sellMenuItems.map((item) => (
                  <button
                    key={item.to}
                    type="button"
                    onClick={() => {
                      setMobileSellSheetOpen(false);
                      navigate(item.to);
                    }}
                    className="flex min-h-[48px] items-center rounded-2xl border border-stone-200 px-4 py-3 text-left text-sm font-semibold text-stone-800 transition hover:border-[#E8A08E] hover:bg-[#FDF5F3]"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white/95 shadow-[0_-12px_28px_-24px_rgba(28,25,23,0.4)] backdrop-blur-md lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-5 px-2 py-2">
            {mobileBottomItems.map((item) => {
              const Icon = item.icon || LayoutGrid;
              const isSell = item.label === "Sell";
              const active = isSell ? mobileSellSheetOpen : pathMatches(location.pathname, item.to);
              if (isSell) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setMobileSellSheetOpen((prev) => !prev)}
                    className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition ${
                      active ? "text-[#A0452E]" : "text-stone-500"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-[#A0452E]" : "text-stone-400"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              }
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-semibold transition ${
                    active ? "text-[#A0452E]" : "text-stone-500"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "text-[#A0452E]" : "text-stone-400"}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
        </>
      )}
    </>
  );
};

export default Navbar;
