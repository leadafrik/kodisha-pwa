import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-green-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-2xl font-bold flex items-center">
            🌱 Kodisha
          </Link>
          <div className="space-x-6 flex items-center">
            <Link to="/browse" className="hover:text-green-200 transition duration-300">
              Browse Land
            </Link>
            <Link to="/find-services" className="hover:text-green-200 transition duration-300">
              Find Equipment/Services
            </Link>
            
            {user ? (
              <div className="inline-block relative group">
                <button className="hover:text-green-200 transition duration-300 px-3 py-2 bg-green-700 rounded-lg flex items-center gap-2">
                  👤 {user.name.split(' ')[0]}
                  <span>▼</span>
                </button>
                <div className="absolute hidden group-hover:block bg-white text-gray-800 shadow-xl rounded-lg mt-2 py-2 w-48 z-10 right-0">
                  <Link 
                    to="/profile" 
                    className="block px-4 py-3 hover:bg-green-50 border-b border-gray-100"
                  >
                    <div className="font-semibold">My Profile</div>
                    <div className="text-sm text-gray-600">View your account</div>
                  </Link>
                  <div className="border-b border-gray-100">
                    <Link 
                      to="/list-property" 
                      className="block px-4 py-2 hover:bg-green-50"
                    >
                      🏞️ List Land
                    </Link>
                    <Link 
                      to="/list-service" 
                      className="block px-4 py-2 hover:bg-green-50"
                    >
                      🚜 List Service
                    </Link>
                  </div>
                  <button 
                    onClick={logout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600"
                  >
                    🚪 Logout
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link 
                  to="/login" 
                  className="bg-green-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-600 transition duration-300"
                >
                  Login
                </Link>
                <div className="inline-block relative group">
                  <button className="hover:text-green-200 transition duration-300 px-3 py-2 bg-green-800 rounded-lg">
                    List ▼
                  </button>
                  <div className="absolute hidden group-hover:block bg-white text-gray-800 shadow-xl rounded-lg mt-2 py-2 w-48 z-10 right-0">
                    <Link 
                      to="/list-property" 
                      className="block px-4 py-3 hover:bg-green-50 border-b border-gray-100"
                    >
                      <div className="font-semibold">🏞️ List Land</div>
                      <div className="text-sm text-gray-600">Sell or rent your land</div>
                    </Link>
                    <Link 
                      to="/list-service" 
                      className="block px-4 py-3 hover:bg-green-50"
                    >
                      <div className="font-semibold">🚜 List Equipment/Service</div>
                      <div className="text-sm text-gray-600">Offer services to farmers</div>
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