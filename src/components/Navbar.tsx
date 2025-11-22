import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import KodishaLogo from "./KodishaLogo";

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
              <KodishaLogo size={42} />
              <span className="text-2xl font-extrabold text-gray-800 tracking-tight">Kodisha</span>
            </Link>

            {/* DESKTOP NAV */}
            <div className="hidden lg:flex items-center gap-10 font-semibold text-gray-700">
              <Link to="/browse" className="hover:text-black hover:underline underline-offset-4 transition">
                Browse Land
              </Link>

              <Link to="/find-services" className="hover:text-black hover:underline underline-offset-4 transition">
                Find Services
              </Link>

              {user ? (
                <div className="flex items-center gap-6">
                  {/* LIST DROPDOWN */}
                  <div className="group relative">
                    <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition font-semibold flex items-center gap-2">
                      List <Chevron />
                    </button>

                    <div className="absolute hidden group-hover:block bg-white shadow-lg border border-gray-200 rounded-xl w-56 mt-2 right-0 z-50">
                      <Link to="/list-property" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold">List Land</div>
                        <p className="text-sm text-gray-600">Sell or lease farmland</p>
                      </Link>

                      <Link to="/list-agrovet" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold">List Agrovet</div>
                        <p className="text-sm text-gray-600">Add farm supplies</p>
                      </Link>

                      <Link to="/list-service" className="block px-4 py-3 hover:bg-gray-50">
                        <div className="font-semibold">List Service</div>
                        <p className="text-sm text-gray-600">Equipment or expertise</p>
                      </Link>
                    </div>
                  </div>

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

                      <div className="border-b">
                        <Link to="/list-property" className="block px-4 py-2 hover:bg-gray-50 text-sm">My Land Listings</Link>
                        <Link to="/list-agrovet" className="block px-4 py-2 hover:bg-gray-50 text-sm">My Agrovet Listings</Link>
                        <Link to="/list-service" className="block px-4 py-2 hover:bg-gray-50 text-sm">My Service Listings</Link>
                      </div>

                      <Link to="/admin" className="block px-4 py-2 hover:bg-blue-50 text-blue-600 font-semibold border-b text-sm">
                        Admin Dashboard
                      </Link>

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

                  <div className="group relative">
                    <button className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-semibold flex items-center gap-2">
                      List <Chevron />
                    </button>

                    <div className="absolute hidden group-hover:block bg-white shadow-lg border border-gray-200 rounded-xl w-56 mt-2 right-0 z-50">
                      <Link to="/login" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        List Land
                      </Link>
                      <Link to="/login" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        List Agrovet
                      </Link>
                      <Link to="/login" className="block px-4 py-3 hover:bg-gray-50">
                        List Service
                      </Link>
                    </div>
                  </div>
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
              <Link to="/browse" onClick={closeMobile}>Browse Land</Link>
              <Link to="/find-services" onClick={closeMobile}>Find Services</Link>
              <hr />

              {user ? (
                <>
                  <Link to="/profile" onClick={closeMobile}>Dashboard</Link>
                  <Link to="/list-property" onClick={closeMobile}>List Land</Link>
                  <Link to="/list-agrovet" onClick={closeMobile}>List Agrovet</Link>
                  <Link to="/list-service" onClick={closeMobile}>List Service</Link>
                  <Link to="/admin" onClick={closeMobile}>Admin</Link>
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
                  <Link to="/list-property" onClick={closeMobile}>List Land</Link>
                  <Link to="/list-agrovet" onClick={closeMobile}>List Agrovet</Link>
                  <Link to="/list-service" onClick={closeMobile}>List Service</Link>
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
