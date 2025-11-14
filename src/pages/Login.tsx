import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    userType: 'buyer' as 'buyer' | 'seller' | 'service_provider',
    county: ''
  });

  // All 47 Kenyan counties
  const kenyaCounties = [
    'Baringo', 'Bomet', 'Bungoma', 'Busia', 'Elgeyo-Marakwet',
    'Embu', 'Garissa', 'Homa Bay', 'Isiolo', 'Kajiado',
    'Kakamega', 'Kericho', 'Kiambu', 'Kilifi', 'Kirinyaga',
    'Kisii', 'Kisumu', 'Kitui', 'Kwale', 'Laikipia',
    'Lamu', 'Machakos', 'Makueni', 'Mandera', 'Marsabit',
    'Meru', 'Migori', 'Mombasa', 'Muranga', 'Nairobi',
    'Nakuru', 'Nandi', 'Narok', 'Nyamira', 'Nyandarua',
    'Nyeri', 'Samburu', 'Siaya', 'Taita-Taveta', 'Tana River',
    'Tharaka-Nithi', 'Trans Nzoia', 'Turkana', 'Uasin Gishu',
    'Vihiga', 'Wajir', 'West Pokot'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.name.trim() && formData.phone.trim() && formData.county) {
      try {
        await register({
          name: formData.name,
          phone: formData.phone,
          type: formData.userType,
          county: formData.county
        });
        navigate('/profile');
      } catch (error) {
        alert('Registration failed. Please try again.');
        console.error('Registration error:', error);
      }
    } else {
      alert('Please fill in all required fields including county.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-500 to-green-800 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🌱 Join Kodisha
          </h1>
          <p className="text-gray-600">Create your account to start trading across Kenya</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 mb-2">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="0712 345 678"
              pattern="[0-9]{10}"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Enter your 10-digit Kenyan number</p>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">County *</label>
            <select
              name="county"
              value={formData.county}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select your county</option>
              {kenyaCounties.map(county => (
                <option key={county} value={county}>{county}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">I want to *</label>
            <select
              name="userType"
              value={formData.userType}
              onChange={handleChange}
              className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="buyer">Buy/Rent Land</option>
              <option value="seller">Sell/Rent Out Land</option>
              <option value="service_provider">Offer Services/Equipment</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            Already have an account?{' '}
            <span className="text-green-600 font-semibold">
              Just enter your details above
            </span>
          </p>
        </div>

        <div className="mt-8 p-4 bg-green-50 rounded-lg">
          <p className="text-green-800 text-sm text-center">
            🔒 Serving all 47 Kenyan counties. Your information is secure.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;