import React, { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import NotificationCenter from "./NotificationCenter";

const Chevron: React.FC = () => (
  <svg className="w-3 h-3" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 2.5L6 6L10 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const listCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeMobile = () => setMobileOpen(false);
  const scheduleListClose = () => {
    if (listCloseTimer.current) {
      clearTimeout(listCloseTimer.current);
    }
    listCloseTimer.current = setTimeout(() => setListOpen(false), 180);
  };

  const cancelListClose = () => {
    if (listCloseTimer.current) {
      clearTimeout(listCloseTimer.current);
      listCloseTimer.current = null;
    }
  };

  return (
    <>
      {/* GLOBAL NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-[#A0452E]/20 sticky top-0 z-40">
        <div className="h-1 w-full bg-[#A0452E]"></div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* LOGO */}
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="Agrisoko" className="h-10 w-10" />
              <span className="text-2xl font-extrabold text-gray-800 tracking-tight">Agrisoko</span>
            </Link>

            {/* DESKTOP NAV */}
            <div className="hidden lg:flex items-center gap-10 font-semibold text-gray-700">
              {/* Browse Toggle - Easy navigation between Listings and Buy Requests */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <Link 
                  to="/browse" 
                  className="px-4 py-2 rounded-md transition font-semibold text-sm hover:bg-white"
                >
                  Listings
                </Link>
                <Link 
                  to="/request" 
                  className="px-4 py-2 rounded-md transition font-semibold text-sm hover:bg-white"
                >
                  Buy Requests
                </Link>
              </div>

              <Link 
                to="/about" 
                className="px-4 py-2 rounded-lg hover:bg-gray-100 transition text-gray-700 font-semibold text-sm"
              >
                About
              </Link>

              <div
                className="relative"
                onMouseEnter={() => {
                  cancelListClose();
                  setListOpen(true);
                }}
                onMouseLeave={scheduleListClose}
              >
                <button
                  type="button"
                  onClick={() => setListOpen((prev) => !prev)}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-semibold flex items-center gap-2"
                >
                  + List <Chevron />
                </button>
                <div
                  className={`absolute ${listOpen ? "block" : "hidden"} bg-white shadow-lg border border-gray-200 rounded-xl w-56 mt-2 z-50`}
                  onMouseEnter={cancelListClose}
                  onMouseLeave={scheduleListClose}
                >
                  {user ? (
                    <>
                      <Link
                        to="/create-listing"
                        className="block px-4 py-3 hover:bg-green-50 border-b"
                        onClick={() => setListOpen(false)}
                      >
                        <div className="font-semibold text-green-700">List for sale</div>
                        <p className="text-sm text-gray-600">Products, livestock, inputs, services</p>
                      </Link>
                      <hr className="my-2" />
                      <Link
                        to="/request/new"
                        className="block px-4 py-3 hover:bg-blue-50"
                        onClick={() => setListOpen(false)}
                      >
                        <div className="font-semibold text-blue-700">Post buy request</div>
                        <p className="text-sm text-gray-600">Looking to buy something?</p>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login?next=/create-listing"
                        className="block px-4 py-3 hover:bg-green-50 border-b"
                        onClick={() => setListOpen(false)}
                      >
                        <div className="font-semibold text-green-700">List for sale</div>
                        <p className="text-sm text-gray-600">Products, livestock, inputs, services</p>
                      </Link>
                      <hr className="my-2" />
                      <Link
                        to="/login?next=/request/new"
                        className="block px-4 py-3 hover:bg-blue-50"
                        onClick={() => setListOpen(false)}
                      >
                        <div className="font-semibold text-blue-700">Post buy request</div>
                        <p className="text-sm text-gray-600">Looking to buy something?</p>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {user ? (
                <div className="flex items-center gap-6">
                  {/* NOTIFICATION CENTER */}
                  <NotificationCenter />

                  {/* USER DROPDOWN */}
                  <div className="group relative">
                    <button className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 font-semibold text-gray-800">
                      <span className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="font-semibold text-white">{user.name ? user.name[0].toUpperCase() : "U"}</span>
                        )}
                      </span>
                      {user.name ? user.name.split(" ")[0] : "Profile"}
                      <Chevron />
                    </button>

                    <div className="absolute hidden group-hover:block bg-white shadow-lg border border-gray-200 rounded-xl w-56 mt-2 right-0 z-50">
                      <div className="px-4 py-3 border-b bg-gray-50">
                        <div className="font-semibold truncate">{user.name || "User"}</div>
                        <div className="text-sm text-gray-600 truncate">{user.email}</div>
                      </div>

                      <Link to="/profile" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold">Dashboard</div>
                      </Link>
                      <Link to="/messages" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold">Messages</div>
                      </Link>
                      <Link to="/favorites" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold">Saved Listings</div>
                      </Link>

                      {user.role === 'admin' || user.type === 'admin' ? (
                        <>
                          <Link to="/admin/listings-approval" className="block px-4 py-3 hover:bg-gray-50 border-b">
                            <div className="font-semibold">Listing Approvals</div>
                          </Link>
                          <Link to="/admin/id-verification" className="block px-4 py-3 hover:bg-gray-50 border-b">
                            <div className="font-semibold">ID Verification</div>
                          </Link>
                          <Link to="/admin/reports" className="block px-4 py-3 hover:bg-gray-50 border-b">
                            <div className="font-semibold">User Reports</div>
                          </Link>
                          <Link to="/admin/profile-verification" className="block px-4 py-3 hover:bg-gray-50 border-b">
                            <div className="font-semibold">Profile Verification</div>
                          </Link>
                        </>
                      ) : null}

                      <div className="border-b">
                        <Link to="/create-listing" className="block px-4 py-2 hover:bg-gray-50 text-sm">Create Listing</Link>
                      </div>

                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-semibold"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Link to="/login" className="px-5 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-semibold transition">
                    Login
                  </Link>
                </div>
              )}
            </div>

            {/* MOBILE MENU ICON */}
            <button className="lg:hidden flex flex-col gap-1" onClick={() => setMobileOpen(true)}>
              <span className="w-6 h-0.5 bg-gray-900"></span>
              <span className="w-6 h-0.5 bg-gray-900"></span>
              <span className="w-6 h-0.5 bg-gray-900"></span>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-50" onClick={closeMobile}>
          <div
            className="absolute top-0 left-0 h-full w-72 bg-white shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-bold">Menu</span>
              <button onClick={closeMobile} aria-label="Close menu" className="text-2xl leading-none">
                ×
              </button>
            </div>

            <div className="flex flex-col gap-4 text-lg font-medium">
              {/* Browse Toggle for Mobile */}
              <div className="flex flex-col gap-2 bg-gray-100 rounded-lg p-2">
                <Link to="/browse" onClick={closeMobile} className="px-3 py-2 rounded hover:bg-white transition font-semibold">
                  Browse Listings
                </Link>
                <Link to="/request" onClick={closeMobile} className="px-3 py-2 rounded hover:bg-white transition font-semibold">
                  Browse Buy Requests
                </Link>
              </div>
              <Link to="/about" onClick={closeMobile} className="px-3 py-2 font-semibold">
                About Agrisoko
              </Link>
              <hr />

              {user ? (
                <>
                  <Link to="/profile" onClick={closeMobile}>Dashboard</Link>
                  <Link to="/messages" onClick={closeMobile}>Messages</Link>
                  <Link to="/favorites" onClick={closeMobile}>Saved Listings</Link>
                  {user.role === 'admin' || user.type === 'admin' ? (
                    <>
                      <Link to="/admin/listings-approval" onClick={closeMobile}>Listing Approvals</Link>
                      <Link to="/admin/id-verification" onClick={closeMobile}>ID Verification</Link>
                      <Link to="/admin/reports" onClick={closeMobile}>User Reports</Link>
                      <Link to="/admin/profile-verification" onClick={closeMobile}>Profile Verification</Link>
                    </>
                  ) : null}
                  <Link to="/create-listing" onClick={closeMobile}>List for sale</Link>
                  <Link to="/request/new" onClick={closeMobile}>Post buy request</Link>
                  <button
                    onClick={() => { logout(); closeMobile(); }}
                    className="text-left text-red-600 font-semibold mt-4"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={closeMobile}>Login</Link>
                  <Link to="/login?next=/create-listing" onClick={closeMobile}>List for sale</Link>
                  <Link to="/login?next=/request/new" onClick={closeMobile}>Post buy request</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
