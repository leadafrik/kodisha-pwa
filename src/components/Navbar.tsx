import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-green-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">🌱</span>
            <span>Kodisha</span>
          </Link>
          
          {/* Main Navigation */}
          <div className="space-x-6 flex items-center">
            <Link to="/browse" className="hover:text-green-200 transition duration-300 font-medium">
              🏞️ Browse Land
            </Link>
            <Link to="/find-services" className="hover:text-green-200 transition duration-300 font-medium">
              🛠️ Find Services
            </Link>
            
            {user ? (
              /* User Logged In */
              <div className="flex items-center gap-4">
                {/* Quick List Button */}
                <div className="inline-block relative group">
                  <button className="bg-green-700 hover:bg-green-800 transition duration-300 px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                    ➕ List
                    <span className="text-sm">▼</span>
                  </button>
                  <div className="absolute hidden group-hover:block bg-white text-gray-800 shadow-xl rounded-lg mt-2 py-2 w-56 z-10 right-0 border border-gray-100">
                    <Link 
                      to="/list-property" 
                      className="block px-4 py-3 hover:bg-green-50 border-b border-gray-100"
                    >
                      <div className="font-semibold flex items-center gap-2">
                        <span>🏞️</span>
                        List Land
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Sell or lease farmland</div>
                    </Link>
                    <Link 
                      to="/list-agrovet" 
                      className="block px-4 py-3 hover:bg-green-50 border-b border-gray-100"
                    >
                      <div className="font-semibold flex items-center gap-2">
                        <span>🏪</span>
                        List Agrovet
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Sell farm supplies & products</div>
                    </Link>
                    <Link 
                      to="/list-service" 
                      className="block px-4 py-3 hover:bg-green-50"
                    >
                      <div className="font-semibold flex items-center gap-2">
                        <span>🚜</span>
                        List Service
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Offer equipment & professional services</div>
                    </Link>
                  </div>
                </div>

                {/* User Menu */}
                <div className="inline-block relative group">
                  <button className="hover:text-green-200 transition duration-300 px-4 py-2 bg-green-700 rounded-lg flex items-center gap-2 font-medium">
                    <span className="w-8 h-8 bg-green-800 rounded-full flex items-center justify-center">
                      👤
                    </span>
                    {user.name.split(' ')[0]}
                    <span className="text-sm">▼</span>
                  </button>
                  <div className="absolute hidden group-hover:block bg-white text-gray-800 shadow-xl rounded-lg mt-2 py-2 w-56 z-10 right-0 border border-gray-100">
                    <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                      <div className="font-semibold text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                    
                    <Link 
                      to="/profile" 
                      className="block px-4 py-3 hover:bg-green-50 border-b border-gray-100"
                    >
                      <div className="font-semibold">📊 My Dashboard</div>
                      <div className="text-sm text-gray-600">View listings & activity</div>
                    </Link>

                    <div className="border-b border-gray-100">
                      <Link 
                        to="/list-property" 
                        className="block px-4 py-2 hover:bg-green-50 text-sm"
                      >
                        🏞️ My Land Listings
                      </Link>
                      <Link 
                        to="/list-agrovet" 
                        className="block px-4 py-2 hover:bg-green-50 text-sm"
                      >
                        🏪 My Agrovet Listings
                      </Link>
                      <Link 
                        to="/list-service" 
                        className="block px-4 py-2 hover:bg-green-50 text-sm"
                      >
                        🚜 My Service Listings
                      </Link>
                    </div>

                    {/* 🔧 TEMPORARY: Show Admin link for all users during testing */}
                    <Link 
                      to="/admin" 
                      className="block px-4 py-2 hover:bg-blue-50 text-blue-600 border-b border-gray-100 text-sm font-medium"
                    >
                      ⚙️ Admin Dashboard
                    </Link>

                    <button 
                      onClick={logout}
                      className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 font-medium border-t border-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <span>🚪</span>
                        Logout
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* User Not Logged In */
              <div className="flex items-center gap-4">
                <Link 
                  to="/login" 
                  className="bg-green-700 text-white px-5 py-2 rounded-lg font-semibold hover:bg-green-800 transition duration-300"
                >
                  Login
                </Link>
                
                {/* List Dropdown for Guests */}
                <div className="inline-block relative group">
                  <button className="bg-green-800 hover:bg-green-900 transition duration-300 px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                    ➕ List
                    <span className="text-sm">▼</span>
                  </button>
                  <div className="absolute hidden group-hover:block bg-white text-gray-800 shadow-xl rounded-lg mt-2 py-2 w-56 z-10 right-0 border border-gray-100">
                    <Link 
                      to="/list-property" 
                      className="block px-4 py-3 hover:bg-green-50 border-b border-gray-100"
                    >
                      <div className="font-semibold flex items-center gap-2">
                        <span>🏞️</span>
                        List Land
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Sell or lease farmland</div>
                    </Link>
                    <Link 
                      to="/list-agrovet" 
                      className="block px-4 py-3 hover:bg-green-50 border-b border-gray-100"
                    >
                      <div className="font-semibold flex items-center gap-2">
                        <span>🏪</span>
                        List Agrovet
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Sell farm supplies & products</div>
                    </Link>
                    <Link 
                      to="/list-service" 
                      className="block px-4 py-3 hover:bg-green-50"
                    >
                      <div className="font-semibold flex items-center gap-2">
                        <span>🚜</span>
                        List Service
                      </div>
                      <div className="text-sm text-gray-600 mt-1">Offer equipment & professional services</div>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;