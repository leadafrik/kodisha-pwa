import React, { useState, useEffect } from 'react';
import { useProperties } from '../contexts/PropertyContext';
import { ServiceFormData } from '../types/property';
import { Link } from 'react-router-dom';
import { kenyaCounties, getConstituenciesByCounty, getWardsByConstituency } from '../data/kenyaCounties';

// Define the specific service types for this component
type ServiceType = 'equipment' | 'professional_services';

const ListService: React.FC = () => {
  const { addService } = useProperties();
  const [formData, setFormData] = useState<ServiceFormData>({
    type: 'equipment',
    name: '',
    description: '',
    county: '',
    constituency: '',
    ward: '',
    contact: '',
    services: [],
    pricing: '',
    experience: '',
    operatorIncluded: false,
    approximateLocation: '',
    photos: [] // Added photos array
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [constituencies, setConstituencies] = useState<{value: string; label: string}[]>([]);
  const [wards, setWards] = useState<{value: string; label: string}[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Updated service options - removed agrovet, enhanced others
  const serviceOptions: Record<ServiceType, string[]> = {
    equipment: [
      'Tractor Hire & Ploughing', 'Combine Harvester', 'Planting Equipment', 
      'Spraying Equipment', 'Irrigation Systems', 'Water Pumps', 'Transport Trailers',
      'Tillers & Cultivators', 'Greenhouse Equipment', 'Solar Systems', 'Fencing Equipment',
      'Harvesting Machinery', 'Post-Harvest Equipment'
    ],
    professional_services: [
      'Land Survey & Boundary Marking', 'Soil Testing & Analysis', 
      'Agricultural Consulting', 'Farm Planning & Design', 'Legal Services',
      'Title Processing & Transfers', 'Farm Management', 'Valuation Services',
      'Irrigation Design', 'Greenhouse Construction', 'Farm Infrastructure',
      'Environmental Assessment'
    ]
  };

  const typeLabels: Record<ServiceType, string> = {
    equipment: '🚜 Equipment Hire',
    professional_services: '👨‍💼 Professional Services'
  };

  const typeDescriptions: Record<ServiceType, string> = {
    equipment: 'Rent out farm machinery and equipment',
    professional_services: 'Offer expert agricultural services'
  };

  // Safe service options getter - this fixes the TypeScript error
  const getServiceOptions = (type: string): string[] => {
    return serviceOptions[type as ServiceType] || [];
  };

  // Photo handling functions
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadingPhotos(true);
    
    try {
      const newPhotos: string[] = [];
      
      // Convert files to base64 (in a real app, you'd upload to cloud storage)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          alert(`File ${file.name} is too large. Maximum size is 5MB.`);
          continue;
        }

        const base64 = await convertToBase64(file);
        newPhotos.push(base64);
      }

      // Add new photos to existing ones (limit to 10 photos)
      const updatedPhotos = [...(formData.photos || []), ...newPhotos].slice(0, 10);
      
      setFormData(prev => ({
        ...prev,
        photos: updatedPhotos
      }));

      if (newPhotos.length < files.length) {
        alert('Some photos were not added due to size limits or maximum photo count reached.');
      }
    } catch (error) {
      alert('Error uploading photos. Please try again.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index)
    }));
  };

  // Update constituencies when county changes
  useEffect(() => {
    if (formData.county) {
      const countyConstituencies = getConstituenciesByCounty(formData.county);
      setConstituencies(countyConstituencies);
      setFormData(prev => ({
        ...prev,
        constituency: '',
        ward: ''
      }));
      setWards([]);
    } else {
      setConstituencies([]);
      setWards([]);
    }
  }, [formData.county]);

  // Update wards when constituency changes
  useEffect(() => {
    if (formData.county && formData.constituency) {
      const constituencyWards = getWardsByConstituency(formData.county, formData.constituency);
      setWards(constituencyWards);
      setFormData(prev => ({
        ...prev,
        ward: ''
      }));
    } else {
      setWards([]);
    }
  }, [formData.county, formData.constituency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await addService({
        ...formData,
        services: selectedServices
      });
      
      alert('Service listed successfully! It will appear after verification.');
      
      // Reset form
      setFormData({
        type: 'equipment',
        name: '',
        description: '',
        county: '',
        constituency: '',
        ward: '',
        contact: '',
        services: [],
        pricing: '',
        experience: '',
        operatorIncluded: false,
        approximateLocation: '',
        photos: []
      });
      setSelectedServices([]);
      setConstituencies([]);
      setWards([]);
      
    } catch (error) {
      alert('Error listing service. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
    
    if (e.target.name === 'type') {
      setSelectedServices([]);
    }
  };

  const handleServiceToggle = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service)
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const countiesForDropdown = kenyaCounties.map(county => ({
    value: county.name.toLowerCase(),
    label: county.name
  }));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">List Equipment or Professional Service</h1>
        <p className="text-gray-600">Offer farm equipment hire or professional agricultural services to farmers</p>
        <div className="flex gap-4 mt-4">
          <Link 
            to="/list-property" 
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            ← List Land Instead
          </Link>
          <Link 
            to="/list-agrovet" 
            className="text-green-600 hover:text-green-700 font-semibold"
          >
            ← List Agrovet Instead
          </Link>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Service Type */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Service Type *</label>
            <div className="grid grid-cols-2 gap-4">
              {(['equipment', 'professional_services'] as ServiceType[]).map(type => (
                <label key={type} className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border-gray-200 hover:border-green-500">
                  <input
                    type="radio"
                    name="type"
                    value={type}
                    checked={formData.type === type}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-semibold text-lg">{typeLabels[type]}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {typeDescriptions[type]}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Service Details */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">
              {formData.type === 'equipment' ? 'Company/Equipment Owner Name *' : 'Service Provider Name *'}
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder={
                formData.type === 'equipment' ? 'e.g., FarmTech Equipment Hire' :
                'e.g., Kenya Land Surveyors Ltd'
              }
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder={
                formData.type === 'equipment' 
                  ? "Describe your equipment, conditions, availability, and why farmers should choose you..."
                  : "Describe your expertise, qualifications, experience, and services offered..."
              }
              required
            />
          </div>

          {/* Equipment Photos Section */}
          {formData.type === 'equipment' && (
            <div className="md:col-span-2 border-l-4 border-orange-500 pl-4 bg-orange-50 rounded-r-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">📸 Equipment Photos (Optional)</h3>
              <p className="text-sm text-gray-600 mb-4">
                Add photos of your equipment to attract more customers. Maximum 10 photos, 5MB each.
              </p>
              
              {/* Photo Upload */}
              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Upload Photos</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhotos || (formData.photos && formData.photos.length >= 10)}
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <p className="text-sm text-gray-500 mt-1">
                  {uploadingPhotos ? 'Uploading...' : `Photos: ${formData.photos?.length || 0}/10`}
                </p>
              </div>

              {/* Photo Preview */}
              {(formData.photos && formData.photos.length > 0) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative group">
                      <img 
                        src={photo} 
                        alt={`Equipment ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border"
                      />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Service-Specific Fields */}
          {formData.type === 'equipment' && (
            <div className="md:col-span-2 border-l-4 border-blue-500 pl-4 bg-blue-50 rounded-r-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">🚜 Equipment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Pricing Information *</label>
                  <input
                    type="text"
                    name="pricing"
                    value={formData.pricing || ''}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., KSh 2,500 per hour, KSh 15,000 per day"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="operatorIncluded"
                    checked={formData.operatorIncluded || false}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  <label className="text-gray-700">Operator Included</label>
                </div>
              </div>
            </div>
          )}

          {formData.type === 'professional_services' && (
            <div className="md:col-span-2 border-l-4 border-purple-500 pl-4 bg-purple-50 rounded-r-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-3">👨‍💼 Professional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 mb-2">Years of Experience</label>
                  <input
                    type="text"
                    name="experience"
                    value={formData.experience || ''}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., 5+ years, Since 2010"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 mb-2">Pricing Model</label>
                  <input
                    type="text"
                    name="pricing"
                    value={formData.pricing || ''}
                    onChange={handleChange}
                    className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Project-based, Hourly rate, Free consultation"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rest of the form remains the same */}
          {/* ... Location, Services, Contact sections ... */}

        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-800 text-sm">
            ✅ <strong>Verified Listings:</strong> Your service will be verified before appearing in search results. 
            {formData.type === 'equipment' && ' Photos help farmers trust your equipment quality.'}
          </p>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className={`w-full py-3 rounded-lg font-semibold text-lg transition duration-300 mt-6 ${
            submitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {submitting ? 'Listing Service...' : 'List Service'}
        </button>
      </form>
    </div>
  );
};

export default ListService;