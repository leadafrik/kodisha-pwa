import React, { useState } from 'react';
import { useProperties } from '../contexts/PropertyContext';
import { PropertyFormData } from '../types/property';

const ListProperty: React.FC = () => {
  const { addProperty } = useProperties();
  const [formData, setFormData] = useState<PropertyFormData>({
    title: '',
    description: '',
    price: '',
    size: '',
    sizeUnit: 'acres',
    county: '',
    constituency: '',
    contact: '',
    type: 'sale'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addProperty(formData);
    alert('Property listed successfully! It will appear after verification.');
    
    // Reset form
    setFormData({
      title: '',
      description: '',
      price: '',
      size: '',
      sizeUnit: 'acres',
      county: '',
      constituency: '',
      contact: '',
      type: 'sale'
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const kenyaCounties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale',
    'Kericho', 'Kakamega', 'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru',
    'Nyeri', 'Embu', 'Machakos', 'Kitui', 'Makueni', 'Nyandarua', 'Kirinyaga', 'Muranga',
    'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo Marakwet',
    'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Bomet', 'Bungoma', 'Busia',
    'Siaya', 'Kisii', 'Homa Bay', 'Migori', 'Kisumu', 'Vihiga', 'Nyamira'
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">List Your Property</h1>
      <p className="text-gray-600 mb-8">Reach thousands of potential buyers across Kenya's 47 counties</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Property Type */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Property Type *</label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="sale"
                  checked={formData.type === 'sale'}
                  onChange={handleChange}
                  className="mr-2"
                />
                For Sale
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="rental"
                  checked={formData.type === 'rental'}
                  onChange={handleChange}
                  className="mr-2"
                />
                For Rent
              </label>
            </div>
          </div>

          {/* Property Details */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Property Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 5 Acre Farmland in Kiambu"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Describe the land, soil type, accessibility, water availability, nearby amenities..."
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-gray-700 mb-2">County *</label>
            <select
              name="county"
              value={formData.county}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              <option value="">Select County</option>
              {kenyaCounties.map(county => (
                <option key={county} value={county.toLowerCase()}>{county}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Constituency</label>
            <input
              type="text"
              name="constituency"
              value={formData.constituency}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Kikuyu Constituency"
            />
          </div>

          {/* Price & Size */}
          <div>
            <label className="block text-gray-700 mb-2">Price (KSh) *</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 2500000"
              required
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-gray-700 mb-2">Land Size *</label>
              <input
                type="number"
                name="size"
                value={formData.size}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., 5"
                step="0.1"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 mb-2">Unit</label>
              <select
                name="sizeUnit"
                value={formData.sizeUnit}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="acres">Acres</option>
                <option value="hectares">Hectares</option>
              </select>
            </div>
          </div>

          {/* Contact */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Contact Phone *</label>
            <input
              type="tel"
              name="contact"
              value={formData.contact}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 0712 345 678"
              pattern="[0-9]{10}"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Enter your 10-digit Kenyan phone number</p>
          </div>

          {/* Image Upload Placeholder */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Property Images</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">📷 Image upload feature coming soon</p>
              <p className="text-sm text-gray-400 mt-2">You'll be able to upload multiple photos of your land</p>
            </div>
          </div>

        </div>

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold text-lg hover:bg-green-700 transition duration-300 mt-6"
        >
          List Property
        </button>
      </form>
    </div>
  );
};

export default ListProperty;