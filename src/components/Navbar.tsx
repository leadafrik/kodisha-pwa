import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const earthTone = "#A0452E"; // Kenyan earth-tone accent

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* NAVBAR */}
      <nav className="bg-white shadow-md border-b" style={{ borderColor: earthTone }}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center py-3">
            
            {/* LOGO */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[##0F4F2C] flex items-center justify-center shadow-sm border border-gray-200">
                <span className="text-xl">🌱</span>
              </div>
              <span className="text-2xl tracking-tight font-bold text-gray-800">
                Kodisha
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-8 font-medium text-gray-700">
              <Link to="/browse" className="hover:text-black transition">🏞️ Browse Land</Link>
              <Link to="/find-services" className="hover:text-black transition">🛠️ Find Services</Link>

              {/* Logged In */}
              {user ? (
                <div className="flex items-center gap-4">

                  {/* LIST DROPDOWN */}
                  <div className="relative group">
                    <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition font-semibold flex items-center gap-2">
                      ➕ List <span className="text-sm">▼</span>
                    </button>

                    <div className="absolute hidden group-hover:block bg-white shadow-lg border border-gray-200 rounded-xl w-56 mt-2 right-0">
                      <Link to="/list-property" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold flex gap-2">🏞️ List Land</div>
                        <p className="text-sm text-gray-600">Sell or lease farmland</p>
                      </Link>

                      <Link to="/list-agrovet" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold flex gap-2">🏪 List Agrovet</div>
                        <p className="text-sm text-gray-600">Add farm supplies & products</p>
                      </Link>

                      <Link to="/list-service" className="block px-4 py-3 hover:bg-gray-50">
                        <div className="font-semibold flex gap-2">🚜 List Service</div>
                        <p className="text-sm text-gray-600">Equipment or expertise</p>
                      </Link>
                    </div>
                  </div>

                  {/* USER DROPDOWN */}
                  <div className="relative group">
                    <button className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition flex items-center gap-2 font-semibold text-gray-800">
                      <span className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">👤</span>
                      {user.name.split(" ")[0]}
                      <span className="text-sm">▼</span>
                    </button>

                    <div className="absolute hidden group-hover:block bg-white shadow-lg border border-gray-200 rounded-xl w-56 mt-2 right-0">
                      <div className="px-4 py-3 border-b bg-gray-50">
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>

                      <Link to="/profile" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        <div className="font-semibold">📊 My Dashboard</div>
                        <p className="text-sm text-gray-600">View activity</p>
                      </Link>

                      <div className="border-b">
                        <Link to="/list-property" className="block px-4 py-2 hover:bg-gray-50 text-sm">🏞️ My Land Listings</Link>
                        <Link to="/list-agrovet" className="block px-4 py-2 hover:bg-gray-50 text-sm">🏪 My Agrovet Listings</Link>
                        <Link to="/list-service" className="block px-4 py-2 hover:bg-gray-50 text-sm">🚜 My Service Listings</Link>
                      </div>

                      {/* TEMP ADMIN */}
                      <Link to="/admin" className="block px-4 py-2 hover:bg-blue-50 text-blue-600 font-semibold border-b text-sm">
                        ⚙️ Admin Dashboard
                      </Link>

                      <button
                        onClick={logout}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-semibold"
                      >
                        🚪 Logout
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                /* Guest */
                <div className="flex items-center gap-4">
                  <Link
                    to="/login"
                    className="px-5 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 font-semibold transition"
                  >
                    Login
                  </Link>

                  <div className="relative group">
                    <button className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition font-semibold flex items-center gap-2">
                      ➕ List <span className="text-sm">▼</span>
                    </button>

                    <div className="absolute hidden group-hover:block bg-white shadow-lg border border-gray-200 rounded-xl w-56 mt-2 right-0">
                      <Link to="/list-property" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        🏞️ List Land
                      </Link>
                      <Link to="/list-agrovet" className="block px-4 py-3 hover:bg-gray-50 border-b">
                        🏪 List Agrovet
                      </Link>
                      <Link to="/list-service" className="block px-4 py-3 hover:bg-gray-50">
                        🚜 List Service
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* MOBILE MENU BUTTON */}
            <button
              className="lg:hidden flex flex-col gap-1"
              onClick={() => setMobileOpen(true)}
            >
              <span className="w-6 h-0.5 bg-gray-800"></span>
              <span className="w-6 h-0.5 bg-gray-800"></span>
              <span className="w-6 h-0.5 bg-gray-800"></span>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE SLIDE-IN MENU */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-0 left-0 h-full w-72 bg-white shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <span className="text-xl font-bold">Menu</span>
              <button onClick={() => setMobileOpen(false)}>✖</button>
            </div>

            <div className="flex flex-col gap-4 text-lg font-medium">
              <Link to="/browse">🏞️ Browse Land</Link>
              <Link to="/find-services">🛠️ Find Services</Link>
              <hr />

              {/* Logged In */}
              {user ? (
                <>
                  <Link to="/profile">📊 Dashboard</Link>
                  <Link to="/list-property">🏞️ List Land</Link>
                  <Link to="/list-agrovet">🏪 List Agrovet</Link>
                  <Link to="/list-service">🚜 List Service</Link>
                  <Link to="/admin">⚙️ Admin</Link>

                  <button
                    onClick={logout}
                    className="text-left text-red-600 font-semibold mt-4"
                  >
                    🚪 Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login">Login</Link>
                  <Link to="/list-property">🏞️ List Land</Link>
                  <Link to="/list-agrovet">🏪 List Agrovet</Link>
                  <Link to="/list-service">🚜 List Service</Link>
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