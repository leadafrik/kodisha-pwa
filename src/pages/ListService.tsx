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
    approximateLocation: ''
  });

  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [constituencies, setConstituencies] = useState<{value: string; label: string}[]>([]);
  const [wards, setWards] = useState<{value: string; label: string}[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
        approximateLocation: ''
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

          {/* Location with Dropdowns */}
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
              {countiesForDropdown.map(county => (
                <option key={county.value} value={county.value}>{county.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Constituency *</label>
            <select
              name="constituency"
              value={formData.constituency}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={!formData.county}
            >
              <option value="">{formData.county ? 'Select Constituency' : 'Select County First'}</option>
              {constituencies.map(constituency => (
                <option key={constituency.value} value={constituency.value}>{constituency.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">Ward *</label>
            <select
              name="ward"
              value={formData.ward}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              required
              disabled={!formData.constituency}
            >
              <option value="">{formData.constituency ? 'Select Ward' : 'Select Constituency First'}</option>
              {wards.map(ward => (
                <option key={ward.value} value={ward.value}>{ward.label}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">Specific Location</label>
            <input
              type="text"
              name="approximateLocation"
              value={formData.approximateLocation || ''}
              onChange={handleChange}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g., Near main road, Opposite market, Industrial area"
            />
          </div>

          {/* Services - FIXED SECTION */}
          <div className="md:col-span-2">
            <label className="block text-gray-700 mb-2">
              {formData.type === 'equipment' ? 'Equipment & Services Offered *' : 'Professional Services Offered *'}
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getServiceOptions(formData.type).map((service: string) => (
                <label key={service} className="flex items-center p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service)}
                    onChange={() => handleServiceToggle(service)}
                    className="mr-3"
                  />
                  <span className="font-medium">{service}</span>
                </label>
              ))}
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
            <p className="text-sm text-gray-500 mt-1">This number will be visible to potential customers</p>
          </div>

        </div>

        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <p className="text-green-800 text-sm">
            ✅ <strong>Verified Listings:</strong> Your service will be verified before appearing in search results. 
            Farmers will contact you directly for bookings and inquiries.
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