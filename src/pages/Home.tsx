import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-800">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-white mb-6">
          🌱 Kodisha
        </h1>
        <p className="text-2xl text-green-100 mb-4">
          Farmland Rental Marketplace
        </p>
        <p className="text-lg text-white mb-8">
          Connecting farmers with land across Kenya's 47 counties
        </p>
        
        {/* Call-to-Action Buttons */}
        <div className="flex justify-center gap-4 mb-12">
          <Link 
            to="/browse" 
            className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold text-lg hover:bg-green-100 transition duration-300"
          >
            Browse Land
          </Link>
          <Link 
            to="/list-property" 
            className="bg-green-700 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-green-600 transition duration-300 border border-white"
          >
            List Your Land
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-3">🏞️ Find Land</h3>
            <p className="text-gray-600">Browse verified land listings across all 47 counties</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-3">📱 Easy Listing</h3>
            <p className="text-gray-600">List your land with photos, location, and price details</p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-3">🔒 Secure Transactions</h3>
            <p className="text-gray-600">M-Pesa payments and verified user system</p>
          </div>
        </div>
      </div>

      {/* Ecosystem Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">More Than Just Land</h2>
          <p className="text-green-100 text-lg">Complete farming ecosystem at your fingertips</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Link 
            to="/browse"
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-opacity-20 transition duration-300 border border-white border-opacity-20"
          >
            <div className="text-4xl mb-4">🏞️</div>
            <h3 className="text-xl font-bold text-white mb-2">Find Land</h3>
            <p className="text-green-100">Browse verified land listings across all 47 counties</p>
            <div className="mt-4 text-white font-semibold">
              Browse Properties →
            </div>
          </Link>

          <Link 
            to="/find-services"
            className="bg-white bg-opacity-10 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-opacity-20 transition duration-300 border border-white border-opacity-20"
          >
            <div className="text-4xl mb-4">🚜</div>
            <h3 className="text-xl font-bold text-white mb-2">Find Equipment & Services</h3>
            <p className="text-green-100">Tractors, agrovets, surveyors & professional services</p>
            <div className="mt-4 text-white font-semibold">
              Find Services →
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;