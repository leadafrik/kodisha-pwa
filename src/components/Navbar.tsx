import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Chevron: React.FC = () => (
  <svg className="w-3 h-3" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 2.5L6 6L10 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* GLOBAL NAVBAR */}
      <nav className="bg-white shadow-sm border-b border-[#A0452E]/20 sticky top-0 z-40">
        <div className="h-1 w-full bg-[#A0452E]"></div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            {/* LOGO */}
            <Link to="/" className="flex items-center gap-3">
              <img src="/logo.svg" alt="Mamamboga Digital" className="h-10 w-10" />
              <span className="text-2xl font-extrabold text-gray-800 tracking-tight">Mamamboga Digital</span>
            </Link>

            {/* DESKTOP NAV */}
            <div className="hidden lg:flex items-center gap-10 font-semibold text-gray-700">
              <Link to="/browse" className="hover:text-black hover:underline underline-offset-4 transition">
                Marketplace
              </Link>

              <div className="group relative">
                <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition font-semibold flex items-center gap-2">
                  List <Chevron />
                </button>
                <div className="absolute hidden group-hover:block bg-white shadow-lg border border-gray-200 rounded-xl w-56 mt-2 z-50">
                  {user ? (
                    <>
                      <Link to="/list?category=land" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold">List Land</div>
                        <p className="text-sm text-gray-600">Rent only — sale listings paused</p>
                      </Link>
                      <Link to="/list?category=service" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold">List Service</div>
                        <p className="text-sm text-gray-600">Equipment or professional</p>
                      </Link>
                      <Link to="/list?category=agrovet" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold">List Agrovet</div>
                        <p className="text-sm text-gray-600">Inputs & store</p>
                      </Link>
                      <Link to="/list?category=product" className="block px-4 py-3 hover:bg-gray-50">
                        <div className="font-semibold">List Products</div>
                        <p className="text-sm text-gray-600">Produce / livestock</p>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link to="/login?next=/list?category=land" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold">List Land</div>
                        <p className="text-sm text-gray-600">Rent only — sale listings paused</p>
                      </Link>
                      <Link to="/login?next=/list?category=service" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold">List Service</div>
                        <p className="text-sm text-gray-600">Equipment or professional</p>
                      </Link>
                      <Link to="/login?next=/list?category=agrovet" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold">List Agrovet</div>
                        <p className="text-sm text-gray-600">Inputs & store</p>
                      </Link>
                      <Link to="/login?next=/list?category=product" className="block px-4 py-3 hover:bg-gray-50">
                        <div className="font-semibold">List Products</div>
                        <p className="text-sm text-gray-600">Produce / livestock</p>
                      </Link>
                    </>
                  )}
                </div>
              </div>

              {user ? (
                <div className="flex items-center gap-6">
                  {/* USER DROPDOWN */}
                  <div className="group relative">
                    <button className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 font-semibold text-gray-800">
                      <span className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                        {user.name ? user.name[0].toUpperCase() : "U"}
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
                      <Link to="/favorites" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold">Saved Listings</div>
                      </Link>

                      <div className="border-b">
                        <Link to="/list" className="block px-4 py-2 hover:bg-gray-50 text-sm">Create Listing</Link>
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
              <Link to="/browse" onClick={closeMobile}>Marketplace</Link>
              <hr />

              {user ? (
                <>
                  <Link to="/profile" onClick={closeMobile}>Dashboard</Link>
                  <Link to="/favorites" onClick={closeMobile}>Saved Listings</Link>
                  <Link to="/list" onClick={closeMobile}>Create Listing</Link>
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
                  <Link to="/login?next=/list" onClick={closeMobile}>List</Link>
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
