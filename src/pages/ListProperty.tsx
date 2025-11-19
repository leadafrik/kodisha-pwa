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
    ward: '', // ✅ ADDED
    approximateLocation: '', // ✅ ADDED
    soilType: 'loam', // ✅ ADDED
    waterAvailability: 'rain-fed', // ✅ ADDED
    previousCrops: '', // ✅ ADDED
    organicCertified: false, // ✅ ADDED
    availableFrom: '', // ✅ ADDED
    availableTo: '', // ✅ ADDED
    minLeasePeriod: '1', // ✅ ADDED
    maxLeasePeriod: '12', // ✅ ADDED
    preferredCrops: '', // ✅ ADDED
    contact: '',
    type: 'sale'
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('description', formData.description);
      submitData.append('price', formData.price);
      submitData.append('size', formData.size);
      submitData.append('sizeUnit', formData.sizeUnit);
      submitData.append('county', formData.county);
      submitData.append('constituency', formData.constituency);
      submitData.append('ward', formData.ward); // ✅ ADDED
      submitData.append('approximateLocation', formData.approximateLocation); // ✅ ADDED
      submitData.append('soilType', formData.soilType); // ✅ ADDED
      submitData.append('waterAvailability', formData.waterAvailability); // ✅ ADDED
      submitData.append('previousCrops', formData.previousCrops); // ✅ ADDED
      submitData.append('organicCertified', formData.organicCertified.toString()); // ✅ ADDED
      submitData.append('availableFrom', formData.availableFrom); // ✅ ADDED
      submitData.append('availableTo', formData.availableTo); // ✅ ADDED
      submitData.append('minLeasePeriod', formData.minLeasePeriod); // ✅ ADDED
      submitData.append('maxLeasePeriod', formData.maxLeasePeriod); // ✅ ADDED
      submitData.append('preferredCrops', formData.preferredCrops); // ✅ ADDED
      submitData.append('contact', formData.contact);
      submitData.append('type', formData.type);
      
      // Append images
      selectedImages.forEach((image) => {
        submitData.append('images', image);
      });

      await addProperty(submitData);
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
        ward: '', // ✅ ADDED
        approximateLocation: '', // ✅ ADDED
        soilType: 'loam', // ✅ ADDED
        waterAvailability: 'rain-fed', // ✅ ADDED
        previousCrops: '', // ✅ ADDED
        organicCertified: false, // ✅ ADDED
        availableFrom: '', // ✅ ADDED
        availableTo: '', // ✅ ADDED
        minLeasePeriod: '1', // ✅ ADDED
        maxLeasePeriod: '12', // ✅ ADDED
        preferredCrops: '', // ✅ ADDED
        contact: '',
        type: 'sale'
      });
      setSelectedImages([]);
    } catch (error) {
      alert('Error listing property. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).slice(0, 5 - selectedImages.length);
      setSelectedImages(prev => [...prev, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const kenyaCounties = [
    'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale',
    'Kericho', 'Kakamega', 'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru',
    'Nyeri', 'Embu', 'Machakos', 'Kitui', 'Makueni', 'Nyandarua', 'Kirinyaga', 'Muranga',
    'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia', 'Uasin Gishu', 'Elgeyo Marakwet',
    'Nandi', 'Baringo', 'Laikipia', 'Nakuru', 'Narok', 'Kajiado', 'Bomet', 'Bungoma', 'Busia',
    'Siaya', 'Kisii', 'Homa Bay', 'Migori', 'Kisumu', 'Vihiga', 'Nyamira'
  ];

  const soilTypes = [
    { value: 'clay', label: 'Clay' },
    { value: 'sandy', label: 'Sandy' },
    { value: 'loam', label: 'Loam' },
    { value: 'clay-loam', label: 'Clay Loam' },
    { value: 'sandy-loam', label: 'Sandy Loam' }
  ];

  const waterSources = [
    { value: 'river', label: 'River' },
    { value: 'well', label: 'Well' },
    { value: 'tap', label: 'Tap Water' },
    { value: 'rain-fed', label: 'Rain-fed' },
    { value: 'irrigation', label: 'Irrigation' }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">List Your Farmland</h1>
      <p className="text-gray-600 mb-8">Connect with farmers across Kenya - list your land for seasonal leasing</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Property Type */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Lease Type *</label>
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
                For Rent/Lease
              </label>
            </div>
          </div>

          {/* Property Details */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Farmland Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., 5 Acre Farmland in Kiambu - Ready for Maize Season"
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
              placeholder="Describe the land, soil quality, accessibility, water sources, nearby markets, and any improvements..."
              required
            />
          </div>

          {/* Location Details */}
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
            <label className="block text-gray-700 mb-2">Constituency *</label>
            <input
              type="text"
              name="constituency"
              value={formData.constituency}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Kikuyu Constituency"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Ward *</label>
            <input
              type="text"
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Kikuyu Ward"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Approximate Location *</label>
            <input
              type="text"
              name="approximateLocation"
              value={formData.approximateLocation}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Near Kikuyu Market, 2km from main road"
              required
            />
          </div>

          {/* Agricultural Details */}
          <div>
            <label className="block text-gray-700 mb-2">Soil Type *</label>
            <select
              name="soilType"
              value={formData.soilType}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              {soilTypes.map(soil => (
                <option key={soil.value} value={soil.value}>{soil.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Water Availability *</label>
            <select
              name="waterAvailability"
              value={formData.waterAvailability}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            >
              {waterSources.map(water => (
                <option key={water.value} value={water.value}>{water.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Previous Crops (Optional)</label>
            <input
              type="text"
              name="previousCrops"
              value={formData.previousCrops}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Maize, Beans, Vegetables (comma separated)"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Preferred Crops (Optional)</label>
            <input
              type="text"
              name="preferredCrops"
              value={formData.preferredCrops}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Maize, Potatoes, Vegetables (comma separated)"
            />
          </div>

          {/* Lease Period */}
          <div>
            <label className="block text-gray-700 mb-2">Available From *</label>
            <input
              type="date"
              name="availableFrom"
              value={formData.availableFrom}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Available To *</label>
            <input
              type="date"
              name="availableTo"
              value={formData.availableTo}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Min Lease Period (Months) *</label>
            <input
              type="number"
              name="minLeasePeriod"
              value={formData.minLeasePeriod}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              min="1"
              max="24"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Max Lease Period (Months) *</label>
            <input
              type="number"
              name="maxLeasePeriod"
              value={formData.maxLeasePeriod}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              min="1"
              max="24"
              required
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
              placeholder="e.g., 15000"
              required
            />
            <p className="text-sm text-gray-500 mt-1">Price per season</p>
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
                min="0.1"
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

          {/* Organic Certification */}
          <div className="md:col-span-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="organicCertified"
                checked={formData.organicCertified}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-gray-700">Organically Certified Farmland</span>
            </label>
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

          {/* Image Upload */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Farmland Images</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-green-400 transition-colors">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                <div className="text-4xl mb-2">📷</div>
                <p className="font-semibold text-gray-700">Upload Farmland Images</p>
                <p className="text-sm text-gray-500 mt-1">
                  Click to select images or drag and drop
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Up to 5 images • JPG, PNG, GIF • Max 5MB each
                </p>
              </label>
            </div>
            
            {/* Selected Images Preview */}
            {selectedImages.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Selected images ({selectedImages.length}/5):
                </p>
                <div className="flex gap-2 flex-wrap">
                  {selectedImages.map((file, index) => (
                    <div key={index} className="relative bg-gray-100 rounded-lg p-2">
                      <div className="text-xs text-gray-700 max-w-24 truncate">
                        📷 {file.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

        <button
          type="submit"
          disabled={uploading}
          className={`w-full py-3 rounded-lg font-semibold text-lg transition duration-300 mt-6 ${
            uploading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {uploading ? 'Uploading...' : 'List Farmland'}
        </button>
      </form>
    </div>
  );
};

export default ListProperty;