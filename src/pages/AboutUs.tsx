import React from 'react';
import { Link } from 'react-router-dom';

const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
      {/* Hero Section */}
      <section className="bg-green-700 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About Agrisoko</h1>
          <p className="text-xl md:text-2xl text-green-100">
            Digitizing Kenya's Agricultural Marketplace for the 21st Century
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Mission */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-2xl">🎯</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Our Mission</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              To digitize Kenya's agricultural marketplace and bring agriculture online, making it accessible, 
              efficient, and aligned with 21st-century standards. We connect farmers, producers, service providers, 
              and buyers across all 47 counties, breaking down barriers and creating opportunity.
            </p>
          </div>

          {/* Vision */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mr-4">
                <span className="text-white text-2xl">💡</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Our Vision</h2>
            </div>
            <p className="text-gray-700 leading-relaxed">
              A thriving agricultural ecosystem where every farmer, buyer, and service provider has equal access 
              to markets, information, and opportunity. We envision a Kenya where agriculture thrives through 
              digital innovation, direct connections, and shared trust.
            </p>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">What We Offer</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Produce */}
            <div className="bg-gradient-to-br from-yellow-50 to-green-50 rounded-lg shadow p-8 hover:shadow-lg transition">
              <div className="text-5xl mb-4">🌾</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Agricultural Produce</h3>
              <p className="text-gray-700 mb-4">
                Buy and sell fresh agricultural produce directly from farmers and producers across Kenya.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Fresh vegetables and fruits</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Livestock and animal products</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Grains and cereals</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Direct farm-to-buyer connections</span>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg shadow p-8 hover:shadow-lg transition">
              <div className="text-5xl mb-4">🔧</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">Agricultural Services</h3>
              <p className="text-gray-700 mb-4">
                Connect with professional and skilled service providers for all your agricultural needs.
              </p>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Land surveying and mapping</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Transportation and logistics</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Equipment rental and leasing</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>Landscaping and land preparation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Agrisoko */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">Why Choose Agrisoko?</h2>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">1</div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Direct Connections</h3>
              <p className="text-gray-700">
                Connect directly with buyers and sellers. No middlemen, no markups, just fair prices.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">2</div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Verified Profiles</h3>
              <p className="text-gray-700">
                All users are verified for your peace of mind. We maintain trust through transparent verification.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">3</div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Nationwide Coverage</h3>
              <p className="text-gray-700">
                Access markets across all 47 counties. Find what you need, wherever you are.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">4</div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Data Protection</h3>
              <p className="text-gray-700">
                Your data is protected with industry-standard encryption and security measures.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">5</div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Simple & Intuitive</h3>
              <p className="text-gray-700">
                Easy to navigate, even for first-time users. Accessibility is our priority.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-bold">6</div>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Fair Ratings & Reviews</h3>
              <p className="text-gray-700">
                See ratings from real users. Build your reputation and find trustworthy partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-green-50 py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-800 mb-12 text-center">How Agrisoko Works</h2>
          
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-lg font-bold">1</div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Sign Up & Verify</h3>
                <p className="text-gray-700">
                  Create your free account and verify your identity. This helps build trust in our community.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-lg font-bold">2</div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">List or Browse</h3>
                <p className="text-gray-700">
                  List your products or services, or browse what others are offering. Create a buy request if you're looking for something specific.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-lg font-bold">3</div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Connect & Communicate</h3>
                <p className="text-gray-700">
                  Chat directly with buyers or sellers. Check ratings and verify before doing business.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="bg-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0 text-lg font-bold">4</div>
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Complete & Rate</h3>
                <p className="text-gray-700">
                  Complete your transaction and leave a rating. Help others make informed decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="bg-green-700 text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl mb-8 text-green-100">
            Join thousands of farmers, producers, buyers, and service providers already using Agrisoko.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/login" 
              className="bg-white text-green-700 px-8 py-3 rounded-lg font-bold hover:bg-green-50 transition"
            >
              Sign In
            </Link>
            <Link 
              to="/" 
              className="bg-green-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-800 transition border-2 border-white"
            >
              Explore Listings
            </Link>
          </div>
        </div>
      </section>

      {/* Contact / Support */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Have Questions?</h2>
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <p className="text-gray-700 mb-6">
            We're here to help. Whether you're a farmer, buyer, or service provider, our support team is ready to assist.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="mailto:support@agrisoko.com" 
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-700 transition"
            >
              Email Support
            </a>
            <a 
              href="https://chat.whatsapp.com/HzCaV5YVz86CjwajiOHR5i" 
              target="_blank" 
              rel="noopener noreferrer"
              className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-green-600 transition"
            >
              WhatsApp Community
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
